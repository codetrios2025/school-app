const Subject = require("../models/Subject");

// ➕ Create
exports.createSubject = async (req, res) => {
  try {
    const name = req.body.name.trim();

    const exists = await Subject.findOne({ name });
    if (exists) {
      return res
        .status(400)
        .json({ success: false, message: "Subject already exists" });
    }

    const data = await Subject.create({ name });
    res.status(201).json({ success: true, data });
  } catch (err) {
    // duplicate key fallback
    if (err.code === 11000) {
      return res
        .status(400)
        .json({ success: false, message: "Subject already exists" });
    }
    res
      .status(500)
      .json({ success: false, message: err.message || "Server error" });
  }
};

// 📄 Get (search + pagination + sorting)
exports.getSubjects = async (req, res) => {
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

    const allowedSortFields = ["name", "createdAt"];
    if (!allowedSortFields.includes(sortField)) sortField = "createdAt";

    const query = search ? { name: { $regex: search, $options: "i" } } : {};

    const sort = { [sortField]: sortOrder === "asc" ? 1 : -1 };

    const total = await Subject.countDocuments(query);

    const data = await Subject.find(query)
      .sort(sort)
      .skip((page - 1) * limit)
      .limit(limit);

    res.json({
      success: true,
      data,
      total,
      page,
      totalPages: Math.ceil(total / limit),
      limit,
    });
  } catch (err) {
    res
      .status(500)
      .json({ success: false, message: err.message || "Server error" });
  }
};

// ✏️ Update
exports.updateSubject = async (req, res) => {
  try {
    const name = req.body.name.trim();

    const exists = await Subject.findOne({
      name,
      _id: { $ne: req.params.id },
    });
    if (exists) {
      return res
        .status(400)
        .json({ success: false, message: "Subject already exists" });
    }

    const data = await Subject.findByIdAndUpdate(
      req.params.id,
      { name },
      { new: true },
    );

    res.json({ success: true, data });
  } catch (err) {
    res
      .status(500)
      .json({ success: false, message: err.message || "Server error" });
  }
};

// ❌ Delete
exports.deleteSubject = async (req, res) => {
  try {
    await Subject.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: "Deleted successfully" });
  } catch (err) {
    res
      .status(500)
      .json({ success: false, message: err.message || "Server error" });
  }
};
