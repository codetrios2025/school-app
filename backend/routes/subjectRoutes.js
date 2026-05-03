const express = require("express");
const router = express.Router();

const {
  createSubject,
  getSubjects,
  updateSubject,
  deleteSubject,
} = require("../controllers/subjectController");

const validate = require("../middleware/validate");
const { subjectValidator } = require("../validators/subjectValidator");
const { protect, authorize } = require("../middleware/authMiddleware");

// Admin only for mutations
router.post(
  "/",
  protect,
  authorize("admin"),
  subjectValidator,
  validate,
  createSubject,
);
router.get("/", protect, getSubjects);
router.put(
  "/:id",
  protect,
  authorize("admin"),
  subjectValidator,
  validate,
  updateSubject,
);
router.delete("/:id", protect, authorize("admin"), deleteSubject);

module.exports = router;
