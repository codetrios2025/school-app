const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const Student = require("../models/Student");
const User = require("../models/User");
const Class = require("../models/Class");
const {
  removeUploadedFiles,
  uploadDirectory,
} = require("../middleware/studentUpload");
const { sendEmail } = require("../utils/sendEmail");
const { userWelcomeTemplate } = require("../utils/emailTemplates");

const fileDetails = (file) => ({
  originalName: path.basename(file.originalname.replace(/\\/g, "/")).slice(0, 255),
  filename: file.filename,
  mimeType: file.mimetype,
  size: file.size,
});

const removeStoredFile = (filename) => {
  if (!filename || path.basename(filename) !== filename) return;

  fs.unlink(path.join(uploadDirectory, filename), (error) => {
    if (error && error.code !== "ENOENT") {
      console.error("Unable to remove student upload:", error);
    }
  });
};

const removeFilesFromRequest = (req) => removeUploadedFiles(req.files);
const emailPattern = /^\S+@\S+\.\S+$/;
const importRowValue = (value) =>
  typeof value === "string" ? value.trim() : value;

const resolveImportClass = async (data) => {
  if (data.classId) return Class.findById(data.classId);
  if (!data.className || !data.section) return null;
  return Class.findOne({
    className: new RegExp(
      `^${String(data.className).trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`,
      "i",
    ),
    section: new RegExp(
      `^${String(data.section).trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`,
      "i",
    ),
  });
};

const validateStudentImportRow = (data) => {
  const required = [
    ["admissionNo", "Admission number"],
    ["name", "Student name"],
    ["email", "Student email"],
    ["rollNumber", "Roll number"],
    ["gender", "Gender"],
    ["dateOfBirth", "Date of birth"],
    ["fatherName", "Father name"],
    ["motherName", "Mother name"],
    ["contactNumber", "Parent mobile number"],
    ["emergencyContactName", "Emergency contact name"],
    ["emergencyContactNumber", "Emergency contact number"],
    ["emergencyContactRelation", "Emergency contact relation"],
  ];
  const missing = required.find(([field]) => !data[field]);
  if (missing) return `${missing[1]} is required`;
  if (!emailPattern.test(data.email)) return "Enter a valid student email";
  if (data.parentEmail && !emailPattern.test(data.parentEmail)) {
    return "Enter a valid parent email";
  }
  if (!["male", "female", "other"].includes(data.gender)) {
    return "Gender must be male, female, or other";
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(data.dateOfBirth)) {
    return "Date of birth must use YYYY-MM-DD";
  }
  const dateOfBirth = new Date(`${data.dateOfBirth}T00:00:00.000Z`);
  if (
    Number.isNaN(dateOfBirth.getTime()) ||
    dateOfBirth.toISOString().slice(0, 10) !== data.dateOfBirth ||
    dateOfBirth >= new Date()
  ) {
    return "Date of birth must be a valid date in the past";
  }
  if (data.status && !["active", "inactive"].includes(data.status)) {
    return "Status must be active or inactive";
  }
  if (data.bloodGroup && !["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"].includes(data.bloodGroup)) {
    return "Blood group is invalid";
  }
  const addressFields = ["line1", "country", "state", "district", "city", "pincode"];
  const address = data.address || {};
  const missingAddress = addressFields.find((field) => !address[field]);
  if (missingAddress) return `Address ${missingAddress} is required`;
  return null;
};

const validateStudentReferences = async (data, currentStudentId) => {
  const classExists = await Class.exists({ _id: data.classId });
  if (!classExists) return "Selected class and section do not exist";

  const admissionQuery = { admissionNo: data.admissionNo };
  const rollQuery = { rollNumber: data.rollNumber, classId: data.classId };
  if (currentStudentId) {
    admissionQuery._id = { $ne: currentStudentId };
    rollQuery._id = { $ne: currentStudentId };
  }

  const [existingAdmission, existingRoll] = await Promise.all([
    Student.exists(admissionQuery),
    Student.exists(rollQuery),
  ]);

  if (existingAdmission) return "Admission number already exists";
  if (existingRoll) return "Roll number already exists in this class";
  return null;
};

const assignStudentFields = (student, data) => {
  const fields = [
    "admissionNo",
    "rollNumber",
    "classId",
    "gender",
    "dateOfBirth",
    "bloodGroup",
    "category",
    "religion",
    "nationality",
    "aadhaarNumber",
    "apaarId",
    "pen",
    "srnNumber",
    "familyId",
    "fatherName",
    "motherName",
    "parentName",
    "parentEmail",
    "contactNumber",
    "fatherContactNumber",
    "motherContactNumber",
    "guardianName",
    "guardianRelation",
    "guardianContactNumber",
    "emergencyContactName",
    "emergencyContactNumber",
    "emergencyContactRelation",
    "status",
  ];

  fields.forEach((field) => {
    if (data[field] !== undefined) student[field] = data[field];
  });
  if (data.address !== undefined) student.address = data.address;
};

