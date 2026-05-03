const mongoose = require("mongoose");

const studentSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    rollNumber: {
      type: String,
      required: true,
      trim: true,
    },

    classId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Class",
      required: true,
    },

    parentName: {
      type: String,
      trim: true,
    },
    parentEmail: {
      type: String,
      trim: true,
    },
    contactNumber: {
      type: String,
      trim: true,
    },
  },
  { timestamps: true },
);

// prevent duplicate roll number per class
studentSchema.index({ rollNumber: 1, classId: 1 }, { unique: true });

module.exports = mongoose.model("Student", studentSchema);
