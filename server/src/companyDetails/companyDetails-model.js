const mongoose = require("mongoose");
const { Schema } = mongoose;

/** 🏢 Company Settings Schema */
const companySettingsSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, trim: true },
    phone: { type: String },
    address: { type: String },
    website: { type: String },
    logo: { type: String },
    createdBy: { type: String },
  },
  { timestamps: true }
);

/** 👨‍💼 Admin Settings Schema */
const amcSettingsSchema = new mongoose.Schema(
  {
    defaultPercentage: { type: Number, required: true },
    minPercentage: { type: Number, required: false },
    maxPercentage: { type: Number, required: false },
    defaultDuration: { type: Number, required: false },
    termsAndConditions: { type: String, required: true },
  },
  { timestamps: true }
);

// ✅ Define both models
const CompanySettings = mongoose.model("CompanySettings", companySettingsSchema);
const AMCSettings = mongoose.model("amcSettings", amcSettingsSchema);

// ✅ Export both
module.exports = { CompanySettings, AMCSettings };
