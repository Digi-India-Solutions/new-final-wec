const catchAsyncErrors = require("../../middleware/catchAsyncErrors");
const sendResponse = require("../../middleware/response");
const ErrorHandler = require("../../utils/ErrorHandler");
const AMC = require("./amcs-model");
const { deleteLocalFile } = require("../../middleware/DeleteImageFromLoaclFolder");
const { uploadImage } = require("../../middleware/Uploads");
const mongoose = require("mongoose");
const SuperAdmin = require("../super-admin/super-admin-model");
const { createTransactionByAdmin } = require("../transaction/transaction-controller");
const transactionModel = require("../transaction/transaction-model");
const Customers = require("../customer/customer-model");
const { CompanySettings, AMCSettings } = require("../companyDetails/companyDetails-model");
const { sendOrderNotification } = require("../../utils/mail");

exports.createAmcByAdmin = catchAsyncErrors(async (req, res, next) => {
    try {
        console.log("Incoming AMC Create Request:=>", req.body);

        const { userId, purchaseValue, amcPercentage, amcAmount } = req.body;

        // ✅ Validate essential fields
        if (!userId || !purchaseValue || !amcPercentage || !amcAmount) {
            return next(new ErrorHandler("Missing required fields", 400));
        }

        const lastAMC = await AMC.findOne().sort({ _id: -1 });
        let nextNumber = 1;
        if (lastAMC?.id) {
            // Extract numeric part from "WEC-10"
            const lastNum = parseInt(lastAMC.id.replace("WEC-0", ""), 10);
            nextNumber = lastNum + 1;
        }
        const nextId = `WEC-0${nextNumber}`;

        // ✅ Fetch user (distributor/retailer)
        const user = await SuperAdmin.findById(userId);
        if (!user) {
            return next(new ErrorHandler("User not found", 404));
        }

        if (user?.walletBalance < amcAmount) {
            return res.status(200).json({ status: false, massage: "Insufficient wallet balance please add amount" });
        }
        // ✅ Prepare transaction object
        const newTransaction = {
            id: Date.now().toString(),
            userId: user._id,
            userType: user.role,
            userName: user.name,
            userEmail: user.email,
            type: "debit",
            amount: Number(amcAmount),
            description: `Wallet Debit - ₹${Number(amcAmount).toLocaleString()} / (WEC Created (ID:-${nextId || ""}))`,
            clientAmount: Number(purchaseValue),
            percentage: Number(amcPercentage),
            createdBy: `${user?.name || "System"}`,
            createdByEmail: { name: user?.name, email: user?.email, role: user?.role },
            createdDate: new Date(),
            balanceAfter: (user.walletBalance || 0) - Number(amcAmount),
        };

        const { type, amount } = newTransaction;

        // 2️⃣ Determine New Wallet Balance
        let newWalletBalance = user.walletBalance || 0;

        if (type === "credit") {
            newWalletBalance += parseFloat(amount);
        } else if (type === "debit") {
            newWalletBalance -= parseFloat(amount);
            if (newWalletBalance < 0) newWalletBalance = 0; // Prevent negative balance
        }

        // 3️⃣ Update Wallet Balance
        user.walletBalance = newWalletBalance;
        if (user.totalAMCs >= 0) {
            user.totalAMCs += 1;
        }

        await user.save();

        // 4️⃣ Create Transaction Record
        const transaction = await transactionModel.create({
            ...newTransaction,
            balanceAfter: newWalletBalance,
            createdByEmail: newTransaction.createdByEmail || {},
        });

        console.log("transaction", transaction);

        // ✅ Clean up optional ObjectId fields
        const objectIdFields = ["retailerId", "distributorId", "categoryId", "brandId", "typeId"];
        for (const field of objectIdFields) {
            if (!req.body[field] || req.body[field].trim() === "") {
                req.body[field] = null;
            }
        }

        // ✅ Parse createdByEmail safely (if stringified)
        if (req.body.createdByEmail && typeof req.body.createdByEmail === "string") {
            try {
                req.body.createdByEmail = JSON.parse(req.body.createdByEmail);
            } catch {
                req.body.createdByEmail = { name: "", email: "" };
            }
        }
        console.log("req.FILES::===>", req.files);
        // ✅ Handle file upload (optional)
        let imageUrl = null;
        let imageUrl2 = null;

        if (req.files.purchaseProof) {
            const localImagePath = req.files.purchaseProof[0].path;
            imageUrl = await uploadImage(localImagePath);
            deleteLocalFile(localImagePath);
            console.log("🖼️ Uploaded image path:", imageUrl);
        }
        if (req.files.productPicture) {
            const localImagePath = req.files.productPicture[0].path;
            imageUrl2 = await uploadImage(localImagePath);
            deleteLocalFile(localImagePath);
            console.log("🖼️ Uploaded image path:", imageUrl2);
        }

        // ✅ Convert and sanitize numeric fields
        req.body.purchaseValue = Number(purchaseValue) || 0;
        req.body.amcPercentage = Number(amcPercentage) || 0;
        req.body.amcAmount = Number(amcAmount) || 0;
        req.body.renewalCount = Number(req.body.renewalCount) || 0;



        const amc = await AMC.create({
            ...req.body,
            id: nextId,
            purchaseProof: imageUrl,
            productPicture: imageUrl2,
            createdAt: new Date(),
        });



        ///////////////////////////CUSTOMER UPDATE and CREATE///////////////////////////
        const ByEmail =
            typeof req.body.createdByEmail === "string"
                ? JSON.parse(req.body.createdByEmail)
                : req.body.createdByEmail;

        const amcAmounts = Number(req.body.amcAmount) || 0; // ensure numeric value

        const customer = await Customers.findOne({ email: req.body.customerEmail });

        if (customer) {
            // Safely update counts
            customer.totalAMCs = (customer.totalAMCs || 0) + 1;

            const currentSpent = Number(customer.totalSpent) || 0;
            customer.totalSpent = currentSpent + amcAmounts;

            if (req.body.status === "active") {
                customer.activeAMCs = (customer.activeAMCs || 0) + 1;
            } else if (
                req.body.status !== "active" &&
                (customer.activeAMCs || 0) > 0
            ) {
                customer.activeAMCs -= 1;
            }

            await customer.save();
        } else {
            await Customers.create({
                customerId: `CUSTOMER-${Math.floor(Math.random() * 10000)}`,
                email: req.body.customerEmail,
                name: req.body.customerName,
                mobile: req.body.customerMobile,
                address: req.body.customerAddress,
                totalAMCs: 1,
                totalSpent: amcAmount,
                activeAMCs: req.body.status === "active" ? 1 : 0,
                createdByEmail: ByEmail || null,
            });
        }

        const companySettings = await CompanySettings.findOne().lean();
        const termsAndConditions = await AMCSettings.findOne().lean();

        await sendOrderNotification({
            email: req.body.customerEmail,
            name: req.body.customerName,
            customer: customer || {
                email: req.body.customerEmail,
                name: req.body.customerName,
                mobile: req.body.customerMobile,
                address: req.body.customerAddress,
                totalAMCs: 1,
                totalSpent: amcAmount,
                activeAMCs: req.body.status === "active" ? 1 : 0,
                createdByEmail: ByEmail || null
            },
            companySettings,
            record: {
                amcs: [{
                    ...req.body,
                    id: nextId,
                    purchaseProof: imageUrl,
                    productPicture: imageUrl2,
                    createdAt: new Date(),
                }]
            },
            termsAndConditions: termsAndConditions.termsAndConditions
        })

        /////////////////////////////////////////////////////////////////////////////////////////
        res.status(200).json({ status: true, message: "AMC created successfully", data: amc, walletBalanceAfter: user.walletBalance, });

    } catch (error) {
        console.error("❌ Error creating AMC:", error);
        return next(new ErrorHandler(error.message || "Internal Server Error", 500));
    }
});
// ✅ Get AMC with pagination + search + status filter
exports.getAmcByAdminWithPagination = catchAsyncErrors(async (req, res, next) => {
    try {
        let { page = 1, limit = 10, search = "", status = "", category = "" } = req.query;
        page = Math.max(1, parseInt(page, 10));
        limit = Math.max(1, parseInt(limit, 10));

        const filter = {};

        if (status && status !== "all") {
            filter.status = new RegExp(`^${status}$`, "i");
        }
        if (category && category.toLowerCase() !== "all") {
            const searchRegex = new RegExp(category.trim(), "i");
            filter.productCategory = category || searchRegex;
        }

        if (search && search.trim() !== "") {
            const searchRegex = new RegExp(search.trim(), "i");
            filter.$or = [
                { customerName: searchRegex },
                { id: searchRegex },
                { customerEmail: searchRegex },
                { customerMobile: searchRegex },
                { productCategory: searchRegex },
                { distributorName: searchRegex },
                { retailerName: searchRegex },
            ];
        }

        const total = await AMC.countDocuments(filter);
        const totalAMCs = await AMC.countDocuments();
        const totalExpiredAMCs = await AMC.countDocuments({ status: "expired" });
        const totalActiveAMCs = await AMC.countDocuments({ status: "active" });
        const totalExpiringSoonAMCs = await AMC.countDocuments({ status: "expiring_soon" });
        const amcs = await AMC.find(filter).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).lean();

        const totalPages = Math.ceil(total / limit);

        res.status(200).json({
            status: true,
            message: "AMCs fetched successfully",
            data: amcs,
            pagination: {
                total,
                totalAMCs,
                totalExpiredAMCs,
                totalActiveAMCs,
                totalExpiringSoonAMCs,
                totalPages,
                currentPage: page,
                pageSize: limit,
                hasNextPage: page < totalPages,
                hasPrevPage: page > 1,
            },
        });
    } catch (error) {
        return next(new ErrorHandler(error.message, 500));
    }
});

