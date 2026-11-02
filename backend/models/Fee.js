const mongoose = require("mongoose");

const paymentSchema = new mongoose.Schema(
  {
    amount: {
      type: Number,
      required: true,
      min: 0.01,
    },
    method: {
      type: String,
      enum: ["cash", "bank_transfer", "card", "online", "cheque", "other"],
      required: true,
    },
    reference: {
      type: String,
      trim: true,
      maxlength: 100,
    },
    receivedAt: {
      type: Date,
      default: Date.now,
    },
    receivedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    submissionId: {
      type: mongoose.Schema.Types.ObjectId,
    },
  },
  { timestamps: true },
);

const paymentSubmissionSchema = new mongoose.Schema(
  {
    amount: { type: Number, required: true, min: 0.01 },
    method: {
      type: String,
      enum: ["cash", "bank_transfer", "card", "online", "cheque", "other"],
      required: true,
    },
    reference: { type: String, trim: true, maxlength: 100 },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
      required: true,
    },
    submittedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    submittedAt: { type: Date, default: Date.now, required: true },
    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    reviewedAt: Date,
    reviewNote: { type: String, trim: true, maxlength: 500 },
  },
  { timestamps: true },
);

const feeSchema = new mongoose.Schema(
  {
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Student",
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },
    academicYear: {
      type: String,
      required: true,
      trim: true,
      maxlength: 20,
    },
    amount: {
      type: Number,
      required: true,
      min: 0.01,
    },
    currency: {
      type: String,
      required: true,
      default: "INR",
      uppercase: true,
      minlength: 3,
      maxlength: 3,
    },
    dueDate: {
      type: Date,
      required: true,
    },
    description: {
      type: String,
      trim: true,
      maxlength: 1000,
    },
    payments: {
      type: [paymentSchema],
      default: [],
    },
    paymentSubmissions: {
      type: [paymentSubmissionSchema],
      default: [],
    },
  },
  { timestamps: true, optimisticConcurrency: true },
);

feeSchema.index({ studentId: 1, academicYear: 1, createdAt: -1 });

module.exports = mongoose.model("Fee", feeSchema);
