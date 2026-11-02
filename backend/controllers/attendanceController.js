const mongoose = require("mongoose");
const Attendance = require("../models/Attendance");
const AttendanceSettings = require("../models/AttendanceSettings");
const Student = require("../models/Student");
const Class = require("../models/Class");
const Subject = require("../models/Subject");
const User = require("../models/User");
const TeacherAssignment = require("../models/TeacherAssignment");
const { sendEmail } = require("../utils/sendEmail");
const { sendWhatsApp } = require("../utils/sendWhatsApp");

const isValidId = (id) => mongoose.Types.ObjectId.isValid(id);
const isValidDate = (date) => /^\d{4}-\d{2}-\d{2}$/.test(date);
const isValidCalendarDate = (date) => {
  if (!isValidDate(date)) return false;
  const parsed = new Date(`${date}T00:00:00.000Z`);
  return !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === date;
};

const getStudentsForUser = async (user) => {
  if (user.role === "student") {
    return Student.find({ userId: user.id });
  }
  if (user.role === "parent") {
    const account = await User.findById(user.id).select("email");
    if (!account?.email) return [];
    return Student.find({
      parentEmail: account.email,
    });
  }
  return [];
};

const ensureTeacherAssignment = async (user, classId, subjectId) => {
  if (user.role !== "teacher") return true;
  const [subjectAssignment, classTeacherAssignment] = await Promise.all([
    TeacherAssignment.exists({
      teacherId: user.id,
      classId,
      subjectId,
    }),
    Class.exists({ _id: classId, classTeacherId: user.id }),
  ]);
  return Boolean(subjectAssignment || classTeacherAssignment);
};

const canAccessTeacherClass = async (user, classId) => {
  if (user.role !== "teacher") return true;
  const [subjectAssignment, classTeacherAssignment] = await Promise.all([
    TeacherAssignment.exists({ teacherId: user.id, classId }),
    Class.exists({ _id: classId, classTeacherId: user.id }),
  ]);
  return Boolean(subjectAssignment || classTeacherAssignment);
};

const escapeHtml = (value) =>
  String(value).replace(/[&<>"']/g, (character) => {
    const entities = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;",
    };
    return entities[character];
  });

const sendAbsenceNotifications = async (students, newlyAbsent, date) => {
  if (!newlyAbsent.length) {
    return { emailSent: 0, mobileSent: 0, failed: 0, attempted: 0 };
  }

  const settings = await AttendanceSettings.findOne({ key: "attendance" }).lean();
  const studentById = new Map(
    students.map((student) => [student._id.toString(), student]),
  );
  let unavailable = 0;
  const tasks = newlyAbsent.flatMap((studentId) => {
      const student = studentById.get(studentId);
      if (!student) return [];
      const name = student.userId?.name || "your child";
      const actions = [];
      if (student.parentEmail) {
        actions.push({
          channel: "email",
          promise: sendEmail({
            to: student.parentEmail,
            subject: "Student absence notification",
            html: `<p>Dear Parent/Guardian,</p><p>${escapeHtml(name)} was marked absent on ${escapeHtml(date)}.</p><p>Please contact the school if you have any questions.</p>`,
          }),
        });
      } else {
        unavailable += 1;
      }
      if (settings?.mobileNotificationsEnabled) {
        const phone =
          student.guardianContactNumber ||
          student.fatherContactNumber ||
          student.motherContactNumber ||
          student.contactNumber;
        if (phone) {
          actions.push({
            channel: "mobile",
            promise: sendWhatsApp(
              phone,
              `${name} was marked absent on ${date}. Please contact the school if you have any questions.`,
              { throwOnError: true },
            ),
          });
        } else {
          unavailable += 1;
        }
      }
      return actions;
    });
  const outcomes = await Promise.allSettled(tasks.map((task) => task.promise));
  const failed = outcomes.filter((result) => result.status === "rejected");
  failed.forEach((result) =>
    console.error(
      "Unable to send attendance notification:",
      result.reason?.message || result.reason,
    ),
  );
  if (unavailable) {
    console.error(
      `${unavailable} attendance notification channel(s) have no configured recipient`,
    );
  }
  const failedCount = failed.length + unavailable;
  return {
    emailSent: outcomes.filter(
      (result, index) =>
        result.status === "fulfilled" && tasks[index].channel === "email",
    ).length,
    mobileSent: outcomes.filter(
      (result, index) =>
        result.status === "fulfilled" && tasks[index].channel === "mobile",
    ).length,
    failed: failedCount,
    attempted: outcomes.length,
  };
};

