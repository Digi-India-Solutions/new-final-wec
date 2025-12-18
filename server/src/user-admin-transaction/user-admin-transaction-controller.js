const catchAsyncErrors = require("../../middleware/catchAsyncErrors");
const ErrorHandler = require("../../utils/ErrorHandler");
const SuperAdmin = require("../super-admin/super-admin-model");
const UserAdmin = require("../user-admin/user-admin-model");
const UserAdminTransaction = require("./user-admin-transaction-model");


exports.createTransactionByAdmin = catchAsyncErrors(async (req, res, next) => {
    try {
        const { userId, amount, type, createdByEmail, role } = req.body;
        console.log("BODY:=>", req.body)
        if (!userId || !type || !amount) {
            return res.status(400).json({ status: false, message: "Required fields missing" });
        }

        const user = await UserAdmin.findById(userId);
        if (!user) return next(new ErrorHandler("Target user not found", 404));

        const creator = await SuperAdmin.findOne({ email: createdByEmail?.email , name: createdByEmail?.name }).lean();

        // console.log("DD::=>X", user, creator, createdByEmail?.name, createdByEmail?.email)

        if (!creator) return next(new ErrorHandler("Creator user not found", 404));

        const amt = parseFloat(amount);
        if (isNaN(amt) || amt <= 0) {
            return res.status(400).json({ status: false, message: "Amount must be greater than 0" });
        }

        let targetNewBalance = user.walletBalance || 0;
        let creatorNewBalance = creator.walletBalance || 0;

        // ✅ Wallet Logic + Mirrored Wallet Effect
        if (type === "credit") {
            // Retailer/Target gets +amt
            targetNewBalance += amt;

            // Distributor loses money
            if (role === "distributor" || role === "retailer") {
                if (creatorNewBalance < amt) {
                    return res.status(400).json({ status: false, message: "Insufficient distributor wallet balance" });
                }
                creatorNewBalance -= amt;
            }
        } else if (type === "debit") {
            // Retailer/Target loses money
            if (targetNewBalance < amt) {
                return res.status(400).json({ status: false, message: "Insufficient wallet balance" });
            }
            targetNewBalance -= amt;

            // Distributor gains money
            if (role === "distributor" || role === "retailer") {
                creatorNewBalance += amt;
            }
        } else {
            return res.status(400).json({ status: false, message: "Invalid transaction type" });
        }

        // ✅ Save Wallets
        user.walletBalance = targetNewBalance;
        creator.walletBalance = creatorNewBalance;
        await user.save();
        // await creator.save();

        // ✅ Create Transaction for Retailer/User
        const userTransaction = await UserAdminTransaction.create({
            ...req.body,
            userType: role,
            amount: amt,
            balanceAfter: targetNewBalance,
            createdByEmail,
        });

        // ✅ Create Reverse Transaction for Creator (Mirror Entry)
        const creatorTransaction = await UserAdminTransaction.create({
            id: Date.now().toString(),
            createdBy: creator.name,
            userId: creator?._id,
            userName: creator.name,
            userEmail: creator.email,
            userType: creator.role,
            type: type === "credit" ? "debit" : "credit", // Mirrored
            amount: amt,
            description: `${type === "credit" ? "Wallet Recharge to" : "Return Received from"} ${user.name}`,
            balanceAfter: creatorNewBalance,
            createdByEmail,
        });

        //  const creatorTransaction = await Transaction.create({
        //     id: Date.now().toString(),
        //     createdBy: creator.name,
        //     userId: creator?._id,
        //     userName: creator.name,
        //     userEmail: creator.email,
        //     userType: creator.role,
        //     type: type === "credit" ? "debit" : "credit", // Mirrored
        //     amount: amt,
        //     description: `${type === "credit" ? "Wallet Recharge to" : "Return Received from"} ${user.name}`,
        //     balanceAfter: creatorNewBalance,
        //     createdByEmail,
        // });


        return res.status(200).json({
            status: true,
            message: "Transaction completed for both parties",
            data: {
                userTransaction,
                // creatorTransaction,
                userWallet: targetNewBalance,
                creatorWallet: creatorNewBalance,
            },
        });

    } catch (error) {
        console.error("Transaction Error:", error);
        return next(new ErrorHandler(error.message, 500));
    }
});


