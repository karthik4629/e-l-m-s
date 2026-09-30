const express = require("express");

const {
    getNotifications,
    getUnreadCount,
    markAsRead,
    markAllAsRead
} = require("../controllers/notificationController");

const protect = require("../middleware/authMiddleware");

const router = express.Router();


// Get all notifications
router.get(
    "/",
    protect,
    getNotifications
);


// Get unread notification count
router.get(
    "/unread-count",
    protect,
    getUnreadCount
);


// IMPORTANT:
// Specific route must come before dynamic :id route
// Mark all notifications as read
router.put(
    "/read-all",
    protect,
    markAllAsRead
);


// Mark one notification as read
router.put(
    "/:id/read",
    protect,
    markAsRead
);


module.exports = router;