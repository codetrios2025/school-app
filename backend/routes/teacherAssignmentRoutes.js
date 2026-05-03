const express = require("express");
const router = express.Router();

const {
  createAssignment,
  getAssignments,
  deleteAssignment,
} = require("../controllers/teacherAssignmentController");

const { protect, authorize } = require("../middleware/authMiddleware");

router.post("/", protect, authorize("admin"), createAssignment);
router.get("/", protect, getAssignments);
router.delete("/:id", protect, authorize("admin"), deleteAssignment);

module.exports = router;
