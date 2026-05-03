const mongoose = require("mongoose");

const teacherAssignmentSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    teacherId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User", // role = teacher
      required: true,
    },

    classId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Class",
      required: true,
    },

    subjectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Subject",
      required: true,
    },
  },
  { timestamps: true },
);

// ❗ Prevent duplicate assignment
teacherAssignmentSchema.index(
  { teacherId: 1, classId: 1, subjectId: 1 },
  { unique: true },
);

module.exports = mongoose.model("TeacherAssignment", teacherAssignmentSchema);
