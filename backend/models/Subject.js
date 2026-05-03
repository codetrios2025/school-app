const mongoose = require("mongoose");

const subjectSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },
  },
  { timestamps: true },
);

// prevent duplicates (case-insensitive)
subjectSchema.index({ name: 1 }, { unique: true });

module.exports = mongoose.model("Subject", subjectSchema);
