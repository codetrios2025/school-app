const Assignment = require("../models/TeacherAssignment");
const User = require("../models/User");
const Class = require("../models/Class");
const Subject = require("../models/Subject");
const { sendEmail } = require("../utils/sendEmail");
const { teacherAssignmentTemplate } = require("../utils/emailTemplates");

const assignmentQuery = (query, teacherScope) => {
  const conditions = [];
  if (teacherScope) conditions.push({ teacherId: teacherScope });
  if (query.teacherId) conditions.push({ teacherId: query.teacherId });
  if (query.classId) conditions.push({ classId: query.classId });
  if (query.subjectId) conditions.push({ subjectId: query.subjectId });

  const search = String(query.search || "").trim();
  if (search) {
    const safeSearch = search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const regex = { $regex: safeSearch, $options: "i" };
    conditions.push({
      $or: [
        { title: regex },
        { description: regex },
        { teacherId: { $in: query.matchingTeacherIds } },
        { classId: { $in: query.matchingClassIds } },
        { subjectId: { $in: query.matchingSubjectIds } },
      ],
    });
  }
  return conditions.length ? { $and: conditions } : {};
};

const allocationList = (body) =>
  Array.isArray(body.allocations)
    ? body.allocations
    : [{ classId: body.classId, subjectId: body.subjectId }];

