const { body } = require("express-validator");

exports.studentValidator = [
  body("name").notEmpty().withMessage("Name required"),
  body("rollNumber").notEmpty().withMessage("Roll number required"),
  body("classId").notEmpty().withMessage("Class required"),
];
