const amcsModel = require("../amcs/amcs-model");
const catchAsyncErrors = require("../../middleware/catchAsyncErrors");
const ErrorHandler = require("../../utils/ErrorHandler");
const SuperAdmin = require("../super-admin/super-admin-model");
const Transactions = require("../transaction/transaction-model");
const dayjs = require("dayjs");
const relativeTime = require("dayjs/plugin/relativeTime");
dayjs.extend(relativeTime);


exports.getAllAmcTotal = catchAsyncErrors(async (req, res, next) => {
    try {
        const { userId, role, createdByEmail } = req.query;
        const today = new Date();
        const currentYear = today.getFullYear();
        const currentMonth = today.getMonth() + 1;
        const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
        const colors = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#6366F1', '#14B8A6'];

        console.log("Incoming Query:", req.query, currentMonth, currentYear);

        // 🧠 Parse createdByEmail JSON safely
        let createdBy = {};
        if (createdByEmail) {
            try {
                createdBy = JSON.parse(createdByEmail);
            } catch (err) {
                console.warn("Invalid JSON in createdByEmail:", createdByEmail);
            }
        }

        // 🧩 Build filter
        const filter = {};
        if (userId && role === "distributor" || role === "retailer") {
            console.log("userIda:===>", userId, "role:", role);
            if (role === "distributor") {
                filter.distributorId = userId;
            } else if (role === "retailer") {
                filter.retailerId = userId;
            }
        }

        if (createdBy?.email && role === "distributor" || role === "retailer") {
            filter["createdByEmail.email"] = createdBy.email;
        }

        // 📊 Total AMC count
        const amcCount = await amcsModel.countDocuments(filter);

        // 🟢 Active AMCs
        const activeAccount = await amcsModel.countDocuments({ ...filter, status: "active", });

        // 🧭 Expiring this month (handle string dates safely)
        const expiringThisMonth = await amcsModel.countDocuments({
            ...filter,
            $expr: {
                $and: [
                    { $eq: [{ $year: { $toDate: "$endDate" } }, currentYear] },
                    { $eq: [{ $month: { $toDate: "$endDate" } }, currentMonth] },
                ],
            },
        });

        const totalDistributors = await SuperAdmin.countDocuments({ ...filter, role: "distributor" });
        const totalRetailers = role === "distributor" ? await SuperAdmin.countDocuments({ 'createdByEmail.email': createdBy?.email, role: "retailer" }) :
            await SuperAdmin.countDocuments({ ...filter, role: "retailer" });


        const usersTransactions = await Transactions.find({ ...filter, type: 'debit' })

        const totalRevenue = usersTransactions.reduce((sum, transaction) => sum + transaction.amount, 0);
        console.log("XXXXXXXX::=>", usersTransactions, createdBy?.email ,expiringThisMonth)

        /////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
        const totalAmcData = await amcsModel.find(filter);
        const monthlyData = {};

        totalAmcData.forEach(item => {
            const date = new Date(item.createdAt);
            const month = monthNames[date.getMonth()]; // e.g. "Oct"

            if (!monthlyData[month]) {
                monthlyData[month] = { month, sales: 0, revenue: 0 };
            }

            monthlyData[month].sales += 1;
            monthlyData[month].revenue += item.amcAmount || 0;
        });


        const salesData = monthNames.filter(m => monthlyData[m]).map(m => monthlyData[m]);


        ////////////////////////////////////// Product Data//////////////////////////////////////////////////////////////
        const categoryCount = {};

        totalAmcData.forEach(item => {
            const category = item.productCategory || 'Others';
            if (!categoryCount[category]) {
                categoryCount[category] = 0;
            }
            categoryCount[category] += 1;
        });

        const productData = Object.entries(categoryCount).map(([name, value], index) => ({ name, value, color: colors[index % colors.length], }));


        ////////////////////////////////////////////resentActivety//////////////////////////////////////////////////
        const recentActivities = totalAmcData.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 5).map(item => ({
            action: `New AMC created for ${item.productBrand} ${item.productCategory}`,
            user: item.createdByEmail?.name || "Unknown User",
            time: dayjs(item.createdAt).fromNow(), // e.g. "2 hours ago"
            icon: "ri-add-circle-line",
            color: "text-green-600",
        }));

        ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

        ///////////////////////////////////////////////////////WALLET///////////////////////////////////////////////////////////////
        const totalDistributorWalletAmount = await SuperAdmin.aggregate([
            { $match: { role: "distributor" } },
            { $group: { _id: "$_id", totalAmount: { $sum: "$walletBalance" } } },
        ]);
        const totalDistributorWalletAmounts = totalDistributorWalletAmount.reduce((sum, item) => sum + (item.totalAmount || 0), 0)

        const totalRetailerWalletAmount = await SuperAdmin.aggregate([
            { $match: { role: "retailer" } },
            { $group: { _id: "$_id", totalAmount: { $sum: "$walletBalance" } } },
        ]);
        const totalRetailerWalletAmounts = totalRetailerWalletAmount.reduce((sum, item) => sum + (item.totalAmount || 0), 0)

        ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
        console.log("totalAmcData==>", totalAmcData);

        // ✅ Respond
        res.status(200).json({
            success: true,
            message: "AMC total fetched successfully",
            data: {
                totalAmc: amcCount,
                totalActiveAccount: activeAccount,
                totalExpiringThisMonth: expiringThisMonth,
                totalDistributors,
                totalRetailers,
                totalRevenue,
                amcSalesData: salesData,
                amcProductData: productData,
                amcRecentActivities: recentActivities,
                totalDistributorWalletAmounts,
                totalRetailerWalletAmounts


            },
            filterUsed: filter,
        });

    } catch (error) {
        return next(new ErrorHandler(error.message, 500));
    }
});
