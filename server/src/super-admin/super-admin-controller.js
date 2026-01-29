const catchAsyncErrors = require("../../middleware/catchAsyncErrors");
const sendResponse = require("../../middleware/response");
const ErrorHandler = require("../../utils/ErrorHandler");
const SuperAdmin = require("./super-admin-model");
const bcrypt = require("bcryptjs");
const sendToken = require("../../utils/jwtToken");
const ShortUniqueId = require("short-unique-id");
const { sendEmailUpdateOtp, sendResetPasswordSuperAdmin } = require("../../utils/mail");
const jwt = require("jsonwebtoken");


exports.createSuperAdmin = catchAsyncErrors(async (req, res, next) => {
    console.log('req.body::', req.body);

    try {
        const { email, password } = req.body;
        const hash = await bcrypt.hash(password, 10);

        const existing = await SuperAdmin.findOne({ email });
        if (existing) {
            return next(new ErrorHandler("Super Admin email already exists.", 400));
        }

        const newSuperAdmin = await SuperAdmin.create({
            ...req.body,
            password: hash,
        });

        const token = newSuperAdmin.getJwtToken();

        return sendResponse(res, 200, "Super Admin created successfully", {
            user: newSuperAdmin,
            token,
        });

    } catch (error) {
        console.error(error);
        return next(new ErrorHandler(error.message, 500));
    }
});

exports.superAdminLogin = catchAsyncErrors(async (req, res, next) => {
    try {
        const { email, password } = req.body;
        const superAdmin = await SuperAdmin.findOne({ email }).populate('staffRole');

        if (!superAdmin) {
            return res.status(200).json({ status: false, message: "Super Admin does not exist" })
        }
        const passwordMatch = await bcrypt.compare(password, superAdmin.password)
        console.log('passwordMatch::=>', passwordMatch)
        if (passwordMatch) {
            sendToken(superAdmin, 200, res, "Super Admin Login successfully");
        }
        else {
            res.status(200).json({ status: false, message: "Password Incorrect" })
        }
    } catch (error) {
        res.status(500).json({ status: false, data: error.message })
    }
});



/////////////////////////////////////// crud operation by admin ////////////////////////////////////////////////////

exports.createAdminByAdmin = catchAsyncErrors(async (req, res, next) => {

    try {
        const { email, password } = req.body;
        // console.log('req.body::', req.body.userForm)
        const hash = await bcrypt.hash(password, 10);
        if (req.body?.admin) {
            const user = await SuperAdmin.findOne({ email: req.body.admin.email, name: req.body.admin.name });
            console.log('req.body::', user)

            if (user) {
                if (req.body.role === 'distributor') {
                    user.totalDistributors += 1;
                } else if (req.body.role === 'retailer') {
                    user.totalRetailers += 1;
                } else if (req.body.role === 'TSM-ASM') {
                    user.totalTSMAMC += 1;
                } else if (req.body.role === 'promoter') {
                    user.totalRetailers += 1;
                } else if (req.body.role === 'superStockist') {
                    user.totalSuperStockist += 1;
                }
                await user.save();
            }
        }
        let creteId = null
        if (req.body?.createdByEmail) {
            const user = await SuperAdmin.findOne({ email: req.body.createdByEmail.email, name: req.body.createdByEmail.name });
            // console.log('req.body::==>', user)
            creteId = user._id
            if (user) {
                if (req.body.role === 'distributor') {
                    user.totalDistributors += 1;
                } else if (req.body.role === 'retailer') {
                    user.totalRetailers += 1;
                } else if (req.body.role === 'TSM-ASM') {
                    user.totalTSMAMC += 1;
                } else if (req.body.role === 'promoter') {
                    user.totalRetailers += 1;
                } else if (req.body.role === 'superStockist') {
                    user.totalSuperStockist += 1;
                }
                await user.save();
            }
        }
        // console.log('BODY=>', req.body.email)
        const currentSuperAdmin = await SuperAdmin.findOne({ email: email });

        if (currentSuperAdmin) {
            return res.status(200).json({ status: false, message: req.body.role === 'distributor' ? 'Distributor email already exist.' : req.body.role === 'retailer' ? "Retailer email already exist." : "This email already exist. please try another email" });
        }

        const newSuperAdmin = await SuperAdmin.create({ ...req.body, createdId: creteId, showpassword: req.body.password, password: hash });

        res.status(200).json({ status: true, message: "Super Admin created successfully", data: newSuperAdmin });
    } catch (error) {
        return next(new ErrorHandler(error.message, 500));
    }
});

