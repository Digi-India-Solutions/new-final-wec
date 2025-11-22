const catchAsyncErrors = require("../../middleware/catchAsyncErrors");
const sendResponse = require("../../middleware/response");
const ErrorHandler = require("../../utils/ErrorHandler");
const UserAdmin = require("./user-admin-model");
const bcrypt = require("bcryptjs");
const sendToken = require("../../utils/jwtToken");
const ShortUniqueId = require("short-unique-id");
const { sendEmailUpdateOtp, sendResetPasswordSuperAdmin } = require("../../utils/mail");
const jwt = require("jsonwebtoken");


/////////////////////////////////////// crud operation by admin ////////////////////////////////////////////////////

exports.createUserAdminByAdmin = catchAsyncErrors(async (req, res, next) => {

    try {
        const { email, password, url } = req.body;
        console.log('req.body::', req.body)
        const ExistUrl = await UserAdmin.findOne({ url });
        if (ExistUrl) {
            return res.status(200).json({ status: false, message: "This url already exist. please try another url" });
        }

        const hash = await bcrypt.hash(password, 10);
        if (req.body?.admin) {
            const user = await UserAdmin.findOne({ email: req.body.admin.email, name: req.body.admin.name });
            console.log('req.body::=>', user)

            if (user) {
                if (req.body.role === 'distributor') {
                    user.totalDistributors += 1;
                }
                else if (req.body.role === 'retailer') {
                    user.totalRetailers += 1;
                }
                await user.save();
            }
        }
        if (req.body?.createdByEmail) {
            const user = await UserAdmin.findOne({ email: req.body.createdByEmail.email, name: req.body.createdByEmail.name });
            // console.log('req.body::==>', user)

            if (user) {
                if (req.body.role === 'distributor') {
                    user.totalDistributors += 1;
                }
                else if (req.body.role === 'retailer') {
                    user.totalRetailers += 1;
                }
                await user.save();
            }
        }
        // console.log('BODY=>', req.body.email)
        const currentUserAdmin = await UserAdmin.findOne({ email: email });

        if (currentUserAdmin) {
            return res.status(200).json({ status: false, message: req.body.role === 'distributor' ? 'Distributor email already exist.' : req.body.role === 'retailer' ? "Retailer email already exist." : "This email already exist. please try another email" });
        }

        const newUserAdmin = await UserAdmin.create({ ...req.body, password: hash, showpassword: req?.body?.password });

        res.status(200).json({ status: true, message: "Super Admin created successfully", data: newUserAdmin });
    } catch (error) {
        return next(new ErrorHandler(error.message, 500));
    }
});

exports.getUserAdminUsersByAdminwithPagination = catchAsyncErrors(async (req, res, next) => {
    try {
        // Extract and sanitize query parameters
        let { page = 1, limit = 10, search = '', role = '', status = '' } = req.query;
        // console.log('req.query::===>>AA', req.query)
        // Convert page/limit safely to numbers
        page = Math.max(1, parseInt(page, 10));
        limit = Math.max(1, parseInt(limit, 10));

        // Build dynamic filter object
        const filter = {};

        if (role && role !== 'all') {
            filter.role = role.trim();
        }

        if (status && status !== 'all') {
            filter.status = new RegExp(`^${status}$`, 'i'); // Case-insensitive exact match
        }

        if (search && search.trim() !== '') {
            const searchRegex = new RegExp(search.trim(), 'i');
            filter.$or = [
                { name: searchRegex },
                { email: searchRegex },
                { DistributorId: searchRegex },
                { phone: searchRegex }
            ];
        }

        // Count total documents matching filters
        const total = await UserAdmin.countDocuments(filter);
        const totalRetailers = await UserAdmin.countDocuments({ role: 'retailer' });
        // Pagination skip calculation
        const skip = (page - 1) * limit;

        // Fetch paginated, filtered data
        const users = await UserAdmin.find(filter)
            .skip(skip)
            .limit(limit)
            .sort({ createdAt: -1 })
            .select('-password -otp') // Exclude sensitive fields
            .lean(); // return plain JS objects for performance

        const totalPages = Math.ceil(total / limit);

        // Prevent 304 caching by forcing no-cache headers
        res.set({
            'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0',
            'Surrogate-Control': 'no-store'
        });

        // ✅ Always send fresh data
        return res.status(200).json({
            status: true,
            message: 'Admin users fetched successfully',
            data: users,
            pagination: {
                total,
                totalRetailers,
                totalPages,
                currentPage: page,
                pageSize: limit,
                hasNextPage: page < totalPages,
                hasPrevPage: page > 1
            },
            filtersUsed: { search, role, status }
        });
    } catch (error) {
        console.error('Fetch Admin Users Error:', error);
        return next(new ErrorHandler(error.message, 500));
    }
});

