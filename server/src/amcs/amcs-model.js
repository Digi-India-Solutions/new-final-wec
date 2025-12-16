const mongoose = require("mongoose");
const { Schema } = mongoose;

const amcSchema = new Schema(
    {
        id: { type: String, required: true, unique: true },
        customerName: { type: String, required: true, trim: true },
        customerAddress: { type: String, required: true },
        customerEmail: { type: String, required: true },
        customerMobile: { type: String, required: true },
        serialNumber: { type: String, required: true },
        purchaseProof: { type: String, default: null }, // uploaded image URL
        productPicture: { type: String, default: null }, // uploaded image URL
        createdByEmail: {
            name: { type: String },
            email: { type: String },
        },

        productCategory: { type: String, required: true },
        productBrand: { type: String, required: true },
        productType: { type: String },
        productModel: { type: String, required: true },

        categoryId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Category",
            required: null,
        },
        brandId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Brand",
            required: null,
        },
        typeId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Type",
            required: null,
        },
        PackageForms: [{
            packageId: { type: String, required: true },
            durationId: { type: String, required: true },
            packageData: { type: Object, required: true },
            startDate: { type: Date, required: true, },
            endDate: { type: Date, required: true, },
        }],
        purchaseValue: { type: Number, required: true },
        amcPercentage: { type: Number, required: true },
        amcPackageValidity: { type: String },
        amcAmount: { type: Number, required: true },
        startDate: { type: String, required: true },
        endDate: { type: String, required: true },
        gst: { type: String },
        status: { type: String, default: "active" },
        retailerId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "SuperAdmin",
            default: null,
        },
        retailerName: { type: String },
        distributorId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "SuperAdmin",
            default: null,
        },
        distributorName: { type: String },
        createdDate: { type: String },
        renewalCount: { type: Number, default: 0 },
        lastServiceDate: { type: String, default: null },
    },
    { timestamps: true }
);

module.exports = mongoose.model("AMC", amcSchema);