exports.getAmcByRetailerWithPagination = catchAsyncErrors(async (req, res, next) => {
    try {
        const retailerId = req.params.id;
        let { page = 1, limit = 10, search = "", status = "", category = "" } = req.query;

        // ✅ Validate and sanitize pagination inputs
        page = Math.max(1, parseInt(page, 10));
        limit = Math.max(1, parseInt(limit, 10));

        // ✅ Base filter (for specific retailer)
        const filter = {};
        if (retailerId && mongoose.Types.ObjectId.isValid(retailerId)) {
            filter.retailerId = retailerId;
        } else {
            return next(new ErrorHandler("Invalid retailer ID", 400));
        }

        // ✅ Add status filter
        if (status && status.toLowerCase() !== "all") {
            filter.status = status.toLowerCase();
        }

        if (category && category.toLowerCase() !== "all") {
            filter.productCategory = category;
        }

        // ✅ Add search filter
        if (search && search.trim() !== "") {
            const searchRegex = new RegExp(search.trim(), "i");
            filter.$or = [
                { customerName: searchRegex },
                { id: searchRegex },
                { customerEmail: searchRegex },
                { customerMobile: searchRegex },
                { productCategory: searchRegex },
                { productBrand: searchRegex },
                { productType: searchRegex },
            ];
        }

        // ✅ Get paginated AMC data
        const [amcs, total, totalAMCs, totalExpiredAMCs, totalActiveAMCs, totalExpiringSoonAMCs] =
            await Promise.all([
                AMC.find(filter)
                    .sort({ createdAt: -1 })
                    .skip((page - 1) * limit)
                    .limit(limit)
                    .lean(),
                AMC.countDocuments(filter),
                AMC.countDocuments({ retailerId }),
                AMC.countDocuments({ retailerId, status: "expired" }),
                AMC.countDocuments({ retailerId, status: "active" }),
                AMC.countDocuments({ retailerId, status: "expiring_soon" }),
            ]);

        const totalPages = Math.ceil(total / limit);

        res.status(200).json({
            status: true,
            message: "AMCs fetched successfully",
            data: amcs,
            pagination: {
                total,
                totalAMCs,
                totalExpiredAMCs,
                totalActiveAMCs,
                totalExpiringSoonAMCs,
                totalPages,
                currentPage: page,
                pageSize: limit,
                hasNextPage: page < totalPages,
                hasPrevPage: page > 1,
            },
        });
    } catch (error) {
        console.error("❌ Error fetching AMCs by retailer:", error);
        return next(new ErrorHandler(error.message, 500));
    }
});