exports.deleteUserAdminUserByAdmin = catchAsyncErrors(async (req, res, next) => {
    const id = req.params.id;
    const user = await UserAdmin.findByIdAndDelete(id);
    if (!user) return next(new ErrorHandler('Admin user not found', 404));
    sendResponse(res, 200, 'Admin user deleted successfully', user);
});

exports.updateUserAdminByAdmin = catchAsyncErrors(async (req, res, next) => {
    const id = req.params.id;
    let updateData = { ...req?.body };
    // hash password if provided
    if (updateData?.createdByEmail.email !== updateData?.oldCreatedByEmail.email) {

        if (updateData.oldCreatedByEmail) {
            const oldUser = await UserAdmin.findOne({ email: updateData?.oldCreatedByEmail?.email });
            if (oldUser && Number(oldUser?.totalRetailers) > 0) {
                console.log('oldUser::===>', oldUser)
                oldUser.totalRetailers = Number(oldUser?.totalRetailers - 1);
            }
            console.log('oldUser::===>------>', oldUser.totalRetailers)
            oldUser.save();
        }

        if (updateData?.createdByEmail) {
            const oldUser = await UserAdmin.findOne({ email: updateData?.createdByEmail?.email });
            if (oldUser && Number(oldUser?.totalRetailers) >= 0) {
                console.log('oldUser::===>', oldUser)
                oldUser.totalRetailers = Number(oldUser.totalRetailers + 1) || oldUser?.totalRetailers;
            }
            console.log('oldUser::===>++++++', oldUser.totalRetailers)
            oldUser.save();
        }
    }
    const existData = await UserAdmin.findById(id)
    // console.log('updateData::===>kkk', updateData, existData.password)
    if (updateData.password) {
        updateData.password = await bcrypt.hash(updateData.password, 10);
    } else {
        updateData.password = existData.password
    }

    updateData.name = updateData.name || existData.name;
    updateData.email = updateData.email || existData.email;
    updateData.phone = updateData.phone || existData.phone;
    updateData.role = updateData.role || existData.role;
    updateData.url = updateData.url || existData.url;
    updateData.status = updateData.status || existData.status;
    updateData.createdByEmail = updateData.createdByEmail || existData.createdByEmail;
    updateData.DistributorId = updateData.DistributorId || existData.DistributorId;
    updateData.address = updateData.address || existData.address;
    updateData.dateOfJoining = updateData.dateOfJoining || existData.dateOfJoining;
    updateData.totalRetailers = updateData.totalRetailers || existData.totalRetailers;
    updateData.totalAMCs = updateData.totalAMCs || existData.totalAMCs;
    updateData.walletBalance = updateData.walletBalance || existData.walletBalance;
    updateData.showpassword = req?.body?.password || existData?.showpassword;
    // console.log('updateData::===>', updateData)

    const user = await UserAdmin.findByIdAndUpdate(id, updateData, {
        new: true, runValidators: true
    });

    if (!user) return next(new ErrorHandler('Admin user not found', 404));

    sendResponse(res, 200, 'Admin user updated successfully', user);
});

