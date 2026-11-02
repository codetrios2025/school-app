const crypto = require("crypto");
const fs = require("fs");
const path = require("path");
const User = require("../models/User");
const Class = require("../models/Class");
const TeacherAssignment = require("../models/TeacherAssignment");
const {
  removeUploadedFile,
  uploadDirectory,
} = require("../middleware/teacherUpload");
const { sendEmail } = require("../utils/sendEmail");
const { userWelcomeTemplate } = require("../utils/emailTemplates");
const emailPattern = /^\S+@\S+\.\S+$/;
const teacherProfileImportFields = [
  "employeeId",
  "phone",
  "gender",
  "dateOfBirth",
  "designation",
  "department",
  "qualification",
  "specialization",
  "joiningDate",
  "employmentType",
  "address",
  "emergencyContactName",
  "emergencyContactPhone",
];
const importRowValue = (value) =>
  typeof value === "string" ? value.trim() : value;
const editableTeacherProfile = (profile = {}) =>
  teacherProfileImportFields
    .filter((field) => profile[field] !== undefined)
    .map((field) => [`teacherProfile.${field}`, profile[field]]);

const validateTeacherImportRow = (data, profile) => {
  if (!data.name) return "Teacher name is required";
  if (!data.email || !emailPattern.test(data.email)) {
    return "Enter a valid teacher email";
  }
  const required = [
    ["employeeId", "Employee ID"],
    ["phone", "Phone number"],
    ["gender", "Gender"],
    ["dateOfBirth", "Date of birth"],
    ["designation", "Designation"],
    ["department", "Department"],
    ["qualification", "Qualification"],
    ["specialization", "Specialization"],
    ["joiningDate", "Joining date"],
    ["employmentType", "Employment type"],
    ["address", "Address"],
    ["emergencyContactName", "Emergency contact name"],
    ["emergencyContactPhone", "Emergency contact phone"],
  ];
  const missing = required.find(([field]) => !profile[field]);
  if (missing) return `${missing[1]} is required`;
  if (!["male", "female", "other"].includes(profile.gender)) {
    return "Gender must be male, female, or other";
  }
  if (!["full_time", "part_time", "contract"].includes(profile.employmentType)) {
    return "Employment type must be full_time, part_time, or contract";
  }
  for (const [field, label] of [
    ["dateOfBirth", "Date of birth"],
    ["joiningDate", "Joining date"],
  ]) {
    const value = String(profile[field]);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
      return `${label} must use YYYY-MM-DD`;
    }
    const parsedDate = new Date(`${value}T00:00:00.000Z`);
    if (
      Number.isNaN(parsedDate.getTime()) ||
      parsedDate.toISOString().slice(0, 10) !== value
    ) {
      return `${label} must be a valid date`;
    }
    if (field === "dateOfBirth" && parsedDate >= new Date()) {
      return "Date of birth must be in the past";
    }
  }
  if (data.status && !["active", "inactive"].includes(data.status)) {
    return "Status must be active or inactive";
  }
  return null;
};

const teacherFields = [
  "name",
  "email",
  "status",
  "teacherProfile.employeeId",
  "teacherProfile.phone",
  "teacherProfile.gender",
  "teacherProfile.dateOfBirth",
  "teacherProfile.designation",
  "teacherProfile.department",
  "teacherProfile.qualification",
  "teacherProfile.specialization",
  "teacherProfile.joiningDate",
  "teacherProfile.employmentType",
  "teacherProfile.address",
  "teacherProfile.emergencyContactName",
  "teacherProfile.emergencyContactPhone",
  "createdAt",
];

const makeTemporaryPassword = () => crypto.randomBytes(12).toString("base64url");

const teacherPhotoDetails = (file) => ({
  originalName: path.basename(file.originalname.replace(/\\/g, "/")).slice(0, 255),
  filename: file.filename,
  mimeType: file.mimetype,
  size: file.size,
});

