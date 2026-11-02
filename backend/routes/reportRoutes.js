const express = require("express");
const router = express.Router();

const {
  getStudentReport,
} = require("../controllers/reportController");
const { getClassReport } = require("../controllers/attendanceController");

const { protect, authorize } = require("../middleware/authMiddleware");

router.get("/class", protect, authorize("admin", "teacher"), getClassReport);
router.get("/student", protect, getStudentReport);

module.exports = router;