exports.getAmcByDistributorWithPagination = catchAsyncErrors(async (req, res, next) => {
    try {
        // const distributorId = req.params.id;
        // let { page = 1, limit = 10, search = "", status = "", category = "", createdByEmail } = req.query;

        // let userExite = null;

        // if (createdByEmail) {
        //     userExite = await SuperAdmin.find({
        //         "createdByEmail.email": typeof createdByEmail === "string"
        //             ? createdByEmail
        //             : createdByEmail?.email
        //     });
        // }
        // if (!userExite) {
        //     return next(new ErrorHandler("Invalid distributor ID", 400));
        // }
        // const createdByEmails = userExite.map((item) => item.email)

        // // ✅ Validate and sanitize pagination inputs
        // page = Math.max(1, parseInt(page, 10));
        // limit = Math.max(1, parseInt(limit, 10));

        // // ✅ Base filter (for specific retailer)
        // const filter = {};
        // if (distributorId && mongoose.Types.ObjectId.isValid(distributorId)) {
        //     filter.distributorId = distributorId;
        // } else {
        //     return next(new ErrorHandler("Invalid retailer ID", 400));
        // }
        // console.log("createdByEmails==", createdByEmails)
        // if (createdByEmails) {
        //     filter["createdByEmail.email"] = { $in: createdByEmails };
        // }

        // // ✅ Add status filter
        // if (status && status.toLowerCase() !== "all") {
        //     filter.status = status.toLowerCase();
        // }

        // if (category && category.toLowerCase() !== "all") {
        //     const searchRegex = new RegExp(category.trim(), "i");
        //     filter.productCategory = searchRegex;
        // }

        // // ✅ Add search filter
        // if (search && search.trim() !== "") {
        //     const searchRegex = new RegExp(search.trim(), "i");
        //     filter.$or = [
        //         { customerName: searchRegex },
        //         { id: searchRegex },
        //         { customerEmail: searchRegex },
        //         { customerMobile: searchRegex },
        //         { productCategory: searchRegex },
        //         { productBrand: searchRegex },
        //         { productType: searchRegex },
        //         { retailerName: searchRegex },

        //     ];
        // }

        const distributorId = req.params.id;
        let { page = 1, limit = 10, search = "", status = "", category = "", createdByEmail } = req.query;

        // ✅ Fetch all child users under this admin
        let userList = [];
        if (createdByEmail) {
            userList = await SuperAdmin.find({
                "createdByEmail.email": typeof createdByEmail === "string" ? createdByEmail : createdByEmail?.email
            }).lean();
        }
        if (!userList.length) {
            return next(new ErrorHandler("No users found under this creator", 400));
        }

        const createdByEmails = userList.map(u => u.email);

        // ✅ Pagination sanitize
        page = Math.max(1, parseInt(page));
        limit = Math.max(1, parseInt(limit));

        // ✅ Base filter
        if (!mongoose.Types.ObjectId.isValid(distributorId)) {
            return next(new ErrorHandler("Invalid distributor ID", 400));
        }

        const filter = {};

        filter.$or = [
            { distributorId },
            { "createdByEmail.email": { $in: createdByEmails } }
        ];

        // ✅ Status Filter
        if (status && status.toLowerCase() !== "all") {
            filter.status = status.toLowerCase();
        }

        // ✅ Category Filter
        if (category && category.toLowerCase() !== "all") {
            filter.productCategory = new RegExp(category.trim(), "i");
        }

        // ✅ Search Filter
        if (search.trim()) {
            const searchRegex = new RegExp(search.trim(), "i");
            filter.$or = [
                { customerName: searchRegex },
                { id: searchRegex },
                { customerEmail: searchRegex },
                { customerMobile: searchRegex },
                { productCategory: searchRegex },
                { productBrand: searchRegex },
                { retailerName: searchRegex },
            ];
        }

        // ✅ Get paginated AMC data
        const [amcs, total, totalAMCs, totalExpiredAMCs, totalActiveAMCs, totalExpiringSoonAMCs] =
            await Promise.all([
                AMC.find(filter).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).lean(),
                AMC.countDocuments({ ...filter }),
                AMC.countDocuments({ ...filter, }),
                AMC.countDocuments({ ...filter, status: "expired" }),
                AMC.countDocuments({ ...filter, status: "active" }),
                AMC.countDocuments({ ...filter, status: "expiring_soon" }),
            ]);

        const totalPages = Math.ceil(total / limit);

        res.status(200).json({
            status: true,
            message: "AMCs fetched successfully",
            data: amcs,
            pagination: {
                total,
                totalAMCs,
                totalExpiredAMCs,
                totalActiveAMCs,
                totalExpiringSoonAMCs,
                totalPages,
                currentPage: page,
                pageSize: limit,
                hasNextPage: page < totalPages,
                hasPrevPage: page > 1,
            },
        });
    } catch (error) {
        console.error("❌ Error fetching AMCs by retailer:", error);
        return next(new ErrorHandler(error.message, 500));
    }
});

