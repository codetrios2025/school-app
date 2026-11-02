const { body, param, query } = require("express-validator");

const textField = (field, label, max = 100) =>
  body(field)
    .trim()
    .notEmpty()
    .withMessage(`${label} is required`)
    .bail()
    .isLength({ max })
    .withMessage(`${label} cannot exceed ${max} characters`);

exports.teacherValidator = [
  textField("name", "Teacher name", 50),
  body("email")
    .trim()
    .isEmail()
    .withMessage("Enter a valid email address")
    .normalizeEmail(),
  textField("teacherProfile.employeeId", "Employee ID", 30),
  body("teacherProfile.phone")
    .trim()
    .notEmpty()
    .withMessage("Phone number is required")
    .bail()
    .isLength({ max: 30 })
    .withMessage("Phone number cannot exceed 30 characters"),
  body("teacherProfile.gender")
    .isIn(["male", "female", "other"])
    .withMessage("Select a valid gender"),
  body("teacherProfile.dateOfBirth")
    .isISO8601({ strict: true })
    .withMessage("Enter a valid date of birth")
    .toDate()
    .custom((date) => date < new Date())
    .withMessage("Date of birth must be in the past"),
  textField("teacherProfile.designation", "Designation", 80),
  textField("teacherProfile.department", "Department", 80),
  textField("teacherProfile.qualification", "Qualification", 200),
  textField("teacherProfile.specialization", "Specialization", 150),
  body("teacherProfile.joiningDate")
    .isISO8601({ strict: true })
    .withMessage("Enter a valid joining date")
    .toDate(),
  body("teacherProfile.employmentType")
    .isIn(["full_time", "part_time", "contract"])
    .withMessage("Select a valid employment type"),
  textField("teacherProfile.address", "Address", 500),
  textField("teacherProfile.emergencyContactName", "Emergency contact name"),
  body("teacherProfile.emergencyContactPhone")
    .trim()
    .notEmpty()
    .withMessage("Emergency contact phone is required")
    .bail()
    .isLength({ max: 30 })
    .withMessage("Emergency contact phone cannot exceed 30 characters"),
];

exports.teacherStatusValidator = [
  param("id").isMongoId().withMessage("Invalid teacher ID"),
  body("status")
    .isIn(["active", "inactive"])
    .withMessage("Status must be active or inactive"),
];

exports.teacherIdValidator = [
  param("id").isMongoId().withMessage("Invalid teacher ID"),
];

exports.teacherListValidator = [
  query("page").optional().isInt({ min: 1 }).withMessage("Invalid page"),
  query("limit")
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage("Limit must be between 1 and 100"),
  query("status")
    .optional()
    .isIn(["active", "inactive"])
    .withMessage("Invalid account status"),
  query("gender")
    .optional()
    .isIn(["male", "female", "other"])
    .withMessage("Invalid gender"),
  query("sortOrder")
    .optional()
    .isIn(["asc", "desc"])
    .withMessage("Invalid sort order"),
  query("search")
    .optional()
    .isLength({ max: 100 })
    .withMessage("Search cannot exceed 100 characters"),
];