// Login Admin User
exports.adminLogin = catchAsyncErrors(async (req, res, next) => {
    const { email, password } = req.body;
    const adminUser = await SuperAdmin.findOne({ email });
    if (!adminUser) return next(new ErrorHandler('Admin user not found', 404));
    const match = await adminUser.comparePassword(password);
    if (!match) return next(new ErrorHandler('Incorrect password', 400));
    const token = adminUser.getJwtToken();
    // update lastLogin
    adminUser.lastLogin = new Date();
    await adminUser.save();
    res.status(200).json({ status: true, message: 'Login successful', token, adminUser });
});

// Get all Admin Users
exports.getAdminUsersByAdmin = catchAsyncErrors(async (req, res) => {
    const users = await SuperAdmin.find();
    res.status(200).json({ status: true, message: 'Admin users fetched successfully', data: users });
    // sendResponse(res, 200, 'Admin users fetched successfully', users);
});

exports.getDistributorsByAdmin = catchAsyncErrors(async (req, res) => {
    const users = await SuperAdmin.find({ role: 'distributor' });
    res.status(200).json({ status: true, message: 'Admin users fetched successfully', data: users });
    // sendResponse(res, 200, 'Admin users fetched successfully', users);
});

exports.getTSMASMByAdmin = catchAsyncErrors(async (req, res) => {
    const users = await SuperAdmin.find({ role: 'TSM-ASM' });
    res.status(200).json({ status: true, message: 'Admin users fetched successfully', data: users });
    // sendResponse(res, 200, 'Admin users fetched successfully', users);
});


