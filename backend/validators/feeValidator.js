const { body, param, query } = require("express-validator");

const amountValidation = (field) =>
  body(field)
    .isFloat({ gt: 0 })
    .withMessage("Amount must be greater than zero")
    .bail()
    .custom((value) => /^\d+(\.\d{1,2})?$/.test(String(value)))
    .withMessage("Amount can have at most two decimal places");

exports.createFeeValidator = [
  body("studentId").isMongoId().withMessage("Select a valid student"),
  body("title")
    .trim()
    .notEmpty()
    .withMessage("Fee title is required")
    .isLength({ max: 100 })
    .withMessage("Fee title cannot exceed 100 characters"),
  body("academicYear")
    .trim()
    .notEmpty()
    .withMessage("Academic year is required")
    .isLength({ max: 20 })
    .withMessage("Academic year cannot exceed 20 characters"),
  amountValidation("amount"),
  body("dueDate")
    .isISO8601({ strict: true })
    .withMessage("Enter a valid due date")
    .toDate(),
  body("description")
    .optional({ values: "falsy" })
    .isLength({ max: 1000 })
    .withMessage("Description cannot exceed 1000 characters"),
];

exports.recordPaymentValidator = [
  param("id").isMongoId().withMessage("Invalid fee record"),
  amountValidation("amount"),
  body("method")
    .isIn(["cash", "bank_transfer", "card", "online", "cheque", "other"])
    .withMessage("Select a valid payment method"),
  body("reference")
    .optional({ values: "falsy" })
    .trim()
    .isLength({ max: 100 })
    .withMessage("Reference cannot exceed 100 characters"),
];

exports.getFeesValidator = [
  query("page").optional().isInt({ min: 1 }).withMessage("Invalid page"),
  query("limit")
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage("Limit must be between 1 and 100"),
  query("studentId")
    .optional()
    .isMongoId()
    .withMessage("Invalid student"),
  query("classId")
    .optional()
    .isMongoId()
    .withMessage("Invalid class"),
  query("academicYear")
    .optional()
    .isLength({ max: 20 })
    .withMessage("Academic year cannot exceed 20 characters"),
  query("status")
    .optional()
    .isIn(["pending", "partial", "overdue", "paid"])
    .withMessage("Invalid fee status"),
  query("reviewStatus")
    .optional()
    .isIn(["pending", "approved", "rejected"])
    .withMessage("Invalid payment review status"),
];

exports.importFeesValidator = [
  body("classId")
    .optional({ values: "falsy" })
    .isMongoId()
    .withMessage("Select a valid class"),
  body("rows")
    .isArray({ min: 1, max: 500 })
    .withMessage("Import between 1 and 500 fee rows at a time"),
];

exports.submitPaymentValidator = [
  param("id").isMongoId().withMessage("Invalid fee record"),
  amountValidation("amount"),
  body("method")
    .isIn(["cash", "bank_transfer", "card", "online", "cheque", "other"])
    .withMessage("Select a valid payment method"),
  body("reference")
    .optional({ values: "falsy" })
    .trim()
    .isLength({ max: 100 })
    .withMessage("Reference cannot exceed 100 characters"),
];

exports.reviewPaymentSubmissionValidator = [
  param("id").isMongoId().withMessage("Invalid fee record"),
  param("submissionId").isMongoId().withMessage("Invalid payment submission"),
  body("status")
    .isIn(["approved", "rejected"])
    .withMessage("Status must be approved or rejected"),
  body("reviewNote")
    .optional({ values: "falsy" })
    .trim()
    .isLength({ max: 500 })
    .withMessage("Review note cannot exceed 500 characters"),
];
