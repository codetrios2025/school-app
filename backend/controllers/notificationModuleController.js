const fs = require("fs");
const path = require("path");
const mongoose = require("mongoose");
const Notification = require("../models/Notification");
const SchoolSettings = require("../models/SchoolSettings");
const User = require("../models/User");
const Student = require("../models/Student");
const TeacherAssignment = require("../models/TeacherAssignment");
const Class = require("../models/Class");
const { sendEmail } = require("../utils/sendEmail");
const { sendWhatsApp } = require("../utils/sendWhatsApp");
const { notificationEmailTemplate } = require("../utils/emailTemplates");
const { uploadDirectory: schoolUploadDirectory } = require("../middleware/schoolLogoUpload");

const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const toId = (value) => String(value?._id || value);
const allowedChannels = new Set(["inApp", "email", "whatsapp"]);
const studentPhone = (student) =>
  student.guardianContactNumber ||
  student.fatherContactNumber ||
  student.motherContactNumber ||
  student.contactNumber;

const ensureTeacherCanAccessClass = async (teacherId, classId) => {
  const [subjectAssignment, classTeacherAssignment] = await Promise.all([
    TeacherAssignment.exists({ teacherId, classId }),
    Class.exists({ _id: classId, classTeacherId: teacherId }),
  ]);
  return Boolean(subjectAssignment || classTeacherAssignment);
};

const addStudentRecipients = async (students, recipientIds, deliveries) => {
  const parentEmails = new Set();
  for (const student of students) {
    if (student.userId?._id) recipientIds.add(toId(student.userId));
    if (student.parentEmail) parentEmails.add(student.parentEmail.toLowerCase());
    deliveries.push({
      email: student.parentEmail || student.userId?.email || "",
      phone: studentPhone(student) || "",
    });
  }
  if (parentEmails.size) {
    const parents = await User.find({
      role: "parent",
      email: { $in: [...parentEmails] },
      $or: [{ status: "active" }, { status: { $exists: false } }],
    }).select("_id");
    parents.forEach((parent) => recipientIds.add(toId(parent)));
  }
};

const getStudentByRecipient = async (recipientId) => {
  if (!mongoose.Types.ObjectId.isValid(recipientId)) return null;
  return Student.findOne({
    $or: [{ _id: recipientId }, { userId: recipientId }],
  }).populate("userId", "name email role status");
};

const getActiveStudentQuery = () => ({ status: { $ne: "inactive" } });

