const Fee = require("../models/Fee");
const Student = require("../models/Student");
const User = require("../models/User");
const Notification = require("../models/Notification");
const mongoose = require("mongoose");

const toMinorUnits = (amount) => Math.round(Number(amount) * 100);

const getFeeStatus = (fee, paidAmount, balance) => {
  if (balance <= 0) return "paid";
  const today = new Date();
  const todayUtc = Date.UTC(
    today.getUTCFullYear(),
    today.getUTCMonth(),
    today.getUTCDate(),
  );

  if (new Date(fee.dueDate).getTime() < todayUtc) return "overdue";
  return paidAmount > 0 ? "partial" : "pending";
};

const serializeFee = (fee) => {
  const data = fee.toObject();
  const paidMinor = data.payments.reduce(
    (sum, payment) => sum + toMinorUnits(payment.amount),
    0,
  );
  const amountMinor = toMinorUnits(data.amount);
  const balanceMinor = Math.max(0, amountMinor - paidMinor);
  const paidAmount = paidMinor / 100;
  const balance = balanceMinor / 100;

  return {
    ...data,
    paidAmount,
    balance,
    status: getFeeStatus(data, paidAmount, balance),
  };
};

const notifyUsers = async (req, recipientIds, title, message) => {
  const uniqueIds = [...new Set(recipientIds.map(String))];
  if (!uniqueIds.length) return;
  try {
    const notification = await Notification.create({
      title,
      message,
      sender: req.user.id,
      type: "individual",
      recipients: uniqueIds,
      channels: ["inApp"],
    });
    const io = req.app.get("io");
    if (io) {
      uniqueIds.forEach((id) =>
        io.to(id).emit("new_notification", {
          id: notification._id,
          title,
          message,
          createdAt: notification.createdAt,
        }),
      );
    }
  } catch (error) {
    console.error("Unable to create fee notification:", error);
  }
};

const getFeeContactUserIds = async (studentId) => {
  const student = await Student.findById(studentId).select("userId parentEmail");
  if (!student) return [];
  const ids = student.userId ? [String(student.userId)] : [];
  if (student.parentEmail) {
    const parent = await User.findOne({
      role: "parent",
      email: student.parentEmail.toLowerCase(),
      $or: [{ status: "active" }, { status: { $exists: false } }],
    }).select("_id");
    if (parent) ids.push(String(parent._id));
  }
  return ids;
};

const isFeeVisibleToUser = async (fee, user) => {
  const student = await Student.findById(fee.studentId).select(
    "userId parentEmail",
  );
  if (!student) return false;
  if (
    user.role === "student" &&
    String(student.userId) === String(user.id)
  ) {
    return true;
  }
  if (user.role === "parent") {
    const parent = await User.findById(user.id).select("email");
    return Boolean(
      parent?.email &&
        student.parentEmail?.toLowerCase() === parent.email.toLowerCase(),
    );
  }
  return false;
};

const feeStatusFilter = (status) => {
  const now = new Date();
  const todayUtc = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()),
  );
  const paidAmount = {
    $sum: {
      $map: {
        input: { $ifNull: ["$payments", []] },
        as: "payment",
        in: "$$payment.amount",
      },
    },
  };

  if (status === "paid") {
    return { $expr: { $gte: [paidAmount, "$amount"] } };
  }

  if (status === "overdue") {
    return {
      dueDate: { $lt: todayUtc },
      $expr: { $lt: [paidAmount, "$amount"] },
    };
  }

  if (status === "partial") {
    return {
      dueDate: { $gte: todayUtc },
      $expr: {
        $and: [
          { $gt: [paidAmount, 0] },
          { $lt: [paidAmount, "$amount"] },
        ],
      },
    };
  }

  if (status === "pending") {
    return {
      dueDate: { $gte: todayUtc },
      $expr: { $eq: [paidAmount, 0] },
    };
  }

  return {};
};