exports.getAttendanceClasses = async (req, res) => {
  try {
    const subjects = await Subject.find().select("name").sort({ name: 1 }).lean();
    let classes;

    if (req.user.role === "admin") {
      classes = await Class.find()
        .select("className section")
        .sort({ className: 1, section: 1 })
        .lean();
      classes = classes.map((schoolClass) => ({
        ...schoolClass,
        isClassTeacher: false,
        subjects,
      }));
    } else {
      const [assignments, classTeacherClasses] = await Promise.all([
        TeacherAssignment.find({ teacherId: req.user.id })
          .populate("classId", "className section")
          .populate("subjectId", "name")
          .sort({ createdAt: -1 })
          .lean(),
        Class.find({ classTeacherId: req.user.id })
          .select("className section")
          .lean(),
      ]);
      const classMap = new Map();
      assignments.forEach((assignment) => {
        if (!assignment.classId) return;
        const id = assignment.classId._id.toString();
        if (!classMap.has(id)) {
          classMap.set(id, {
            ...assignment.classId,
            isClassTeacher: false,
            subjects: [],
          });
        }
        const schoolClass = classMap.get(id);
        if (
          assignment.subjectId &&
          !schoolClass.subjects.some(
            (subject) =>
              subject._id.toString() === assignment.subjectId._id.toString(),
          )
        ) {
          schoolClass.subjects.push(assignment.subjectId);
        }
      });
      classTeacherClasses.forEach((schoolClass) => {
        const id = schoolClass._id.toString();
        const assignedClass = classMap.get(id);
        classMap.set(id, {
          ...(assignedClass || schoolClass),
          isClassTeacher: true,
          subjects,
        });
      });
      classes = [...classMap.values()].sort(
        (left, right) =>
          left.className.localeCompare(right.className) ||
          left.section.localeCompare(right.section),
      );
    }

    return res.json({ success: true, data: classes });
  } catch (error) {
    console.error("Unable to load attendance classes:", error.message);
    return res.status(500).json({
      success: false,
      message: "Unable to load attendance classes",
    });
  }
};

