const User = require("../models/User");
const jwt = require("jsonwebtoken");
const sanitize = require("../utils/sanitize");
const crypto = require("crypto");
const { sendEmail } = require("../utils/sendEmail");

exports.register = async (req, res) => {
  try {
    // ✅ sanitize only required fields
    const name = sanitize(req.body.name);
    const email = sanitize(req.body.email);
    const password = req.body.password; // ❗ don't sanitize password
    const role = req.body.role;

    const user = await User.create({
      name,
      email,
      password,
      role,
    });

    res.status(201).json({
      success: true,
      message: "User registered",
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

exports.login = async (req, res) => {
  try {
    const email = sanitize(req.body.email);
    const password = req.body.password;
    //console.log(email, password);
    const user = await User.findOne({ email }).select("+password");
    //console.log(user);
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials",
      });
    }

    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "1d" },
    );

    res.json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.forgotPassword = async (req, res) => {
  const user = await User.findOne({ email: req.body.email });

  if (!user) return res.json({ success: true });

  const token = crypto.randomBytes(32).toString("hex");

  user.resetToken = token;
  user.resetExpire = Date.now() + 10 * 60 * 1000;

  await user.save();

  const url = `${process.env.FRONTEND_URL}/reset-password/${token}`;

  await sendEmail({
    to: user.email,
    subject: "Reset Password",
    html: `<a href="${url}">Reset Password</a>`,
  });

  res.json({ success: true });
};

exports.resetPassword = async (req, res) => {
  const user = await User.findOne({
    resetToken: req.params.token,
    resetExpire: { $gt: Date.now() },
  });

  if (!user) {
    return res.status(400).json({ message: "Invalid or expired token" });
  }

  user.password = req.body.password;
  user.resetToken = undefined;
  user.resetExpire = undefined;

  await user.save();

  res.json({ success: true });
};

exports.updatePassword = async (req, res) => {
  try {
    const { password } = req.body;

    res.json({ success: true, message: "Password updated successfully" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.changePassword = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("+password");

    const { oldPassword, newPassword } = req.body;

    const isMatch = await user.comparePassword(oldPassword);

    if (!isMatch) {
      return res.status(400).json({
        success: false,
        message: "Old password incorrect",
      });
    }

    user.password = newPassword;
    await user.save();

    res.json({ success: true, message: "Password updated successfully" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// controllers/userController.js

exports.createTeacher = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    const user = await User.create({
      name,
      email,
      password,
      role: "teacher",
    });

    res.status(201).json({
      success: true,
      data: user,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

exports.getTeachers = async (req, res) => {
  try {
    const teachers = await User.find({ role: "teacher" })
      .select("-password")
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: teachers,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

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

exports.logout = (req, res) => {};
