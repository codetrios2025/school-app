const Student = require("../models/Student");
const Attendance = require("../models/Attendance");
const Notification = require("../models/Notification");

exports.getParentDashboardold = async (req, res) => {
  try {
    // 🔎 find student linked to parent
    const student = await Student.findOne({
      parentEmail: req.user.email,
    }).populate("classId");

    if (!student) {
      return res.json({
        success: true,
        data: { student: null, attendance: [], notifications: [] },
      });
    }

    // 📊 attendance
    const attendance = await Attendance.find({
      studentId: student.userId,
    })
      .sort({ date: -1 })
      .limit(5);

    // 🔔 notifications
    const notifications = await Notification.find({
      recipients: student.userId,
    })
      .sort({ createdAt: -1 })
      .limit(5);

    res.json({
      success: true,
      data: {
        student: {
          name: student.parentName,
          className: student.classId.className,
          section: student.classId.section,
        },
        attendance,
        notifications,
      },
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
exports.getParentDashboard = async (req, res) => {
  try {
    console.log("🔐 Logged User:", req.user);

    let student;

    // ✅ CASE 1: If logged in as STUDENT
    if (req.user.role === "student") {
      student = await Student.findOne({
        userId: req.user.id,
      })
        .populate("userId", "name email")
        .populate("classId", "className section");
    }

    // ✅ CASE 2: If logged in as PARENT (email match)
    else if (req.user.role === "parent") {
      student = await Student.findOne({
        parentEmail: req.user.email,
      })
        .populate("userId", "name email")
        .populate("classId", "className section");
    }

    console.log("🎯 Found Student:", student);

    if (!student) {
      return res.json({
        success: true,
        data: {
          student: null,
          attendance: [],
          notifications: [],
        },
      });
    }

    // 📊 Attendance
    const attendance = await Attendance.find({
      studentId: student.userId._id,
    })
      .populate("subjectId", "name")
      .sort({ date: -1 })
      .limit(5);

    // 🔔 Notifications
    const notifications = await Notification.find({
      recipients: student.userId._id,
    })
      .sort({ createdAt: -1 })
      .limit(5);

    res.json({
      success: true,
      data: {
        student: {
          name: student.userId?.name,
          email: student.userId?.email,
          className: student.classId?.className,
          section: student.classId?.section,
          parentName: student.parentName,
        },
        attendance,
        notifications,
      },
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