exports.getFees = async (req, res) => {
  try {
    let studentIds;

    if (req.user.role === "student") {
      const student = await Student.findOne({ userId: req.user.id }).select(
        "_id",
      );
      studentIds = student ? [student._id] : [];
    } else if (req.user.role === "parent") {
      const parent = await User.findById(req.user.id).select("email");
      if (!parent) {
        return res.status(404).json({
          success: false,
          message: "Parent account not found",
        });
      }

      const students = await Student.find({
        parentEmail: new RegExp(
          `^${parent.email.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`,
          "i",
        ),
      }).select("_id");
      studentIds = students.map((student) => student._id);
    }

    const page = Math.max(1, Number.parseInt(req.query.page, 10) || 1);
    const limit = Math.min(
      100,
      Math.max(1, Number.parseInt(req.query.limit, 10) || 20),
    );
    const filter = {};
    const scopedStudentIds = studentIds ? [...studentIds] : null;

    if (req.query.studentId && !mongoose.Types.ObjectId.isValid(req.query.studentId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid student",
      });
    }

    if (req.query.classId) {
      if (!mongoose.Types.ObjectId.isValid(req.query.classId)) {
        return res.status(400).json({
          success: false,
          message: "Invalid class",
        });
      }
      const classStudents = await Student.find({
        classId: req.query.classId,
      }).distinct("_id");
      if (scopedStudentIds) {
        const classStudentIds = new Set(classStudents.map(String));
        filter.studentId = {
          $in: scopedStudentIds.filter((id) => classStudentIds.has(String(id))),
        };
      } else {
        filter.studentId = { $in: classStudents };
      }
    } else if (scopedStudentIds) {
      filter.studentId = { $in: scopedStudentIds };
    } else if (req.query.studentId) {
      filter.studentId = req.query.studentId;
    }

    if (req.query.studentId && filter.studentId?.$in) {
      filter.studentId.$in = filter.studentId.$in.filter(
        (id) => String(id) === String(req.query.studentId),
      );
    }

    if (req.query.academicYear) {
      filter.academicYear = req.query.academicYear;
    }

    Object.assign(filter, feeStatusFilter(req.query.status));
    if (req.query.reviewStatus && req.query.reviewStatus !== "all") {
      filter.paymentSubmissions = {
        $elemMatch: { status: req.query.reviewStatus },
      };
    }

    const total = await Fee.countDocuments(filter);
    const fees = await Fee.find(filter)
      .populate({
        path: "studentId",
        select: "rollNumber classId",
        populate: [
          { path: "userId", select: "name email" },
          { path: "classId", select: "className section" },
        ],
      })
      .populate("payments.receivedBy", "name")
      .populate("paymentSubmissions.submittedBy", "name role")
      .populate("paymentSubmissions.reviewedBy", "name")
      .sort({ dueDate: 1, createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    res.json({
      success: true,
      data: fees.map(serializeFee),
      total,
      page,
      totalPages: Math.ceil(total / limit),
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.createFee = async (req, res) => {
  try {
    const { studentId, title, academicYear, amount, dueDate, description } =
      req.body;
    const student = await Student.findById(studentId);

    if (!student) {
      return res.status(404).json({
        success: false,
        message: "Student not found",
      });
    }

    const fee = await Fee.create({
      studentId,
      title,
      academicYear,
      amount: toMinorUnits(amount) / 100,
      dueDate,
      description,
    });

    const populatedFee = await Fee.findById(fee._id)
      .populate({
        path: "studentId",
        select: "rollNumber classId",
        populate: [
          { path: "userId", select: "name email" },
          { path: "classId", select: "className section" },
        ],
      });

    res.status(201).json({
      success: true,
      data: serializeFee(populatedFee),
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.importFees = async (req, res) => {
  try {
  const { rows, classId } = req.body;
  if (!Array.isArray(rows) || rows.length < 1 || rows.length > 500) {
    return res.status(400).json({
      success: false,
      message: "Import between 1 and 500 fee rows at a time",
    });
  }
  if (classId && !mongoose.Types.ObjectId.isValid(classId)) {
    return res.status(400).json({
      success: false,
      message: "Select a valid class",
    });
  }

  const result = { created: 0, updated: 0, failed: 0, errors: [] };
  let processedRecords = 0;
  let classStudents;
  if (classId) {
    classStudents = await Student.find({
      classId,
      status: { $ne: "inactive" },
    })
      .select("_id")
      .lean();
    if (!classStudents.length) {
      return res.status(400).json({
        success: false,
        message: "The selected class has no active students",
      });
    }
  }

  for (const [index, row] of rows.entries()) {
    const rowNumber = Number(row?.__rowNumber) || index + 2;
    try {
      if (!row || typeof row !== "object" || Array.isArray(row)) {
        throw new Error("Fee row must contain spreadsheet fields");
      }
      const title = String(row.title || "").trim();
      const academicYear = String(row.academicYear || "").trim();
      const amount = Number(row.amount);
      const dueDateText = String(row.dueDate || "").trim();
      const dueDate = new Date(`${dueDateText}T00:00:00.000Z`);
      const description = String(row.description || "").trim();
      const currency = String(row.currency || "INR").trim().toUpperCase();
      const admissionNo = String(row.admissionNo || "").trim();
      const rollNumber = String(row.rollNumber || "").trim();
      const studentEmail = String(row.studentEmail || "").trim().toLowerCase();

      if (!title || title.length > 100) {
        throw new Error("Fee title is required and must be 100 characters or fewer");
      }
      if (!academicYear || academicYear.length > 20) {
        throw new Error("Academic year is required and must be 20 characters or fewer");
      }
      if (!Number.isFinite(amount) || amount <= 0 || !/^\d+(\.\d{1,2})?$/.test(String(row.amount).trim())) {
        throw new Error("Amount must be positive with at most two decimal places");
      }
      if (
        !/^\d{4}-\d{2}-\d{2}$/.test(dueDateText) ||
        Number.isNaN(dueDate.getTime()) ||
        dueDate.toISOString().slice(0, 10) !== dueDateText
      ) {
        throw new Error("Due date must be a valid YYYY-MM-DD date");
      }
      if (description.length > 1000) {
        throw new Error("Description cannot exceed 1000 characters");
      }
      if (!/^[A-Z]{3}$/.test(currency)) {
        throw new Error("Currency must be a three-letter currency code");
      }
      try {
        new Intl.NumberFormat("en", {
          style: "currency",
          currency,
        }).format(amount);
      } catch {
        throw new Error("Currency is not supported");
      }

      const hasStudentIdentifier = admissionNo || rollNumber || studentEmail;
      if (!classId && !hasStudentIdentifier) {
        throw new Error("All-school imports require admissionNo, rollNumber, or studentEmail");
      }

      let targets;
      if (!hasStudentIdentifier) {
        targets = classStudents;
      } else {
        const studentFilter = {
          status: { $ne: "inactive" },
          ...(classId && { classId }),
        };
        if (admissionNo) {
          studentFilter.admissionNo = new RegExp(
            `^${admissionNo.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`,
            "i",
          );
        }
        if (rollNumber) studentFilter.rollNumber = rollNumber;
        if (studentEmail) {
          const studentUser = await User.findOne({
            role: "student",
            email: studentEmail,
          }).select("_id");
          if (!studentUser) throw new Error(`No student account found for ${studentEmail}`);
          studentFilter.userId = studentUser._id;
        }
        targets = await Student.find(studentFilter).select("_id").lean();
        if (targets.length !== 1) {
          throw new Error(
            targets.length
              ? "Student identifiers match more than one student"
              : "No active student matches the supplied identifiers in the selected scope",
          );
        }
      }

      if (processedRecords + targets.length > 5000) {
        throw new Error("This import expands to more than 5,000 fee records");
      }
      const targetIds = targets.map((target) => target._id);
      const escapedTitle = title.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const escapedYear = academicYear.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const existingFees = await Fee.find({
        studentId: { $in: targetIds },
        title: new RegExp(`^${escapedTitle}$`, "i"),
        academicYear: new RegExp(`^${escapedYear}$`, "i"),
      });
      const existingByStudent = new Map(
        existingFees.map((fee) => [String(fee.studentId), fee]),
      );
      const updates = [];
      const creates = [];
      for (const target of targets) {
        const existing = existingByStudent.get(String(target._id));
        if (existing) {
          if (
            existing.payments.length ||
            existing.paymentSubmissions.some(
              (payment) => payment.status === "pending",
            )
          ) {
            throw new Error(
              `Fee "${title}" for a student already has payments or a pending payment review and cannot be changed by import`,
            );
          }
          existing.title = title;
          existing.academicYear = academicYear;
          existing.amount = toMinorUnits(amount) / 100;
          existing.currency = currency;
          existing.dueDate = dueDate;
          existing.description = description;
          updates.push(existing);
        } else {
          creates.push({
            studentId: target._id,
            title,
            academicYear,
            amount: toMinorUnits(amount) / 100,
            currency,
            dueDate,
            description,
          });
        }
      }
      await Promise.all(updates.map((fee) => fee.save()));
      if (creates.length) await Fee.insertMany(creates);
      processedRecords += targets.length;
      result.updated += updates.length;
      result.created += creates.length;
    } catch (error) {
      result.failed += 1;
      result.errors.push({ row: rowNumber, message: error.message });
    }
  }

  return res.json({
    success: true,
    message: "Fee import processed",
    data: result,
  });
  } catch (error) {
    console.error("Unable to import fee records:", error);
    return res.status(500).json({
      success: false,
      message: "Unable to import fee records",
    });
  }
};

exports.recordPayment = async (req, res) => {
  try {
    const { amount, method, reference } = req.body;
    const fee = await Fee.findById(req.params.id);

    if (!fee) {
      return res.status(404).json({
        success: false,
        message: "Fee record not found",
      });
    }

    const paidMinor = fee.payments.reduce(
      (sum, payment) => sum + toMinorUnits(payment.amount),
      0,
    );
    const balanceMinor = toMinorUnits(fee.amount) - paidMinor;
    const paymentMinor = toMinorUnits(amount);

    if (paymentMinor > balanceMinor) {
      return res.status(400).json({
        success: false,
        message: "Payment cannot exceed the outstanding balance",
      });
    }

    fee.payments.push({
      amount: paymentMinor / 100,
      method,
      reference,
      receivedBy: req.user.id,
    });

    await fee.save();

    const populatedFee = await Fee.findById(fee._id)
      .populate({
        path: "studentId",
        select: "rollNumber classId",
        populate: [
          { path: "userId", select: "name email" },
          { path: "classId", select: "className section" },
        ],
      })
      .populate("payments.receivedBy", "name");

    res.json({
      success: true,
      data: serializeFee(populatedFee),
    });
  } catch (err) {
    if (err.name === "VersionError") {
      return res.status(409).json({
        success: false,
        message: "This fee was updated by another user. Refresh and try again.",
      });
    }

    res.status(500).json({ success: false, message: err.message });
  }
};

exports.submitPayment = async (req, res) => {
  try {
    const fee = await Fee.findById(req.params.id);
    if (!fee) {
      return res.status(404).json({
        success: false,
        message: "Fee record not found",
      });
    }
    if (!(await isFeeVisibleToUser(fee, req.user))) {
      return res.status(403).json({
        success: false,
        message: "You cannot submit payment for this student",
      });
    }

    const paidMinor = fee.payments.reduce(
      (sum, payment) => sum + toMinorUnits(payment.amount),
      0,
    );
    const pendingMinor = fee.paymentSubmissions
      .filter((submission) => submission.status === "pending")
      .reduce(
        (sum, submission) => sum + toMinorUnits(submission.amount),
        0,
      );
    const paymentMinor = toMinorUnits(req.body.amount);
    const availableMinor = toMinorUnits(fee.amount) - paidMinor - pendingMinor;
    if (paymentMinor > availableMinor) {
      return res.status(400).json({
        success: false,
        message: "Payment exceeds the outstanding amount not already under review",
      });
    }

    fee.paymentSubmissions.push({
      amount: paymentMinor / 100,
      method: req.body.method,
      reference: req.body.reference,
      submittedBy: req.user.id,
      status: "pending",
    });
    await fee.save();

    const student = await Student.findById(fee.studentId).select("userId");
    const admins = await User.find({
      role: "admin",
      $or: [{ status: "active" }, { status: { $exists: false } }],
    }).distinct("_id");
    await notifyUsers(
      req,
      admins,
      "Manual fee payment submitted",
      `${student?.userId ? "A student or parent" : "A parent"} submitted ${fee.currency} ${(paymentMinor / 100).toFixed(2)} for "${fee.title}". Review the submission in Fee management.`,
    );

    const populatedFee = await Fee.findById(fee._id)
      .populate({
        path: "studentId",
        select: "rollNumber classId",
        populate: [
          { path: "userId", select: "name email" },
          { path: "classId", select: "className section" },
        ],
      })
      .populate("paymentSubmissions.submittedBy", "name role")
      .populate("paymentSubmissions.reviewedBy", "name");

    return res.status(201).json({
      success: true,
      message: "Payment submitted for administrator review",
      data: serializeFee(populatedFee),
    });
  } catch (error) {
    if (error.name === "VersionError") {
      return res.status(409).json({
        success: false,
        message: "This fee was updated by another user. Refresh and try again.",
      });
    }
    return res.status(500).json({ success: false, message: error.message });
  }
};

exports.reviewPaymentSubmission = async (req, res) => {
  try {
    const fee = await Fee.findById(req.params.id);
    if (!fee) {
      return res.status(404).json({
        success: false,
        message: "Fee record not found",
      });
    }
    const submission = fee.paymentSubmissions.id(req.params.submissionId);
    if (!submission) {
      return res.status(404).json({
        success: false,
        message: "Payment submission not found",
      });
    }
    if (submission.status !== "pending") {
      return res.status(409).json({
        success: false,
        message: "This payment submission has already been reviewed",
      });
    }

    const reviewStatus = req.body.status;
    const reviewNote = String(req.body.reviewNote || "").trim();
    if (reviewStatus === "rejected" && !reviewNote) {
      return res.status(400).json({
        success: false,
        message: "Provide a reason when rejecting a payment submission",
      });
    }

    if (reviewStatus === "approved") {
      const paidMinor = fee.payments.reduce(
        (sum, payment) => sum + toMinorUnits(payment.amount),
        0,
      );
      if (toMinorUnits(submission.amount) > toMinorUnits(fee.amount) - paidMinor) {
        return res.status(409).json({
          success: false,
          message: "The outstanding balance changed; this payment cannot be approved",
        });
      }
      fee.payments.push({
        amount: submission.amount,
        method: submission.method,
        reference: submission.reference,
        receivedAt: new Date(),
        receivedBy: req.user.id,
        submissionId: submission._id,
      });
    }

    submission.status = reviewStatus;
    submission.reviewedBy = req.user.id;
    submission.reviewedAt = new Date();
    submission.reviewNote = reviewNote;
    await fee.save();

    const recipientIds = await getFeeContactUserIds(fee.studentId);
    const decisionText =
      reviewStatus === "approved"
        ? `Your payment of ${fee.currency} ${submission.amount.toFixed(2)} for "${fee.title}" was approved.`
        : `Your payment of ${fee.currency} ${submission.amount.toFixed(2)} for "${fee.title}" was not approved. Reason: ${reviewNote}`;
    await notifyUsers(req, recipientIds, "Fee payment update", decisionText);

    const populatedFee = await Fee.findById(fee._id)
      .populate({
        path: "studentId",
        select: "rollNumber classId",
        populate: [
          { path: "userId", select: "name email" },
          { path: "classId", select: "className section" },
        ],
      })
      .populate("payments.receivedBy", "name")
      .populate("paymentSubmissions.submittedBy", "name role")
      .populate("paymentSubmissions.reviewedBy", "name");

    return res.json({
      success: true,
      message: `Payment submission ${reviewStatus}`,
      data: serializeFee(populatedFee),
    });
  } catch (error) {
    if (error.name === "VersionError") {
      return res.status(409).json({
        success: false,
        message: "This fee was updated by another user. Refresh and try again.",
      });
    }
    return res.status(500).json({ success: false, message: error.message });
  }
};
