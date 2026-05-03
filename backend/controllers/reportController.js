const Attendance = require("../models/Attendance");

// 📊 Class Report (date range)
exports.getClassReport = async (req, res) => {
  try {
    const { classId, fromDate, toDate } = req.query;

    const data = await Attendance.find({
      classId,
      date: { $gte: fromDate, $lte: toDate },
    }).populate("records.studentId", "name");

    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// 📊 Student Monthly Report
exports.getStudentReport = async (req, res) => {
  try {
    const { studentId, month } = req.query;

    const start = `${month}-01`;
    const end = `${month}-31`;

    const records = await Attendance.find({
      date: { $gte: start, $lte: end },
      "records.studentId": studentId,
    });

    let present = 0;
    let total = 0;

    records.forEach((att) => {
      att.records.forEach((r) => {
        if (r.studentId.toString() === studentId) {
          total++;
          if (r.status === "present") present++;
        }
      });
    });

    const percentage = total ? ((present / total) * 100).toFixed(2) : 0;

    res.json({
      success: true,
      present,
      total,
      percentage,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
