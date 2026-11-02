const express = require("express");
const router = express.Router();

const {
  createStudent,
  deleteStudent,
  downloadStudentFile,
  getStudent,
  getStudents,
  importStudents,
  updateStudent,
  updateStudentStatus,
} = require("../controllers/studentController");
const studentUpload = require("../middleware/studentUpload");
const { parseStudentData } = require("../middleware/studentUpload");
const validate = require("../middleware/validate");
const { protect, authorize } = require("../middleware/authMiddleware");
const {
  getStudentsValidator,
  studentValidator,
} = require("../validators/studentValidator");
const { body, param, validationResult } = require("express-validator");
const { removeUploadedFiles } = require("../middleware/studentUpload");

const validateStudentRequest = (req, res, next) => {
  const errors = validationResult(req);
  if (errors.isEmpty()) return next();

  removeUploadedFiles(req.files);
  return res.status(400).json({
    success: false,
    errors: errors.array(),
  });
};

router.get(
  "/",
  protect,
  authorize("admin", "teacher"),
  getStudentsValidator,
  validate,
  getStudents,
);
router.post("/import", protect, authorize("admin"), importStudents);
router.get(
  "/:id/files/:fileId",
  protect,
  authorize("admin", "student", "parent"),
  [
    param("id").isMongoId().withMessage("Invalid student ID"),
    param("fileId")
      .custom((value) => value === "photo" || /^[a-f\d]{24}$/i.test(value))
      .withMessage("Invalid file ID"),
  ],
  validate,
  downloadStudentFile,
);
router.get(
  "/:id",
  protect,
  authorize("admin"),
  [param("id").isMongoId().withMessage("Invalid student ID")],
  validate,
  getStudent,
);
router.post(
  "/",
  protect,
  authorize("admin"),
  studentUpload,
  parseStudentData,
  studentValidator,
  validateStudentRequest,
  createStudent,
);
router.put(
  "/:id",
  protect,
  authorize("admin"),
  studentUpload,
  parseStudentData,
  studentValidator,
  validateStudentRequest,
  updateStudent,
);
router.patch(
  "/:id/status",
  protect,
  authorize("admin"),
  [
    param("id").isMongoId().withMessage("Invalid student ID"),
    body("status")
      .isIn(["active", "inactive"])
      .withMessage("Status must be active or inactive"),
  ],
  validate,
  updateStudentStatus,
);
router.delete(
  "/:id",
  protect,
  authorize("admin"),
  [param("id").isMongoId().withMessage("Invalid student ID")],
  validate,
  deleteStudent,
);

module.exports = router;
