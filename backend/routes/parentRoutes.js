const express = require("express");
const { protect } = require("../middleware/authMiddleware");
const { getParentDashboard } = require("../controllers/parentController");

const router = express.Router();

router.get("/dashboard", protect, getParentDashboard);

module.exports = router;
