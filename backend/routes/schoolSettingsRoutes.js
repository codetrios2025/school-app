const express = require("express");
const router = express.Router();
const {
  getSchoolLogo,
  getSchoolSettings,
  updateSchoolSettings,
} = require("../controllers/schoolSettingsController");
const { protect, authorize } = require("../middleware/authMiddleware");
const schoolLogoUpload = require("../middleware/schoolLogoUpload");

router.get("/", protect, getSchoolSettings);
router.put(
  "/",
  protect,
  authorize("admin"),
  schoolLogoUpload,
  updateSchoolSettings,
);
router.get("/logo", protect, getSchoolLogo);

module.exports = router;
