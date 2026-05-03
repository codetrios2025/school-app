const Student = require("../models/Student");
const User = require("../models/User");
const { sendEmail } = require("../utils/sendEmail");
const { userWelcomeTemplate } = require("../utils/emailTemplates");

// ➕ Create
exports.createStudentold = async (req, res) => {
  try {
    const data = await Student.create(req.body);
    res.status(201).json({ success: true, data });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(400).json({
        success: false,
        message: "Roll number already exists in this class",
      });
    }
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.createStudent = async (req, res) => {
  try {
    const {
      name,
      email,
      rollNumber,
      classId,
      parentName,
      parentEmail,
      contactNumber,
    } = req.body;

    // 🔐 temp password
    const password = Math.random().toString(36).slice(-8);

    // 1️⃣ Create user
    const user = await User.create({
      name,
      email,
      password,
      role: "student",
      classId,
    });

    // 2️⃣ Create student profile
    const student = await Student.create({
      userId: user._id,
      rollNumber,
      classId,
      parentName,
      parentEmail,
      contactNumber,
    });
    // 📧 Send email to parent (if exists)
    const loginUrl = `${process.env.FRONTEND_URL}`;
    if (parentEmail) {
      await sendEmail({
        to: parentEmail,
        subject: "Your Child's School Account",
        html: userWelcomeTemplate({
          name,
          email,
          password,
          role: "Student",
          loginUrl,
        }),
      });
    }
    res.status(201).json({
      success: true,
      data: student,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

// 📄 Get (search + pagination + sorting)
exports.getStudents = async (req, res) => {
  try {
    let {
      page = 1,
      limit = 6,
      search = "",
      sortField = "createdAt",
      sortOrder = "desc",
    } = req.query;

    page = Number(page);
    limit = Number(limit);

    const query = search
      ? {
          name: { $regex: search, $options: "i" },
        }
      : {};

    const sort = {
      [sortField]: sortOrder === "asc" ? 1 : -1,
    };

    const total = await Student.countDocuments(query);

    const data = await Student.find(query)
      .populate("classId", "className section")
      .populate("userId", "name email")
      .sort(sort)
      .skip((page - 1) * limit)
      .limit(limit);

    res.json({
      success: true,
      data,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ✏️ Update
exports.updateStudent = async (req, res) => {
  try {
    const data = await Student.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
    });
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ❌ Delete
exports.deleteStudent = async (req, res) => {
  try {
    await Student.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: "Deleted" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