const populateStudent = (query) =>
  query
    .populate("classId", "className section")
    .populate("userId", "name email");

exports.createStudent = async (req, res) => {
  let user;
  let student;
  try {
    const data = req.body;
    const referenceError = await validateStudentReferences(data);
    if (referenceError) {
      removeFilesFromRequest(req);
      return res.status(400).json({ success: false, message: referenceError });
    }

    const existingUser = await User.exists({ email: data.email.toLowerCase() });
    if (existingUser) {
      removeFilesFromRequest(req);
      return res.status(409).json({
        success: false,
        message: "An account with this email already exists",
      });
    }

    const password = crypto.randomBytes(9).toString("base64url");
    user = await User.create({
      name: data.name,
      email: data.email,
      password,
      role: "student",
      classId: data.classId,
    });

    student = new Student({ userId: user._id });
    assignStudentFields(student, data);
    if (!student.parentName) student.parentName = data.fatherName;

    const uploadedPhoto = req.files?.photo?.[0];
    if (uploadedPhoto) student.photo = fileDetails(uploadedPhoto);
    student.documents = (req.files?.documents || []).map(fileDetails);
    await student.save();

    let emailSent = true;
    try {
      await sendEmail({
        to: data.parentEmail || data.email,
        subject: "Your Child's School Account",
        html: userWelcomeTemplate({
          name: data.name,
          email: data.email,
          password,
          role: "Student",
          loginUrl: `${process.env.FRONTEND_URL}/`,
        }),
      });
    } catch (error) {
      emailSent = false;
      console.error("Unable to send student account email:", error.message);
    }

    const populated = await populateStudent(
      Student.findById(student._id).select("+aadhaarNumber"),
    );
    return res.status(201).json({
      success: true,
      message: emailSent
        ? "Student created and account details sent"
        : "Student created, but the account email could not be sent",
      emailSent,
      data: populated,
    });
  } catch (error) {
    removeFilesFromRequest(req);
    if (student?._id) {
      await Student.findByIdAndDelete(student._id);
    }
    if (user) {
      await User.findByIdAndDelete(user._id);
    }
    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern || {})[0];
      const message = {
        email: "An account with this email already exists",
        admissionNo: "Admission number already exists",
        rollNumber: "A student with this roll number already exists in the class",
      }[field] || "A student with this roll number already exists in the class";
      return res.status(409).json({ success: false, message });
    }
    return res.status(500).json({ success: false, message: error.message });
  }
};

