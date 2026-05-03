const mongoose = require("mongoose");
const Assignment = require("../models/TeacherAssignment");
const User = require("../models/User");
const Class = require("../models/Class");
const Subject = require("../models/Subject");
const { sendEmail } = require("../utils/sendEmail");
const { teacherAssignmentTemplate } = require("../utils/emailTemplates");

// ➕ Create Assignment
exports.createAssignmentold = async (req, res) => {
  try {
    const data = await TeacherAssignment.create(req.body);

    res.status(201).json({ success: true, data });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(400).json({
        success: false,
        message: "Assignment already exists",
      });
    }

    res.status(500).json({ success: false, message: err.message });
  }
};

exports.createAssignment = async (req, res) => {
  try {
    const { teacherId, classId, subjectId, title, description } = req.body;

    const assignment = await Assignment.create({
      teacherId,
      classId,
      subjectId,
      title,
      description,
    });

    // 🔍 Fetch details for email
    const teacher = await User.findById(teacherId);
    const classData = await Class.findById(classId);
    const subject = await Subject.findById(subjectId);

    const loginUrl = `${process.env.FRONTEND_URL}/login`;

    // 📧 Send email
    await sendEmail({
      to: teacher.email,
      subject: "New Assignment Assigned",
      html: teacherAssignmentTemplate({
        teacherName: teacher.name,
        assignmentTitle: title,
        description,
        className: classData.className,
        section: classData.section,
        subject: subject.name,
        loginUrl,
        actionType: "assigned",
      }),
    });

    res.json({ success: true, data: assignment });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.updateAssignment = async (req, res) => {
  try {
    const { teacherId, classId, subjectId, title, description } = req.body;

    const assignment = await Assignment.findByIdAndUpdate(
      req.params.id,
      { teacherId, classId, subjectId, title, description },
      { returnDocument: "after" },
    );

    // 🔍 Fetch details
    const teacher = await User.findById(teacherId);
    const classData = await Class.findById(classId);
    const subject = await Subject.findById(subjectId);

    const loginUrl = `${process.env.FRONTEND_URL}/login`;

    // 📧 Send update email
    await sendEmail({
      to: teacher.email,
      subject: "Assignment Updated",
      html: teacherAssignmentTemplate({
        teacherName: teacher.name,
        assignmentTitle: title,
        description,
        className: classData.className,
        section: classData.section,
        subject: subject.name,
        loginUrl,
        actionType: "updated",
      }),
    });

    res.json({ success: true, data: assignment });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// 📄 Get Assignments
exports.getAssignmentsold = async (req, res) => {
  try {
    const data = await TeacherAssignment.find()
      .populate("teacherId", "name email")
      .populate("classId", "className section")
      .populate("subjectId", "name")
      .sort({ createdAt: -1 });

    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.getAssignments = async (req, res) => {
  try {
    const user = req.user;

    let filter = {};

    // ✅ ONLY teacher filter
    if (user.role === "teacher") {
      filter.teacherId = new mongoose.Types.ObjectId(user.id);
    }

    const assignments = await Assignment.find(filter)
      .populate("teacherId", "name email")
      .populate("classId", "className section")
      .populate("subjectId", "name")
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: assignments,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

// ❌ Delete
exports.deleteAssignment = async (req, res) => {
  try {
    await Assignment.findByIdAndDelete(req.params.id);

    res.json({ success: true, message: "Deleted" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
