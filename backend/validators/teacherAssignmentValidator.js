const { body, param, query } = require("express-validator");

exports.createTeacherAssignmentValidator = [
  body("teacherId").isMongoId().withMessage("Select a valid teacher"),
  body().custom((value) => {
    if (Array.isArray(value.allocations)) {
      return (
        value.allocations.length > 0 &&
        value.allocations.length <= 30 &&
        value.allocations.every(
          (item) =>
            item &&
            /^[a-f\d]{24}$/i.test(item.classId || "") &&
            /^[a-f\d]{24}$/i.test(item.subjectId || ""),
        )
      );
    }
    return (
      /^[a-f\d]{24}$/i.test(value.classId || "") &&
      /^[a-f\d]{24}$/i.test(value.subjectId || "")
    );
  }).withMessage(
    "Provide between 1 and 30 valid class and subject assignments",
  ),
  body("title").optional().isLength({ max: 120 }),
  body("description").optional().isLength({ max: 1000 }),
];

exports.teacherAssignmentIdValidator = [
  param("id").isMongoId().withMessage("Invalid teaching assignment ID"),
];

exports.updateTeacherAssignmentValidator = [
  param("id").isMongoId().withMessage("Invalid teaching assignment ID"),
  body("teacherId").isMongoId().withMessage("Select a valid teacher"),
  body("classId").isMongoId().withMessage("Select a valid class"),
  body("subjectId").isMongoId().withMessage("Select a valid subject"),
  body("title").optional().isLength({ max: 120 }),
  body("description").optional().isLength({ max: 1000 }),
];

exports.teacherAssignmentListValidator = [
  ...["teacherId", "classId", "subjectId"].map((field) =>
    query(field)
      .optional()
      .isMongoId()
      .withMessage(`Invalid ${field}`),
  ),
  query("page")
    .optional()
    .isInt({ min: 1 })
    .withMessage("Invalid page"),
  query("limit")
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage("Limit must be between 1 and 100"),
  query("search")
    .optional()
    .isLength({ max: 100 })
    .withMessage("Search cannot exceed 100 characters"),
];
