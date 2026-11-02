const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 50,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
    },
    password: {
      type: String,
      required: true,
      minlength: 6,
      select: false,
    },
    role: {
      type: String,
      enum: ["admin", "teacher", "student", "parent"],
      required: true,
    },
    status: {
      type: String,
      enum: ["active", "inactive"],
      default: "active",
    },
    teacherProfile: {
      employeeId: { type: String, trim: true, uppercase: true, maxlength: 30 },
      phone: { type: String, trim: true, maxlength: 30 },
      gender: { type: String, enum: ["male", "female", "other"] },
      dateOfBirth: Date,
      designation: { type: String, trim: true, maxlength: 80 },
      department: { type: String, trim: true, maxlength: 80 },
      qualification: { type: String, trim: true, maxlength: 200 },
      specialization: { type: String, trim: true, maxlength: 150 },
      joiningDate: Date,
      employmentType: {
        type: String,
        enum: ["full_time", "part_time", "contract"],
        default: "full_time",
      },
      address: { type: String, trim: true, maxlength: 500 },
      emergencyContactName: { type: String, trim: true, maxlength: 100 },
      emergencyContactPhone: { type: String, trim: true, maxlength: 30 },
      photo: {
        originalName: { type: String, maxlength: 255 },
        filename: { type: String, maxlength: 100 },
        mimeType: { type: String, enum: ["image/jpeg", "image/png", "image/webp"] },
        size: { type: Number, min: 0, max: 2097152 },
      },
    },
    classId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Class",
    },
    resetToken: {
      type: String,
    },

    resetExpire: {
      type: Date,
    },
  },
  { timestamps: true },
);

// 🔐 Hash password
userSchema.pre("save", async function () {
  if (!this.isModified("password")) return;
  this.password = await bcrypt.hash(this.password, 12);
});

// 🔑 Compare password
userSchema.methods.comparePassword = async function (candidate) {
  return await bcrypt.compare(candidate, this.password);
};

userSchema.index(
  { "teacherProfile.employeeId": 1 },
  { unique: true, sparse: true, name: "unique_teacher_employee_id" },
);

module.exports = mongoose.model("User", userSchema);
