const mongoose = require("mongoose");

const classSchema = new mongoose.Schema(
  {
    className: {
      type: String,
      required: true,
      trim: true,
    },
    section: {
      type: String,
      required: true,
      trim: true,
    },
  },
  { timestamps: true },
);

// Prevent duplicate class + section
classSchema.index({ className: 1, section: 1 }, { unique: true });

module.exports = mongoose.model("Class", classSchema);
