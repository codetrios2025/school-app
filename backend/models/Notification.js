const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema(
  {
    title: String,
    message: String,

    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },

    // who receives this
    type: {
      type: String,
      enum: ["broadcast", "all", "teachers", "students", "class"],
      required: true,
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

module.exports = mongoose.model("Notification", notificationSchema);
