const User = require("../models/User");
const { sendEmail } = require("../utils/sendEmail");
const { userWelcomeTemplate } = require("../utils/emailTemplates");

// ➕ Create Teacher
exports.createTeacher = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    const exists = await User.findOne({ email });
    if (exists) {
      return res.status(400).json({
        success: false,
        message: "Email already exists",
      });
    }

    const teacher = await User.create({
      name,
      email,
      password,
      role: "teacher",
    });

    // 📧 send email
    await sendEmail({
      to: email,
      subject: "Your Teacher Account",
      html: userWelcomeTemplate(name, email, password, "Teacher"),
    });

    res.status(201).json({
      success: true,
      data: teacher,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

// 📄 Get Teachers
exports.getTeachers = async (req, res) => {
  let {
    page = 1,
    limit = 6,
    search = "",
    sortField = "createdAt",
    sortOrder = "desc",
  } = req.query;

  page = Number(page);
  limit = Number(limit);

  const query = search ? { name: { $regex: search, $options: "i" } } : {};

  const sort = { [sortField]: sortOrder === "asc" ? 1 : -1 };

  const total = await User.countDocuments({ role: "teacher", ...query });

  const data = await User.find({ role: "teacher", ...query })
    .select("-password")
    .sort(sort)
    .skip((page - 1) * limit)
    .limit(limit);

  res.json({
    success: true,
    data,
    total,
    totalPages: Math.ceil(total / limit),
  });
};

exports.updateTeacher = async (req, res) => {
  const teacher = await User.findByIdAndUpdate(req.params.id, req.body, {
    returnDocument: "after",
  });

  res.json({ success: true, data: teacher });
};

// ❌ Delete Teacher
exports.deleteTeacher = async (req, res) => {
  try {
    await User.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: "Teacher deleted",
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};