exports.getRetailersByDistributor = catchAsyncErrors(async (req, res, next) => {
    try {
        let { page = 1, limit = 10, search = '', role = '', userId = '', status = '', createdByEmail = '' } = req.query;

        // ✅ Sanitize pagination values
        page = Math.max(1, parseInt(page, 10));
        limit = Math.max(1, parseInt(limit, 10));
        const existUser = await SuperAdmin.findOne({ _id: userId });
        // ✅ Base filter (always restrict to retailers)
        console.log("XX::+=>>XXXX=>", existUser.DistributorId, req.query)

        let filter = {};
        if (role !== 'admin') {
            if (role === 'distributor') {
                filter.role = 'retailer';

                // ✅ CreatedByEmail filter (distributor identifier)

                if (createdByEmail && createdByEmail.trim() !== '') {
                    const createdByRegex = new RegExp(createdByEmail.trim(), 'i');
                    filter.$or = [
                        { 'createdByEmail.email': createdByRegex },
                        { 'createdByEmail.name': createdByRegex }
                    ];
                }
            } else if (role === 'superStockist') {
                if (createdByEmail && createdByEmail.trim() !== '') {
                    const createdByRegex = new RegExp(createdByEmail.trim(), 'i');
                    filter.$or = [
                        { 'createdByEmail.email': createdByRegex },
                        { 'createdByEmail.name': createdByRegex }
                    ];
                }
            } else if (role === 'TSM-ASM') {
                if (createdByEmail && createdByEmail.trim() !== '') {
                    const createdByRegex = new RegExp(createdByEmail.trim(), 'i');
                    const retailerByTSMASMRegex = new RegExp(existUser.DistributorId.trim(), 'i');
                    filter.$or = [
                        { 'createdByEmail.email': createdByRegex },
                        { 'createdByEmail.name': retailerByTSMASMRegex },
                        { 'retailerByTSMASM.email': createdByRegex },
                        { 'retailerByTSMASM.name': createdByRegex },

                    ];
                }
            } else {
                filter._id = userId;
            }
        }
        if (role === 'admin') {
            filter.role = { $ne: 'promoter' };  // ✅ show all except promoter
        }
        console.log("XX::+=>>", filter)
        // ✅ Status filter (optional)
        if (status && status !== 'all') {
            filter.status = new RegExp(`^${status}$`, 'i');
        }

        // ✅ Search filter (optional)
        if (search && search.trim() !== '') {
            const searchRegex = new RegExp(search.trim(), 'i');
            filter.$and = [
                ...(filter.$and || []),
                {
                    $or: [
                        { name: searchRegex },
                        { email: searchRegex },
                        { phone: searchRegex },
                        { address: searchRegex }
                    ]
                }
            ];
        }

        // ✅ Count total retailers
        const total = await SuperAdmin.countDocuments(filter);

        const totalPages = Math.ceil(total / limit);
        const skip = (page - 1) * limit;

        // ✅ Fetch paginated data
        const retailers = await SuperAdmin.find(filter)
            .skip(skip)
            .limit(limit)
            .sort({ createdAt: -1 })
            .collation({ locale: 'en', strength: 2 })
            .select('-password -otp -__v')
            .lean();

        // ✅ Disable caching (important for dashboard-like APIs)
        res.set({
            'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0',
            'Surrogate-Control': 'no-store'
        });

        return res.status(200).json({
            status: true,
            message: 'Retailers fetched successfully',
            data: retailers,
            pagination: {
                total,
                totalPages,
                currentPage: page,
                pageSize: limit,
                hasNextPage: page < totalPages,
                hasPrevPage: page > 1
            },
            filtersUsed: { search, status, createdByEmail }
        });
    } catch (error) {
        console.error('getRetailersByDistributor Error:', error);
        return next(new ErrorHandler(error.message || 'Internal Server Error', 500));
    }
});


