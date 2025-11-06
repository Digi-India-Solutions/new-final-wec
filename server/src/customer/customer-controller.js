const catchAsyncErrors = require("../../middleware/catchAsyncErrors");
const sendResponse = require("../../middleware/response");
const ErrorHandler = require("../../utils/ErrorHandler");
const { sendOrderNotification } = require("../../utils/mail");
const Customers = require("./customer-model");
const ExcelJS = require("exceljs");
const { CompanySettings, AMCSettings } = require("../companyDetails/companyDetails-model");

// ✅ Create Customer
exports.createCustomerByAdmin = catchAsyncErrors(async (req, res, next) => {
    try {
        console.log("req.body::===>", req.body);

        const customer = await Customers.create({
            ...req.body,
            createdByEmail: req.body.createdByEmail
                ? JSON.parse(req.body.createdByEmail)
                : null,
        });

        return sendResponse(res, true, 200, "Customer created successfully", customer);
    } catch (error) {
        return next(new ErrorHandler(error.message, 500));
    }
});

// ✅ Get All Customers (with pagination + search)
exports.getCustomerByAdminWithPagination = catchAsyncErrors(async (req, res, next) => {
    try {
        let { page = 1, limit = 10, search = "" } = req.query;
        page = Math.max(1, parseInt(page, 10));
        limit = Math.max(1, parseInt(limit, 10));

        const filter = {};

        if (search && search.trim() !== "") {
            const searchRegex = new RegExp(search.trim(), "i");
            filter.$or = [
                { name: searchRegex },
                { email: searchRegex },
                { mobile: searchRegex },
                { address: searchRegex },
            ];
        }

        const total = await Customers.countDocuments(filter);
        const totalData = await Customers.countDocuments();
        const aggregateStats = await Customers.aggregate([
            {
                $group: {
                    _id: null,
                    totalActiveAMCs: { $sum: "$activeAMCs" },
                    totalAMCs: { $sum: "$totalAMCs" },
                    totalRevenue: { $sum: "$totalSpent" },
                },
            },
        ]);

        const totalActiveAMCs = aggregateStats[0]?.totalActiveAMCs || 0;
        const totalAMCs = aggregateStats[0]?.totalAMCs || 0;
        const totalRevenue = aggregateStats[0]?.totalRevenue || 0;
        const totalInactiveAMCs = totalAMCs - totalActiveAMCs;

        const customers = await Customers.find(filter)
            .sort({ createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(limit)
            .lean();

        const totalPages = Math.ceil(total / limit);

        res.status(200).json({
            status: true,
            message: "Customers fetched successfully",
            data: customers,
            pagination: {
                total,
                totalPages,
                currentPage: page,
                pageSize: limit,
                hasNextPage: page < totalPages,
                hasPrevPage: page > 1,
                totalData,
                totalRevenue,
                totalInActive: totalInactiveAMCs,
                totalActive: totalActiveAMCs
            },
        })

    } catch (error) {
        return next(new ErrorHandler(error.message, 500));
    }
});

// ✅ Update Customer
exports.updateCustomerByAdmin = catchAsyncErrors(async (req, res, next) => {
    try {
        const { id } = req.params;
        const existingCustomer = await Customers.findById(id);

        if (!existingCustomer) {
            return next(new ErrorHandler("Customer not found", 404));
        }

        const updatedCustomer = await Customers.findByIdAndUpdate(id, req.body, {
            new: true,
            runValidators: true,
        });

        return sendResponse(res, true, 200, "Customer updated successfully", updatedCustomer);
    } catch (error) {
        return next(new ErrorHandler(error.message, 500));
    }
});

// ✅ Delete Customer
exports.deleteCustomerByAdmin = catchAsyncErrors(async (req, res, next) => {
    try {
        const { id } = req.params;
        const existingCustomer = await Customers.findById(id);

        if (!existingCustomer) {
            return next(new ErrorHandler("Customer not found", 404));
        }

        await Customers.findByIdAndDelete(id);

        return sendResponse(res, true, 200, "Customer deleted successfully", existingCustomer);
    } catch (error) {
        return next(new ErrorHandler(error.message, 500));
    }
});

// exports.exportCustomersByAdmin = catchAsyncErrors(async (req, res, next) => {
//     try {
//         // 1️⃣ Fetch all data
//         const customers = await Customers.find().lean();

//         // 2️⃣ Create Excel workbook
//         const workbook = new ExcelJS.Workbook();
//         const worksheet = workbook.addWorksheet("Customers");

//         // 3️⃣ Define columns
//         worksheet.columns = [
//             { header: "Customer ID", key: "customerId", width: 20 },
//             { header: "Name", key: "name", width: 25 },
//             { header: "Email", key: "email", width: 30 },
//             { header: "Mobile", key: "mobile", width: 15 },
//             { header: "Address", key: "address", width: 30 },
//             { header: "Total AMCs", key: "totalAMCs", width: 15 },
//             { header: "Active AMCs", key: "activeAMCs", width: 15 },
//             { header: "Total Spent", key: "totalSpent", width: 15 },
//             { header: "Created By", key: "createdBy", width: 25 },
//             { header: "Created At", key: "createdAt", width: 20 },
//         ];

//         // 4️⃣ Add rows
//         customers.forEach((c) => {
//             worksheet.addRow({
//                 customerId: c.customerId,
//                 name: c.name,
//                 email: c.email,
//                 mobile: c.mobile,
//                 address: c.address,
//                 totalAMCs: c.totalAMCs,
//                 activeAMCs: c.activeAMCs,
//                 totalSpent: c.totalSpent,
//                 createdBy: c.createdByEmail?.email || "",
//                 createdAt: new Date(c.createdAt).toLocaleString(),
//             });
//         });

//         // 5️⃣ Set headers for download
//         res.setHeader(
//             "Content-Type",
//             "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
//         );
//         res.setHeader(
//             "Content-Disposition",
//             "attachment; filename=customers.xlsx"
//         );

//         // 6️⃣ Write file to response stream
//         await workbook.xlsx.write(res);
//         res.end();
//     } catch (error) {
//         return next(new ErrorHandler(error.message, 500));
//     }
// });

exports.exportCustomersByAdmin = catchAsyncErrors(async (req, res, next) => {
    try {
        // 1. Fetch all customers
        const customers = await Customers.find().lean();

        // 2. Create workbook + worksheet
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet("Customers");

        // 3. Define columns
        worksheet.columns = [
            { header: "Customer ID", key: "customerId", width: 20 },
            { header: "Name", key: "name", width: 25 },
            { header: "Email", key: "email", width: 30 },
            { header: "Mobile", key: "mobile", width: 15 },
            { header: "Address", key: "address", width: 30 },
            { header: "Total AMCs", key: "totalAMCs", width: 15 },
            { header: "Active AMCs", key: "activeAMCs", width: 15 },
            { header: "Total Spent", key: "totalSpent", width: 15 },
            { header: "Created By", key: "createdBy", width: 25 },
            { header: "Created At", key: "createdAt", width: 20 },
        ];

        // 4. Add rows
        customers.forEach((c) => {
            worksheet.addRow({
                customerId: c.customerId || "",
                name: c.name || "",
                email: c.email || "",
                mobile: c.mobile || "",
                address: c.address || "",
                totalAMCs: c.totalAMCs ?? 0,
                activeAMCs: c.activeAMCs ?? 0,
                totalSpent: c.totalSpent ?? 0,
                createdBy: c.createdByEmail?.email || c.createdByEmail?.name || "",
                createdAt: c.createdAt ? new Date(c.createdAt).toLocaleString() : "",
            });
        });

        // Optional: format header row
        worksheet.getRow(1).font = { bold: true };

        // 5. Generate buffer (safer and easier to send)
        const buffer = await workbook.xlsx.writeBuffer();

        // 6. Set headers and send file
        const filename = `customers-${Date.now()}.xlsx`;
        res.setHeader(
            "Content-Type",
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        );
        res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
        res.setHeader("Content-Length", buffer.length);

        return res.status(200).send(Buffer.from(buffer));
    } catch (error) {
        return next(new ErrorHandler(error.message, 500));
    }
});

exports.sendEmail = catchAsyncErrors(async (req, res, next) => {
    try {
        // console.log("BODY:==>", req.body);
        // console.log("DATA:==>", req.body.data);
        // console.log("AMC:==>", req?.body?.data?.amc);
        const companySettings = await CompanySettings.findOne().lean();
        const termsAndConditions = await AMCSettings.findOne().lean();
        await sendOrderNotification({
            email: req?.body?.data?.email,
            name: req?.body?.data?.name,
            customer: req?.body?.data,
            companySettings,
            record: req?.body?.data?.amc,
            termsAndConditions: termsAndConditions.termsAndConditions
        })
        return res.status(200).json({ status: true, message: "Email sent successfully" });
    } catch (error) {
        return next(new ErrorHandler(error.message, 500));
    }
})