// exports.getAmcByDistributorWithPagination = catchAsyncErrors(async (req, res, next) => {
//     try {
//         const distributorId = req.params.id;
//         let { page = 1, limit = 10, search = "", status = "", category = "", createdByEmail } = req.query;

//         // ✅ Fetch all child users under this admin
//         let userList = [];
//         if (createdByEmail) {
//             userList = await SuperAdmin.find({
//                 "createdByEmail.email": typeof createdByEmail === "string"
//                     ? createdByEmail
//                     : createdByEmail?.email
//             }).lean();
//         }
//         if (!userList.length) {
//             return next(new ErrorHandler("No users found under this creator", 400));
//         }

//         const createdByEmails = userList.map(u => u.email);

//         // ✅ Pagination sanitize
//         page = Math.max(1, parseInt(page));
//         limit = Math.max(1, parseInt(limit));

//         // ✅ Base filter
//         if (!mongoose.Types.ObjectId.isValid(distributorId)) {
//             return next(new ErrorHandler("Invalid distributor ID", 400));
//         }

//         const filter = {};

//         filter.$or = [
//             { distributorId },
//             { "createdByEmail.email": { $in: createdByEmails } }
//         ];

//         // ✅ Status Filter
//         if (status && status.toLowerCase() !== "all") {
//             filter.status = status.toLowerCase();
//         }

