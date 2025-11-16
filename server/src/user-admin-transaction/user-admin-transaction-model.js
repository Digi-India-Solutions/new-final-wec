const mongoose = require("mongoose");
const { Schema } = mongoose;

const userAdminTransactionSchema = new Schema(
    {
        id: { type: String, required: true, unique: true }, // Custom ID (like "1761284332583")
        userId: { type: mongoose.Schema.Types.ObjectId, ref: "SuperAdmin", required: false },
        userType: { type: String, enum: ["distributor", "retailer", "admin"], required: true },
        userName: { type: String, required: true },
        userEmail: { type: String, required: true },

        type: { type: String, enum: ["credit", "debit"], required: true },
        amount: { type: Number, required: true },
        description: { type: String, default: "" },
        clientAmount: { type: Number, default: 0 },
        percentage: { type: Number, default: 0 },

        createdBy: { type: String, default: "System" },
        createdDate: { type: Date, default: Date.now },

        createdByEmail: {
            name: { type: String },
            email: { type: String },
            createdBy: { type: String, default: "System" }
        },

        balanceAfter: { type: Number, default: 0 },
        status: { type: String, enum: ["active", "inactive"], default: "active" },
    },
    {
        timestamps: true, // adds createdAt, updatedAt
    }
);

module.exports = mongoose.model("UserAdminTransaction", userAdminTransactionSchema);