exports.markAttendance = async (req, res) => {
  try {
    const { classId, subjectId, date, records } = req.body;
    if (
      !isValidId(classId) ||
      !isValidId(subjectId) ||
      !isValidDate(date) ||
      !Array.isArray(records) ||
      records.length === 0
    ) {
      return res.status(400).json({
        success: false,
        message: "Select a class, subject, date, and at least one student",
      });
    }

    const parsedDate = new Date(`${date}T00:00:00.000Z`);
    if (
      Number.isNaN(parsedDate.getTime()) ||
      parsedDate.toISOString().slice(0, 10) !== date
    ) {
      return res.status(400).json({
        success: false,
        message: "Enter a valid attendance date",
      });
    }
    const [schoolClass, subject, permitted] = await Promise.all([
      Class.findById(classId),
      Subject.findById(subjectId),
      ensureTeacherAssignment(req.user, classId, subjectId),
    ]);
    if (!schoolClass) {
      return res.status(404).json({ success: false, message: "Class not found" });
    }
    if (!subject) {
      return res.status(404).json({ success: false, message: "Subject not found" });
    }
    if (!permitted) {
      return res.status(403).json({
        success: false,
        message: "You are not assigned to this class and subject",
      });
    }

    const studentIds = records.map((record) => String(record.studentId || ""));
    if (
      studentIds.some((id) => !isValidId(id)) ||
      new Set(studentIds).size !== studentIds.length ||
      records.some(
        (record) => !["present", "absent"].includes(record.status),
      )
    ) {
      return res.status(400).json({
        success: false,
        message: "Attendance records contain invalid or duplicate students",
      });
    }

    const activeStudentFilter = {
      classId,
      $or: [{ status: "active" }, { status: { $exists: false } }],
    };
    const [students, activeClassStudentCount] = await Promise.all([
      Student.find({
        _id: { $in: studentIds },
        ...activeStudentFilter,
      }).populate("userId", "name"),
      Student.countDocuments(activeStudentFilter),
    ]);
    if (
      students.length !== studentIds.length ||
      students.length !== activeClassStudentCount
    ) {
      return res.status(400).json({
        success: false,
        message: "Attendance must include every active student in the selected class",
      });
    }

    const existing = await Attendance.findOne({ classId, subjectId, date });
    const oldStatuses = new Map(
      (existing?.records || []).map((record) => [
        record.studentId.toString(),
        record.status,
      ]),
    );
    const newlyAbsent = records
      .filter(
        (record) =>
          record.status === "absent" &&
          oldStatuses.get(String(record.studentId)) !== "absent",
      )
      .map((record) => String(record.studentId));

    const attendance = await Attendance.findOneAndUpdate(
      { classId, subjectId, date },
      {
        $set: {
          classId,
          subjectId,
          date,
          teacherId: req.user.id,
          records,
        },
      },
      { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true },
    );

    let notifications;
    try {
      notifications = await sendAbsenceNotifications(
        students,
        newlyAbsent,
        date,
      );
    } catch (error) {
      console.error("Unable to process absence notifications:", error.message);
      notifications = {
        emailSent: 0,
        mobileSent: 0,
        failed: newlyAbsent.length,
        attempted: 0,
      };
    }
    return res.status(existing ? 200 : 201).json({
      success: true,
      message: notifications.failed
        ? "Attendance saved, but one or more absence notifications could not be sent"
        : "Attendance saved successfully",
      notifications,
      data: attendance,
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "Attendance for this class, subject, and date was saved concurrently",
      });
    }
    console.error("Unable to save attendance:", error.message);
    return res.status(500).json({
      success: false,
      message: "Unable to save attendance",
    });
  }
};

