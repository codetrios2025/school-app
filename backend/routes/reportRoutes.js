const express = require("express");
const router = express.Router();

const {
  getClassReport,
  getStudentReport,
} = require("../controllers/reportController");

const { protect, authorize } = require("../middleware/authMiddleware");

router.get("/class", protect, authorize("admin"), getClassReport);
router.get("/student", protect, getStudentReport);

module.exports = router;
