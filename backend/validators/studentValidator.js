const { body, param, query } = require("express-validator");

const requiredText = (field, label, max = 100) =>
  body(field)
    .trim()
    .notEmpty()
    .withMessage(`${label} is required`)
    .bail()
    .isLength({ max })
    .withMessage(`${label} cannot exceed ${max} characters`);

exports.studentValidator = [
  requiredText("name", "Student name", 50),
  body("email")
    .trim()
    .isEmail()
    .withMessage("Enter a valid student email")
    .normalizeEmail(),
  requiredText("admissionNo", "Admission number", 50),
  requiredText("rollNumber", "Roll number", 50),
  body("classId").isMongoId().withMessage("Select a valid class and section"),
  body("gender")
    .isIn(["male", "female", "other"])
    .withMessage("Select a valid gender"),
  body("dateOfBirth")
    .isISO8601({ strict: true })
    .withMessage("Enter a valid date of birth")
    .toDate()
    .custom((date) => date < new Date())
    .withMessage("Date of birth must be in the past"),
  body("bloodGroup")
    .optional({ values: "falsy" })
    .isIn(["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"])
    .withMessage("Select a valid blood group"),
  requiredText("fatherName", "Father name"),
  requiredText("motherName", "Mother name"),
  body("contactNumber")
    .trim()
    .notEmpty()
    .withMessage("Parent mobile number is required")
    .bail()
    .isLength({ max: 30 })
    .withMessage("Parent mobile number cannot exceed 30 characters"),
  body("parentEmail")
    .optional({ values: "falsy" })
    .trim()
    .isEmail()
    .withMessage("Enter a valid parent email")
    .normalizeEmail(),
  requiredText("emergencyContactName", "Emergency contact name"),
  body("emergencyContactNumber")
    .trim()
    .notEmpty()
    .withMessage("Emergency contact number is required")
    .bail()
    .isLength({ max: 30 })
    .withMessage("Emergency contact number cannot exceed 30 characters"),
  requiredText("emergencyContactRelation", "Emergency contact relation", 80),
  requiredText("address.line1", "Address line 1", 200),
  requiredText("address.country", "Country", 80),
  requiredText("address.state", "State", 80),
  requiredText("address.district", "District", 80),
  requiredText("address.city", "City", 80),
  requiredText("address.pincode", "Pincode", 20),
  body("address.line2")
    .optional({ values: "falsy" })
    .isLength({ max: 200 })
    .withMessage("Address line 2 cannot exceed 200 characters"),
  body("status")
    .optional()
    .isIn(["active", "inactive"])
    .withMessage("Select a valid student status"),
  body("category").optional({ values: "falsy" }).isLength({ max: 80 }),
  body("religion").optional({ values: "falsy" }).isLength({ max: 80 }),
  body("nationality").optional({ values: "falsy" }).isLength({ max: 80 }),
  body("aadhaarNumber").optional({ values: "falsy" }).isLength({ max: 20 }),
  body("apaarId").optional({ values: "falsy" }).isLength({ max: 50 }),
  body("pen").optional({ values: "falsy" }).isLength({ max: 50 }),
  body("srnNumber").optional({ values: "falsy" }).isLength({ max: 50 }),
  body("familyId").optional({ values: "falsy" }).isLength({ max: 50 }),
  param("id").optional().isMongoId().withMessage("Invalid student ID"),
];

exports.getStudentsValidator = [
  query("page").optional().isInt({ min: 1 }).withMessage("Invalid page"),
  query("limit")
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage("Limit must be between 1 and 100"),
  query("classId").optional().isMongoId().withMessage("Invalid class"),
  query("gender")
    .optional()
    .isIn(["male", "female", "other"])
    .withMessage("Invalid gender"),
  query("status")
    .optional()
    .isIn(["active", "inactive"])
    .withMessage("Invalid student status"),
  query("sortField")
    .optional()
    .isIn(["createdAt", "admissionNo", "rollNumber", "gender", "status"])
    .withMessage("Invalid sort field"),
  query("sortOrder")
    .optional()
    .isIn(["asc", "desc"])
    .withMessage("Invalid sort order"),
  query("search")
    .optional()
    .isLength({ max: 100 })
    .withMessage("Search cannot exceed 100 characters"),
];
