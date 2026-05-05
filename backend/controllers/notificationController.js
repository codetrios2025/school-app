const Notification = require("../models/Notification");
const User = require("../models/User");
const Student = require("../models/Student");
const { sendEmail } = require("../utils/sendEmail");
const TeacherAssignment = require("../models/TeacherAssignment");
const Class = require("../models/Class");
const { sendWhatsApp } = require("../utils/sendWhatsApp");

// 🔔 Admin → broadcast
exports.sendBroadcast = async (req, res) => {
  try {
    const { title, message } = req.body;

    if (req.user.role !== "admin") {
      return res.status(403).json({ message: "Unauthorized" });
    }

    const users = await User.find({
      role: { $in: ["teacher", "parent"] },
    });

    const recipients = users.map((u) => u._id);

    const notif = await Notification.create({
      title,
      message,
      sender: req.user.id,
      type: "broadcast",
      recipients,
    });

    res.json({ success: true, data: notif });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// 👨‍🏫 Teacher → class students
exports.sendClassNotification = async (req, res) => {
  try {
    const { title, message, classId } = req.body;

    if (req.user.role !== "teacher") {
      return res.status(403).json({ message: "Unauthorized" });
    }

    const students = await Student.find({ classId }).populate("userId");

    const recipients = students.map((s) => s.userId?._id).filter(Boolean);

    const notif = await Notification.create({
      title,
      message,
      sender: req.user.id,
      type: "class",
      classId,
      recipients,
    });

    res.json({ success: true, data: notif });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// 📥 Get notifications for logged-in user
exports.getMyNotifications = async (req, res) => {
  try {
    const userId = req.user.id;

    const data = await Notification.find({
      recipients: userId,
    })
      .sort({ createdAt: -1 })
      .limit(20);

    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// 🔔 unread count
exports.getUnreadCount = async (req, res) => {
  try {
    const count = await Notification.countDocuments({
      recipients: req.user.id,
      readBy: { $ne: req.user.id },
    });

    res.json({ success: true, count });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ✅ mark as read
exports.markAsRead = async (req, res) => {
  try {
    await Notification.findByIdAndUpdate(req.params.id, {
      $addToSet: { readBy: req.user.id },
    });

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.sendNotificationold = async (req, res) => {
  try {
    const { title, message, target, classId } = req.body;

    let recipients = [];
    let emails = [];

    // ✅ ADMIN LOGIC
    if (req.user.role === "admin") {
      if (target === "all") {
        const teachers = await User.find({ role: "teacher" });
        const students = await Student.find();

        recipients = [
          ...teachers.map((t) => t._id),
          ...students.map((s) => s.userId),
        ];

        emails = [
          ...teachers.map((t) => t.email),
          ...students.map((s) => s.parentEmail),
        ];
      }

      if (target === "teachers") {
        const teachers = await User.find({
          role: { $regex: "^teacher$", $options: "i" },
        });

        recipients = teachers.map((t) => t._id);
        emails = teachers.map((t) => t.email);
      }

      if (target === "students") {
        const students = await Student.find();

        recipients = students.map((s) => s.userId);
        emails = students.map((s) => s.parentEmail);
      }

      if (target === "class") {
        const students = await Student.find({ classId });

        recipients = students.map((s) => s.userId);
        emails = students.map((s) => s.parentEmail);
      }
    }

    // ✅ TEACHER LOGIC
    if (req.user.role === "teacher") {
      const isAssigned = await TeacherAssignment.findOne({
        teacherId: req.user.id,
        classId,
      });

      if (!isAssigned) {
        return res.status(403).json({
          message: "You are not assigned to this class",
        });
      }

      const students = await Student.find({ classId });

      recipients = students.map((s) => s.userId);
      emails = students.map((s) => s.parentEmail);
    }

    // ✅ REMOVE DUPLICATES
    recipients = [...new Set(recipients.map(String))];
    emails = [...new Set(emails)].filter(Boolean);

    // 🚨 VALIDATION
    if (!recipients.length) {
      return res.status(400).json({
        message: "No recipients found",
      });
    }

    // 📧 SEND EMAIL
    await Promise.all(
      emails.map((email) =>
        sendEmail({
          to: email,
          subject: title,
          html: `<h3>${title}</h3><p>${message}</p>`,
        }),
      ),
    );

    // 💾 SAVE
    const notif = await Notification.create({
      title,
      message,
      sender: req.user.id,
      recipients,
      classId: classId || null,
      type: target,
    });

    // 🔔 SOCKET
    const io = req.app.get("io");
    recipients.forEach((id) => {
      io.to(id.toString()).emit("new_notification", {
        title,
        message,
      });
    });

    res.json({ success: true, data: notif });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.sendNotification = async (req, res) => {
  try {
    const { title, message, target, classId } = req.body;

    let recipients = [];
    let emails = [];
    let phoneNumbers = [];

    // =============================
    // ✅ ADMIN LOGIC
    // =============================
    if (req.user.role === "admin") {
      // 🔹 ALL USERS (teachers + parents)
      if (target === "all") {
        const teachers = await User.find({ role: "teacher" });
        const students = await Student.find();

        recipients = [
          ...teachers.map((t) => t._id),
          ...students.map((s) => s.userId),
        ];

        emails = [
          ...teachers.map((t) => t.email),
          ...students.map((s) => s.parentEmail),
        ];

        phoneNumbers = students.map((s) => s.contactNumber);
      }

      // 🔹 ONLY TEACHERS
      if (target === "teachers") {
        const teachers = await User.find({
          role: { $regex: "^teacher$", $options: "i" },
        });

        recipients = teachers.map((t) => t._id);
        emails = teachers.map((t) => t.email);
      }

      // 🔹 ONLY STUDENTS (PARENTS)
      if (target === "students") {
        const students = await Student.find();

        recipients = students.map((s) => s.userId);
        emails = students.map((s) => s.parentEmail);
        phoneNumbers = students.map((s) => s.contactNumber);
      }

      // 🔹 CLASS WISE
      if (target === "class") {
        const students = await Student.find({ classId });

        recipients = students.map((s) => s.userId);
        emails = students.map((s) => s.parentEmail);
        phoneNumbers = students.map((s) => s.contactNumber);
      }
    }

    // =============================
    // ✅ TEACHER LOGIC
    // =============================
    if (req.user.role === "teacher") {
      const isAssigned = await TeacherAssignment.findOne({
        teacherId: req.user.id,
        classId,
      });

      if (!isAssigned) {
        return res.status(403).json({
          message: "You are not assigned to this class",
        });
      }

      const students = await Student.find({ classId });

      recipients = students.map((s) => s.userId);
      emails = students.map((s) => s.parentEmail);
      phoneNumbers = students.map((s) => s.contactNumber);
    }

    // =============================
    // ✅ CLEAN DATA
    // =============================
    recipients = [...new Set(recipients.map(String))];
    emails = [...new Set(emails)].filter(Boolean);
    phoneNumbers = [...new Set(phoneNumbers)].filter(Boolean);

    // 🚨 VALIDATION
    if (!recipients.length) {
      return res.status(400).json({
        message: "No recipients found",
      });
    }

    // =============================
    // 📧 SEND EMAIL
    // =============================
    await Promise.all(
      emails.map((email) =>
        sendEmail({
          to: email,
          subject: title,
          html: `<h3>${title}</h3><p>${message}</p>`,
        }),
      ),
    );

    // =============================
    // 📱 SEND WHATSAPP
    // =============================
    const whatsappText = `📢 ${title}\n\n${message}`;

    await Promise.all(
      phoneNumbers.map((number) => sendWhatsApp(number, whatsappText)),
    );

    // =============================
    // 💾 SAVE NOTIFICATION
    // =============================
    const notif = await Notification.create({
      title,
      message,
      sender: req.user.id,
      recipients,
      classId: classId || null,
      type: target,
    });

    // =============================
    // 🔔 SOCKET REAL-TIME
    // =============================
    const io = req.app.get("io");

    recipients.forEach((id) => {
      io.to(id.toString()).emit("new_notification", {
        title,
        message,
      });
    });

    // =============================
    // ✅ RESPONSE
    // =============================
    res.json({
      success: true,
      message: "Notification sent successfully",
      data: notif,
    });
  } catch (err) {
    res.status(500).json({
      message: err.message,
    });
  }
};

// 🎯 Get classes for teacher

exports.getTeacherClasses = async (req, res) => {
  try {
    if (req.user.role !== "teacher") {
      return res.status(403).json({ message: "Unauthorized" });
    }

    const assignments = await TeacherAssignment.find({
      teacherId: req.user.id,
    }).populate("classId");

    // ✅ Remove null + duplicates
    const uniqueClasses = [];
    const seen = new Set();

    for (let a of assignments) {
      if (a.classId && !seen.has(a.classId._id.toString())) {
        seen.add(a.classId._id.toString());
        uniqueClasses.push(a.classId);
      }
    }

    res.json({
      success: true,
      data: uniqueClasses,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getNotificationsWithFilter = async (req, res) => {
  try {
    const { type, startDate, endDate } = req.query;

    let filter = {
      recipients: req.user.id,
    };

    if (type) filter.type = type;

    if (startDate && endDate) {
      filter.createdAt = {
        $gte: new Date(startDate),
        $lte: new Date(endDate),
      };
    }

    const data = await Notification.find(filter).sort({ createdAt: -1 });

    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ❌ DELETE notification
exports.deleteNotificationold = async (req, res) => {
  try {
    const notif = await Notification.findById(req.params.id);

    if (!notif) {
      return res.status(404).json({ message: "Notification not found" });
    }

    // 🔐 Only recipient or admin can delete
    if (!notif.recipients.includes(req.user.id) && req.user.role !== "admin") {
      return res.status(403).json({ message: "Unauthorized" });
    }

    await notif.deleteOne();

    res.json({ success: true, message: "Notification deleted" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.deleteNotification = async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({
        message: "Only admin can delete",
      });
    }

    await Notification.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: "Notification deleted",
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getNotifications = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      search = "",
      classId,
      type,
      startDate,
      endDate,
    } = req.query;

    let query = {};

    // 👨‍💼 ADMIN → all
    if (req.user.role === "admin") {
      query = {};
    }

    // 👩‍🏫 TEACHER → own notifications
    if (req.user.role === "teacher") {
      query.sender = req.user.id;
    }

    // 🔍 search
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: "i" } },
        { message: { $regex: search, $options: "i" } },
      ];
    }

    // 📘 class filter
    if (classId) {
      query.classId = classId;
    }

    // 📌 type filter
    if (type) {
      query.type = type;
    }

    // 📅 date filter
    if (startDate && endDate) {
      query.createdAt = {
        $gte: new Date(startDate),
        $lte: new Date(endDate),
      };
    }

    const total = await Notification.countDocuments(query);

    const data = await Notification.find(query)
      .populate("sender", "name")
      .populate("classId", "className section")
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    res.json({
      success: true,
      data,
      total,
      totalPages: Math.ceil(total / limit),
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
