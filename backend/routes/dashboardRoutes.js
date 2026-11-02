const express = require("express");
const {
  getAdminDashboard,
  getTeacherDashboard,
} = require("../controllers/dashboardController");
const { protect, authorize } = require("../middleware/authMiddleware");

const router = express.Router();

router.get("/teacher", protect, authorize("teacher"), getTeacherDashboard);
router.get("/admin", protect, authorize("admin"), getAdminDashboard);

module.exports = router;
