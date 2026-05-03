const { body } = require("express-validator");

exports.registerValidator = [
  body("name").notEmpty().withMessage("Name required"),
  body("email").isEmail().withMessage("Valid email required"),
  body("password")
    .isLength({ min: 6 })
    .withMessage("Password must be 6+ chars"),
  body("role").isIn(["admin", "teacher", "student", "parent"]),
];

exports.loginValidator = [
  body("email").isEmail().withMessage("Valid email required"),
  body("password")
    .isLength({ min: 6 })
    .withMessage("Password must be 6+ chars"),
];

exports.forgotPasswordValidator = [
  body("email").isEmail().withMessage("Valid email required"),
];

exports.resetPasswordValidator = [
  body("password")
    .isLength({ min: 6 })
    .withMessage("Password must be 6+ chars"),
];

exports.updatePasswordValidator = [
  body("password")
    .isLength({ min: 6 })
    .withMessage("Password must be 6+ chars"),
];
