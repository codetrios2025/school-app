const mongoose = require("mongoose");
const Attendance = require("../models/Attendance");
const Class = require("../models/Class");
const Fee = require("../models/Fee");
const Notification = require("../models/Notification");
const SchoolSettings = require("../models/SchoolSettings");
const Student = require("../models/Student");
const TeacherAssignment = require("../models/TeacherAssignment");
const User = require("../models/User");

exports.getAdminDashboard = async (_req, res) => {
  try {
    const today = new Date().toISOString().slice(0, 10);
    const [
      students,
      teachers,
      classes,
      attendanceSessionsToday,
      attendanceTotals,
      feeTotals,
      recentAttendance,
      notifications,
      schoolSettings,
    ] = await Promise.all([
      Student.countDocuments({ status: "active" }),
      User.countDocuments({ role: "teacher", status: "active" }),
      Class.countDocuments(),
      Attendance.countDocuments({ date: today }),
      Attendance.aggregate([
        { $match: { date: today } },
        { $unwind: "$records" },
        {
          $group: {
            _id: null,
            present: {
              $sum: { $cond: [{ $eq: ["$records.status", "present"] }, 1, 0] },
            },
            absent: {
              $sum: { $cond: [{ $eq: ["$records.status", "absent"] }, 1, 0] },
            },
          },
        },
      ]),
      Fee.aggregate([
        {
          $project: {
            amount: 1,
            paid: { $sum: "$payments.amount" },
          },
        },
        {
          $group: {
            _id: "$currency",
            billed: { $sum: "$amount" },
            collected: { $sum: "$paid" },
            outstanding: {
              $sum: {
                $max: [{ $subtract: ["$amount", "$paid"] }, 0],
              },
            },
          },
        },
      ]),
      Attendance.find({ date: { $lte: today } })
        .populate("classId", "className section")
        .populate("subjectId", "name")
        .sort({ date: -1, createdAt: -1 })
        .limit(5),
      Notification.find()
        .populate("sender", "name")
        .sort({ createdAt: -1 })
        .limit(5)
        .select("title message sender createdAt"),
      SchoolSettings.findOne({ key: "school" }).select("schoolName").lean(),
    ]);
    const attendance = attendanceTotals[0] || { present: 0, absent: 0 };

    return res.json({
      success: true,
      data: {
        today,
        schoolName: schoolSettings?.schoolName || "",
        summary: {
          students,
          teachers,
          classes,
          attendanceSessionsToday,
          presentToday: attendance.present,
          absentToday: attendance.absent,
        },
        feeTotals: feeTotals.map((fee) => ({
          currency: fee._id || "INR",
          billed: fee.billed,
          collected: fee.collected,
          outstanding: fee.outstanding,
        })),
        recentAttendance: recentAttendance.map((record) => ({
          _id: record._id,
          date: record.date,
          className: record.classId
            ? `${record.classId.className} - ${record.classId.section}`
            : "Class unavailable",
          subject: record.subjectId?.name || "Subject unavailable",
          present: (record.records || []).filter(
            (item) => item.status === "present",
          ).length,
          absent: (record.records || []).filter(
            (item) => item.status === "absent",
          ).length,
        })),
        notifications: notifications.map((notification) => ({
          _id: notification._id,
          title: notification.title,
          message: notification.message,
          sender: notification.sender?.name || "School",
          createdAt: notification.createdAt,
        })),
      },
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

exports.getTeacherDashboard = async (req, res) => {
  try {
    const [teacher, assignments, classTeacherClasses, notifications, unreadNotifications] =
      await Promise.all([
        User.findById(req.user.id).select("name email teacherProfile status"),
        TeacherAssignment.find({ teacherId: req.user.id })
          .populate("classId", "className section")
          .populate("subjectId", "name")
          .sort({ createdAt: -1 }),
        Class.find({ classTeacherId: req.user.id }).select(
          "className section classTeacherId",
        ),
        Notification.find({ recipients: req.user.id })
          .sort({ createdAt: -1 })
          .limit(5)
          .select("title message createdAt readBy"),
        Notification.countDocuments({
          recipients: req.user.id,
          readBy: { $ne: req.user.id },
        }),
      ]);

    const classMap = new Map();
    assignments.forEach((assignment) => {
      if (assignment.classId) {
        classMap.set(assignment.classId._id.toString(), assignment.classId);
      }
    });
    classTeacherClasses.forEach((schoolClass) => {
      classMap.set(schoolClass._id.toString(), schoolClass);
    });
    const classIds = [...classMap.keys()];
    const today = new Date().toISOString().slice(0, 10);

    const [studentCounts, todayAttendance, recentAttendance] =
      classIds.length === 0
        ? [[], [], []]
        : await Promise.all([
            Student.aggregate([
              {
                $match: {
                  classId: {
                    $in: classIds.map((id) => new mongoose.Types.ObjectId(id)),
                  },
                  $or: [
                    { status: "active" },
                    { status: { $exists: false } },
                  ],
                },
              },
              { $group: { _id: "$classId", count: { $sum: 1 } } },
            ]),
            Attendance.find({
              teacherId: req.user.id,
              classId: { $in: classIds },
              date: today,
            }).select("classId subjectId date records"),
            Attendance.find({
              teacherId: req.user.id,
              classId: { $in: classIds },
            })
              .populate("classId", "className section")
              .populate("subjectId", "name")
              .sort({ date: -1 })
              .limit(5),
          ]);

    const countByClass = new Map(
      studentCounts.map((item) => [item._id.toString(), item.count]),
    );
    const attendanceByClass = new Map(
      todayAttendance.map((item) => [item.classId.toString(), item]),
    );
    const classes = [...classMap.values()].map((schoolClass) => ({
      _id: schoolClass._id,
      className: schoolClass.className,
      section: schoolClass.section,
      isClassTeacher: classTeacherClasses.some(
        (item) => item._id.toString() === schoolClass._id.toString(),
      ),
      studentCount: countByClass.get(schoolClass._id.toString()) || 0,
      attendanceMarked: attendanceByClass.has(schoolClass._id.toString()),
    }));

    return res.json({
      success: true,
      data: {
        teacher,
        today,
        summary: {
          classes: classes.length,
          students: classes.reduce((sum, item) => sum + item.studentCount, 0),
          assignments: assignments.length,
          attendanceMarked: todayAttendance.length,
          attendancePending: Math.max(0, classes.length - todayAttendance.length),
          unreadNotifications,
        },
        classes,
        assignments: assignments.map((assignment) => ({
          _id: assignment._id,
          title: assignment.title,
          description: assignment.description,
          className: assignment.classId
            ? `${assignment.classId.className} - ${assignment.classId.section}`
            : "Class not set",
          subject: assignment.subjectId?.name || "Subject not set",
          createdAt: assignment.createdAt,
        })),
        recentAttendance: recentAttendance.map((attendance) => ({
          _id: attendance._id,
          date: attendance.date,
          className: attendance.classId
            ? `${attendance.classId.className} - ${attendance.classId.section}`
            : "Class",
          subject: attendance.subjectId?.name || "Subject",
          present: attendance.records.filter(
            (record) => record.status === "present",
          ).length,
          absent: attendance.records.filter(
            (record) => record.status === "absent",
          ).length,
        })),
        notifications: notifications.map((notification) => ({
          _id: notification._id,
          title: notification.title,
          message: notification.message,
          createdAt: notification.createdAt,
          read: notification.readBy.some(
            (id) => id.toString() === req.user.id,
          ),
        })),
      },
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