exports.UserAdminLogin = catchAsyncErrors(async (req, res, next) => {
    try {
        const { email, password } = req.body;
        const userAdmin = await UserAdmin.findOne({ email }).populate('staffRole');

        if (!userAdmin) {
            return res.status(200).json({ status: false, message: "Admin does not exist" })
        }
        const passwordMatch = await bcrypt.compare(password, userAdmin.password)
        console.log('passwordMatch::=>', passwordMatch)
        if (passwordMatch) {
            sendToken(userAdmin, 200, res, "Super Admin Login successfully");
        }
        else {
            res.status(200).json({ status: false, message: "Password Incorrect" })
        }
    } catch (error) {
        res.status(500).json({ status: false, data: error.message })
    }
});


// Login Admin User
// exports.adminLogin = catchAsyncErrors(async (req, res, next) => {
//     const { email, password } = req.body;
//     const adminUser = await UserAdmin.findOne({ email });
//     if (!adminUser) return next(new ErrorHandler('Admin user not found', 404));
//     const match = await adminUser.comparePassword(password);
//     if (!match) return next(new ErrorHandler('Incorrect password', 400));
//     const token = adminUser.getJwtToken();
//     // update lastLogin
//     adminUser.lastLogin = new Date();
//     await adminUser.save();
//     res.status(200).json({ status: true, message: 'Login successful', token, adminUser });
// });

// // Get all Admin Users
// exports.getAdminUsersByAdmin = catchAsyncErrors(async (req, res) => {
//     const users = await UserAdmin.find();
//     res.status(200).json({ status: true, message: 'Admin users fetched successfully', data: users });
//     // sendResponse(res, 200, 'Admin users fetched successfully', users);
// });

// exports.getDistributorsByAdmin = catchAsyncErrors(async (req, res) => {
//     const users = await UserAdmin.find({ role: 'distributor' });
//     res.status(200).json({ status: true, message: 'Admin users fetched successfully', data: users });
//     // sendResponse(res, 200, 'Admin users fetched successfully', users);
// });

// exports.getRetailersByDistributor = catchAsyncErrors(async (req, res, next) => {
//     try {
//         let { page = 1, limit = 10, search = '', role = '', userId = '', status = '', createdByEmail = '' } = req.query;

//         // ✅ Sanitize pagination values
//         page = Math.max(1, parseInt(page, 10));
//         limit = Math.max(1, parseInt(limit, 10));

//         // ✅ Base filter (always restrict to retailers)

//         let filter = {};
//         if (role !== 'admin') {
//             if (role === 'distributor') {
//                 filter.role = 'retailer';

//                 // ✅ CreatedByEmail filter (distributor identifier)

//                 if (createdByEmail && createdByEmail.trim() !== '') {
//                     const createdByRegex = new RegExp(createdByEmail.trim(), 'i');
//                     filter.$or = [
//                         { 'createdByEmail.email': createdByRegex },
//                         { 'createdByEmail.name': createdByRegex }
//                     ];
//                 }
//             } else {
//                 filter._id = userId;
//             }

//         }

//         // ✅ Status filter (optional)
//         if (status && status !== 'all') {
//             filter.status = new RegExp(`^${status}$`, 'i');
//         }

//         // ✅ Search filter (optional)
//         if (search && search.trim() !== '') {
//             const searchRegex = new RegExp(search.trim(), 'i');
//             filter.$and = [
//                 ...(filter.$and || []),
//                 {
//                     $or: [
//                         { name: searchRegex },
//                         { email: searchRegex },
//                         { phone: searchRegex },
//                         { address: searchRegex }
//                     ]
//                 }
//             ];
//         }

//         // ✅ Count total retailers
//         const total = await UserAdmin.countDocuments(filter);

//         const totalPages = Math.ceil(total / limit);
//         const skip = (page - 1) * limit;

//         // ✅ Fetch paginated data
//         const retailers = await UserAdmin.find(filter)
//             .skip(skip)
//             .limit(limit)
//             .sort({ createdAt: -1 })
//             .collation({ locale: 'en', strength: 2 })
//             .select('-password -otp -__v')
//             .lean();