exports.createAssignment = async (req, res) => {
  try {
    const { teacherId } = req.body;
    const allocations = allocationList(req.body);
    const teacher = await User.findOne({
      _id: teacherId,
      role: "teacher",
      $or: [{ status: "active" }, { status: { $exists: false } }],
    });

    if (!teacher) {
      return res.status(400).json({
        success: false,
        message: "Select an active teacher",
      });
    }

    const classes = await Class.find({
      _id: { $in: allocations.map((item) => item.classId) },
    });
    const subjects = await Subject.find({
      _id: { $in: allocations.map((item) => item.subjectId) },
    });
    if (classes.length !== new Set(allocations.map((item) => item.classId)).size) {
      return res.status(400).json({
        success: false,
        message: "One or more selected classes do not exist",
      });
    }
    if (
      subjects.length !== new Set(allocations.map((item) => item.subjectId)).size
    ) {
      return res.status(400).json({
        success: false,
        message: "One or more selected subjects do not exist",
      });
    }

    const uniqueKeys = new Set();
    for (const allocation of allocations) {
      const key = `${allocation.classId}:${allocation.subjectId}`;
      if (uniqueKeys.has(key)) {
        return res.status(409).json({
          success: false,
          message: "The same class and subject are listed more than once",
        });
      }
      uniqueKeys.add(key);
    }

    const existingCount = await Assignment.countDocuments({
      teacherId,
      $or: allocations.map(({ classId, subjectId }) => ({
        classId,
        subjectId,
      })),
    });
    if (existingCount) {
      return res.status(409).json({
        success: false,
        message: "This teacher already has one or more selected subject assignments",
      });
    }

    const classById = new Map(classes.map((item) => [item._id.toString(), item]));
    const subjectById = new Map(
      subjects.map((item) => [item._id.toString(), item]),
    );
    const assignmentData = allocations.map((allocation) => {
      const schoolClass = classById.get(allocation.classId);
      const subject = subjectById.get(allocation.subjectId);
      return {
        teacherId,
        classId: allocation.classId,
        subjectId: allocation.subjectId,
        title:
          req.body.title ||
          `${subject.name} - ${schoolClass.className} ${schoolClass.section}`,
        description: req.body.description || "",
      };
    });

    let assignments;
    try {
      assignments = await Assignment.insertMany(assignmentData, {
        ordered: true,
      });
    } catch (error) {
      if (error.code === 11000) {
        return res.status(409).json({
          success: false,
          message: "One or more selected subject assignments already exist",
        });
      }
      throw error;
    }

    const emailResults = await Promise.allSettled(
      assignments.map((assignment) => {
        const schoolClass = classById.get(assignment.classId.toString());
        const subject = subjectById.get(assignment.subjectId.toString());
        return sendEmail({
          to: teacher.email,
          subject: "New Teaching Assignment",
          html: teacherAssignmentTemplate({
            teacherName: teacher.name,
            assignmentTitle: assignment.title,
            description: assignment.description,
            className: schoolClass.className,
            section: schoolClass.section,
            subject: subject.name,
            loginUrl: `${process.env.FRONTEND_URL}/`,
            actionType: "assigned",
          }),
        });
      }),
    );
    const failedEmails = emailResults.filter(
      (result) => result.status === "rejected",
    );
    failedEmails.forEach((result) =>
      console.error(
        "Unable to email teacher assignment:",
        result.reason?.message || result.reason,
      ),
    );
    const emailSent = failedEmails.length === 0;

    const data = await Assignment.find({
      _id: { $in: assignments.map((item) => item._id) },
    })
      .populate("teacherId", "name email")
      .populate("classId", "className section")
      .populate("subjectId", "name")
      .sort({ createdAt: -1 });

    return res.status(201).json({
      success: true,
      emailSent,
      message: emailSent
        ? "Teaching assignments saved and teacher notified"
        : "Teaching assignments saved, but one or more notification emails could not be sent",
      data,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

exports.getAssignments = async (req, res) => {
  try {
    const page = Math.max(1, Number.parseInt(req.query.page, 10) || 1);
    const limit = Math.min(
      100,
      Math.max(1, Number.parseInt(req.query.limit, 10) || 100),
    );
    const search = String(req.query.search || "").trim();
    let matchingTeacherIds = [];
    let matchingClassIds = [];
    let matchingSubjectIds = [];
    if (search) {
      const safeSearch = search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const regex = { $regex: safeSearch, $options: "i" };
      [matchingTeacherIds, matchingClassIds, matchingSubjectIds] =
        await Promise.all([
          User.find({ role: "teacher", $or: [{ name: regex }, { email: regex }] })
            .distinct("_id"),
          Class.find({ $or: [{ className: regex }, { section: regex }] })
            .distinct("_id"),
          Subject.find({ name: regex }).distinct("_id"),
        ]);
    }
    const filter = assignmentQuery(
      { ...req.query, matchingTeacherIds, matchingClassIds, matchingSubjectIds },
      req.user.role === "teacher" ? req.user.id : null,
    );
    const [total, assignments] = await Promise.all([
      Assignment.countDocuments(filter),
      Assignment.find(filter)
        .populate("teacherId", "name email")
        .populate("classId", "className section")
        .populate("subjectId", "name")
        .sort({ createdAt: -1, _id: -1 })
        .skip((page - 1) * limit)
        .limit(limit),
    ]);

    return res.json({
      success: true,
      data: assignments,
      total,
      page,
      limit,
      totalPages: Math.max(1, Math.ceil(total / limit)),
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

exports.updateAssignment = async (req, res) => {
  try {
    const assignment = await Assignment.findById(req.params.id);
    if (!assignment) {
      return res.status(404).json({
        success: false,
        message: "Teaching assignment not found",
      });
    }

    const { teacherId, classId, subjectId } = req.body;
    const teacher = await User.findOne({
      _id: teacherId,
      role: "teacher",
      $or: [{ status: "active" }, { status: { $exists: false } }],
    });
    if (!teacher) {
      return res.status(400).json({
        success: false,
        message: "Select an active teacher",
      });
    }

    const [schoolClass, subject, duplicate] = await Promise.all([
      Class.findById(classId),
      Subject.findById(subjectId),
      Assignment.exists({
        _id: { $ne: assignment._id },
        teacherId,
        classId,
        subjectId,
      }),
    ]);
    if (!schoolClass || !subject) {
      return res.status(400).json({
        success: false,
        message: "Select a valid class and subject",
      });
    }
    if (duplicate) {
      return res.status(409).json({
        success: false,
        message: "This teacher already has this subject assignment",
      });
    }

    assignment.teacherId = teacherId;
    assignment.classId = classId;
    assignment.subjectId = subjectId;
    assignment.title =
      req.body.title ||
      `${subject.name} - ${schoolClass.className} ${schoolClass.section}`;
    assignment.description = req.body.description || "";
    await assignment.save();

    let emailSent = true;
    try {
      await sendEmail({
        to: teacher.email,
        subject: "Teaching Assignment Updated",
        html: teacherAssignmentTemplate({
          teacherName: teacher.name,
          assignmentTitle: assignment.title,
          description: assignment.description,
          className: schoolClass.className,
          section: schoolClass.section,
          subject: subject.name,
          loginUrl: `${process.env.FRONTEND_URL}/`,
          actionType: "updated",
        }),
      });
    } catch (error) {
      emailSent = false;
      console.error("Unable to email updated teacher assignment:", error.message);
    }

    const data = await Assignment.findById(assignment._id)
      .populate("teacherId", "name email")
      .populate("classId", "className section")
      .populate("subjectId", "name");
    return res.json({
      success: true,
      emailSent,
      message: emailSent
        ? "Teaching assignment updated and teacher notified"
        : "Teaching assignment updated, but the teacher notification email could not be sent",
      data,
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "This teacher already has this subject assignment",
      });
    }
    return res.status(500).json({ success: false, message: error.message });
  }
};

exports.deleteAssignment = async (req, res) => {
  try {
    const assignment = await Assignment.findByIdAndDelete(req.params.id);
    if (!assignment) {
      return res.status(404).json({
        success: false,
        message: "Teaching assignment not found",
      });
    }
    return res.json({ success: true, message: "Teaching assignment deleted" });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
