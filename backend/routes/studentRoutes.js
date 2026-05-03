const express = require("express");
const router = express.Router();

const {
  createStudent,
  getStudents,
  updateStudent,
  deleteStudent,
} = require("../controllers/studentController");

const { studentValidator } = require("../validators/studentValidator");
const validate = require("../middleware/validate");
const { protect, authorize } = require("../middleware/authMiddleware");

router.post(
  "/",
  protect,
  authorize("admin"),
  studentValidator,
  validate,
  createStudent,
);
router.get("/", protect, getStudents);
router.put("/:id", protect, authorize("admin"), updateStudent);
router.delete("/:id", protect, authorize("admin"), deleteStudent);

module.exports = router;
