const catchAsyncErrors = require("../../middleware/catchAsyncErrors");
const sendResponse = require("../../middleware/response");
const ErrorHandler = require("../../utils/ErrorHandler");
const AMC = require("./user-admin-wec-model");
const { deleteLocalFile } = require("../../middleware/DeleteImageFromLoaclFolder");
const { uploadImage } = require("../../middleware/Uploads");
const mongoose = require("mongoose");
const SuperAdmin = require("../super-admin/super-admin-model");
const UserAdmin = require("../user-admin/user-admin-model");
const { createTransactionByAdmin } = require("../transaction/transaction-controller");
const transactionModel = require("../transaction/transaction-model");
const Customers = require("../customer/customer-model");
const { CompanySettings, AMCSettings } = require("../companyDetails/companyDetails-model");
const { sendOrderNotification } = require("../../utils/mail");
const ExcelJS = require("exceljs");

exports.createAmcByAdmin = catchAsyncErrors(async (req, res, next) => {
    try {
        console.log("Incoming AMC Create Request:=>", req.body);
        const userAdmin = await UserAdmin.findOne({ email: req.body.admin.email });
        console.log("userAdmin:==>", userAdmin);
        if (!userAdmin) {
            return res.status(200).json({ status: false, message: "Admin does not exist" })
        }
        userAdmin.totalAMCs = Number(userAdmin?.totalAMCs + 1)
        userAdmin.save()

        const amc = await AMC.create({
            ...req.body,
        });

        res.status(200).json({ status: true, message: "AMC created successfully", data: amc });

    } catch (error) {
        console.error("❌ Error creating AMC:", error);
        return next(new ErrorHandler(error.message || "Internal Server Error", 500));
    }
});

