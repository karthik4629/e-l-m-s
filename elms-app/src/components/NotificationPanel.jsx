import {
    useCallback,
    useEffect,
    useState
} from "react";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

function NotificationPanel() {

    const [notifications, setNotifications] =
        useState([]);

    const [unreadCount, setUnreadCount] =
        useState(0);

    const [isLoading, setIsLoading] =
        useState(true);

    const [message, setMessage] =
        useState("");


    // ==========================================
    // GET TOKEN
    // ==========================================

    const getToken = () => {

        return localStorage.getItem("token");

    };


    // ==========================================
    // LOAD NOTIFICATIONS
    // ==========================================

    const loadNotifications = useCallback(async () => {

        try {

            const token = getToken();

            if (!token) return;


            setIsLoading(true);


            const response =
                await fetch(
                    `${API_URL}/api/notifications`,
                    {
                        method: "GET",
                        headers: {
                            Authorization:
                                `Bearer ${token}`
                        }
                    }
                );


            const data =
                await response.json();


            if (!response.ok) {

                throw new Error(
                    data.message ||
                    "Unable to load notifications"
                );

            }


            setNotifications(
                data.notifications || []
            );


            // Calculate unread notifications
            const unread =
                (data.notifications || [])
                    .filter(
                        (notification) =>
                            !notification.isRead
                    )
                    .length;


            setUnreadCount(unread);


        } catch (error) {

            console.error(
                "Notification error:",
                error
            );

            setMessage(
                "Unable to load notifications."
            );

        } finally {

            setIsLoading(false);

        }

    }, []);


    // ==========================================
    // LOAD ON COMPONENT START
    // ==========================================

    useEffect(() => {

        const timer = setTimeout(() => {

            loadNotifications();

        }, 0);


        return () => {

            clearTimeout(timer);

        };

    }, [loadNotifications]);


    // ==========================================
    // MARK ONE AS READ
    // ==========================================

    const markAsRead = async (notificationId) => {

        try {

            const token = getToken();

            if (!token) return;


            const response =
                await fetch(
                    `${API_URL}/api/notifications/${notificationId}/read`,
                    {
                        method: "PUT",
                        headers: {
                            Authorization:
                                `Bearer ${token}`
                        }
                    }
                );


            const data =
                await response.json();


            if (!response.ok) {

                throw new Error(
                    data.message ||
                    "Unable to mark notification as read"
                );

            }


            setNotifications(
                (previousNotifications) =>
                    previousNotifications.map(
                        (notification) =>
                            notification._id ===
                            notificationId
                                ? {
                                    ...notification,
                                    isRead: true,
                                    readAt:
                                        new Date()
                                }
                                : notification
                    )
            );


            setUnreadCount(
                (previousCount) =>
                    Math.max(
                        previousCount - 1,
                        0
                    )
            );


        } catch (error) {

            console.error(
                "Mark notification error:",
                error
            );

        }

    };


    // ==========================================
    // MARK ALL AS READ
    // ==========================================

    const markAllAsRead = async () => {

        try {

            const token = getToken();

            if (!token) return;


            const response =
                await fetch(
                    `${API_URL}/api/notifications/read-all`,
                    {
                        method: "PUT",
                        headers: {
                            Authorization:
                                `Bearer ${token}`
                        }
                    }
                );


            const data =
                await response.json();


            if (!response.ok) {

                throw new Error(
                    data.message ||
                    "Unable to mark notifications as read"
                );

            }


            setNotifications(
                (previousNotifications) =>
                    previousNotifications.map(
                        (notification) => ({
                            ...notification,
                            isRead: true,
                            readAt:
                                notification.readAt ||
                                new Date()
                        })
                    )
            );


            setUnreadCount(0);


        } catch (error) {

            console.error(
                "Mark all notifications error:",
                error
            );

        }

    };


    // ==========================================
    // FORMAT DATE
    // ==========================================

    const formatDate = (date) => {

        if (!date) return "";

        return new Date(date).toLocaleString(
            "en-IN",
            {
                day: "2-digit",
                month: "short",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit"
            }
        );

    };


    // ==========================================
    // NOTIFICATION ICON
    // ==========================================

    const getNotificationIcon = (type) => {

        switch (type) {

            case "leave_submitted":
                return "📝";

            case "leave_approved":
                return "✅";

            case "leave_rejected":
                return "❌";

            case "leave_cancelled":
                return "↩️";

            default:
                return "🔔";

        }

    };


    // ==========================================
    // RENDER
    // ==========================================

    return (

        <div className="notification-panel">

            <div className="notification-header">

                <div>

                    <h3>
                        Notifications
                    </h3>

                    <span>
                        {unreadCount} unread
                    </span>

                </div>


                {unreadCount > 0 && (

                    <button
                        type="button"
                        onClick={markAllAsRead}
                    >
                        Mark all as read
                    </button>

                )}

            </div>


            {message && (

                <div className="notification-message">
                    {message}
                </div>

            )}


            {isLoading ? (

                <div className="notification-empty">

                    <p>
                        Loading notifications...
                    </p>

                </div>

            ) : notifications.length === 0 ? (

                <div className="notification-empty">

                    <h4>
                        No notifications
                    </h4>

                    <p>
                        You're all caught up.
                    </p>

                </div>

            ) : (

                <div className="notification-list">

                    {notifications.map(
                        (notification) => (

                        <div
                            key={
                                notification._id
                            }
                            className={
                                notification.isRead
                                    ? "notification-item read"
                                    : "notification-item unread"
                            }
                            onClick={() => {

                                if (
                                    !notification.isRead
                                ) {

                                    markAsRead(
                                        notification._id
                                    );

                                }

                            }}
                        >

                            <div className="notification-icon">

                                {
                                    getNotificationIcon(
                                        notification.type
                                    )
                                }

                            </div>


                            <div className="notification-content">

                                <h4>
                                    {
                                        notification.title
                                    }
                                </h4>

                                <p>
                                    {
                                        notification.message
                                    }
                                </p>

                                <small>
                                    {
                                        formatDate(
                                            notification.createdAt
                                        )
                                    }
                                </small>

                            </div>


                            {!notification.isRead && (

                                <span className="unread-dot">
                                </span>

                            )}

                        </div>

                    ))}

                </div>

            )}

        </div>

    );

}

export default NotificationPanel;