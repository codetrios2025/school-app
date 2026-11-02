const express = require("express");
const router = express.Router();

const {
  createFee,
  getFees,
  importFees,
  recordPayment,
  reviewPaymentSubmission,
  submitPayment,
} = require("../controllers/feeController");
const { protect, authorize } = require("../middleware/authMiddleware");
const validate = require("../middleware/validate");
const {
  createFeeValidator,
  getFeesValidator,
  importFeesValidator,
  recordPaymentValidator,
  reviewPaymentSubmissionValidator,
  submitPaymentValidator,
} = require("../validators/feeValidator");

router.post(
  "/import",
  protect,
  authorize("admin"),
  importFeesValidator,
  validate,
  importFees,
);
router.get(
  "/",
  protect,
  authorize("admin", "student", "parent"),
  getFeesValidator,
  validate,
  getFees,
);
router.post(
  "/",
  protect,
  authorize("admin"),
  createFeeValidator,
  validate,
  createFee,
);
router.post(
  "/:id/payments",
  protect,
  authorize("admin"),
  recordPaymentValidator,
  validate,
  recordPayment,
);
router.post(
  "/:id/submissions",
  protect,
  authorize("student", "parent"),
  submitPaymentValidator,
  validate,
  submitPayment,
);
router.put(
  "/:id/submissions/:submissionId/review",
  protect,
  authorize("admin"),
  reviewPaymentSubmissionValidator,
  validate,
  reviewPaymentSubmission,
);

module.exports = router;