// // ✅ Get AMC with pagination + search + status filter
exports.getAmcByAdminWithPagination = catchAsyncErrors(async (req, res, next) => {
    try {
        let { page = 1, limit = 10, search = "", status = "", category = "", createdByName = "", createdByEmail = "" } = req.query;
        console.log("req.query==>", req.query)
        page = Math.max(1, parseInt(page, 10));
        limit = Math.max(1, parseInt(limit, 10));

        const filter = {};
        filter["admin.name"] = { $regex: createdByName, $options: "i" };
        filter["admin.email"] = { $regex: createdByEmail, $options: "i" };

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
                { "admin.name": searchRegex },
                { "admin.email": searchRegex },
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


exports.downloadExcelWec = catchAsyncErrors(async (req, res, next) => {
    try {
        const { createdByEmail } = req.query;

        if (!createdByEmail) {
            return res.status(400).json({ status: false, message: "createdByEmail is required" });
        }

        const creator = JSON.parse(createdByEmail);

        if (!creator?.email) {
            return res.status(400).json({ status: false, message: "Invalid creator email" });
        }

        // Check if admin exists
        const userAdmin = await UserAdmin.findOne({ email: creator.email });
        if (!userAdmin) {
            return res.status(404).json({ status: false, message: "Admin not found" });
        }

        // Fetch AMC data
        const amcs = await AMC.find({
            "admin.email": creator.email,
            "admin.name": creator.name
        }).lean();

        if (!amcs.length) {
            return res.status(200).json({
                status: true,
                message: "No AMC data found",
                data: []
            });
        }


        res.status(200).json({ status: true, data: amcs, message: "AMC Report Downloaded Successfully" });

    } catch (err) {
        return next(new ErrorHandler(err.message, 500));
    }
});

// ✅ Delete AMC
exports.deleteAmcByAdmin = catchAsyncErrors(async (req, res, next) => {
    try {
        const { id } = req.params;
        const { admin } = req.body;
        console.log('XXXXXXXXXXX::=>', admin)
        const amc = await AMC.findOne({ id: id, 'admin.email': admin.email });
        const user = await UserAdmin.findOne({ email: admin?.email });
        console.log("AAAAAA:==>", amc)
        console.log("User:==>SS", user)
        if (user) {
            user.totalAMCs -= 1;
            user.save();
        }

        const deletedAmc = await AMC.findByIdAndDelete({ _id: amc._id });
        if (!deletedAmc) return next(new ErrorHandler("AMC not found", 404));
        res.status(200).json({ status: true, message: "AMC deleted successfully" })
    } catch (error) {
        return next(new ErrorHandler(error.message, 500));
    }
});

// exports.getAmcByRetailerWithPagination = catchAsyncErrors(async (req, res, next) => {
//     try {
//         const retailerId = req.params.id;
//         let { page = 1, limit = 10, search = "", status = "", category = "" } = req.query;

//         // ✅ Validate and sanitize pagination inputs
//         page = Math.max(1, parseInt(page, 10));
//         limit = Math.max(1, parseInt(limit, 10));

//         // ✅ Base filter (for specific retailer)
//         const filter = {};
//         if (retailerId && mongoose.Types.ObjectId.isValid(retailerId)) {
//             filter.retailerId = retailerId;
//         } else {
//             return next(new ErrorHandler("Invalid retailer ID", 400));
//         }

//         // ✅ Add status filter
//         if (status && status.toLowerCase() !== "all") {
//             filter.status = status.toLowerCase();
//         }

//         if (category && category.toLowerCase() !== "all") {
//             filter.productCategory = category;
//         }

//         // ✅ Add search filter
//         if (search && search.trim() !== "") {
//             const searchRegex = new RegExp(search.trim(), "i");
//             filter.$or = [
//                 { customerName: searchRegex },
//                 { id: searchRegex },
//                 { customerEmail: searchRegex },
//                 { customerMobile: searchRegex },
//                 { productCategory: searchRegex },
//                 { productBrand: searchRegex },
//                 { productType: searchRegex },
//             ];
//         }

//         // ✅ Get paginated AMC data
//         const [amcs, total, totalAMCs, totalExpiredAMCs, totalActiveAMCs, totalExpiringSoonAMCs] =
//             await Promise.all([
//                 AMC.find(filter)
//                     .sort({ createdAt: -1 })
//                     .skip((page - 1) * limit)
//                     .limit(limit)
//                     .lean(),
//                 AMC.countDocuments(filter),
//                 AMC.countDocuments({ retailerId }),
//                 AMC.countDocuments({ retailerId, status: "expired" }),
//                 AMC.countDocuments({ retailerId, status: "active" }),
//                 AMC.countDocuments({ retailerId, status: "expiring_soon" }),
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
//                 totalPages,
//                 currentPage: page,
//                 pageSize: limit,
//                 hasNextPage: page < totalPages,
//                 hasPrevPage: page > 1,
//             },
//         });
//     } catch (error) {
//         console.error("❌ Error fetching AMCs by retailer:", error);
//         return next(new ErrorHandler(error.message, 500));
//     }
// });


// exports.getAmcByDistributorWithPagination = catchAsyncErrors(async (req, res, next) => {
//     try {
//         // const distributorId = req.params.id;
//         // let { page = 1, limit = 10, search = "", status = "", category = "", createdByEmail } = req.query;

//         // let userExite = null;

//         // if (createdByEmail) {
//         //     userExite = await SuperAdmin.find({
//         //         "createdByEmail.email": typeof createdByEmail === "string"
//         //             ? createdByEmail
//         //             : createdByEmail?.email
//         //     });
//         // }
//         // if (!userExite) {
//         //     return next(new ErrorHandler("Invalid distributor ID", 400));
//         // }
//         // const createdByEmails = userExite.map((item) => item.email)

//         // // ✅ Validate and sanitize pagination inputs
//         // page = Math.max(1, parseInt(page, 10));
//         // limit = Math.max(1, parseInt(limit, 10));

//         // // ✅ Base filter (for specific retailer)
//         // const filter = {};
//         // if (distributorId && mongoose.Types.ObjectId.isValid(distributorId)) {
//         //     filter.distributorId = distributorId;
//         // } else {
//         //     return next(new ErrorHandler("Invalid retailer ID", 400));
//         // }
//         // console.log("createdByEmails==", createdByEmails)
//         // if (createdByEmails) {
//         //     filter["createdByEmail.email"] = { $in: createdByEmails };
//         // }

//         // // ✅ Add status filter
//         // if (status && status.toLowerCase() !== "all") {
//         //     filter.status = status.toLowerCase();
//         // }

//         // if (category && category.toLowerCase() !== "all") {
//         //     const searchRegex = new RegExp(category.trim(), "i");
//         //     filter.productCategory = searchRegex;
//         // }

//         // // ✅ Add search filter
//         // if (search && search.trim() !== "") {
//         //     const searchRegex = new RegExp(search.trim(), "i");
//         //     filter.$or = [
//         //         { customerName: searchRegex },
//         //         { id: searchRegex },
//         //         { customerEmail: searchRegex },
//         //         { customerMobile: searchRegex },
//         //         { productCategory: searchRegex },
//         //         { productBrand: searchRegex },
//         //         { productType: searchRegex },
//         //         { retailerName: searchRegex },

//         //     ];
//         // }

//         const distributorId = req.params.id;
//         let { page = 1, limit = 10, search = "", status = "", category = "", createdByEmail } = req.query;

//         // ✅ Fetch all child users under this admin
//         let userList = [];
//         if (createdByEmail) {
//             userList = await SuperAdmin.find({
//                 "createdByEmail.email": typeof createdByEmail === "string" ? createdByEmail : createdByEmail?.email
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

//         // ✅ Get paginated AMC data
//         const [amcs, total, totalAMCs, totalExpiredAMCs, totalActiveAMCs, totalExpiringSoonAMCs] =
//             await Promise.all([
//                 AMC.find(filter).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).lean(),
//                 AMC.countDocuments({ ...filter }),
//                 AMC.countDocuments({ ...filter, }),
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
//                 totalPages,
//                 currentPage: page,
//                 pageSize: limit,
//                 hasNextPage: page < totalPages,
//                 hasPrevPage: page > 1,
//             },
//         });
//     } catch (error) {
//         console.error("❌ Error fetching AMCs by retailer:", error);
//         return next(new ErrorHandler(error.message, 500));
//     }
// });

// // ✅ Update AMC
// exports.updateAmcByAdmin = catchAsyncErrors(async (req, res, next) => {
//     try {
//         const { id } = req.params;

//         let updateData = { ...req.body };

//         if (req.file) {
//             const localImagePath = req.file.path;
//             const imageUrl = await uploadImage(localImagePath);
//             deleteLocalFile(localImagePath);
//             updateData.purchaseProof = imageUrl;
//         }

//         const updatedAmc = await AMC.findByIdAndUpdate(id, updateData, {
//             new: true,
//             runValidators: true,
//         });

//         if (!updatedAmc) return next(new ErrorHandler("AMC not found", 404));

//         return sendResponse(res, true, 200, "AMC updated successfully", updatedAmc);
//     } catch (error) {
//         return next(new ErrorHandler(error.message, 500));
//     }
// });

// // ✅ Get AMC
// exports.getAmcByAdmin = catchAsyncErrors(async (req, res, next) => {
//     try {
//         const amc = await AMC.findById(req.params.id).lean();
//         if (!amc) return next(new ErrorHandler("AMC not found", 404));
//         return sendResponse(res, true, 200, "AMC fetched successfully", amc);
//     } catch (error) {
//         return next(new ErrorHandler(error.message, 500));
//     }
// });


// exports.getAmcByCustomer = catchAsyncErrors(async (req, res, next) => {
//     try {
//         const { customerEmail } = req.query;

//         if (!customerEmail) {
//             return res.status(400).json({
//                 status: false,
//                 message: "customerEmail query parameter is required"
//             });
//         }

//         console.log("Fetching AMC for Email:", customerEmail);

//         const amcList = await AMC.find({ customerEmail: { $regex: new RegExp(`^${customerEmail}$`, "i") } }).lean();

//         if (!amcList || amcList.length === 0) {
//             return res.status(404).json({ status: false, message: "No AMC records found for this customer" });
//         }

//         return res.status(200).json({ status: true, message: "AMC fetched successfully", data: amcList });

//     } catch (error) {
//         console.error("Error in getAmcByCustomer:", error);
//         return next(new ErrorHandler(error.message, 500));
//     }
// });
