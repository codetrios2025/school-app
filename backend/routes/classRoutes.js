const express = require("express");
const router = express.Router();

const {
  createClass,
  getClasses,
  updateClass,
  deleteClass,
  updateClassTeacher,
} = require("../controllers/classController");

const validate = require("../middleware/validate");
const { classValidator } = require("../validators/classValidator");
const { protect, authorize } = require("../middleware/authMiddleware");
const { param, body } = require("express-validator");

// Admin only
router.post(
  "/",
  protect,
  authorize("admin"),
  classValidator,
  validate,
  createClass,
);
router.get("/", protect, getClasses);
router.patch(
  "/:id/class-teacher",
  protect,
  authorize("admin"),
  [
    param("id").isMongoId().withMessage("Invalid class ID"),
    body("teacherId")
      .optional({ nullable: true, checkFalsy: true })
      .isMongoId()
      .withMessage("Invalid teacher ID"),
  ],
  validate,
  updateClassTeacher,
);
router.put("/:id", protect, authorize("admin"), updateClass);
router.delete("/:id", protect, authorize("admin"), deleteClass);

module.exports = router;