const resolveTeacherPhotoFilename = async (photo) => {
  const isSafeFilename =
    photo?.filename && path.basename(photo.filename) === photo.filename;
  if (isSafeFilename) {
    try {
      await fs.promises.access(path.join(uploadDirectory, photo.filename));
      return photo.filename;
    } catch (error) {
      if (error.code !== "ENOENT") throw error;
    }
  }

  const extensions = {
    "image/jpeg": [".jpg", ".jpeg"],
    "image/png": [".png"],
    "image/webp": [".webp"],
  }[photo?.mimeType];
  if (!extensions || !Number.isInteger(photo.size) || photo.size < 1) {
    return null;
  }

  const entries = await fs.promises.readdir(uploadDirectory, {
    withFileTypes: true,
  });
  const candidates = [];
  for (const entry of entries) {
    if (!entry.isFile() || !extensions.includes(path.extname(entry.name).toLowerCase())) {
      continue;
    }
    const fullPath = path.join(uploadDirectory, entry.name);
    const stats = await fs.promises.stat(fullPath);
    if (stats.size === photo.size) {
      candidates.push({ filename: entry.name, fullPath });
    }
  }
  if (candidates.length === 1) return candidates[0].filename;
  if (candidates.length < 2) return null;

  const hashes = await Promise.all(
    candidates.map(async ({ fullPath }) =>
      crypto
        .createHash("sha256")
        .update(await fs.promises.readFile(fullPath))
        .digest("hex"),
    ),
  );
  return hashes.every((hash) => hash === hashes[0])
    ? candidates[0].filename
    : null;
};

const removeStoredPhoto = (filename) => {
  if (!filename || path.basename(filename) !== filename) return;
  fs.unlink(path.join(uploadDirectory, filename), (error) => {
    if (error && error.code !== "ENOENT") {
      console.error("Unable to remove teacher photo:", error);
    }
  });
};

const sendCredentials = async (teacher, password) =>
  sendEmail({
    to: teacher.email,
    subject: "Your Teacher Account",
    html: userWelcomeTemplate({
      name: teacher.name,
      email: teacher.email,
      password,
      role: "Teacher",
      loginUrl: `${process.env.FRONTEND_URL}/`,
    }),
  });

exports.createTeacher = async (req, res) => {
  let photoSaved = false;
  try {
    const email = req.body.email.toLowerCase();
    if (await User.exists({ email })) {
      removeUploadedFile(req.file);
      return res.status(409).json({
        success: false,
        message: "An account with this email already exists",
      });
    }
    if (
      req.body.teacherProfile?.employeeId &&
      (await User.exists({
        role: "teacher",
        "teacherProfile.employeeId": req.body.teacherProfile.employeeId,
      }))
    ) {
      removeUploadedFile(req.file);
      return res.status(409).json({
        success: false,
        message: "Employee ID already exists",
      });
    }

    const password = makeTemporaryPassword();
    const teacher = await User.create({
      name: req.body.name,
      email,
      password,
      role: "teacher",
      status: "active",
      teacherProfile: Object.fromEntries(
        editableTeacherProfile(req.body.teacherProfile).map(([field, value]) => [
          field.slice("teacherProfile.".length),
          value,
        ]),
      ),
      ...(req.file && {
        "teacherProfile.photo": teacherPhotoDetails(req.file),
      }),
    });
    photoSaved = Boolean(req.file);

    let credentialsSent = true;
    try {
      await sendCredentials(teacher, password);
    } catch (error) {
      credentialsSent = false;
      console.error("Unable to send teacher credentials:", error.message);
    }

    const data = await User.findById(teacher._id).select(
      "-password -resetToken -teacherProfile.photo.filename",
    );
    return res.status(201).json({
      success: true,
      credentialsSent,
      message: credentialsSent
        ? "Teacher added and login credentials sent by email"
        : "Teacher added, but the login email could not be sent. Use Send credentials to retry.",
      data,
    });
  } catch (error) {
    if (!photoSaved) removeUploadedFile(req.file);
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message:
          error.keyPattern?.["teacherProfile.employeeId"] === 1
            ? "Employee ID already exists"
            : "An account with this email already exists",
      });
    }
    return res.status(500).json({ success: false, message: error.message });
  }
};