exports.getTransactionByAdminWithPagination = catchAsyncErrors(async (req, res, next) => {
    try {
        let { page = 1, limit = 10, search = "", role = "", status = "", userType = "", userId = [], createdByEmail = "" } = req.query;
        page = Math.max(1, parseInt(page, 10));
        limit = Math.max(1, parseInt(limit, 10));
        // console.log('req.query::===>> hh', createdByEmail)

        if (typeof userId === "string") {
            try {
                userId = JSON.parse(userId);
            } catch {
                userId = userId.split(",").filter(Boolean);
            }
        }

        const filter = {};
        const filterData = {};

        if (createdByEmail) {
            const createdByRegex = new RegExp(createdByEmail.trim(), 'i');
            filter.$or = [
                { 'userEmail': createdByRegex }
            ];
            filterData.$or = [
                { 'userEmail': createdByRegex }
            ]
        }

        if (status && status !== "all") {
            filter.status = new RegExp(`^${status}$`, "i");
        }
        if (userType && userType !== "all") {
            filter.userType = new RegExp(`^${userType}$`, "i");
        }
        if (search && search.trim() !== "") {
            const searchRegex = new RegExp(search.trim(), "i");
            filter.$or = [
                { userName: searchRegex },
                { userEmail: searchRegex },
                { type: searchRegex },
                { description: searchRegex },
            ];
        }

        const total = await UserAdminTransaction.countDocuments(filter);
        const totalTransactions = await UserAdminTransaction.countDocuments(filterData);
        const [creditAgg] = await UserAdminTransaction.aggregate([
            { $match: { type: "credit" } },
            { $group: { _id: null, total: { $sum: "$amount" } } }
        ]);

        const [debitAgg] = await UserAdminTransaction.aggregate([
            { $match: { type: "debit" } },
            { $group: { _id: null, total: { $sum: "$amount" } } }
        ]);

        const totalCredit = creditAgg?.total || 0;
        const totalDebit = debitAgg?.total || 0;

        // ✅ Optionally calculate balance
        const balance = totalCredit - totalDebit;

        const transactions = await UserAdminTransaction.find(filter)
            .sort({ createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(limit)
            .lean();

        const totalPages = Math.ceil(total / limit);

        res.status(200).json({
            status: true,
            message: "Transactions fetched successfully",
            data: transactions,
            pagination: {
                total,
                totalTransactions,
                totalCredit,
                totalDebit,
                totalPages,
                balance,
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

// ✅ Get All Transactions (no pagination)
exports.getAllTransactions = catchAsyncErrors(async (req, res, next) => {
    try {
        const transactions = await UserAdminTransaction.find().sort({ createdAt: -1 });
        res.status(200).json({
            status: true,
            message: "All transactions fetched successfully",
            data: transactions,
        });
    } catch (error) {
        return next(new ErrorHandler(error.message, 500));
    }
});

// ✅ Update Transaction
exports.updateTransactionByAdmin = catchAsyncErrors(async (req, res, next) => {
    try {
        const { id } = req.params;
        const updated = await UserAdminTransaction.findByIdAndUpdate(id, req.body, {
            new: true,
            runValidators: true,
        });

        if (!updated) {
            return next(new ErrorHandler("Transaction not found", 404));
        }

        res.status(200).json({
            status: true,
            message: "Transaction updated successfully",
            data: updated,
        });
    } catch (error) {
        return next(new ErrorHandler(error.message, 500));
    }
});

// ✅ Delete Transaction
exports.deleteTransactionByAdmin = catchAsyncErrors(async (req, res, next) => {
    try {
        const { id } = req.params;
        const deleted = await UserAdminTransaction.findByIdAndDelete(id);

        if (!deleted) {
            return next(new ErrorHandler("Transaction not found", 404));
        }

        res.status(200).json({
            status: true,
            message: "Transaction deleted successfully",
            data: deleted,
        });
    } catch (error) {
        return next(new ErrorHandler(error.message, 500));
    }
});

exports.getWalletManagementByAdmin = catchAsyncErrors(async (req, res, next) => {
    try {
        const { id } = req.params;
        const user = await UserAdmin.findById(id).lean();
        if (!user) return next(new ErrorHandler("User not found", 404));
        console.log("user:==>user:==>", user._id)

        const transactions = await UserAdminTransaction.find({ userId: user._id }).sort({ createdAt: -1 });
        const totalCredit = transactions.reduce((total, transaction) => {
            if (transaction.type === "credit") {
                return total + transaction.amount;
            }
            return total;
        }, 0);
        const totalDebit = transactions.reduce((total, transaction) => {
            if (transaction.type === "debit") {
                return total + transaction.amount;
            }
            return total;
        }, 0);

        const totalBalance = user.walletBalance || 0;
        res.status(200).json({
            status: true,
            message: "Wallet fetched successfully",
            totalBalance, totalCredit, totalDebit,
        })
    } catch (error) {
        return next(new ErrorHandler(error.message, 500));
    }
});



