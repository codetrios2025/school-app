const express = require("express");
const { protect, authorize } = require("../middleware/authMiddleware");
const { getParentDashboard } = require("../controllers/parentController");

const router = express.Router();

router.get(
  "/dashboard",
  protect,
  authorize("parent", "student"),
  getParentDashboard,
);

module.exports = router;
