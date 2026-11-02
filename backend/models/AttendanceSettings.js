const mongoose = require("mongoose");

const attendanceSettingsSchema = new mongoose.Schema(
  {
    key: {
      type: String,
      default: "attendance",
      unique: true,
    },
    mobileNotificationsEnabled: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true },
);

module.exports = mongoose.model("AttendanceSettings", attendanceSettingsSchema);