exports.getStudents = async (req, res) => {
  try {
    const page = Math.max(1, Number.parseInt(req.query.page, 10) || 1);
    const limit = Math.min(
      100,
      Math.max(1, Number.parseInt(req.query.limit, 10) || 10),
    );
    const filter = {};
    const search = String(req.query.search || "").trim();
    const sortFields = [
      "createdAt",
      "admissionNo",
      "rollNumber",
      "gender",
      "status",
    ];
    const sortField = sortFields.includes(req.query.sortField)
      ? req.query.sortField
      : "createdAt";
    const sortOrder = req.query.sortOrder === "asc" ? 1 : -1;

    if (req.query.classId) filter.classId = req.query.classId;
    if (req.query.gender) filter.gender = req.query.gender;
    if (req.query.status) filter.status = req.query.status;

    if (search) {
      const safeSearch = search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const matchingUsers = await User.find({
        role: "student",
        $or: [
          { name: { $regex: safeSearch, $options: "i" } },
          { email: { $regex: safeSearch, $options: "i" } },
        ],
      }).distinct("_id");
      filter.$or = [
        { userId: { $in: matchingUsers } },
        { admissionNo: { $regex: safeSearch, $options: "i" } },
        { rollNumber: { $regex: safeSearch, $options: "i" } },
      ];
    }

    const [total, data, activeCount] = await Promise.all([
      Student.countDocuments(filter),
      populateStudent(
        Student.find(filter)
          .select("-aadhaarNumber -photo.filename -documents.filename")
          .sort({ [sortField]: sortOrder, _id: 1 })
          .skip((page - 1) * limit)
          .limit(limit),
      ),
      Student.countDocuments({
        ...filter,
        $and: [
          ...(filter.$and || []),
          {
            $or: [
              { status: "active" },
              { status: { $exists: false } },
            ],
          },
        ],
      }),
    ]);

    return res.json({
      success: true,
      data,
      total,
      activeCount,
      page,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

exports.importStudents = async (req, res) => {
  const rows = req.body?.rows;
  if (!Array.isArray(rows) || rows.length === 0 || rows.length > 500) {
    return res.status(400).json({
      success: false,
      message: "Provide between 1 and 500 student rows",
    });
  }

  const result = { created: 0, updated: 0, failed: 0, emailWarnings: 0, errors: [] };
  const credentialEmails = [];

  for (const [index, rawRow] of rows.entries()) {
    const rowNumber =
      Number.isInteger(rawRow?.__rowNumber) && rawRow.__rowNumber >= 2
        ? rawRow.__rowNumber
        : index + 2;
    try {
      if (!rawRow || typeof rawRow !== "object" || Array.isArray(rawRow)) {
        throw new Error("Row must contain student fields");
      }

      const data = Object.fromEntries(
        Object.entries(rawRow)
          .filter(
            ([key, value]) =>
              key !== "__rowNumber" &&
              value !== null &&
              value !== undefined &&
              value !== "",
          )
          .map(([key, value]) => [key, importRowValue(value)]),
      );
      data.email = String(data.email || "").toLowerCase();
      if (data.parentEmail) data.parentEmail = String(data.parentEmail).toLowerCase();
      const address = data.address || {};
      const classRecord = await resolveImportClass(data);
      if (!classRecord) {
        throw new Error("Class and section were not found");
      }
      data.classId = classRecord._id;

      const validationError = validateStudentImportRow({ ...data, address });
      if (validationError) throw new Error(validationError);

      const emailUser = await User.findOne({ email: data.email });
      let student = await Student.findOne({ admissionNo: data.admissionNo });
      if (!student && emailUser?.role === "student") {
        student = await Student.findOne({ userId: emailUser._id });
      }
      if (emailUser && (!student || String(student.userId) !== String(emailUser._id))) {
        throw new Error("Student email is already used by another account");
      }

      const referenceError = await validateStudentReferences(
        { ...data, address },
        student?._id,
      );
      if (referenceError) throw new Error(referenceError);

      if (student) {
        const user = emailUser || (await User.findById(student.userId));
        if (!user || user.role !== "student") {
          throw new Error("Student account was not found");
        }
        user.name = data.name;
        user.email = data.email;
        user.classId = data.classId;
        assignStudentFields(student, { ...data, address });
        if (!student.parentName) student.parentName = data.fatherName;
        await student.save();
        await user.save();
        result.updated += 1;
      } else {
        if (emailUser) throw new Error("Student email is already in use");
        const password = crypto.randomBytes(9).toString("base64url");
        const user = await User.create({
          name: data.name,
          email: data.email,
          password,
          role: "student",
          classId: data.classId,
        });
        try {
          const createdStudent = new Student({ userId: user._id });
          assignStudentFields(createdStudent, { ...data, address });
          if (!createdStudent.parentName) createdStudent.parentName = data.fatherName;
          await createdStudent.save();
        } catch (error) {
          await User.findByIdAndDelete(user._id);
          throw error;
        }
        credentialEmails.push({
          rowNumber,
          to: data.parentEmail || data.email,
          name: data.name,
          email: data.email,
          password,
        });
        result.created += 1;
      }
    } catch (error) {
      result.failed += 1;
      result.errors.push({ row: rowNumber, message: error.message });
    }
  }

  const emailWarnings = [];
  for (let offset = 0; offset < credentialEmails.length; offset += 10) {
    const emailResults = await Promise.all(
      credentialEmails.slice(offset, offset + 10).map(async (details) => {
        try {
          await sendEmail({
            to: details.to,
            subject: "Your Child's School Account",
            html: userWelcomeTemplate({
              name: details.name,
              email: details.email,
              password: details.password,
              role: "Student",
              loginUrl: `${process.env.FRONTEND_URL}/`,
            }),
          });
          return null;
        } catch (error) {
          console.error("Unable to send imported student account email:", error.message);
          return { row: details.rowNumber, message: "Student was imported but account email could not be sent" };
        }
      }),
    );
    emailWarnings.push(...emailResults.filter(Boolean));
  }
  result.emailWarnings = emailWarnings.length;
  return res.json({
    success: true,
    data: result,
    emailWarnings,
  });
};

exports.getStudent = async (req, res) => {
  try {
    const student = await populateStudent(
      Student.findById(req.params.id).select("+aadhaarNumber"),
    );
    if (!student) {
      return res.status(404).json({ success: false, message: "Student not found" });
    }

    return res.json({ success: true, data: student });
  } catch (error) {
    return res.status(400).json({ success: false, message: "Invalid student ID" });
  }
};

exports.updateStudent = async (req, res) => {
  try {
    const student = await Student.findById(req.params.id).select(
      "+aadhaarNumber",
    );
    if (!student) {
      removeFilesFromRequest(req);
      return res.status(404).json({ success: false, message: "Student not found" });
    }

    const referenceError = await validateStudentReferences(
      req.body,
      student._id,
    );
    if (referenceError) {
      removeFilesFromRequest(req);
      return res.status(400).json({ success: false, message: referenceError });
    }

    const user = await User.findById(student.userId);
    if (!user) {
      removeFilesFromRequest(req);
      return res.status(404).json({
        success: false,
        message: "Student account was not found",
      });
    }

    const email = req.body.email.toLowerCase();
    const duplicateEmail = await User.exists({
      email,
      _id: { $ne: user._id },
    });
    if (duplicateEmail) {
      removeFilesFromRequest(req);
      return res.status(409).json({
        success: false,
        message: "An account with this email already exists",
      });
    }

    const previousPhoto = student.photo?.filename;
    user.name = req.body.name;
    user.email = email;
    user.classId = req.body.classId;
    assignStudentFields(student, req.body);
    if (!student.parentName) student.parentName = req.body.fatherName;

    const uploadedPhoto = req.files?.photo?.[0];
    if (uploadedPhoto) student.photo = fileDetails(uploadedPhoto);
    student.documents.push(
      ...(req.files?.documents || []).map(fileDetails),
    );

    await user.save();
    await student.save();
    if (uploadedPhoto) removeStoredFile(previousPhoto);

    const populated = await populateStudent(
      Student.findById(student._id).select("+aadhaarNumber"),
    );
    return res.json({ success: true, data: populated });
  } catch (error) {
    removeFilesFromRequest(req);
    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern || {})[0];
      return res.status(409).json({
        success: false,
        message:
          field === "email"
            ? "An account with this email already exists"
            : "Admission or roll number already exists",
      });
    }
    return res.status(500).json({ success: false, message: error.message });
  }
};

exports.updateStudentStatus = async (req, res) => {
  try {
    const student = await Student.findByIdAndUpdate(
      req.params.id,
      { status: req.body.status },
      { new: true, runValidators: true },
    )
      .populate("classId", "className section")
      .populate("userId", "name email");

    if (!student) {
      return res.status(404).json({
        success: false,
        message: "Student not found",
      });
    }

    return res.json({ success: true, data: student });
  } catch (error) {
    return res.status(400).json({ success: false, message: error.message });
  }
};

exports.deleteStudent = async (req, res) => {
  try {
    const student = await Student.findById(req.params.id);
    if (!student) {
      return res.status(404).json({ success: false, message: "Student not found" });
    }

    await Promise.all([
      Student.deleteOne({ _id: student._id }),
      User.deleteOne({ _id: student.userId, role: "student" }),
    ]);
    removeStoredFile(student.photo?.filename);
    student.documents.forEach((document) =>
      removeStoredFile(document.filename),
    );

    return res.json({ success: true, message: "Student deleted" });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

exports.downloadStudentFile = async (req, res) => {
  try {
    const student = await Student.findById(req.params.id).select(
      "userId parentEmail photo documents",
    );
    if (!student) {
      return res.status(404).json({ success: false, message: "Student not found" });
    }

    const isAdmin = req.user.role === "admin";
    const isStudent =
      req.user.role === "student" && student.userId.toString() === req.user.id;
    const isParent =
      req.user.role === "parent" &&
      student.parentEmail &&
      (await User.exists({
        _id: req.user.id,
        email: student.parentEmail,
      }));
    if (!isAdmin && !isStudent && !isParent) {
      return res.status(403).json({ success: false, message: "Forbidden" });
    }

    const file =
      req.params.fileId === "photo"
        ? student.photo
        : student.documents.id(req.params.fileId);
    if (!file?.filename || path.basename(file.filename) !== file.filename) {
      return res.status(404).json({ success: false, message: "File not found" });
    }

    const fullPath = path.join(uploadDirectory, file.filename);
    return res.download(fullPath, file.originalName, (error) => {
      if (error && !res.headersSent) {
        res.status(error.code === "ENOENT" ? 404 : 500).json({
          success: false,
          message:
            error.code === "ENOENT" ? "File not found" : "Unable to download file",
        });
      }
    });
  } catch (error) {
    return res.status(400).json({ success: false, message: "Invalid student file" });
  }
};
