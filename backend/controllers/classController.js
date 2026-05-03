const Class = require("../models/Class");

// ➕ Create Class
exports.createClass = async (req, res) => {
  try {
    const { className, section } = req.body;

    const existing = await Class.findOne({ className, section });
    if (existing) {
      return res.status(400).json({
        success: false,
        message: "Class already exists",
      });
    }

    const newClass = await Class.create({ className, section });

    res.status(201).json({
      success: true,
      data: newClass,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// 📄 Get All Classes
exports.getClassesold = async (req, res) => {
  try {
    const classes = await Class.find().sort({ className: 1 });

    res.json({ success: true, data: classes });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
exports.getClasses = async (req, res) => {
  try {
    // 🔹 Extract query params safely
    let {
      page = 1,
      limit = 6,
      search = "",
      sortField = "createdAt",
      sortOrder = "desc",
    } = req.query;

    // 🔹 Convert to numbers
    page = Number(page);
    limit = Number(limit);

    // 🔹 Build search query
    const query = search
      ? {
          $or: [
            { className: { $regex: search, $options: "i" } },
            { section: { $regex: search, $options: "i" } },
          ],
        }
      : {};

    // 🔹 Sorting logic
    const sort = {
      [sortField]: sortOrder === "asc" ? 1 : -1,
    };

    // 🔹 Total count
    const total = await Class.countDocuments(query);

    // 🔹 Fetch data
    const data = await Class.find(query)
      .sort(sort)
      .skip((page - 1) * limit)
      .limit(limit);

    // 🔹 Response
    res.json({
      success: true,
      data,
      total,
      page,
      totalPages: Math.ceil(total / limit),
      limit,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message || "Server Error",
    });
  }
};

// ✏️ Update Class
exports.updateClass = async (req, res) => {
  try {
    const updated = await Class.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
    });

    res.json({ success: true, data: updated });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ❌ Delete Class
exports.deleteClass = async (req, res) => {
  try {
    await Class.findByIdAndDelete(req.params.id);

    res.json({ success: true, message: "Deleted" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