//         // ✅ Disable caching (important for dashboard-like APIs)
//         res.set({
//             'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
//             'Pragma': 'no-cache',
//             'Expires': '0',
//             'Surrogate-Control': 'no-store'
//         });

//         return res.status(200).json({
//             status: true,
//             message: 'Retailers fetched successfully',
//             data: retailers,
//             pagination: {
//                 total,
//                 totalPages,
//                 currentPage: page,
//                 pageSize: limit,
//                 hasNextPage: page < totalPages,
//                 hasPrevPage: page > 1
//             },
//             filtersUsed: { search, status, createdByEmail }
//         });
//     } catch (error) {
//         console.error('getRetailersByDistributor Error:', error);
//         return next(new ErrorHandler(error.message || 'Internal Server Error', 500));
//     }
// });

// exports.sendResetPasswordEmail = catchAsyncErrors(async (req, res, next) => {
//     try {

//         const { email } = req.body;
//         const userAdmin = await UserAdmin.findOne({ email });

//         if (!userAdmin) {
//             return res.status(200).json({ status: false, message: "Account not found. please Register first " });
//         }

//         const token = userAdmin.getJwtToken();

//         let mail_data = { email: email, token: token, user: 'admin' };

//         await sendResetPasswordSuperAdmin(mail_data);
//         res.status(200).json({ status: true, message: "Reset password mail sent successfully" });
//     } catch (error) {
//         return next(new ErrorHandler(error.message, 500));
//     }
// });

// exports.resetPassword = catchAsyncErrors(async (req, res, next) => {
//     try {
//         const { token, new_password } = req.body;

//         if (!token) {
//             next(new ErrorHandler("No token found", 400));
//         }
//         const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);
//         if (!decoded) {
//             next(new ErrorHandler("Token is not valid", 400));
//         }

//         const userAdmin = await UserAdmin.findById(decoded.id);

//         // Update the password
//         const hash = await bcrypt.hash(new_password, 10);
//         userAdmin.password = hash;

//         await userAdmin.save();
//         // sendResponse(res, 200, "super-admin password changed successfully", []);
//         res.status(200).json({ status: true, message: "Password changed successfully" });
//     } catch (error) {
//         return next(new ErrorHandler(error.message, 500));
//     }
// });

// exports.getRetailersByAdminwithPagination = catchAsyncErrors(async (req, res, next) => {
//     try {
//         let { page = 1, limit = 10, search = '', role = '', status = '', createdByEmail = '' } = req.query;
//         console.log("XXXXXX::=>SS", req.query)
//         page = Math.max(1, parseInt(page, 10));
//         limit = Math.max(1, parseInt(limit, 10));

//         const filter = {};

//         // ✅ CreatedByEmail is a must-match filter (AND condition)
//         if (createdByEmail && createdByEmail.trim() !== '') {
//             const createdByRegex = new RegExp(createdByEmail.trim(), 'i');
//             filter.$or = [
//                 { 'createdByEmail.email': createdByRegex },
//                 { 'createdByEmail.name': createdByRegex }
//             ];
//         }

//         // ✅ Optional Search filter (will be combined later with AND)
//         const searchConditions = [];
//         if (search && search.trim() !== '') {
//             const searchRegex = new RegExp(search.trim(), 'i');
//             searchConditions.push(
//                 { name: searchRegex },
//                 { email: searchRegex },
//                 { phone: searchRegex } // matches your model field
//             );
//         }

//         // Role filter
//         if (role && role !== 'all') {
//             filter.role = role.trim();
//         }

//         // Status filter
//         if (status && status !== 'all') {
//             filter.status = new RegExp(`^${status}$`, 'i');
//         }

//         // ✅ Combine search with createdByEmail using AND logic
//         const finalFilter = { ...filter };
//         if (searchConditions.length > 0) {
//             finalFilter.$and = [{ $or: filter.$or || [] }, { $or: searchConditions }];
//             delete finalFilter.$or; // move createdByEmail OR inside $and
//         }

