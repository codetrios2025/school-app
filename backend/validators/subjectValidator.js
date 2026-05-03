const { body } = require("express-validator");

exports.subjectValidator = [
  body("name")
    .trim()
    .notEmpty()
    .withMessage("Subject name is required")
    .isLength({ max: 100 })
    .withMessage("Max 100 chars"),
];
