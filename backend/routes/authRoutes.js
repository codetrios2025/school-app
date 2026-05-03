const express = require("express");
const router = express.Router();

const {
  register,
  login,
  createTeacher,
  getTeachers,
  deleteTeacher,
  changePassword,
  forgotPassword,
  resetPassword,
} = require("../controllers/authController");
const validate = require("../middleware/validate");
const { registerValidator } = require("../validators/authValidator");
const { protect, authorize } = require("../middleware/authMiddleware");

router.post("/register", registerValidator, validate, register);
router.post("/login", login);
router.post("/change-password", protect, changePassword);
router.post("/teachers", protect, authorize("admin"), createTeacher);
router.get("/teachers", protect, authorize("admin"), getTeachers);
router.delete("/teachers/:id", protect, authorize("admin"), deleteTeacher);

router.post("/forgot-password", forgotPassword);
router.post("/reset-password/:token", resetPassword);

module.exports = router;