exports.getAdminUsersByAdminwithPagination = catchAsyncErrors(async (req, res, next) => {
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
        const total = await SuperAdmin.countDocuments(filter);
        const totalRetailers = await SuperAdmin.countDocuments({ role: 'retailer' });
        const totalDistributors = await SuperAdmin.countDocuments({ role: 'distributor' });
        const totalSuperStockists = await SuperAdmin.countDocuments({ role: 'superStockist' });
        const totalPromoters = await SuperAdmin.countDocuments({ role: 'promoter' });
        const totalTSMASM = await SuperAdmin.countDocuments({ role: 'TSM-ASM' });
        // Pagination skip calculation
        const skip = (page - 1) * limit;

        // Fetch paginated, filtered data
        const users = await SuperAdmin.find(filter)
            .skip(skip)
            .limit(limit)
            .sort({ createdAt: -1 })
            .select('-otp') // Exclude sensitive fields
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
                totalDistributors,
                totalSuperStockists,
                totalPromoters,
                totalTSMASM,
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


exports.sendResetPasswordEmail = catchAsyncErrors(async (req, res, next) => {
    try {

        const { email } = req.body;
        const superAdmin = await SuperAdmin.findOne({ email });

        if (!superAdmin) {
            return res.status(200).json({ status: false, message: "Account not found. please Register first " });
        }

        const token = superAdmin.getJwtToken();

        let mail_data = { email: email, token: token, user: 'admin' };

        await sendResetPasswordSuperAdmin(mail_data);
        res.status(200).json({ status: true, message: "Reset password mail sent successfully" });
    } catch (error) {
        return next(new ErrorHandler(error.message, 500));
    }
});

exports.resetPassword = catchAsyncErrors(async (req, res, next) => {
    try {
        const { token, new_password } = req.body;

        if (!token) {
            next(new ErrorHandler("No token found", 400));
        }
        const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);
        if (!decoded) {
            next(new ErrorHandler("Token is not valid", 400));
        }

        const superAdmin = await SuperAdmin.findById(decoded.id);

        // Update the password
        const hash = await bcrypt.hash(new_password, 10);
        superAdmin.password = hash;

        await superAdmin.save();
        // sendResponse(res, 200, "super-admin password changed successfully", []);
        res.status(200).json({ status: true, message: "Password changed successfully" });
    } catch (error) {
        return next(new ErrorHandler(error.message, 500));
    }
});

exports.getAllUserDataWithPagination = catchAsyncErrors(async (req, res, next) => {
    try {
        // Extract and sanitize query parameters
        let { page = 1, limit = 10, search = '', role = '', status = '', createdByEmail = '' } = req.query;
        console.log('req.query::===>>AA', req.query)
        // Convert page/limit safely to numbers
        page = Math.max(1, parseInt(page, 10));
        limit = Math.max(1, parseInt(limit, 10));

        // Build dynamic filter object
        const filter = {};

        if (createdByEmail && createdByEmail !== 'all') {
            filter['createdByEmail.email'] = createdByEmail.trim()
        }
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
        const total = await SuperAdmin.countDocuments(filter);
        const totalRetailers = await SuperAdmin.countDocuments({ ...filter, role: 'retailer' });
        const totalDistributors = await SuperAdmin.countDocuments({ ...filter, role: 'distributor' });
        const totalSuperStockists = await SuperAdmin.countDocuments({ ...filter, role: 'superStockist' });
        const totalPromoters = await SuperAdmin.countDocuments({ ...filter, role: 'promoter' });
        const totalTSMASM = await SuperAdmin.countDocuments({ ...filter, role: 'TSM-ASM' });
        // Pagination skip calculation
        const skip = (page - 1) * limit;

        // Fetch paginated, filtered data
        const users = await SuperAdmin.find(filter)
            .skip(skip)
            .limit(limit)
            .sort({ createdAt: -1 })
            .select('-otp') // Exclude sensitive fields
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
                totalDistributors,
                totalSuperStockists,
                totalPromoters,
                totalTSMASM,
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

exports.getAllUserDataByTSMASMWithPagination = catchAsyncErrors(async (req, res, next) => {
    try {
        // Extract and sanitize query parameters
        let { page = 1, limit = 10, search = '', role = '', status = '', createdByEmail = '', retailerByTSMASM = '' } = req.query;
        console.log('req.query::===>>AAXXXX=>', req.query)
        // Convert page/limit safely to numbers

        page = Math.max(1, parseInt(page, 10));
        limit = Math.max(1, parseInt(limit, 10));
        // const createrData = await SuperAdmin.findOne({ 'email': retailerByTSMASM });
        // console.log('req.query::===>>AAXXXX=>', createrData, retailerByTSMASM)
        // Build dynamic filter object
        const filter = {};

        if (retailerByTSMASM && retailerByTSMASM !== 'all') {
            filter['retailerByTSMASM.email'] = retailerByTSMASM.trim()
        }
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
        const total = await SuperAdmin.countDocuments(filter);
        const totalRetailers = await SuperAdmin.countDocuments({ ...filter, role: 'retailer' });
        const totalDistributors = await SuperAdmin.countDocuments({ ...filter, role: 'distributor' });
        const totalSuperStockists = await SuperAdmin.countDocuments({ ...filter, role: 'superStockist' });
        const totalPromoters = await SuperAdmin.countDocuments({ ...filter, role: 'promoter' });
        const totalTSMASM = await SuperAdmin.countDocuments({ ...filter, role: 'TSM-ASM' });
        // Pagination skip calculation
        const skip = (page - 1) * limit;

        // Fetch paginated, filtered data
        const users = await SuperAdmin.find(filter)
            .skip(skip)
            .limit(limit)
            .sort({ createdAt: -1 })
            .select('-otp') // Exclude sensitive fields
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
                totalDistributors,
                totalSuperStockists,
                totalPromoters,
                totalTSMASM,
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

exports.getRetailersByAdminwithPagination = catchAsyncErrors(async (req, res, next) => {
    try {
        let { page = 1, limit = 10, search = '', role = '', status = '', createdByEmail = '' } = req.query;
        console.log("XXXXXX::=>SS", req.query)
        page = Math.max(1, parseInt(page, 10));
        limit = Math.max(1, parseInt(limit, 10));

        const filter = {};

        // ✅ CreatedByEmail is a must-match filter (AND condition)
        if (createdByEmail && createdByEmail.trim() !== '') {
            const createdByRegex = new RegExp(createdByEmail.trim(), 'i');
            filter.$or = [
                { 'createdByEmail.email': createdByRegex },
                { 'createdByEmail.name': createdByRegex }
            ];
        }

        // ✅ Optional Search filter (will be combined later with AND)
        const searchConditions = [];
        if (search && search.trim() !== '') {
            const searchRegex = new RegExp(search.trim(), 'i');
            searchConditions.push(
                { name: searchRegex },
                { email: searchRegex },
                { phone: searchRegex } // matches your model field
            );
        }

        // Role filter
        if (role && role !== 'all') {
            filter.role = role.trim();
        }

        // Status filter
        if (status && status !== 'all') {
            filter.status = new RegExp(`^${status}$`, 'i');
        }

        // ✅ Combine search with createdByEmail using AND logic
        const finalFilter = { ...filter };
        if (searchConditions.length > 0) {
            finalFilter.$and = [{ $or: filter.$or || [] }, { $or: searchConditions }];
            delete finalFilter.$or; // move createdByEmail OR inside $and
        }

        // Count total
        const total = await SuperAdmin.countDocuments(finalFilter);

        const skip = (page - 1) * limit;
        const totalPages = Math.ceil(total / limit);

        // Fetch data
        const users = await SuperAdmin.find(finalFilter)
            .skip(skip)
            .limit(limit)
            .sort({ createdAt: -1 })
            .collation({ locale: 'en', strength: 2 })
            .select('-password -otp -__v')
            .lean();

        // No-cache headers
        res.set({
            'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0',
            'Surrogate-Control': 'no-store'
        });

        return res.status(200).json({
            status: true,
            message: 'Retailers fetched successfully',
            data: users,
            pagination: {
                total,
                totalPages,
                currentPage: page,
                pageSize: limit,
                hasNextPage: page < totalPages,
                hasPrevPage: page > 1
            },
            filtersUsed: { search, role, status, createdByEmail }
        });
    } catch (error) {
        console.error('Fetch Admin Users Error:', error);
        return next(new ErrorHandler(error.message || 'Internal Server Error', 500));
    }
});

// Update Admin User
exports.updateAdminByAdmin = catchAsyncErrors(async (req, res, next) => {
    const id = req.params.id;
    let updateData = { ...req?.body };
    console.log("SSSS::->", updateData)
    // hash password if provided
    if (updateData?.createdByEmail.email !== updateData?.oldCreatedByEmail.email) {

        if (updateData.oldCreatedByEmail) {
            const oldUser = await SuperAdmin.findOne({ email: updateData?.oldCreatedByEmail?.email });
            if (oldUser && Number(oldUser?.totalRetailers) > 0) {
                console.log('oldUser::===>', oldUser)
                oldUser.totalRetailers = Number(oldUser?.totalRetailers || 0) - 1;
            }
            console.log('oldUser::===>------>', oldUser?.totalRetailers)
            oldUser.save();
        }

        if (updateData?.createdByEmail) {
            const oldUser = await SuperAdmin.findOne({ email: updateData?.createdByEmail?.email });
            console.log('oldUser::===>------>D', oldUser)
            if (oldUser && Number(oldUser?.totalRetailers) >= 0) {
                console.log('oldUser::===>', oldUser)
                oldUser.totalRetailers = Number(oldUser.totalRetailers || 0) + 1 || oldUser?.totalRetailers;
                oldUser.save();
            }
            // console.log('oldUser::===>++++++', oldUser.totalRetailers)

        }
    }


    const existData = await SuperAdmin.findById(id)
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
    updateData.status = updateData.status || existData.status;
    updateData.createdByEmail = updateData.createdByEmail || existData.createdByEmail;
    updateData.DistributorId = updateData.DistributorId || existData.DistributorId;
    updateData.address = updateData.address || existData.address;
    updateData.dateOfJoining = updateData.dateOfJoining || existData.dateOfJoining;
    updateData.totalRetailers = updateData?.totalRetailers || existData?.totalRetailers;
    updateData.totalAMCs = updateData.totalAMCs || existData.totalAMCs;
    updateData.walletBalance = updateData.walletBalance || existData.walletBalance;
    updateData.showpassword = req?.body?.password || existData?.showpassword;
    // console.log('updateData::===>', updateData)

    const user = await SuperAdmin.findByIdAndUpdate(id, updateData, {
        new: true, runValidators: true
    });

    if (!user) return next(new ErrorHandler('Admin user not found', 404));




    sendResponse(res, 200, 'Admin user updated successfully', user);
});

// Delete Admin User
// exports.deleteAdminUserByAdmin = catchAsyncErrors(async (req, res, next) => {
//     const id = req.params.id;
//     const user = {}
//     const existData = await SuperAdmin.findById(id);
//     console.log("DDDDD::=>", existData.createdByEmail)
//     if (existData) {
//         if (req.body?.createdByEmail) {
//             const ExistUser = await SuperAdmin.findOne({ email: existData.createdByEmail.email, name: existData.createdByEmail.name });
//             console.log('req.body::==>', ExistUser)

//             if (ExistUser) {
//                 if (existData.role === 'distributor') {
//                     ExistUser.totalDistributors -= 1;
//                 } else if (existData.role === 'retailer') {
//                     ExistUser.totalRetailers -= 1;
//                 } else if (existData.role === 'TSM-ASM') {
//                     ExistUser.totalTSMAMC -= 1;
//                 } else if (existData.role === 'promoter') {
//                     ExistUser.totalRetailers -= 1;
//                 } else if (existData.role === 'superStockist') {
//                     ExistUser.totalSuperStockist -= 1;
//                 }
//                 await ExistUser.save();
//             }
//         }

//         user = await SuperAdmin.findByIdAndDelete(id);
//     }
//     if (!user) return next(new ErrorHandler('Admin user not found', 404));
//     sendResponse(res, 200, 'Admin user deleted successfully', user);
// });

exports.deleteAdminUserByAdmin = catchAsyncErrors(async (req, res, next) => {
    const { id } = req.params;

    // 1️⃣ Find user to delete
    const userToDelete = await SuperAdmin.findById(id);
    if (!userToDelete) {
        return next(new ErrorHandler('Admin user not found', 404));
    }

    // 2️⃣ Update creator counters safely
    const creatorEmail = userToDelete?.createdByEmail?.email;
    const creatorName = userToDelete?.createdByEmail?.name;

    if (creatorEmail && creatorName) {
        const creator = await SuperAdmin.findOne({
            email: creatorEmail,
            name: creatorName
        });

        if (creator) {
            const roleCounterMap = {
                distributor: 'totalDistributors',
                retailer: 'totalRetailers',
                promoter: 'totalPromoter',
                "TSM-ASM": 'totalTSMAMC',
                superStockist: 'totalSuperStockist'
            };

            const counterField = roleCounterMap[userToDelete.role];

            if (counterField && creator[counterField] > 0) {
                creator[counterField] -= 1;
                // console.log('creator::===>', creator)
                await creator.save();
            }
        }
    }

    // 3️⃣ Delete user
    const deletedUser = await SuperAdmin.findByIdAndDelete(id);

    sendResponse(res, 200, 'Admin user deleted successfully', deletedUser);
});


exports.getAllStaffByAdmin = catchAsyncErrors(async (req, res, next) => {
    try {
        let { staffRole } = req.query;

        if (typeof staffRole === 'string') {
            try {
                staffRole = JSON.parse(staffRole);
            } catch {
                staffRole = [staffRole]; // fallback if it’s a single string
            }
        }

        // Ensure it’s an array
        if (!Array.isArray(staffRole)) {
            staffRole = [];
        }

        console.log("Parsed staffRole:=", staffRole);

        const users = await SuperAdmin.find({ role: { $in: staffRole } }).populate('staffRole');
        // console.log("Parsed staffRole:=", users);
        return res.status(200).json({
            status: true,
            message: 'Staff fetched successfully',
            data: users
        });

    } catch (error) {
        console.error("Error in getAllStaffByAdmin:", error);
        return next(new ErrorHandler(error.message || 'Server Error', 500));
    }
});

exports.getAdminUsersById = catchAsyncErrors(async (req, res, next) => {
    try {
        const id = req.params.id;
        const user = await SuperAdmin.findById(id).populate('staffRole');
        if (!user) return next(new ErrorHandler('Admin user not found', 404));
        res.status(200).json({ status: true, message: "Admin user fetched successfully", data: user })
    } catch (error) {
        console.error("Error in getAdminUsersById:", error);
        return next(new ErrorHandler(error.message || 'Server Error', 500));
    }
})

exports.getRetailerByEmail = catchAsyncErrors(async (req, res, next) => {
    try {
        const { email } = req.query;
        if (!email) {
            return next(new ErrorHandler("Email is required", 400));
        }

        const retailer = await SuperAdmin.find({
            "createdByEmail.email": email,
            role: "retailer"
        }).select("-password -__v"); // hide sensitive fields

        if (!retailer) {
            return next(new ErrorHandler("Retailer not found", 404));
        }

        res.status(200).json({
            status: true,
            message: "Retailer fetched successfully",
            data: retailer
        });
    } catch (error) {
        return next(new ErrorHandler(error.message || 'Server Error', 500));
    }



});


//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////


// exports.updateSuperAdminByID = catchAsyncErrors(async (req, res, next) => {
//     try {
//         const superAdminID = req.params.id;

//         console.log('req.body::', req.body.bankDetails)

//         const superAdmin = await SuperAdmin.findByIdAndUpdate(superAdminID, req.body, {
//             new: true,
//             runValidators: true,
//         });

//         if (!superAdmin) {
//             return next(new ErrorHandler("Super Admin not found!", 400));
//         }

//         sendResponse(res, 200, "Super Admin Updated Successfully", superAdmin);
//     } catch (error) {
//         return next(new ErrorHandler(error.message, 500));
//     }
// })

// exports.changePassword = catchAsyncErrors(async (req, res, next) => {
//     try {
//         const superAdminID = req.params.id;
//         const { currentPassword, newPassword } = req.body;

//         const superAdmin = await SuperAdmin.findById(superAdminID);

//         if (!superAdmin) {
//             return next(new ErrorHandler("Super Admin not found!", 400));
//         }

//         const passwordMatch = await bcrypt.compare(currentPassword, superAdmin.password)

//         if (passwordMatch) {
//             const hash = await bcrypt.hash(newPassword, 10);
//             const superAdminUpdated = await SuperAdmin.findByIdAndUpdate(superAdminID, { password: hash }, {
//                 new: true,
//                 runValidators: true,
//             });
//             sendResponse(res, 200, "Super Admin Password Changed Successfully", superAdminUpdated);
//         }
//         else {
//             return res.status(500).json({ status: false, message: "Wrong Password" });
//         }

//     } catch (error) {
//         return next(new ErrorHandler(error.message, 500));
//     }
// })


// exports.sendOtpForChangeEmail = catchAsyncErrors(async (req, res, next) => {
//     try {
//         const { email, new_email } = req.body;

//         const uniqueId = new ShortUniqueId({ length: 4, dictionary: "number" });
//         const currentUniqueId = uniqueId.rnd();

//         const superAdmin = await SuperAdmin.findOne({ email });

//         if (!superAdmin) {
//             return next(new ErrorHandler("superAdmin not found", 404));
//         }

//         superAdmin.otp = currentUniqueId;
//         await superAdmin.save();

//         let mail_data = {
//             otp: currentUniqueId,
//             email: new_email,
//             name: superAdmin.name,
//         };

//         await sendEmailUpdateOtp(mail_data);

//         sendResponse(res, 200, "otp sent successfully.", []);
//     } catch (error) {
//         next(new ErrorHandler(error.message, 500));
//     }
// });


// exports.verifyOtpForChangeEmail = catchAsyncErrors(async (req, res, next) => {
//     try {
//         const { email, new_email, otp } = req.body;

//         // Find the Super Admin by email
//         const superAdmin = await SuperAdmin.findOne({ email });

//         if (!superAdmin) {
//             return next(new ErrorHandler("Super Admin not found", 404));
//         }

//         // Check if the OTP matches
//         if (superAdmin.otp !== otp) {
//             return next(new ErrorHandler("OTP didn't match, please try again", 400));
//         }

//         // Update the Super Admin to clear the OTP
//         superAdmin.email = new_email;
//         superAdmin.otp = "";
//         await superAdmin.save();

//         // Send the response with the updated sub-admin
//         sendResponse(res, 200, "Super Admin email updation successful", superAdmin);
//     } catch (error) {
//         next(new ErrorHandler(error.message, 500));
//     }
// });

// exports.sendOtpForChangePhone = catchAsyncErrors(async (req, res, next) => {
//     try {
//         const { phone, new_phone } = req.body;

//         const uniqueId = new ShortUniqueId({ length: 4, dictionary: "number" });
//         const currentUniqueId = uniqueId.rnd();

//         const superAdmin = await SuperAdmin.findOne({ phone });

//         if (!superAdmin) {
//             return next(new ErrorHandler("superAdmin not found", 404));
//         }

//         superAdmin.otp = currentUniqueId;
//         await superAdmin.save();

//         // let mail_data = {
//         //     otp: currentUniqueId,
//         //     email: new_phone,
//         //     name: superAdmin.name,
//         // };

//         // await sendEmailUpdateOtp(mail_data);

//         sendResponse(res, 200, "otp sent successfully.", { otp: currentUniqueId });
//     } catch (error) {
//         next(new ErrorHandler(error.message, 500));
//     }
// });


// exports.verifyOtpForChangePhone = catchAsyncErrors(async (req, res, next) => {
//     try {
//         const { phone, new_phone, otp } = req.body;

//         // Find the Super Admin by email
//         const superAdmin = await SuperAdmin.findOne({ phone });

//         if (!superAdmin) {
//             return next(new ErrorHandler("Super Admin not found", 404));
//         }

//         // Check if the OTP matches
//         if (superAdmin.otp !== otp) {
//             return next(new ErrorHandler("OTP didn't match, please try again", 400));
//         }

//         // Update the Super Admin to clear the OTP
//         superAdmin.phone = new_phone;
//         superAdmin.otp = "";
//         await superAdmin.save();

//         // Send the response with the updated sub-admin
//         sendResponse(res, 200, "Super Admin phone updation successful", superAdmin);
//     } catch (error) {
//         next(new ErrorHandler(error.message, 500));
//     }
// });






