require("dotenv").config();
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const User = require("../models/User");

// 🔗 DB Connection
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("DB Connected for seeding");
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

// 🌱 Seed Admin
const seedAdmin = async () => {
  try {
    const existingAdmin = await User.findOne({ email: "admin@gmail.com" });

    if (existingAdmin) {
      console.log("⚠️ Admin already exists");
      process.exit();
    }

    const hashedPassword = await bcrypt.hash("Admin@123", 12);

    const admin = new User({
      name: "Super Admin",
      email: "admin@gmail.com",
      password: "Admin@123",
      role: "admin",
    });

    await admin.save();

    console.log("✅ Admin user created successfully");
    process.exit();
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
};

// Run
connectDB().then(seedAdmin);
