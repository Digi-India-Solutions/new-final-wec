const mongoose = require("mongoose");
const { Schema } = mongoose;

const packageSchema = new Schema(
    {
        createdByEmail: {
            name: { type: String, },
            email: { type: String, }
        },
        categoryIds: {
            type: mongoose.Schema.Types.ObjectId, ref: 'Category', required: true
        },
        categoryId: {
            type: String
        },
        name: {
            type: String,
            required: true,
            trim: true,
        },

        packages: [{
            validity: {
                type: String,
                required: true,
            },
            percentage: {
                type: String,
                required: true,
            },
        }],

        validFrom: {
            type: String,
            required: true,
        },

        status: {
            type: String,
            default: "active",
        },
        
    },
    {
        timestamps: true, // automatically adds createdAt, updatedAt
    }
);

const Package = mongoose.model("Package", packageSchema);
module.exports = Package;
