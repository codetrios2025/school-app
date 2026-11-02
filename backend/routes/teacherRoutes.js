const express = require("express");
const router = express.Router();

const {
  createTeacher,
  deleteTeacher,
  getTeacher,
  getTeachers,
  getTeacherPhoto,
  importTeachers,
  sendTeacherCredentials,
  updateTeacher,
  updateTeacherStatus,
} = require("../controllers/teacherController");
const teacherUpload = require("../middleware/teacherUpload");
const { protect, authorize } = require("../middleware/authMiddleware");
const validate = require("../middleware/validate");
const {
  teacherIdValidator,
  teacherListValidator,
  teacherStatusValidator,
  teacherValidator,
} = require("../validators/teacherValidator");
const { validationResult } = require("express-validator");
const { removeUploadedFile } = require("../middleware/teacherUpload");

const validateTeacherRequest = (req, res, next) => {
  const errors = validationResult(req);
  if (errors.isEmpty()) return next();
  removeUploadedFile(req.file);
  return res.status(400).json({
    success: false,
    errors: errors.array(),
  });
};

router.get(
  "/",
  protect,
  authorize("admin"),
  teacherListValidator,
  validate,
  getTeachers,
);
router.post("/import", protect, authorize("admin"), importTeachers);
router.get(
  "/:id",
  protect,
  authorize("admin"),
  teacherIdValidator,
  validate,
  getTeacher,
);
router.post(
  "/",
  protect,
  authorize("admin"),
  teacherUpload,
  teacherValidator,
  validateTeacherRequest,
  createTeacher,
);
router.post(
  "/:id/send-credentials",
  protect,
  authorize("admin"),
  teacherIdValidator,
  validate,
  sendTeacherCredentials,
);
router.patch(
  "/:id/status",
  protect,
  authorize("admin"),
  teacherStatusValidator,
  validate,
  updateTeacherStatus,
);
router.get(
  "/:id/photo",
  protect,
  authorize("admin", "teacher"),
  teacherIdValidator,
  validate,
  getTeacherPhoto,
);
router.put(
  "/:id",
  protect,
  authorize("admin"),
  teacherUpload,
  teacherIdValidator,
  teacherValidator,
  validateTeacherRequest,
  updateTeacher,
);
router.delete(
  "/:id",
  protect,
  authorize("admin"),
  teacherIdValidator,
  validate,
  deleteTeacher,
);

module.exports = router;
