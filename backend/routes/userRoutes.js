const express = require("express");
const router = express.Router();

const {
  createTeacher,
  getTeachers,
  deleteTeacher,
} = require("../controllers/authController");
const validate = require("../middleware/validate");
const { protect, authorize } = require("../middleware/authMiddleware");

router.post("/teachers", protect, authorize("admin"), createTeacher);
router.get("/teachers", protect, authorize("admin"), getTeachers);
router.delete("/teachers/:id", protect, authorize("admin"), deleteTeacher);

module.exports = router;
