const express = require("express");
const router = express.Router();

const {
  createClass,
  getClasses,
  updateClass,
  deleteClass,
} = require("../controllers/classController");

const validate = require("../middleware/validate");
const { classValidator } = require("../validators/classValidator");
const { protect, authorize } = require("../middleware/authMiddleware");

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
router.put("/:id", protect, authorize("admin"), updateClass);
router.delete("/:id", protect, authorize("admin"), deleteClass);

module.exports = router;
