const express = require("express");
const router = express.Router();

const {
  markAttendance,
  getAttendanceClasses,
  getStudentsByClass,
  getAttendanceByDate,
  getAttendanceByClassDate,
  getMyAttendance,
  getClassReport,
  getNotificationSettings,
  updateNotificationSettings,
} = require("../controllers/attendanceController");

const { protect, authorize } = require("../middleware/authMiddleware");

// ➕ Mark Attendance (Teacher/Admin)
router.post("/", protect, authorize("teacher", "admin"), markAttendance);

router.get(
  "/settings/notifications",
  protect,
  authorize("admin"),
  getNotificationSettings,
);
router.put(
  "/settings/notifications",
  protect,
  authorize("admin"),
  updateNotificationSettings,
);
router.get(
  "/classes",
  protect,
  authorize("admin", "teacher"),
  getAttendanceClasses,
);
router.get("/students/:classId", protect, authorize("admin", "teacher"), getStudentsByClass);
router.get("/my", protect, authorize("student", "parent"), getMyAttendance);
router.get(
  "/report",
  protect,
  authorize("admin", "teacher"),
  getClassReport,
);
router.get(
  "/by-date",
  protect,
  authorize("admin", "teacher"),
  getAttendanceByClassDate,
);
router.get("/", protect, authorize("admin", "teacher"), getAttendanceByDate);

module.exports = router;
