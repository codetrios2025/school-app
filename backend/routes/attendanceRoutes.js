const express = require("express");
const router = express.Router();

const {
  markAttendance,
  getStudentsByClass,
  getAttendanceByDate,
  getAttendanceByClassDate,
  getStudentHistory,
  getStudentSummary,
  getMyAttendance,
} = require("../controllers/attendanceController");

const { protect, authorize } = require("../middleware/authMiddleware");

// ➕ Mark Attendance (Teacher/Admin)
router.post("/", protect, authorize("teacher", "admin"), markAttendance);

// 📄 Get Students by Class
router.get("/students/:classId", protect, getStudentsByClass);

// 📄 Get Attendance (optional - for reports)
router.get("/", protect, getAttendanceByDate);
router.get("/by-date", protect, getAttendanceByClassDate);
router.get("/my", protect, getMyAttendance);

router.get("/student-history", protect, getStudentHistory);
router.get("/student-summary", protect, getStudentSummary);

module.exports = router;
