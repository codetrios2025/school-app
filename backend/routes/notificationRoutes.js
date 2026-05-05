const express = require("express");
const router = express.Router();
const {
  sendBroadcast,
  sendClassNotification,
  getMyNotifications,
  getUnreadCount,
  markAsRead,
  sendNotification,
  getTeacherClasses,
  getNotificationsWithFilter,
  deleteNotification,
  getNotifications,
} = require("../controllers/notificationController");

const { protect: auth } = require("../middleware/authMiddleware");

router.post("/", auth, sendNotification);
router.get("/", auth, getNotifications);

router.post("/broadcast", auth, sendBroadcast);
router.post("/class", auth, sendClassNotification);

router.get("/", auth, getMyNotifications);
router.get("/count", auth, getUnreadCount);
router.put("/:id/read", auth, markAsRead);
router.get("/teacher-classes", auth, getTeacherClasses);

router.get("/history", auth, getNotificationsWithFilter);
router.delete("/:id", auth, deleteNotification);

module.exports = router;