//         // ✅ Category Filter
//         if (category && category.toLowerCase() !== "all") {
//             filter.productCategory = new RegExp(category.trim(), "i");
//         }

//         // ✅ Search Filter
//         if (search.trim()) {
//             const searchRegex = new RegExp(search.trim(), "i");
//             filter.$or = [
//                 { customerName: searchRegex },
//                 { id: searchRegex },
//                 { customerEmail: searchRegex },
//                 { customerMobile: searchRegex },
//                 { productCategory: searchRegex },
//                 { productBrand: searchRegex },
//                 { retailerName: searchRegex },
//             ];
//         }

//         // ✅ Fetch Data + Stats in Parallel
//         // const [amcs, total, totalAMCs, totalExpiredAMCs, totalActiveAMCs, totalExpiringSoonAMCs] = await Promise.all([
//         //     AMC.find(filter)
//         //         .sort({ createdAt: -1 })
//         //         .skip((page - 1) * limit)
//         //         .limit(limit)
//         //         .lean(),

//         //     AMC.countDocuments(filter),
//         //     AMC.countDocuments({ distributorId, "createdByEmail.email": { $in: createdByEmails } }),
//         //     AMC.countDocuments({ distributorId, status: "expired", "createdByEmail.email": { $in: createdByEmails } }),
//         //     AMC.countDocuments({ distributorId, status: "active", "createdByEmail.email": { $in: createdByEmails } }),
//         //     AMC.countDocuments({ distributorId, status: "expiring_soon", "createdByEmail.email": { $in: createdByEmails } }),
//         // ]);

