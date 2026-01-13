const mongoose = require('mongoose');
const { Schema } = mongoose;
const jwt = require("jsonwebtoken");

const superAdminSchema = new Schema({
    ownerName: {
        type: String,
        trim: true,
        default: "",
    },
    name: {
        type: String,
        trim: true,
        default: "",
    },
    createdId: {
        type: mongoose.Schema.Types.ObjectId,
        trim: true,
        ref: "SuperAdmin",
        default: null
    },
    createdByEmail: {
        name: {
            type: String,
            trim: true,
            default: "",
        },
        email: {
            type: String,
            trim: true,
            default: "",
        }
    },
    DistributorId: {
        type: String,
        trim: true,
        default: "",
    },
    email: {
        type: String,
        unique: true,
        trim: true,
        default: "",
    },
    password: {
        type: String,
        trim: true,
        default: "",
    },
    showpassword: {
        type: String,
        trim: true,
        default: "",
    },
    otp: {
        type: String,
        trim: true,
        default: ""
    },
    phone: {
        type: String,
        trim: true,
        default: "",
    },
    gst: {
        type: String,
        trim: true,
        default: "",
    },
    isSuperAdmin: {
        type: Boolean,
        default: true,
    },
    role: {
        type: String,
        default: "admin",
    },
    staffRole: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "AdminRole",
        required: false
    },
    status: {
        type: String,
        default: "active",
    },
    lastLogin: {
        type: String,
        default: 'Never',
    },
    address: {
        type: String,
        default: "",
    },
    dateOfJoining: {
        type: String,
        default: "",
    },
    totalRetailers: {
        type: Number,
        default: 0,
    },
    totalDistributors: {
        type: Number,
        default: 0,
    },
    totalAMCs: {
        type: Number,
        default: 0,
    },
    walletBalance: {
        type: Number,
        default: 0,
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
    updatedAt: {
        type: Date,
        default: Date.now,
    },
});


// jwt token
superAdminSchema.methods.getJwtToken = function () {
    return jwt.sign({ id: this._id }, process.env.JWT_SECRET_KEY, {
        expiresIn: process.env.JWT_EXPIRES,
    });
};

// Middleware to update the `updated_at` field before each save
superAdminSchema.pre('save', function (next) {
    this.updated_at = Date.now();
    next();
});

// Create the model from the schema
const SuperAdmin = mongoose.model('SuperAdmin', superAdminSchema);

module.exports = SuperAdmin;