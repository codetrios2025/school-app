const express = require("express");
const router = express.Router();

const {
  createAssignment,
  getAssignments,
  deleteAssignment,
  updateAssignment,
} = require("../controllers/teacherAssignmentController");

const { protect, authorize } = require("../middleware/authMiddleware");
const validate = require("../middleware/validate");
const {
  createTeacherAssignmentValidator,
  teacherAssignmentListValidator,
  teacherAssignmentIdValidator,
  updateTeacherAssignmentValidator,
} = require("../validators/teacherAssignmentValidator");

router.post(
  "/",
  protect,
  authorize("admin"),
  createTeacherAssignmentValidator,
  validate,
  createAssignment,
);
router.get(
  "/",
  protect,
  authorize("admin", "teacher"),
  teacherAssignmentListValidator,
  validate,
  getAssignments,
);
router.put(
  "/:id",
  protect,
  authorize("admin"),
  updateTeacherAssignmentValidator,
  validate,
  updateAssignment,
);
router.delete(
  "/:id",
  protect,
  authorize("admin"),
  teacherAssignmentIdValidator,
  validate,
  deleteAssignment,
);

module.exports = router;