exports.getStudentsByClass = async (req, res) => {
  try {
    const { classId } = req.params;
    if (!isValidId(classId)) {
      return res.status(400).json({ success: false, message: "Invalid class ID" });
    }
    if (!(await canAccessTeacherClass(req.user, classId))) {
      return res.status(403).json({ success: false, message: "Forbidden" });
    }
    const students = await Student.find({
      classId,
      $or: [{ status: "active" }, { status: { $exists: false } }],
    })
      .populate("userId", "name")
      .sort({ rollNumber: 1 });
    return res.json({ success: true, data: students });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

exports.getAttendanceByDate = async (req, res) => {
  try {
    const { classId, date } = req.query;
    if (!isValidId(classId) || !isValidDate(date)) {
      return res.status(400).json({
        success: false,
        message: "A valid class and date are required",
      });
    }
    if (!(await canAccessTeacherClass(req.user, classId))) {
      return res.status(403).json({ success: false, message: "Forbidden" });
    }
    const data = await Attendance.find({ classId, date })
      .populate("classId", "className section")
      .populate("subjectId", "name")
      .populate("teacherId", "name");
    return res.json({ success: true, data });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

exports.getAttendanceByClassDate = async (req, res) => {
  try {
    const { classId, date, subjectId } = req.query;
    if (!isValidId(classId) || !isValidId(subjectId) || !isValidDate(date)) {
      return res.status(400).json({
        success: false,
        message: "A valid class, subject, and date are required",
      });
    }
    if (!(await ensureTeacherAssignment(req.user, classId, subjectId))) {
      return res.status(403).json({ success: false, message: "Forbidden" });
    }
    const data = await Attendance.findOne({ classId, subjectId, date });
    return res.json({ success: true, data });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

exports.getMyAttendance = async (req, res) => {
  try {
    const students = await getStudentsForUser(req.user);
    if (!students.length) return res.json({ success: true, data: [], summary: null });
    const studentIds = students.map((student) => student._id);
    const filter = { "records.studentId": { $in: studentIds } };
    const month = req.query.month ? Number(req.query.month) : null;
    const year = req.query.year ? Number(req.query.year) : null;
    if (req.query.month || req.query.year) {
      if (
        (req.query.month && (!Number.isInteger(month) || month < 1 || month > 12)) ||
        (req.query.year && (!Number.isInteger(year) || year < 2000 || year > 9999))
      ) {
        return res.status(400).json({
          success: false,
          message: "Enter a valid month and year",
        });
      }
      const selectedYear = year || new Date().getFullYear();
      const selectedMonth = month || 1;
      const from = `${selectedYear}-${String(selectedMonth).padStart(2, "0")}-01`;
      const endMonth = month ? selectedMonth : 12;
      const to = `${selectedYear}-${String(endMonth).padStart(2, "0")}-${String(new Date(selectedYear, endMonth, 0).getDate()).padStart(2, "0")}`;
      filter.date = { $gte: from, $lte: to };
    }

    const [attendances, populatedStudents] = await Promise.all([
      Attendance.find(filter)
        .populate("subjectId", "name")
        .populate("classId", "className section")
        .sort({ date: -1 }),
      Student.find({ _id: { $in: studentIds } }).populate("userId", "name"),
    ]);
    const studentById = new Map(
      populatedStudents.map((student) => [student._id.toString(), student]),
    );
    const data = attendances.flatMap((attendance) =>
      attendance.records
        .filter((record) => studentById.has(record.studentId.toString()))
        .map((record) => ({
          _id: `${attendance._id}-${record.studentId}`,
          attendanceId: attendance._id,
          studentId: record.studentId,
          studentName:
            studentById.get(record.studentId.toString()).userId?.name || "",
          date: attendance.date,
          class: attendance.classId,
          subject: attendance.subjectId?.name || "",
          status: record.status,
        })),
    );
    const present = data.filter((record) => record.status === "present").length;
    return res.json({
      success: true,
      data,
      summary: {
        total: data.length,
        present,
        absent: data.length - present,
        percentage: data.length
          ? Number(((present / data.length) * 100).toFixed(2))
          : 0,
      },
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

exports.getClassReport = async (req, res) => {
  try {
    const { classId, fromDate, toDate, subjectId, status } = req.query;
    let startDate;
    let endDate;
    if (!isValidId(classId)) {
      return res.status(400).json({
        success: false,
        message: "A valid class is required",
      });
    }
    if (Boolean(fromDate) !== Boolean(toDate)) {
      return res.status(400).json({
        success: false,
        message: "Select both a start date and an end date",
      });
    }
    if (fromDate && toDate) {
      if (
        !isValidCalendarDate(fromDate) ||
        !isValidCalendarDate(toDate) ||
        fromDate > toDate
      ) {
        return res.status(400).json({
          success: false,
          message: "Enter a valid date range",
        });
      }
      startDate = fromDate;
      endDate = toDate;
    } else {
      const month = Number(req.query.month);
      const year = Number(req.query.year);
      if (
        !Number.isInteger(month) ||
        month < 1 ||
        month > 12 ||
        !Number.isInteger(year) ||
        year < 2000 ||
        year > 9999
      ) {
        return res.status(400).json({
          success: false,
          message: "A valid month and year or date range are required",
        });
      }
      startDate = `${year}-${String(month).padStart(2, "0")}-01`;
      endDate = `${year}-${String(month).padStart(2, "0")}-${String(new Date(year, month, 0).getDate()).padStart(2, "0")}`;
    }
    if (subjectId && !isValidId(subjectId)) {
      return res.status(400).json({
        success: false,
        message: "Select a valid subject",
      });
    }
    if (status && !["present", "absent"].includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Select a valid attendance status",
      });
    }

    if (!(await canAccessTeacherClass(req.user, classId))) {
      return res.status(403).json({ success: false, message: "Forbidden" });
    }
    const attendanceFilter = {
      classId,
      date: { $gte: startDate, $lte: endDate },
    };
    if (subjectId) attendanceFilter.subjectId = subjectId;
    const [attendanceRecords, roster] = await Promise.all([
      Attendance.find(attendanceFilter)
      .populate("subjectId", "name")
      .populate("records.studentId", "rollNumber userId")
      .sort({ date: 1, subjectId: 1 }),
      Student.find({ classId })
      .populate("userId", "name")
      .sort({ rollNumber: 1 })
      .lean(),
    ]);

    const studentSummary = new Map(
      roster.map((student) => [
        student._id.toString(),
        {
          studentId: student._id,
          studentName: student.userId?.name || "Student",
          rollNumber: student.rollNumber || "",
          total: 0,
          present: 0,
          absent: 0,
          percentage: 0,
        },
      ]),
    );
    attendanceRecords.forEach((attendance) => {
      attendance.records.forEach((record) => {
        const student = record.studentId;
        const studentId = student?._id?.toString();
        if (!studentId) return;
        if (!studentSummary.has(studentId)) {
          studentSummary.set(studentId, {
            studentId: student._id,
            studentName: student.userId?.name || "Student",
            rollNumber: student.rollNumber || "",
            total: 0,
            present: 0,
            absent: 0,
            percentage: 0,
          });
        }
        const totals = studentSummary.get(studentId);
        totals.total += 1;
        totals[record.status] += 1;
      });
    });

    const report = attendanceRecords
      .map((attendance) => ({
        ...attendance.toObject(),
        records: attendance.records
          .filter((record) => !status || record.status === status)
          .map((record) => ({
            ...record.toObject(),
            studentName: record.studentId?.userId?.name || "Student",
          })),
      }))
      .filter((attendance) => attendance.records.length > 0);

    const totals = {
      sessions: attendanceRecords.filter((attendance) => attendance.records.length)
        .length,
      total: 0,
      present: 0,
      absent: 0,
    };
    studentSummary.forEach((student) => {
      if (!student.total) return;
      student.percentage = Number(
        ((student.present / student.total) * 100).toFixed(2),
      );
      totals.total += student.total;
      totals.present += student.present;
      totals.absent += student.absent;
    });
    totals.percentage = totals.total
      ? Number(((totals.present / totals.total) * 100).toFixed(2))
      : 0;

    return res.json({
      success: true,
      data: report,
      summary: totals,
      students: [...studentSummary.values()].sort(
        (left, right) =>
          left.rollNumber.localeCompare(right.rollNumber, undefined, {
            numeric: true,
          }) || left.studentName.localeCompare(right.studentName),
      ),
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

exports.getNotificationSettings = async (_req, res) => {
  try {
    const settings = await AttendanceSettings.findOne({ key: "attendance" }).lean();
    return res.json({
      success: true,
      data: { mobileNotificationsEnabled: settings?.mobileNotificationsEnabled || false },
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

exports.updateNotificationSettings = async (req, res) => {
  try {
    if (typeof req.body.mobileNotificationsEnabled !== "boolean") {
      return res.status(400).json({
        success: false,
        message: "mobileNotificationsEnabled must be true or false",
      });
    }
    const settings = await AttendanceSettings.findOneAndUpdate(
      { key: "attendance" },
      { $set: { mobileNotificationsEnabled: req.body.mobileNotificationsEnabled } },
      { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true },
    );
    return res.json({ success: true, data: settings });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
