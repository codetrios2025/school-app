const mongoose = require("mongoose");
const Attendance = require("../models/Attendance");
const Fee = require("../models/Fee");
const Notification = require("../models/Notification");
const Student = require("../models/Student");
const User = require("../models/User");

const serializeFee = (fee) => {
  const paid = fee.payments.reduce((sum, payment) => sum + payment.amount, 0);
  const balance = Math.max(0, fee.amount - paid);
  let status = balance === 0 ? "paid" : paid > 0 ? "partial" : "pending";
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  if (balance > 0 && new Date(fee.dueDate) < today) status = "overdue";

  return {
    _id: fee._id,
    studentId: fee.studentId,
    title: fee.title,
    academicYear: fee.academicYear,
    amount: fee.amount,
    currency: fee.currency,
    dueDate: fee.dueDate,
    paidAmount: paid,
    balance,
    status,
    payments: fee.payments.map((payment) => ({
      amount: payment.amount,
      method: payment.method,
      reference: payment.reference,
      receivedAt: payment.receivedAt,
    })),
    paymentSubmissions: (fee.paymentSubmissions || []).map((submission) => ({
      _id: submission._id,
      amount: submission.amount,
      method: submission.method,
      reference: submission.reference,
      status: submission.status,
      submittedAt: submission.submittedAt,
      reviewedAt: submission.reviewedAt,
      reviewNote: submission.reviewNote,
    })),
  };
};

exports.getParentDashboard = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("email name role");
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Account not found",
      });
    }

    const students =
      req.user.role === "student"
        ? await Student.find({ userId: req.user.id })
            .populate("userId", "name email")
            .populate("classId", "className section")
        : await Student.find({
            parentEmail: new RegExp(
              `^${user.email.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`,
              "i",
            ),
          })
            .populate("userId", "name email")
            .populate("classId", "className section");

    if (students.length === 0) {
      return res.json({
        success: true,
        data: { students: [], notifications: [], summary: null },
      });
    }

    const studentIds = students.map((student) => student._id);
    const studentUserIds = students
      .map((student) => student.userId?._id)
      .filter(Boolean);
    const classIds = [
      ...new Set(
        students
          .map((student) => student.classId?._id?.toString())
          .filter(Boolean),
      ),
    ];
    const [attendanceRecords, feeRecords, notifications] = await Promise.all([
      Attendance.find({ "records.studentId": { $in: studentIds } })
        .populate("subjectId", "name")
        .sort({ date: -1 })
        .limit(100),
      Fee.find({ studentId: { $in: studentIds } }).sort({ dueDate: 1 }),
      Notification.find({
        $or: [
          { recipients: { $in: [user._id, ...studentUserIds] } },
          ...(classIds.length
            ? [{ type: "class", classId: { $in: classIds } }]
            : []),
        ],
      })
        .sort({ createdAt: -1 })
        .limit(8)
        .populate("sender", "name"),
    ]);

    const childData = students.map((student) => {
      const childAttendance = attendanceRecords
        .map((attendance) => {
          const record = attendance.records.find(
            (item) => item.studentId.toString() === student._id.toString(),
          );
          if (!record) return null;
          return {
            _id: `${attendance._id}-${student._id}`,
            date: attendance.date,
            status: record.status,
            subject: attendance.subjectId?.name || "Class",
          };
        })
        .filter(Boolean);
      const childFees = feeRecords
        .filter(
          (fee) => fee.studentId.toString() === student._id.toString(),
        )
        .map(serializeFee);
      const presentCount = childAttendance.filter(
        (record) => record.status === "present",
      ).length;
      const totalAttendance = childAttendance.length;

      return {
        _id: student._id,
        name: student.userId?.name || "Student",
        email: student.userId?.email || "",
        admissionNo: student.admissionNo || "",
        rollNumber: student.rollNumber,
        status: student.status,
        className: student.classId?.className || "",
        section: student.classId?.section || "",
        attendance: {
          total: totalAttendance,
          present: presentCount,
          percentage: totalAttendance
            ? Math.round((presentCount / totalAttendance) * 100)
            : 0,
          recent: childAttendance.slice(0, 8),
        },
        fees: childFees,
        feeBalance: childFees.reduce((sum, fee) => sum + fee.balance, 0),
        overdueFees: childFees.filter((fee) => fee.status === "overdue").length,
      };
    });

    return res.json({
      success: true,
      data: {
        students: childData,
        notifications: notifications.map((notification) => ({
          _id: notification._id,
          title: notification.title,
          message: notification.message,
          createdAt: notification.createdAt,
          read: notification.readBy.some(
            (id) => id.toString() === user._id.toString(),
          ),
        })),
        summary: {
          children: childData.length,
          outstandingFees: childData.reduce(
            (sum, student) => sum + student.feeBalance,
            0,
          ),
          overdueFees: childData.reduce(
            (sum, student) => sum + student.overdueFees,
            0,
          ),
        },
      },
    });
  } catch (error) {
    if (error instanceof mongoose.Error) {
      return res.status(400).json({
        success: false,
        message: "Unable to load family dashboard data",
      });
    }
    return res.status(500).json({ success: false, message: error.message });
  }
};