exports.getNotificationClasses = async (req, res) => {
  try {
    if (req.user.role === "admin") {
      const classes = await Class.find().sort({ className: 1, section: 1 });
      return res.json({ success: true, data: classes });
    }
    if (req.user.role !== "teacher") {
      return res.status(403).json({ success: false, message: "Only administrators and teachers can send notifications" });
    }

    const [assignments, classTeacherClasses] = await Promise.all([
      TeacherAssignment.find({ teacherId: req.user.id }).distinct("classId"),
      Class.find({ classTeacherId: req.user.id }).distinct("_id"),
    ]);
    const ids = [...new Set([...assignments, ...classTeacherClasses].map(toId))];
    const classes = await Class.find({ _id: { $in: ids } }).sort({
      className: 1,
      section: 1,
    });
    return res.json({ success: true, data: classes });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

exports.getNotificationRecipients = async (req, res) => {
  try {
    const { classId } = req.query;
    const search = String(req.query.search || "").trim();
    if (req.user.role !== "admin" && req.user.role !== "teacher") {
      return res.status(403).json({ success: false, message: "Forbidden" });
    }
    if (search.length > 100) {
      return res.status(400).json({ success: false, message: "Search must be 100 characters or fewer" });
    }
    if (classId && !mongoose.Types.ObjectId.isValid(classId)) {
      return res.status(400).json({ success: false, message: "Select a valid class" });
    }
    if (req.user.role === "teacher") {
      if (!classId || !mongoose.Types.ObjectId.isValid(classId)) {
        return res.status(400).json({ success: false, message: "Select a valid class" });
      }
      if (!(await ensureTeacherCanAccessClass(req.user.id, classId))) {
        return res.status(403).json({ success: false, message: "You are not assigned to this class" });
      }
    }

    const filter = {
      ...getActiveStudentQuery(),
      ...(classId && { classId }),
    };
    if (search) {
      const expression = new RegExp(escapeRegex(search), "i");
      const users = await User.find({
        role: "student",
        $or: [{ name: expression }, { email: expression }],
      }).distinct("_id");
      filter.$or = [
        { userId: { $in: users } },
        { admissionNo: expression },
        { rollNumber: expression },
      ];
    }
    const students = await Student.find(filter)
      .populate("userId", "name status")
      .populate("classId", "className section")
      .sort({ admissionNo: 1, _id: 1 })
      .limit(500);
    const recipients = students
      .filter(
        (student) =>
          student.userId &&
          (!student.userId.status || student.userId.status === "active"),
      )
      .map((student) => ({
        id: toId(student.userId),
        name: student.userId.name,
        role: "student",
        detail: `${student.classId?.className || ""} ${student.classId?.section || ""} · ${student.admissionNo || student.rollNumber || ""}`.trim(),
      }));

    if (req.user.role === "admin" && !classId) {
      const teacherFilter = {
        role: "teacher",
        $or: [{ status: "active" }, { status: { $exists: false } }],
      };
      if (search) {
        const expression = new RegExp(escapeRegex(search), "i");
        teacherFilter.$and = [
          { $or: teacherFilter.$or },
          { $or: [{ name: expression }, { email: expression }, { "teacherProfile.employeeId": expression }] },
        ];
        delete teacherFilter.$or;
      }
      const teachers = await User.find(teacherFilter)
        .select("name teacherProfile.employeeId")
        .sort({ name: 1 })
        .limit(500);
      recipients.push(
        ...teachers.map((teacher) => ({
          id: toId(teacher),
          name: teacher.name,
          role: "teacher",
          detail: teacher.teacherProfile?.employeeId || "",
        })),
      );
      const parentFilter = {
        role: "parent",
        $or: [{ status: "active" }, { status: { $exists: false } }],
      };
      if (search) {
        const expression = new RegExp(escapeRegex(search), "i");
        parentFilter.$and = [
          { $or: parentFilter.$or },
          { $or: [{ name: expression }, { email: expression }] },
        ];
        delete parentFilter.$or;
      }
      const parents = await User.find(parentFilter)
        .select("name email")
        .sort({ name: 1 })
        .limit(500);
      recipients.push(
        ...parents.map((parent) => ({
          id: toId(parent),
          name: parent.name,
          role: "parent",
          detail: parent.email || "",
        })),
      );
    }
    return res.json({ success: true, data: recipients });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

exports.sendNotification = async (req, res) => {
  try {
    const title = String(req.body.title || "").trim();
    const message = String(req.body.message || "").trim();
    const target = String(req.body.target || "");
    const { classId, recipientId } = req.body;
    const channels = req.body.channels === undefined ? ["inApp", "email"] : req.body.channels;

    if (!title || title.length > 160) {
      return res.status(400).json({ success: false, message: "Title is required and must be 160 characters or fewer" });
    }
    if (!message || message.length > 10000) {
      return res.status(400).json({ success: false, message: "Message is required and must be 10,000 characters or fewer" });
    }
    if (!Array.isArray(channels) || channels.some((channel) => !allowedChannels.has(channel))) {
      return res.status(400).json({ success: false, message: "Select valid notification channels" });
    }
    if (!channels.includes("inApp") && !channels.includes("email") && !channels.includes("whatsapp")) {
      return res.status(400).json({ success: false, message: "Select at least one notification channel" });
    }
    if (!["admin", "teacher"].includes(req.user.role)) {
      return res.status(403).json({ success: false, message: "Only administrators and teachers can send notifications" });
    }

    const isAdmin = req.user.role === "admin";
    const recipientIds = new Set();
    const deliveries = [];
    let notificationClassId = null;
    let normalizedTarget = target;

    if (isAdmin && ["all", "students", "all_students"].includes(target)) {
      normalizedTarget = "all_students";
      const students = await Student.find(getActiveStudentQuery()).populate(
        "userId",
        "email",
      );
      await addStudentRecipients(students, recipientIds, deliveries);
    } else if (isAdmin && ["teachers", "all_teachers"].includes(target)) {
      normalizedTarget = "all_teachers";
      const teachers = await User.find({
        role: "teacher",
        $or: [{ status: "active" }, { status: { $exists: false } }],
      }).select("_id email teacherProfile.phone");
      teachers.forEach((teacher) => {
        recipientIds.add(toId(teacher));
        deliveries.push({
          email: teacher.email || "",
          phone: teacher.teacherProfile?.phone || "",
        });
      });
    } else if (target === "class") {
      if (!classId || !mongoose.Types.ObjectId.isValid(classId)) {
        return res.status(400).json({ success: false, message: "Select a valid class" });
      }
      if (!isAdmin && !(await ensureTeacherCanAccessClass(req.user.id, classId))) {
        return res.status(403).json({ success: false, message: "You are not assigned to this class" });
      }
      const schoolClass = await Class.findById(classId).select("_id");
      if (!schoolClass) {
        return res.status(404).json({ success: false, message: "Class not found" });
      }
      notificationClassId = schoolClass._id;
      const students = await Student.find({
        classId,
        ...getActiveStudentQuery(),
      }).populate("userId", "email");
      await addStudentRecipients(students, recipientIds, deliveries);
    } else if (target === "individual") {
      if (!recipientId || !mongoose.Types.ObjectId.isValid(recipientId)) {
        return res.status(400).json({ success: false, message: "Select a valid recipient" });
      }
      if (!isAdmin) {
        if (!classId || !mongoose.Types.ObjectId.isValid(classId)) {
          return res.status(400).json({ success: false, message: "Select a valid class" });
        }
        if (!(await ensureTeacherCanAccessClass(req.user.id, classId))) {
          return res.status(403).json({ success: false, message: "You are not assigned to this class" });
        }
      }
      const recipient = await User.findOne({
        _id: recipientId,
        $or: [{ status: "active" }, { status: { $exists: false } }],
        ...(isAdmin ? {} : { role: "student" }),
      }).select("name email role teacherProfile.phone");
      if (!recipient) {
        return res.status(404).json({ success: false, message: "Recipient not found" });
      }
      recipientIds.add(toId(recipient));
      if (recipient.role === "student") {
        const student = await getStudentByRecipient(recipient._id);
        if (!student || (!isAdmin && toId(student.classId) !== String(classId))) {
          return res.status(403).json({ success: false, message: "Student is not available in this class" });
        }
        notificationClassId = student.classId;
        await addStudentRecipients([student], recipientIds, deliveries);
      } else if (recipient.role === "parent") {
        const students = await Student.find({
          parentEmail: recipient.email,
          ...getActiveStudentQuery(),
        }).populate("userId", "email");
        await addStudentRecipients(students, recipientIds, deliveries);
        if (recipient.email) deliveries.push({ email: recipient.email, phone: "" });
      } else {
        deliveries.push({
          email: recipient.email || "",
          phone: recipient.teacherProfile?.phone || "",
        });
      }
      normalizedTarget = "individual";
    } else {
      return res.status(400).json({ success: false, message: "Select a valid notification audience" });
    }

    if (!recipientIds.size) {
      return res.status(400).json({ success: false, message: "No active recipients were found for this audience" });
    }
    if (recipientIds.size > 5000) {
      return res.status(400).json({ success: false, message: "This audience is too large to notify in one send" });
    }

    const settings = await SchoolSettings.findOne({ key: "school" }).lean();
    if (channels.includes("whatsapp")) {
      if (!settings?.whatsappNotificationsEnabled) {
        return res.status(400).json({
          success: false,
          message: "WhatsApp notifications are disabled by the school administrator",
        });
      }
      if (
        !process.env.TWILIO_ACCOUNT_SID ||
        !process.env.TWILIO_AUTH_TOKEN ||
        !process.env.TWILIO_WHATSAPP_NUMBER
      ) {
        return res.status(400).json({
          success: false,
          message: "WhatsApp is enabled but Twilio credentials are not configured",
        });
      }
    }

    const emails = new Set(
      deliveries.map((item) => item.email.trim().toLowerCase()).filter(Boolean),
    );
    const phoneNumbers = new Set(
      deliveries.map((item) => item.phone.trim()).filter(Boolean),
    );
    const deliverySummary = {
      email: {
        attempted: channels.includes("email") ? emails.size : 0,
        sent: 0,
        failed: 0,
        unavailable: channels.includes("email")
          ? deliveries.filter((item) => !item.email.trim()).length
          : 0,
      },
      whatsapp: {
        attempted: channels.includes("whatsapp") ? phoneNumbers.size : 0,
        sent: 0,
        failed: 0,
        unavailable: channels.includes("whatsapp")
          ? deliveries.filter((item) => !item.phone.trim()).length
          : 0,
      },
    };

    const notification = await Notification.create({
      title,
      message,
      sender: req.user.id,
      type: normalizedTarget,
      classId: notificationClassId,
      recipients: [...recipientIds],
      channels: [...new Set([...channels, "inApp"])],
      deliverySummary,
    });

    let logoAttachment;
    const logoFilename = settings?.logo?.filename;
    if (
      logoFilename &&
      path.basename(logoFilename) === logoFilename &&
      settings.logo.mimeType
    ) {
      const logoPath = path.join(schoolUploadDirectory, logoFilename);
      try {
        await fs.promises.access(logoPath);
        logoAttachment = {
          filename: settings.logo.originalName || "school-logo",
          path: logoPath,
          cid: "school-notification-logo",
        };
      } catch (error) {
        if (error.code !== "ENOENT") throw error;
        console.error("Configured school logo is missing from storage");
      }
    }

    const emailTasks = channels.includes("email")
      ? [...emails].map((email) =>
          sendEmail({
            to: email,
            subject: title,
            fromName: settings?.schoolName || "School",
            html: notificationEmailTemplate({
              schoolName: settings?.schoolName || "School",
              title,
              message,
              logoCid: logoAttachment?.cid,
              email: settings?.email,
              phone: settings?.phone,
              address: [
                settings?.address,
                settings?.city,
                settings?.state,
                settings?.country,
                settings?.postalCode,
              ]
                .filter(Boolean)
                .join(", "),
              website: settings?.website,
              mapUrl: settings?.mapUrl,
            }),
            ...(logoAttachment && { attachments: [logoAttachment] }),
          }),
        )
      : [];
    const whatsappTasks = channels.includes("whatsapp")
      ? [...phoneNumbers].map((phone) =>
          sendWhatsApp(phone, `${title}\n\n${message}`, { throwOnError: true }),
        )
      : [];
    const [emailResults, whatsappResults] = await Promise.all([
      Promise.allSettled(emailTasks),
      Promise.allSettled(whatsappTasks),
    ]);
    deliverySummary.email.sent = emailResults.filter(
      (result) => result.status === "fulfilled",
    ).length;
    deliverySummary.email.failed =
      emailResults.length - deliverySummary.email.sent;
    deliverySummary.whatsapp.sent = whatsappResults.filter(
      (result) => result.status === "fulfilled",
    ).length;
    deliverySummary.whatsapp.failed =
      whatsappResults.length - deliverySummary.whatsapp.sent;
    notification.deliverySummary = deliverySummary;
    await notification.save();

    const io = req.app.get("io");
    if (io) {
      for (const id of recipientIds) {
        io.to(id).emit("new_notification", {
          id: notification._id,
          title: notification.title,
          message: notification.message,
          createdAt: notification.createdAt,
        });
      }
    }

    return res.status(
      deliverySummary.email.failed || deliverySummary.whatsapp.failed ? 207 : 200,
    ).json({
      success: true,
      message:
        deliverySummary.email.failed || deliverySummary.whatsapp.failed
          ? "Notification was added to recipient dashboards, but some external deliveries failed"
          : "Notification sent successfully",
      data: notification,
    });
  } catch (error) {
    console.error("Unable to send notification:", error);
    return res.status(500).json({
      success: false,
      message: "Unable to send notification",
    });
  }
};

exports.getMyNotifications = async (req, res) => {
  try {
    const page = Math.max(1, Number.parseInt(req.query.page, 10) || 1);
    const limit = Math.min(50, Math.max(1, Number.parseInt(req.query.limit, 10) || 10));
    const filter = { recipients: req.user.id };
    const [total, unreadCount, data] = await Promise.all([
      Notification.countDocuments(filter),
      Notification.countDocuments({
        ...filter,
        readBy: { $ne: req.user.id },
      }),
      Notification.find(filter)
        .populate("sender", "name")
        .populate("classId", "className section")
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit),
    ]);
    return res.json({
      success: true,
      data,
      total,
      unreadCount,
      page,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

exports.getUnreadCount = async (req, res) => {
  try {
    const count = await Notification.countDocuments({
      recipients: req.user.id,
      readBy: { $ne: req.user.id },
    });
    return res.json({ success: true, count });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

exports.markAsRead = async (req, res) => {
  try {
    const notification = await Notification.findOneAndUpdate(
      { _id: req.params.id, recipients: req.user.id },
      { $addToSet: { readBy: req.user.id } },
      { new: true },
    );
    if (!notification) {
      return res.status(404).json({
        success: false,
        message: "Notification not found for this account",
      });
    }
    return res.json({ success: true, data: notification });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

exports.markAllAsRead = async (req, res) => {
  try {
    const result = await Notification.updateMany(
      { recipients: req.user.id, readBy: { $ne: req.user.id } },
      { $addToSet: { readBy: req.user.id } },
    );
    return res.json({ success: true, modifiedCount: result.modifiedCount });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

exports.getNotificationHistory = async (req, res) => {
  try {
    if (!["admin", "teacher"].includes(req.user.role)) {
      return res.status(403).json({ success: false, message: "Forbidden" });
    }
    const page = Math.max(1, Number.parseInt(req.query.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, Number.parseInt(req.query.limit, 10) || 10));
    const filter = req.user.role === "admin" ? {} : { sender: req.user.id };
    const search = String(req.query.search || "").trim();
    if (search) {
      const expression = new RegExp(escapeRegex(search), "i");
      filter.$or = [
        { title: expression },
        { message: expression },
      ];
    }
    if (req.query.classId) {
      if (!mongoose.Types.ObjectId.isValid(req.query.classId)) {
        return res.status(400).json({ success: false, message: "Invalid class" });
      }
      filter.classId = req.query.classId;
    }
    if (req.query.type) {
      const validTypes = [
        "broadcast",
        "all",
        "all_students",
        "all_teachers",
        "teachers",
        "students",
        "class",
        "individual",
      ];
      if (!validTypes.includes(req.query.type)) {
        return res.status(400).json({ success: false, message: "Invalid notification type" });
      }
      filter.type = req.query.type;
    }
    if (req.query.startDate || req.query.endDate) {
      filter.createdAt = {};
      if (req.query.startDate) {
        const startDate = new Date(`${req.query.startDate}T00:00:00.000Z`);
        if (Number.isNaN(startDate.getTime())) {
          return res.status(400).json({ success: false, message: "Invalid start date" });
        }
        filter.createdAt.$gte = startDate;
      }
      if (req.query.endDate) {
        const endDate = new Date(`${req.query.endDate}T23:59:59.999Z`);
        if (Number.isNaN(endDate.getTime())) {
          return res.status(400).json({ success: false, message: "Invalid end date" });
        }
        filter.createdAt.$lte = endDate;
      }
    }
    const [total, data] = await Promise.all([
      Notification.countDocuments(filter),
      Notification.find(filter)
        .populate("sender", "name")
        .populate("classId", "className section")
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit),
    ]);
    return res.json({
      success: true,
      data,
      total,
      page,
      totalPages: Math.max(1, Math.ceil(total / limit)),
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

exports.deleteNotification = async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ success: false, message: "Only administrators can delete notification records" });
    }
    const notification = await Notification.findByIdAndDelete(req.params.id);
    if (!notification) {
      return res.status(404).json({ success: false, message: "Notification not found" });
    }
    return res.json({ success: true, message: "Notification deleted" });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
