const Attendance = require("../models/Attendance");
const Student = require("../models/Student");

// ➕ Save Attendance
exports.markAttendanceold = async (req, res) => {
  try {
    const { classId, subjectId, date, records } = req.body;

    // ✅ get teacher from token
    const teacherId = req.user.id;

    const exists = await Attendance.findOne({ classId, subjectId, date });

    if (exists) {
      return res.status(400).json({
        success: false,
        message: "Attendance already marked",
      });
    }

    const data = await Attendance.create({
      classId,
      subjectId,
      teacherId,
      date,
      records,
    });

    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.markAttendance = async (req, res) => {
  try {
    const { classId, subjectId, date, records } = req.body;

    // 🔍 Check existing attendance
    let attendance = await Attendance.findOne({
      classId,
      subjectId,
      date,
    });

    if (attendance) {
      // 🔁 UPDATE MODE
      attendance.records = records;

      await attendance.save();

      return res.json({
        success: true,
        message: "Attendance updated successfully",
        data: attendance,
      });
    }

    // ➕ CREATE MODE
    attendance = await Attendance.create({
      classId,
      subjectId,
      date,
      records,
      teacherId: req.user.id,
    });

    res.json({
      success: true,
      message: "Attendance saved successfully",
      data: attendance,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// 📄 Get Students by Class
exports.getStudentsByClass = async (req, res) => {
  try {
    const { classId } = req.params;

    const students = await Student.find({ classId }).populate("userId", "name"); // ✅ IMPORTANT

    res.json({
      success: true,
      data: students,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getAttendanceByDate = async (req, res) => {
  try {
    const { classId, date } = req.query;

    const data = await Attendance.find({ classId, date })
      .populate("classId")
      .populate("subjectId")
      .populate("teacherId");

    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.getAttendanceByClassDate = async (req, res) => {
  try {
    const { classId, date } = req.query;

    const attendance = await Attendance.findOne({
      classId,
      date,
    });

    res.json({
      success: true,
      data: attendance || null,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.saveAttendanceold = async (req, res) => {
  try {
    const { classId, date, records } = req.body;

    // records = [{ studentId, status }]

    for (let record of records) {
      // 💾 Save attendance (your existing logic)

      if (record.status === "absent") {
        const student = await Student.findById(record.studentId);

        // 📱 WhatsApp
        await sendWhatsApp(
          student.contactNumber,
          `🚨 Alert: Your ward is absent today (${date}). Please contact school.`,
        );

        // 📧 Email (optional)
        await sendEmail({
          to: student.parentEmail,
          subject: "Attendance Alert",
          html: `
            <h3>Absent Alert</h3>
            <p>Your child is absent on ${date}</p>
          `,
        });
      }
    }

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.saveAttendance = async (req, res) => {
  try {
    const { classId, subjectId, date, records } = req.body;

    if (!classId || !subjectId || !date || !records?.length) {
      return res.status(400).json({
        message: "All fields required",
      });
    }

    // 🔍 CHECK EXISTING
    let attendance = await Attendance.findOne({
      classId,
      subjectId,
      date,
    });

    if (attendance) {
      // ✅ UPDATE EXISTING
      attendance.records = records;
      await attendance.save();

      console.log("✏️ Attendance Updated");
    } else {
      // ✅ CREATE NEW
      attendance = await Attendance.create({
        classId,
        subjectId,
        date,
        records,
      });

      console.log("🆕 Attendance Created");
    }

    // 🔔 SEND ALERT ONLY FOR ABSENT
    for (let record of records) {
      if (record.status === "absent") {
        const student = await Student.findById(record.studentId);

        if (!student) continue;

        // 📱 WhatsApp
        await sendWhatsApp(
          student.contactNumber,
          `🚨 Dear Parent,
Your child is absent on ${date}.
Please contact school if needed.

– School`,
        );
      }
    }

    res.json({
      success: true,
      message: attendance.isNew ? "Created" : "Updated",
      data: attendance,
    });
  } catch (err) {
    console.error(err);

    // ⚠️ DUPLICATE KEY ERROR (safety)
    if (err.code === 11000) {
      return res.status(400).json({
        message: "Attendance already exists for this date",
      });
    }

    res.status(500).json({
      message: err.message,
    });
  }
};

exports.getStudentHistory = async (req, res) => {
  try {
    const { studentId, classId, subjectId, from, to } = req.query;

    let filter = {};

    if (classId) filter.classId = classId;
    if (subjectId) filter.subjectId = subjectId;

    if (from && to) {
      filter.date = {
        $gte: new Date(from),
        $lte: new Date(to),
      };
    }

    const data = await Attendance.find(filter)
      .populate("subjectId", "name")
      .sort({ date: -1 });

    // 🎯 Extract only this student
    const history = data.map((att) => {
      const record = att.records.find(
        (r) => r.studentId.toString() === studentId,
      );

      return {
        date: att.date,
        subject: att.subjectId?.name,
        status: record?.status || "absent",
      };
    });

    res.json({ success: true, data: history });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getStudentSummary = async (req, res) => {
  try {
    const { studentId, classId } = req.query;

    const data = await Attendance.find({ classId });

    let total = 0;
    let present = 0;

    data.forEach((att) => {
      const record = att.records.find(
        (r) => r.studentId.toString() === studentId,
      );

      if (record) {
        total++;
        if (record.status === "present") present++;
      }
    });

    const percentage = total ? ((present / total) * 100).toFixed(2) : 0;

    res.json({
      success: true,
      total,
      present,
      percentage,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
