const mongoose = require("mongoose");

const addressSchema = new mongoose.Schema(
  {
    line1: { type: String, trim: true, maxlength: 200 },
    line2: { type: String, trim: true, maxlength: 200 },
    country: { type: String, trim: true, maxlength: 80 },
    state: { type: String, trim: true, maxlength: 80 },
    district: { type: String, trim: true, maxlength: 80 },
    city: { type: String, trim: true, maxlength: 80 },
    pincode: { type: String, trim: true, maxlength: 20 },
  },
  { _id: false },
);

const fileSchema = new mongoose.Schema(
  {
    originalName: { type: String, required: true, trim: true, maxlength: 255 },
    filename: { type: String, required: true },
    mimeType: { type: String, required: true },
    size: { type: Number, required: true, min: 1 },
    uploadedAt: { type: Date, default: Date.now },
  },
  { timestamps: false },
);

const studentSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    admissionNo: {
      type: String,
      trim: true,
      maxlength: 50,
    },
    rollNumber: {
      type: String,
      required: true,
      trim: true,
      maxlength: 50,
    },
    classId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Class",
      required: true,
    },
    gender: {
      type: String,
      enum: ["male", "female", "other"],
    },
    dateOfBirth: Date,
    bloodGroup: {
      type: String,
      enum: ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"],
    },
    category: { type: String, trim: true, maxlength: 80 },
    religion: { type: String, trim: true, maxlength: 80 },
    nationality: { type: String, trim: true, maxlength: 80 },
    aadhaarNumber: { type: String, trim: true, maxlength: 20, select: false },
    apaarId: { type: String, trim: true, maxlength: 50 },
    pen: { type: String, trim: true, maxlength: 50 },
    srnNumber: { type: String, trim: true, maxlength: 50 },
    familyId: { type: String, trim: true, maxlength: 50 },
    fatherName: { type: String, trim: true, maxlength: 100 },
    motherName: { type: String, trim: true, maxlength: 100 },
    parentName: { type: String, trim: true, maxlength: 100 },
    parentEmail: { type: String, trim: true, lowercase: true, maxlength: 254 },
    contactNumber: { type: String, trim: true, maxlength: 30 },
    fatherContactNumber: { type: String, trim: true, maxlength: 30 },
    motherContactNumber: { type: String, trim: true, maxlength: 30 },
    guardianName: { type: String, trim: true, maxlength: 100 },
    guardianRelation: { type: String, trim: true, maxlength: 80 },
    guardianContactNumber: { type: String, trim: true, maxlength: 30 },
    emergencyContactName: { type: String, trim: true, maxlength: 100 },
    emergencyContactNumber: { type: String, trim: true, maxlength: 30 },
    emergencyContactRelation: { type: String, trim: true, maxlength: 80 },
    address: { type: addressSchema, default: () => ({}) },
    photo: fileSchema,
    documents: { type: [fileSchema], default: [] },
    status: {
      type: String,
      enum: ["active", "inactive"],
      default: "active",
    },
  },
  { timestamps: true },
);

studentSchema.index(
  { admissionNo: 1 },
  { unique: true, sparse: true, name: "unique_admission_number" },
);
studentSchema.index({ rollNumber: 1, classId: 1 }, { unique: true });
studentSchema.index({ parentEmail: 1 });

module.exports = mongoose.model("Student", studentSchema);
