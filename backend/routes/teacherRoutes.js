const express = require("express");
const router = express.Router();

const {
  createTeacher,
  getTeachers,
  deleteTeacher,
  updateTeacher,
} = require("../controllers/teacherController");

const { protect, authorize } = require("../middleware/authMiddleware");
const validate = require("../middleware/validate");
const { teacherValidator } = require("../validators/teacherValidator");

// 🔐 Only Admin Access
router.post(
  "/",
  protect,
  authorize("admin"),
  teacherValidator,
  validate,
  createTeacher,
);
router.get("/", protect, authorize("admin"), getTeachers);
router.put("/:id", protect, authorize("admin"), updateTeacher);
router.delete("/:id", protect, authorize("admin"), deleteTeacher);

module.exports = router;
