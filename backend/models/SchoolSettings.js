const mongoose = require("mongoose");

const schoolSettingsSchema = new mongoose.Schema(
  {
    key: {
      type: String,
      default: "school",
      unique: true,
    },
    schoolName: {
      type: String,
      trim: true,
      required: true,
      maxlength: 120,
      default: "School",
    },
    email: { type: String, trim: true, lowercase: true, maxlength: 254 },
    phone: { type: String, trim: true, maxlength: 30 },
    website: { type: String, trim: true, maxlength: 300 },
    address: { type: String, trim: true, maxlength: 500 },
    city: { type: String, trim: true, maxlength: 100 },
    state: { type: String, trim: true, maxlength: 100 },
    country: { type: String, trim: true, maxlength: 100 },
    postalCode: { type: String, trim: true, maxlength: 20 },
    mapUrl: { type: String, trim: true, maxlength: 1000 },
    whatsappNotificationsEnabled: { type: Boolean, default: false },
    logo: {
      originalName: { type: String, trim: true, maxlength: 255 },
      filename: { type: String, trim: true, maxlength: 100 },
      mimeType: {
        type: String,
        enum: ["image/jpeg", "image/png", "image/webp"],
      },
      size: { type: Number, min: 1, max: 2097152 },
    },
  },
  { timestamps: true },
);

module.exports = mongoose.model("SchoolSettings", schoolSettingsSchema);
