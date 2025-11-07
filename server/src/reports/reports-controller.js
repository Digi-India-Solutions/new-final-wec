const amcsModel = require("../amcs/amcs-model");
const catchAsyncErrors = require("../../middleware/catchAsyncErrors");
const ErrorHandler = require("../../utils/ErrorHandler");
const SuperAdmin = require("../super-admin/super-admin-model");
const Transactions = require("../transaction/transaction-model");
const dayjs = require("dayjs");
const relativeTime = require("dayjs/plugin/relativeTime");
dayjs.extend(relativeTime);


exports.getAllReportsTotal = catchAsyncErrors(async (req, res, next) => {
    try {
        const { userId, role, createdByEmail, startDate, endDate, productCategory, period } = req.query;

        const today = new Date();
        const currentYear = today.getFullYear();
        const currentMonth = today.getMonth() + 1;
        const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
        const colors = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#6366F1', '#14B8A6'];

        console.log("Incoming Query:==>", req.query, currentMonth, currentYear);

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
            // console.log("userIda:===>", userId, "role:", role);
            if (role === "distributor") {
                filter.distributorId = userId;
            } else if (role === "retailer") {
                filter.retailerId = userId;
            }
        }
        if (startDate && endDate) {
            filter.createdAt = {
                $gte: new Date(startDate),
                $lte: new Date(new Date(endDate).setHours(23, 59, 59))
            };
        }

        if (period) {
            const now = new Date();
            const dateRanges = {
                'daily': new Date(now.setDate(now.getDate() - 1)),
                'weekly': new Date(now.setDate(now.getDate() - 7)),
                'monthly': new Date(now.setDate(now.getDate() - 30)),
                'quarterly': new Date(now.setMonth(now.getMonth() - 3)),
                'yearly': new Date(now.setFullYear(now.getFullYear() - 1))
            };
            if (dateRanges[period]) filter.createdAt = { $gte: dateRanges[period] };
        }

        if (createdBy?.email && role === "distributor" || role === "retailer") {
            filter["createdByEmail.email"] = createdBy.email;
        }

        console.log("XXXXXXXXXXX::=>", filter);
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

        const distributorPerformances = await amcsModel.aggregate([
            {
                $match: {
                    ...filter,
                    status: "active",
                    distributorName: { $ne: null }   // ✅ ignore null
                }
            },
            {
                $group: {
                    _id: "$distributorId",
                    name: { $first: "$distributorName" },
                    amcs: { $sum: 1 },
                    revenue: { $sum: "$amcAmount" },
                    retailers: { $addToSet: "$retailerName" }
                }
            },
            {
                $project: {
                    _id: 0,
                    name: 1,
                    amcs: 1,
                    revenue: 1,
                    retailers: {
                        $size: {
                            $filter: {
                                input: "$retailers",
                                as: "r",
                                cond: { $ne: ["$$r", ""] }
                            }
                        }
                    }
                }
            }
        ]);

        const retailerPerformances = await amcsModel.aggregate([
            {
                $match: {
                    ...filter,
                    status: "active",
                    retailerName: { $ne: null }   // ✅ ignore null
                }
            },
            {
                $group: {
                    _id: "$retailerId",
                    name: { $first: "$retailerName" },
                    amcs: { $sum: 1 },
                    revenue: { $sum: "$amcAmount" },

                }
            },
            {
                $project: {
                    _id: 0,
                    name: 1,
                    amcs: 1,
                    revenue: 1,

                }
            }
        ]);

        const monthlySalesData = await amcsModel.aggregate([
            {
                $match: {
                    ...filter,
                    status: "active",
                }
            },
            {
                $group: {
                    _id: {
                        month: { $month: "$createdAt" },
                        year: { $year: "$createdAt" }
                    },
                    count: { $sum: 1 },                 // Number of AMCs
                    revenue: { $sum: "$amcAmount" }     // Total AMC Value
                }
            },
            {
                $sort: { "_id.year": 1, "_id.month": 1 }
            }
        ]);
        console.log("totalAmcData==>formattedData", monthlySalesData);

        const formattedData = monthlySalesData.map(item => ({
            month: monthNames[item._id.month - 1],
            sales: item.revenue,   // or item.revenue * any logic you want
            revenue: item.revenue,
            count: item.count
        }));

        // console.log("XXXXXXXXXXXretailerPerformances::=>", formattedData)

        const totalRetailers = role === "distributor" ? await SuperAdmin.countDocuments({ 'createdByEmail.email': createdBy?.email, role: "retailer" }) :
            await SuperAdmin.countDocuments({ ...filter, role: "retailer" });

        const usersTransactions = await Transactions.find({ "createdByEmail.email": createdBy?.email, type: 'debit' })

        const totalRevenue = usersTransactions.reduce((sum, transaction) => sum + transaction.amount, 0);
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

        console.log("totalAmcData==>formattedData", formattedData);

        // ✅ Respond
        res.status(200).json({
            success: true,
            message: "AMC total fetched successfully",
            data: {
                totalAmc: amcCount,
                totalActiveAccount: activeAccount,
                totalExpiringThisMonth: expiringThisMonth,
                distributorPerformances,
                retailerPerformances,
                totalRevenue,
                amcSalesData: salesData,
                amcProductData: productData,
                amcRecentActivities: recentActivities,
                formattedData,
            },
            filterUsed: filter,
        });
    } catch (error) {
        return next(new ErrorHandler(error.message, 500));
    }
});