//         const [amcs, total, totalAMCs, totalExpiredAMCs, totalActiveAMCs, totalExpiringSoonAMCs] =
//             await Promise.all([
//                 AMC.find(filter).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).lean(),
//                 AMC.countDocuments(filter),
//                 AMC.countDocuments({ ...filter }),
//                 AMC.countDocuments({ ...filter, status: "expired" }),
//                 AMC.countDocuments({ ...filter, status: "active" }),
//                 AMC.countDocuments({ ...filter, status: "expiring_soon" }),
//             ]);

//         const totalPages = Math.ceil(total / limit);

//         res.status(200).json({
//             status: true,
//             message: "AMCs fetched successfully",
//             data: amcs,
//             pagination: {
//                 total,
//                 totalAMCs,
//                 totalExpiredAMCs,
//                 totalActiveAMCs,
//                 totalExpiringSoonAMCs,
//                 totalPages: Math.ceil(total / limit),
//                 currentPage: page,
//                 pageSize: limit,
//             },
//         });

//     } catch (error) {
//         console.error("❌ Error fetching AMCs:", error);
//         return next(new ErrorHandler(error.message, 500));
//     }
// });


// ✅ Update AMC
exports.updateAmcByAdmin = catchAsyncErrors(async (req, res, next) => {
    try {
        const { id } = req.params;

        let updateData = { ...req.body };

        if (req.file) {
            const localImagePath = req.file.path;
            const imageUrl = await uploadImage(localImagePath);
            deleteLocalFile(localImagePath);
            updateData.purchaseProof = imageUrl;
        }

        const updatedAmc = await AMC.findByIdAndUpdate(id, updateData, {
            new: true,
            runValidators: true,
        });

        if (!updatedAmc) return next(new ErrorHandler("AMC not found", 404));

        return sendResponse(res, true, 200, "AMC updated successfully", updatedAmc);
    } catch (error) {
        return next(new ErrorHandler(error.message, 500));
    }
});

// ✅ Delete AMC
exports.deleteAmcByAdmin = catchAsyncErrors(async (req, res, next) => {
    try {
        const { id } = req.params;
        const amc = await AMC.findById(id);
        const user = await SuperAdmin.findOne({ email: amc?.createdByEmail?.email });
        // console.log("AAAAAA:==>", amc)
        // console.log("User:==>", user)
        if (user) {
            user.totalAMCs -= 1;
        }

        user.save();

        const deletedAmc = await AMC.findByIdAndDelete(id);
        if (!deletedAmc) return next(new ErrorHandler("AMC not found", 404));
        res.status(200).json({ status: true, message: "AMC deleted successfully" })
    } catch (error) {
        return next(new ErrorHandler(error.message, 500));
    }
});

// ✅ Get AMC
exports.getAmcByAdmin = catchAsyncErrors(async (req, res, next) => {
    try {
        const amc = await AMC.findById(req.params.id).lean();
        if (!amc) return next(new ErrorHandler("AMC not found", 404));
        return sendResponse(res, true, 200, "AMC fetched successfully", amc);
    } catch (error) {
        return next(new ErrorHandler(error.message, 500));
    }
});


exports.getAmcByCustomer = catchAsyncErrors(async (req, res, next) => {
    try {
        const { customerEmail } = req.query;

        if (!customerEmail) {
            return res.status(400).json({
                status: false,
                message: "customerEmail query parameter is required"
            });
        }

        console.log("Fetching AMC for Email:", customerEmail);

        const amcList = await AMC.find({ customerEmail: { $regex: new RegExp(`^${customerEmail}$`, "i") } }).lean();

        if (!amcList || amcList.length === 0) {
            return res.status(404).json({ status: false, message: "No AMC records found for this customer" });
        }

        return res.status(200).json({ status: true, message: "AMC fetched successfully", data: amcList });

    } catch (error) {
        console.error("Error in getAmcByCustomer:", error);
        return next(new ErrorHandler(error.message, 500));
    }
});
