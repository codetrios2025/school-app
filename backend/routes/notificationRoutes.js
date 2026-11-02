const express = require("express");
const router = express.Router();
const {
  getMyNotifications,
  getUnreadCount,
  markAsRead,
  sendNotification,
  getNotificationClasses,
  getNotificationRecipients,
  getNotificationHistory,
  markAllAsRead,
  deleteNotification,
} = require("../controllers/notificationModuleController");

const { protect, authorize } = require("../middleware/authMiddleware");

router.post("/", protect, authorize("admin", "teacher"), sendNotification);
router.get("/", protect, getMyNotifications);
router.get("/count", protect, getUnreadCount);
router.get("/history", protect, authorize("admin", "teacher"), getNotificationHistory);
router.get("/classes", protect, authorize("admin", "teacher"), getNotificationClasses);
router.get("/recipients", protect, authorize("admin", "teacher"), getNotificationRecipients);
router.put("/read-all", protect, markAllAsRead);
router.put("/:id/read", protect, markAsRead);
router.delete("/:id", protect, authorize("admin"), deleteNotification);

module.exports = router;