exports.getTeachers = async (req, res) => {
  try {
    const page = Math.max(1, Number.parseInt(req.query.page, 10) || 1);
    const limit = Math.min(
      100,
      Math.max(1, Number.parseInt(req.query.limit, 10) || 10),
    );
    const conditions = [{ role: "teacher" }];
    const search = String(req.query.search || "").trim();
    const status = req.query.status;
    const gender = req.query.gender;
    const department = req.query.department;

    if (status === "active") {
      conditions.push({
        $or: [{ status: "active" }, { status: { $exists: false } }],
      });
    } else if (status) {
      conditions.push({ status });
    }
    if (gender) conditions.push({ "teacherProfile.gender": gender });
    if (department) conditions.push({ "teacherProfile.department": department });
    if (search) {
      const escaped = search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const regex = { $regex: escaped, $options: "i" };
      conditions.push({
        $or: [
          { name: regex },
          { email: regex },
          { "teacherProfile.employeeId": regex },
          { "teacherProfile.department": regex },
          { "teacherProfile.designation": regex },
          { "teacherProfile.specialization": regex },
        ],
      });
    }
    const filter = { $and: conditions };

    const sortField = teacherFields.includes(req.query.sortField)
      ? req.query.sortField
      : "createdAt";
    const sortOrder = req.query.sortOrder === "asc" ? 1 : -1;
    const [total, activeCount, data] = await Promise.all([
      User.countDocuments(filter),
      User.countDocuments({
        role: "teacher",
        $or: [{ status: "active" }, { status: { $exists: false } }],
      }),
      User.find(filter)
        .select("-password -resetToken -resetExpire -teacherProfile.photo.filename")
        .sort({ [sortField]: sortOrder, _id: 1 })
        .skip((page - 1) * limit)
        .limit(limit),
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

exports.importTeachers = async (req, res) => {
  const rows = req.body?.rows;
  if (!Array.isArray(rows) || rows.length === 0 || rows.length > 500) {
    return res.status(400).json({
      success: false,
      message: "Provide between 1 and 500 teacher rows",
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
        throw new Error("Row must contain teacher fields");
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
      const profile = { ...(data.teacherProfile || {}) };
      teacherProfileImportFields.forEach((field) => {
        if (data[field] !== undefined) profile[field] = data[field];
      });
      if (profile.employeeId) profile.employeeId = String(profile.employeeId).toUpperCase();
      const validationError = validateTeacherImportRow(data, profile);
      if (validationError) throw new Error(validationError);

      const emailUser = await User.findOne({ email: data.email });
      let teacher = await User.findOne({
        role: "teacher",
        "teacherProfile.employeeId": profile.employeeId,
      });
      if (!teacher && emailUser?.role === "teacher") teacher = emailUser;
      if (emailUser && (!teacher || String(teacher._id) !== String(emailUser._id))) {
        throw new Error("Teacher email is already used by another account");
      }
      const employeeIdOwner = await User.findOne({
        role: "teacher",
        "teacherProfile.employeeId": profile.employeeId,
        ...(teacher && { _id: { $ne: teacher._id } }),
      });
      if (employeeIdOwner) throw new Error("Employee ID already exists");

      if (teacher) {
        teacher.name = data.name;
        teacher.email = data.email;
        if (data.status) teacher.status = data.status;
        if (!teacher.teacherProfile) teacher.teacherProfile = {};
        Object.assign(teacher.teacherProfile, profile);
        await teacher.save();
        result.updated += 1;
      } else {
        if (emailUser) throw new Error("Teacher email is already in use");
        const password = makeTemporaryPassword();
        const createdTeacher = await User.create({
          name: data.name,
          email: data.email,
          password,
          role: "teacher",
          status: data.status || "active",
          teacherProfile: profile,
        });
        credentialEmails.push({
          rowNumber,
          password,
          teacher: createdTeacher,
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
          await sendCredentials(details.teacher, details.password);
          return null;
        } catch (error) {
          console.error("Unable to send imported teacher credentials:", error.message);
          return { row: details.rowNumber, message: "Teacher was imported but credentials email could not be sent" };
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

exports.getTeacher = async (req, res) => {
  try {
    const teacher = await User.findOne({
      _id: req.params.id,
      role: "teacher",
    }).select("-password -resetToken -resetExpire -teacherProfile.photo.filename");

    if (!teacher) {
      return res.status(404).json({
        success: false,
        message: "Teacher not found",
      });
    }
    return res.json({ success: true, data: teacher });
  } catch {
    return res.status(400).json({
      success: false,
      message: "Invalid teacher ID",
    });
  }
};

exports.updateTeacher = async (req, res) => {
  let photoSaved = false;
  try {
    const teacher = await User.findOne({
      _id: req.params.id,
      role: "teacher",
    }).select("teacherProfile.photo");

    if (!teacher) {
      removeUploadedFile(req.file);
      return res.status(404).json({
        success: false,
        message: "Teacher not found",
      });
    }

    const email = req.body.email.toLowerCase();
    if (
      await User.exists({
        email,
        _id: { $ne: teacher._id },
      })
    ) {
      removeUploadedFile(req.file);
      return res.status(409).json({
        success: false,
        message: "An account with this email already exists",
      });
    }

    const employeeId = req.body.teacherProfile?.employeeId;
    if (
      employeeId &&
      (await User.exists({
        role: "teacher",
        _id: { $ne: teacher._id },
        "teacherProfile.employeeId": employeeId,
      }))
    ) {
      removeUploadedFile(req.file);
      return res.status(409).json({
        success: false,
        message: "Employee ID already exists",
      });
    }

    const previousPhoto = teacher.teacherProfile?.photo?.filename;
    const updates = {
      name: req.body.name,
      email,
      ...Object.fromEntries(editableTeacherProfile(req.body.teacherProfile)),
    };
    if (req.file) {
      updates["teacherProfile.photo"] = teacherPhotoDetails(req.file);
    } else {
      const recoverableFilename = await resolveTeacherPhotoFilename(
        teacher.teacherProfile?.photo,
      );
      if (
        recoverableFilename &&
        !teacher.teacherProfile?.photo?.filename
      ) {
        updates["teacherProfile.photo.filename"] = recoverableFilename;
      }
    }
    const updatedTeacher = await User.findOneAndUpdate(
      { _id: teacher._id, role: "teacher" },
      { $set: updates },
      { new: true, runValidators: true },
    );
    photoSaved = Boolean(req.file);
    if (req.file) removeStoredPhoto(previousPhoto);

    const data = await User.findById(updatedTeacher._id).select(
      "-password -resetToken -resetExpire -teacherProfile.photo.filename",
    );
    return res.json({ success: true, data });
  } catch (error) {
    if (!photoSaved) removeUploadedFile(req.file);
    return res.status(500).json({ success: false, message: error.message });
  }
};

exports.updateTeacherStatus = async (req, res) => {
  try {
    const teacher = await User.findOneAndUpdate(
      { _id: req.params.id, role: "teacher" },
      { status: req.body.status },
      { new: true, runValidators: true },
    ).select("-password -resetToken -resetExpire -teacherProfile.photo.filename");

    if (!teacher) {
      return res.status(404).json({
        success: false,
        message: "Teacher not found",
      });
    }

    return res.json({ success: true, data: teacher });
  } catch (error) {
    return res.status(400).json({ success: false, message: error.message });
  }
};

exports.sendTeacherCredentials = async (req, res) => {
  try {
    const teacher = await User.findOne({
      _id: req.params.id,
      role: "teacher",
      status: "active",
    }).select("+password");

    if (!teacher) {
      return res.status(404).json({
        success: false,
        message: "Active teacher account not found",
      });
    }

    const password = makeTemporaryPassword();
    await sendCredentials(teacher, password);
    teacher.password = password;
    await teacher.save();

    return res.json({
      success: true,
      message: "New login credentials sent to the teacher's email",
    });
  } catch (error) {
    console.error("Unable to send teacher credentials:", error);
    return res.status(500).json({
      success: false,
      message: `Unable to send credentials: ${error.message}`,
    });
  }
};

exports.deleteTeacher = async (req, res) => {
  try {
    const teacher = await User.findOneAndDelete({
      _id: req.params.id,
      role: "teacher",
    });

    if (!teacher) {
      return res.status(404).json({
        success: false,
        message: "Teacher not found",
      });
    }
    await Promise.all([
      TeacherAssignment.deleteMany({ teacherId: teacher._id }),
      Class.updateMany(
        { classTeacherId: teacher._id },
        { $set: { classTeacherId: null } },
      ),
    ]);
    removeStoredPhoto(teacher.teacherProfile?.photo?.filename);

    return res.json({ success: true, message: "Teacher deleted" });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

exports.getTeacherPhoto = async (req, res) => {
  try {
    if (req.user.role === "teacher" && req.params.id !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: "Forbidden",
      });
    }

    const query = { _id: req.params.id, role: "teacher" };

    const teacher = await User.findOne(query).select("teacherProfile.photo");
    const photo = teacher?.teacherProfile?.photo;
    const filename = await resolveTeacherPhotoFilename(photo);
    if (!filename) {
      return res.status(404).json({
        success: false,
        message: "Teacher photo is unavailable; upload a replacement",
      });
    }

    return res.sendFile(
      path.join(uploadDirectory, filename),
      {
        headers: {
          "Content-Type": photo.mimeType,
          "Cache-Control": "private, no-store",
        },
      },
      (error) => {
        if (error && !res.headersSent) {
          res.status(error.code === "ENOENT" ? 404 : 500).json({
            success: false,
            message:
              error.code === "ENOENT"
                ? "Teacher photo not found"
                : "Unable to load teacher photo",
          });
        }
      },
    );
  } catch (error) {
    console.error("Unable to load teacher photo:", error);
    return res.status(500).json({
      success: false,
      message: "Unable to load teacher photo",
    });
  }
};