//         // Count total
//         const total = await UserAdmin.countDocuments(finalFilter);

//         const skip = (page - 1) * limit;
//         const totalPages = Math.ceil(total / limit);

//         // Fetch data
//         const users = await UserAdmin.find(finalFilter)
//             .skip(skip)
//             .limit(limit)
//             .sort({ createdAt: -1 })
//             .collation({ locale: 'en', strength: 2 })
//             .select('-password -otp -__v')
//             .lean();

//         // No-cache headers
//         res.set({
//             'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
//             'Pragma': 'no-cache',
//             'Expires': '0',
//             'Surrogate-Control': 'no-store'
//         });

//         return res.status(200).json({
//             status: true,
//             message: 'Retailers fetched successfully',
//             data: users,
//             pagination: {
//                 total,
//                 totalPages,
//                 currentPage: page,
//                 pageSize: limit,
//                 hasNextPage: page < totalPages,
//                 hasPrevPage: page > 1
//             },
//             filtersUsed: { search, role, status, createdByEmail }
//         });
//     } catch (error) {
//         console.error('Fetch Admin Users Error:', error);
//         return next(new ErrorHandler(error.message || 'Internal Server Error', 500));
//     }
// });

// exports.getAllStaffByAdmin = catchAsyncErrors(async (req, res, next) => {
//     try {
//         let { staffRole } = req.query;

//         if (typeof staffRole === 'string') {
//             try {
//                 staffRole = JSON.parse(staffRole);
//             } catch {
//                 staffRole = [staffRole]; // fallback if it’s a single string
//             }
//         }

//         // Ensure it’s an array
//         if (!Array.isArray(staffRole)) {
//             staffRole = [];
//         }

//         console.log("Parsed staffRole:=", staffRole);

//         const users = await UserAdmin.find({ role: { $in: staffRole } }).populate('staffRole');
//         // console.log("Parsed staffRole:=", users);
//         return res.status(200).json({
//             status: true,
//             message: 'Staff fetched successfully',
//             data: users
//         });

//     } catch (error) {
//         console.error("Error in getAllStaffByAdmin:", error);
//         return next(new ErrorHandler(error.message || 'Server Error', 500));
//     }
// });

exports.getUserAdminUsersById = catchAsyncErrors(async (req, res, next) => {
    try {
        const id = req.params.id;
        const user = await UserAdmin.findById(id).populate('staffRole');
        if (!user) return next(new ErrorHandler('Admin user not found', 404));
        res.status(200).json({ status: true, message: "Admin user fetched successfully", data: user })
    } catch (error) {
        console.error("Error in getAdminUsersById:", error);
        return next(new ErrorHandler(error.message || 'Server Error', 500));
    }
})

exports.getUserByEmailAndName = catchAsyncErrors(async (req, res, next) => {
    try {
        const { email, name } = req.query;
        console.log("email:==>", email, "name:==>", name)
        const user = await UserAdmin.findOne({ email, name });
        if (!user) return next(new ErrorHandler("User not found", 404));

        res.status(200).json({ status: true, message: "User fetched successfully", data: user, });
    } catch (error) {
        return next(new ErrorHandler(error.message, 500));
    }
})

exports.updateUserAdminByEmailAndName = catchAsyncErrors(async (req, res, next) => {
    try {
        const id = req.params.id;
        console.log("XXXXX::>=>", req.body, id)
        const updated = await UserAdmin.findById(id);
        if (!updated) return next(new ErrorHandler("User not found", 404));
        updated.walletBalance = req.body.walletBalance;
        await updated.save();

        res.status(200).json({
            status: true,
            message: "User updated successfully",
            data: updated
        })
    } catch (error) {
        return next(new ErrorHandler(error.message, 500));
    }
})

////////////////////////////////////////////////////////////////////////////////////////////////////




