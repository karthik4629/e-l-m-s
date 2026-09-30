const Notification = require("../models/Notification");

// Get notifications for logged-in user
const getNotifications = async (req, res) => {
    try {
        const notifications = await Notification.find({
            recipient: req.user._id
        })
            .populate("leave", "leaveType startDate endDate status reviewComment")
            .sort({ createdAt: -1 });

        res.status(200).json({
            message: "Notifications retrieved successfully",
            notifications
        });

    } catch (error) {
        console.error("Get notifications error:", error);

        res.status(500).json({
            message: "Server error while retrieving notifications"
        });
    }
};


// Get unread notification count
const getUnreadCount = async (req, res) => {
    try {
        const count = await Notification.countDocuments({
            recipient: req.user._id,
            isRead: false
        });

        res.status(200).json({
            unreadCount: count
        });

    } catch (error) {
        console.error("Get unread notification count error:", error);

        res.status(500).json({
            message: "Server error while retrieving unread notification count"
        });
    }
};


// Mark one notification as read
const markAsRead = async (req, res) => {
    try {
        const notification = await Notification.findOne({
            _id: req.params.id,
            recipient: req.user._id
        });

        if (!notification) {
            return res.status(404).json({
                message: "Notification not found"
            });
        }

        notification.isRead = true;
        notification.readAt = new Date();

        await notification.save();

        res.status(200).json({
            message: "Notification marked as read",
            notification
        });

    } catch (error) {
        console.error("Mark notification as read error:", error);

        if (error.name === "CastError") {
            return res.status(400).json({
                message: "Invalid notification ID"
            });
        }

        res.status(500).json({
            message: "Server error while marking notification as read"
        });
    }
};


// Mark all notifications as read
const markAllAsRead = async (req, res) => {
    try {
        await Notification.updateMany(
            {
                recipient: req.user._id,
                isRead: false
            },
            {
                $set: {
                    isRead: true,
                    readAt: new Date()
                }
            }
        );

        res.status(200).json({
            message: "All notifications marked as read"
        });

    } catch (error) {
        console.error("Mark all notifications as read error:", error);

        res.status(500).json({
            message: "Server error while marking notifications as read"
        });
    }
};


module.exports = {
    getNotifications,
    getUnreadCount,
    markAsRead,
    markAllAsRead
};