const { body } = require("express-validator");

exports.classValidator = [
  body("className").notEmpty().withMessage("Class name required"),
  body("section").notEmpty().withMessage("Section required"),
];
