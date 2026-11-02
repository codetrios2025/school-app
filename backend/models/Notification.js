const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true, maxlength: 160 },
    message: { type: String, required: true, trim: true, maxlength: 10000 },

    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },

    // who receives this
    type: {
      type: String,
      enum: [
        "broadcast",
        "all",
        "all_students",
        "all_teachers",
        "teachers",
        "students",
        "class",
        "individual",
      ],
      required: true,
    },
    channels: {
      type: [String],
      enum: ["inApp", "email", "whatsapp"],
      default: ["inApp"],
    },
    deliverySummary: {
      email: {
        attempted: { type: Number, default: 0 },
        sent: { type: Number, default: 0 },
        failed: { type: Number, default: 0 },
        unavailable: { type: Number, default: 0 },
      },
      whatsapp: {
        attempted: { type: Number, default: 0 },
        sent: { type: Number, default: 0 },
        failed: { type: Number, default: 0 },
        unavailable: { type: Number, default: 0 },
      },
    },

    classId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Class",
    },

    recipients: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],

    readBy: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
  },
  { timestamps: true },
);

notificationSchema.index({ recipients: 1, createdAt: -1 });
notificationSchema.index({ sender: 1, createdAt: -1 });

module.exports = mongoose.model("Notification", notificationSchema);
