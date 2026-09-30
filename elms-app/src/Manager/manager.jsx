import {
    useCallback,
    useEffect,
    useMemo,
    useState
} from "react";

import { useNavigate } from "react-router-dom";

import "./manager.css";
import NotificationPanel from "../components/NotificationPanel";

const API_URL =
    import.meta.env.VITE_API_URL || "http://localhost:5000";


// ============================================================
// Manager Component
// ============================================================

function Manager() {

    const navigate = useNavigate();


    // ========================================================
    // USER / MANAGER STATE
    // ========================================================

    const [user, setUser] = useState(null);

    const [manager, setManager] =
        useState(null);


    // ========================================================
    // NAVIGATION STATE
    // ========================================================

    const [activeSection, setActiveSection] =
        useState("dashboard");


    // ========================================================
    // LEAVE REQUEST STATE
    // ========================================================

    const [requests, setRequests] =
        useState([]);

    const [selectedRequest, setSelectedRequest] =
        useState(null);


    // ========================================================
    // FILTER STATE
    // ========================================================

    const [requestFilter, setRequestFilter] =
        useState("All");


    // ========================================================
    // LOADING / MESSAGE STATE
    // ========================================================

    const [isLoading, setIsLoading] =
        useState(true);

    const [isUpdating, setIsUpdating] =
        useState(false);

    const [error, setError] =
        useState("");

    const [success, setSuccess] =
        useState("");


    // ========================================================
    // REJECT MODAL STATE
    // ========================================================

    const [rejectingRequest, setRejectingRequest] =
        useState(null);

    const [rejectReason, setRejectReason] =
        useState("");


    // ========================================================
    // GET TOKEN
    // ========================================================

    const getToken = useCallback(() => {
        return localStorage.getItem("token");
    }, []);


    // ========================================================
    // CLEAR AUTH DATA
    // ========================================================

    const clearAuthAndRedirect =
        useCallback(() => {

            localStorage.removeItem("token");

            localStorage.removeItem(
                "loggedInUser"
            );

            navigate("/");

        }, [navigate]);


    // ========================================================
    // LOAD ALL MANAGER DATA
    // ========================================================

    const loadManagerData =
        useCallback(async () => {

            try {

                const token =
                    getToken();


                if (!token) {

                    clearAuthAndRedirect();

                    return;
                }


                setIsLoading(true);
                setError("");


                const headers = {
                    Authorization:
                        `Bearer ${token}`
                };


                // ------------------------------------------------
                // Dashboard
                // ------------------------------------------------

                const dashboardResponse =
                    await fetch(
                        `${API_URL}/api/manager/dashboard`,
                        {
                            method: "GET",
                            headers
                        }
                    );


                const dashboardData =
                    await dashboardResponse.json();


                // ------------------------------------------------
                // Profile
                // ------------------------------------------------

                const profileResponse =
                    await fetch(
                        `${API_URL}/api/manager/profile`,
                        {
                            method: "GET",
                            headers
                        }
                    );


                const profileData =
                    await profileResponse.json();


                // ------------------------------------------------
                // Leave requests
                // ------------------------------------------------

                const leavesResponse =
                    await fetch(
                        `${API_URL}/api/manager/leaves`,
                        {
                            method: "GET",
                            headers
                        }
                    );


                const leavesData =
                    await leavesResponse.json();


                // ------------------------------------------------
                // Authentication error
                // ------------------------------------------------

                if (
                    dashboardResponse.status === 401 ||
                    profileResponse.status === 401 ||
                    leavesResponse.status === 401
                ) {

                    clearAuthAndRedirect();

                    return;
                }


                // ------------------------------------------------
                // Permission error
                // ------------------------------------------------

                if (
                    dashboardResponse.status === 403 ||
                    profileResponse.status === 403 ||
                    leavesResponse.status === 403
                ) {

                    setError(
                        "You do not have permission to access the Manager Portal."
                    );

                    return;
                }


                // ------------------------------------------------
                // API errors
                // ------------------------------------------------

                if (!dashboardResponse.ok) {

                    throw new Error(
                        dashboardData.message ||
                        "Unable to load manager dashboard."
                    );
                }


                if (!profileResponse.ok) {

                    throw new Error(
                        profileData.message ||
                        "Unable to load manager profile."
                    );
                }


                if (!leavesResponse.ok) {

                    throw new Error(
                        leavesData.message ||
                        "Unable to load leave requests."
                    );
                }


                // ------------------------------------------------
                // Save manager information
                // ------------------------------------------------

                setManager(
                    dashboardData.manager ||
                    profileData.manager ||
                    null
                );


                // ------------------------------------------------
                // Save leave requests
                // ------------------------------------------------

                setRequests(
                    Array.isArray(
                        leavesData.leaves
                    )
                        ? leavesData.leaves
                        : []
                );

            }

            catch (error) {

                console.error(
                    "Manager data error:",
                    error
                );


                setError(
                    error.message ||
                    "Unable to load manager data."
                );

            }

            finally {

                setIsLoading(false);
            }

        }, [
            clearAuthAndRedirect,
            getToken
        ]);


    // ========================================================
    // CHECK LOGIN AND ROLE
    // ========================================================

    useEffect(() => {

        const timer = setTimeout(() => {

            const token =
                getToken();

            const storedUser =
                localStorage.getItem(
                    "loggedInUser"
                );


            if (!token || !storedUser) {

                navigate("/");

                return;
            }


            try {

                const loggedInUser =
                    JSON.parse(storedUser);


                if (
                    !loggedInUser ||
                    loggedInUser.role !== "manager"
                ) {

                    if (
                        loggedInUser?.role ===
                        "employee"
                    ) {

                        navigate("/employee");

                    } else if (
                        loggedInUser?.role ===
                        "admin"
                    ) {

                        navigate("/admin");

                    } else {

                        navigate("/");
                    }

                    return;
                }


                setUser(loggedInUser);

                loadManagerData();

            } catch (error) {

                console.error(
                    "Invalid stored user:",
                    error
                );

                clearAuthAndRedirect();
            }

        }, 0);


        return () =>
            clearTimeout(timer);

    }, [
        clearAuthAndRedirect,
        getToken,
        loadManagerData,
        navigate
    ]);


    // ========================================================
    // SHOW SECTION
    // ========================================================

    const showSection = (section) => {

        setError("");
        setSuccess("");

        setSelectedRequest(null);

        setActiveSection(section);
    };


    // ========================================================
    // FORMAT DATE
    // ========================================================

    const formatDate = (date) => {

        if (!date) {
            return "-";
        }


        const parsedDate =
            new Date(date);


        if (
            isNaN(
                parsedDate.getTime()
            )
        ) {
            return "-";
        }


        return parsedDate.toLocaleDateString(
            "en-IN",
            {
                day: "2-digit",
                month: "short",
                year: "numeric"
            }
        );
    };


    // ========================================================
    // FORMAT DATE AND TIME
    // ========================================================

    const formatDateTime = (date) => {

        if (!date) {
            return "-";
        }


        const parsedDate =
            new Date(date);


        if (
            isNaN(
                parsedDate.getTime()
            )
        ) {
            return "-";
        }


        return parsedDate.toLocaleString(
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


    // ========================================================
    // FORMAT LEAVE TYPE
    // ========================================================

    const formatLeaveType = (type) => {

        if (!type) {
            return "-";
        }


        return String(type)
            .split("_")
            .map(
                (word) =>
                    word.charAt(0).toUpperCase() +
                    word.slice(1)
            )
            .join(" ");
    };


    // ========================================================
    // CALCULATE LEAVE DAYS
    // ========================================================

    const calculateLeaveDays = (
        startDate,
        endDate
    ) => {

        if (!startDate || !endDate) {
            return 0;
        }


        const start =
            new Date(startDate);

        const end =
            new Date(endDate);


        if (
            isNaN(start.getTime()) ||
            isNaN(end.getTime())
        ) {
            return 0;
        }


        start.setHours(
            0,
            0,
            0,
            0
        );

        end.setHours(
            0,
            0,
            0,
            0
        );


        const difference =
            end.getTime() -
            start.getTime();


        return (
            Math.floor(
                difference /
                (1000 * 60 * 60 * 24)
            ) + 1
        );
    };


    // ========================================================
    // GET STATUS CLASS
    // ========================================================

    const getStatusClass = (status) => {

        if (!status) {
            return "pending";
        }


        return String(status)
            .toLowerCase();
    };


    // ========================================================
    // REQUEST COUNTS
    // ========================================================

    const total =
        requests.length;


    const pending =
        requests.filter(
            (request) =>
                request.status ===
                "Pending"
        ).length;


    const approved =
        requests.filter(
            (request) =>
                request.status ===
                "Approved"
        ).length;


    const rejected =
        requests.filter(
            (request) =>
                request.status ===
                "Rejected"
        ).length;


    const cancelled =
        requests.filter(
            (request) =>
                request.status ===
                "Cancelled"
        ).length;


    // ========================================================
    // PENDING REQUESTS
    // ========================================================

    const pendingRequests =
        useMemo(() => {

            return requests
                .filter(
                    (request) =>
                        request.status ===
                        "Pending"
                )
                .sort(
                    (a, b) =>
                        new Date(
                            b.createdAt ||
                            b.appliedAt ||
                            0
                        ) -
                        new Date(
                            a.createdAt ||
                            a.appliedAt ||
                            0
                        )
                );

        }, [requests]);


    // ========================================================
    // FILTERED REQUESTS
    // ========================================================

    const filteredRequests =
        useMemo(() => {

            if (
                requestFilter ===
                "All"
            ) {
                return requests;
            }


            return requests.filter(
                (request) =>
                    request.status ===
                    requestFilter
            );

        }, [
            requests,
            requestFilter
        ]);


    // ========================================================
    // OPEN REQUEST DETAILS
    // ========================================================

    const openRequestDetails = (
        request
    ) => {

        setError("");
        setSuccess("");

        setSelectedRequest(
            request
        );
    };


    // ========================================================
    // CLOSE REQUEST DETAILS
    // ========================================================

    const closeRequestDetails = () => {

        if (isUpdating) {
            return;
        }

        setSelectedRequest(null);
    };


    // ========================================================
    // APPROVE REQUEST
    // ========================================================

    const approveRequest = async (
        requestId
    ) => {

        const request =
            requests.find(
                (item) =>
                    item._id ===
                    requestId
            );


        if (!request) {
            return;
        }


        const days =
            calculateLeaveDays(
                request.startDate,
                request.endDate
            );


        const confirmed =
            window.confirm(
                `Approve ${request.employee?.name || "this employee"}'s ${formatLeaveType(request.leaveType)} leave for ${days} day${days === 1 ? "" : "s"}?`
            );


        if (!confirmed) {
            return;
        }


        try {

            const token =
                getToken();


            if (!token) {

                clearAuthAndRedirect();

                return;
            }


            setError("");
            setSuccess("");
            setIsUpdating(true);


            const response =
                await fetch(
                    `${API_URL}/api/manager/leaves/${requestId}/approve`,
                    {
                        method: "PUT",

                        headers: {
                            "Content-Type":
                                "application/json",

                            Authorization:
                                `Bearer ${token}`
                        },

                        body:
                            JSON.stringify({})
                    }
                );


            const data =
                await response.json();


            if (
                response.status ===
                401
            ) {

                clearAuthAndRedirect();

                return;
            }


            if (
                response.status ===
                403
            ) {

                throw new Error(
                    data.message ||
                    "You are not authorized to approve this leave."
                );
            }


            if (!response.ok) {

                throw new Error(
                    data.message ||
                    "Unable to approve leave."
                );
            }


            setSuccess(
                data.message ||
                "Leave request approved successfully."
            );


            setSelectedRequest(
                null
            );


            await loadManagerData();

        }

        catch (error) {

            console.error(
                "Approve leave error:",
                error
            );


            setError(
                error.message ||
                "Unable to approve leave."
            );

        }

        finally {

            setIsUpdating(false);
        }
    };


    // ========================================================
    // OPEN REJECT DIALOG
    // ========================================================

    const openRejectDialog = (
        request
    ) => {

        setError("");
        setSuccess("");

        setSelectedRequest(
            null
        );

        setRejectingRequest(
            request
        );

        setRejectReason("");
    };


    // ========================================================
    // CLOSE REJECT DIALOG
    // ========================================================

    const closeRejectDialog = () => {

        if (isUpdating) {
            return;
        }


        setRejectingRequest(
            null
        );

        setRejectReason("");
    };


    // ========================================================
    // REJECT REQUEST
    // ========================================================

    const rejectRequest = async () => {

        if (!rejectingRequest) {
            return;
        }


        const reason =
            rejectReason.trim();


        if (!reason) {

            setError(
                "Please provide a reason for rejecting the leave request."
            );

            return;
        }


        if (reason.length < 3) {

            setError(
                "Rejection reason must contain at least 3 characters."
            );

            return;
        }


        if (reason.length > 500) {

            setError(
                "Rejection reason cannot exceed 500 characters."
            );

            return;
        }


        try {

            const token =
                getToken();


            if (!token) {

                clearAuthAndRedirect();

                return;
            }


            setError("");
            setSuccess("");
            setIsUpdating(true);


            const response =
                await fetch(
                    `${API_URL}/api/manager/leaves/${rejectingRequest._id}/reject`,
                    {
                        method: "PUT",

                        headers: {
                            "Content-Type":
                                "application/json",

                            Authorization:
                                `Bearer ${token}`
                        },

                        body:
                            JSON.stringify({
                                reviewComment:
                                    reason
                            })
                    }
                );


            const data =
                await response.json();


            if (
                response.status ===
                401
            ) {

                clearAuthAndRedirect();

                return;
            }


            if (
                response.status ===
                403
            ) {

                throw new Error(
                    data.message ||
                    "You are not authorized to reject this leave."
                );
            }


            if (!response.ok) {

                throw new Error(
                    data.message ||
                    "Unable to reject leave."
                );
            }


            setSuccess(
                data.message ||
                "Leave request rejected successfully."
            );


            setRejectingRequest(
                null
            );

            setRejectReason("");


            await loadManagerData();

        }

        catch (error) {

            console.error(
                "Reject leave error:",
                error
            );


            setError(
                error.message ||
                "Unable to reject leave."
            );

        }

        finally {

            setIsUpdating(false);
        }
    };


    // ========================================================
    // LOGOUT
    // ========================================================

    const handleLogout = () => {

        localStorage.removeItem(
            "loggedInUser"
        );

        localStorage.removeItem(
            "token"
        );

        navigate("/");
    };


    // ========================================================
    // REQUEST CARD
    // ========================================================

    const createRequestCard = (
        request
    ) => {

        const statusClass =
            getStatusClass(
                request.status
            );


        const leaveDays =
            calculateLeaveDays(
                request.startDate,
                request.endDate
            );


        return (

            <div
                className="request-card"
                key={request._id}
            >

                {/* =========================================
                    REQUEST HEADER
                ========================================== */}

                <div className="request-top">

                    <div className="employee-summary">

                        <div className="employee-avatar">

                            {(
                                request.employee?.name ||
                                request.employee?.email ||
                                "E"
                            )
                                .charAt(0)
                                .toUpperCase()}

                        </div>


                        <div>

                            <h4>
                                {request.employee?.name ||
                                    request.employee?.email ||
                                    "Employee"}
                            </h4>

                            <span>
                                {request.employee?.email ||
                                    "Employee"}
                            </span>

                        </div>

                    </div>


                    <span
                        className={`status ${statusClass}`}
                    >
                        {request.status}
                    </span>

                </div>


                {/* =========================================
                    REQUEST INFORMATION
                ========================================== */}

                <div className="request-info">

                    <div className="info-item">

                        <span>
                            Leave Type
                        </span>

                        <strong>
                            {formatLeaveType(
                                request.leaveType
                            )}
                        </strong>

                    </div>


                    <div className="info-item">

                        <span>
                            Start Date
                        </span>

                        <strong>
                            {formatDate(
                                request.startDate
                            )}
                        </strong>

                    </div>


                    <div className="info-item">

                        <span>
                            End Date
                        </span>

                        <strong>
                            {formatDate(
                                request.endDate
                            )}
                        </strong>

                    </div>


                    <div className="info-item">

                        <span>
                            Duration
                        </span>

                        <strong>
                            {leaveDays} day
                            {leaveDays === 1
                                ? ""
                                : "s"}
                        </strong>

                    </div>

                </div>


                {/* =========================================
                    REASON
                ========================================== */}

                <div className="request-reason">

                    <span>
                        Reason
                    </span>

                    <p>
                        {request.reason ||
                            "No reason provided."}
                    </p>

                </div>


                {/* =========================================
                    REVIEW COMMENT
                ========================================== */}

                {request.reviewComment && (

                    <div className="request-review">

                        <span>
                            Manager Review
                        </span>

                        <p>
                            {request.reviewComment}
                        </p>

                    </div>

                )}


                {/* =========================================
                    REQUEST DATE
                ========================================== */}

                {(request.createdAt ||
                    request.appliedAt) && (

                    <div className="reviewed-info">

                        <span>
                            Applied On
                        </span>

                        <strong>
                            {formatDateTime(
                                request.createdAt ||
                                request.appliedAt
                            )}
                        </strong>

                    </div>

                )}


                {/* =========================================
                    REVIEWED DATE
                ========================================== */}

                {request.reviewedAt && (

                    <div className="reviewed-info">

                        <span>
                            Reviewed On
                        </span>

                        <strong>
                            {formatDateTime(
                                request.reviewedAt
                            )}
                        </strong>

                    </div>

                )}


                {/* =========================================
                    ACTIONS
                ========================================== */}

                <div className="request-actions">

                    <button
                        type="button"
                        className="details-btn"
                        disabled={isUpdating}
                        onClick={() =>
                            openRequestDetails(
                                request
                            )
                        }
                    >
                        View Details
                    </button>


                    {request.status ===
                        "Pending" && (

                        <>

                            <button
                                type="button"
                                className="approve-btn"
                                disabled={isUpdating}
                                onClick={() =>
                                    approveRequest(
                                        request._id
                                    )
                                }
                            >
                                {isUpdating
                                    ? "Processing..."
                                    : "Approve"}
                            </button>


                            <button
                                type="button"
                                className="reject-btn"
                                disabled={isUpdating}
                                onClick={() =>
                                    openRejectDialog(
                                        request
                                    )
                                }
                            >
                                Reject
                            </button>

                        </>

                    )}

                </div>

            </div>
        );
    };


    // ========================================================
    // LOADING SCREEN
    // ========================================================

    if (isLoading) {

        return (

            <div className="manager-layout">

                <div className="manager-loading">

                    <div className="loading-spinner">

                        <span></span>

                    </div>

                    <h2>
                        Loading Manager Portal...
                    </h2>

                    <p>
                        Please wait while your manager
                        data is being loaded.
                    </p>

                </div>

            </div>
        );
    }


    // ========================================================
    // MAIN UI
    // ========================================================

    return (

        <div className="manager-layout">


            {/* ==================================================
                SIDEBAR
            ================================================== */}

            <aside className="sidebar">

                <div className="brand">

                    <h1>
                        Leave Desk
                    </h1>

                    <span>
                        Manager Portal
                    </span>

                </div>


                <nav className="sidebar-nav">


                    {/* Dashboard */}

                    <button
                        type="button"
                        className={
                            activeSection ===
                            "dashboard"
                                ? "nav-item active"
                                : "nav-item"
                        }
                        onClick={() =>
                            showSection(
                                "dashboard"
                            )
                        }
                    >

                        <span className="nav-icon">
                            ◉
                        </span>

                        <span>
                            Dashboard
                        </span>

                    </button>


                    {/* Leave Requests */}

                    <button
                        type="button"
                        className={
                            activeSection ===
                            "requests"
                                ? "nav-item active"
                                : "nav-item"
                        }
                        onClick={() =>
                            showSection(
                                "requests"
                            )
                        }
                    >

                        <span className="nav-icon">
                            ▤
                        </span>

                        <span>
                            Leave Requests
                        </span>


                        {pending > 0 && (

                            <span className="nav-badge">
                                {pending}
                            </span>

                        )}

                    </button>


                    {/* Notifications */}

                    <button
                        type="button"
                        className={
                            activeSection ===
                            "notifications"
                                ? "nav-item active"
                                : "nav-item"
                        }
                        onClick={() =>
                            showSection(
                                "notifications"
                            )
                        }
                    >

                        <span className="nav-icon">
                            ♢
                        </span>

                        <span>
                            Notifications
                        </span>

                    </button>


                    {/* Profile */}

                    <button
                        type="button"
                        className={
                            activeSection ===
                            "profile"
                                ? "nav-item active"
                                : "nav-item"
                        }
                        onClick={() =>
                            showSection(
                                "profile"
                            )
                        }
                    >

                        <span className="nav-icon">
                            ○
                        </span>

                        <span>
                            Profile
                        </span>

                    </button>

                </nav>


                {/* Logout */}

                <button
                    type="button"
                    className="logout-btn"
                    onClick={
                        handleLogout
                    }
                >
                    Logout
                </button>

            </aside>


            {/* ==================================================
                MAIN CONTENT
            ================================================== */}

            <main className="main-content">


                {/* =================================================
                    TOPBAR
                ================================================= */}

                <div className="topbar">

                    <div>

                        <h2>

                            {activeSection ===
                                "dashboard" &&
                                "Manager Dashboard"}

                            {activeSection ===
                                "requests" &&
                                "Leave Requests"}

                            {activeSection ===
                                "notifications" &&
                                "Notifications"}

                            {activeSection ===
                                "profile" &&
                                "Manager Profile"}

                        </h2>


                        <p>

                            {activeSection ===
                                "dashboard" &&
                                "Overview of employee leave activity"}

                            {activeSection ===
                                "requests" &&
                                "Review and manage employee leave requests"}

                            {activeSection ===
                                "notifications" &&
                                "Stay updated about leave activity"}

                            {activeSection ===
                                "profile" &&
                                "Manage your manager account information"}

                        </p>

                    </div>


                    <div className="user-info">

                        <div className="user-avatar">

                            {(
                                manager?.name ||
                                user?.name ||
                                user?.email ||
                                "M"
                            )
                                .charAt(0)
                                .toUpperCase()}

                        </div>


                        <div>

                            <span>
                                {manager?.name ||
                                    user?.name ||
                                    user?.email ||
                                    "Manager"}
                            </span>

                            <small>
                                Manager
                            </small>

                        </div>

                    </div>

                </div>


                {/* =================================================
                    GLOBAL ERROR
                ================================================= */}

                {error && (

                    <div className="manager-error">

                        <span>
                            !
                        </span>

                        <p>
                            {error}
                        </p>

                        <button
                            type="button"
                            onClick={() =>
                                setError("")
                            }
                        >
                            ×
                        </button>

                    </div>

                )}


                {/* =================================================
                    GLOBAL SUCCESS
                ================================================= */}

                {success && (

                    <div className="manager-success">

                        <span>
                            ✓
                        </span>

                        <p>
                            {success}
                        </p>

                        <button
                            type="button"
                            onClick={() =>
                                setSuccess("")
                            }
                        >
                            ×
                        </button>

                    </div>

                )}


                {/* ==================================================
                    P1 — DASHBOARD
                ================================================== */}

                {activeSection ===
                    "dashboard" && (

                    <section className="content-section active-section">


                        {/* Welcome */}

                        <div className="welcome-card">

                            <div>

                                <span className="section-label">
                                    MANAGER PORTAL
                                </span>

                                <h3>
                                    Welcome,{" "}
                                    {manager?.name ||
                                        user?.name ||
                                        "Manager"}
                                </h3>

                                <p>
                                    Review employee leave
                                    requests and manage
                                    approvals from one place.
                                </p>

                            </div>


                            <button
                                type="button"
                                className="primary-btn"
                                onClick={() =>
                                    showSection(
                                        "requests"
                                    )
                                }
                            >
                                Review Requests
                            </button>

                        </div>


                        {/* =================================================
                            SUMMARY CARDS
                        ================================================= */}

                        <div className="summary-grid">


                            <div className="summary-card">

                                <div className="summary-card-top">

                                    <span className="summary-icon">
                                        ≡
                                    </span>

                                    <span className="summary-title">
                                        Total Requests
                                    </span>

                                </div>

                                <strong>
                                    {total}
                                </strong>

                                <p>
                                    All employee leave
                                    requests
                                </p>

                            </div>


                            <div className="summary-card pending-card">

                                <div className="summary-card-top">

                                    <span className="summary-icon">
                                        ◷
                                    </span>

                                    <span className="summary-title">
                                        Pending
                                    </span>

                                </div>

                                <strong>
                                    {pending}
                                </strong>

                                <p>
                                    Waiting for approval
                                </p>

                            </div>


                            <div className="summary-card approved-card">

                                <div className="summary-card-top">

                                    <span className="summary-icon">
                                        ✓
                                    </span>

                                    <span className="summary-title">
                                        Approved
                                    </span>

                                </div>

                                <strong>
                                    {approved}
                                </strong>

                                <p>
                                    Approved requests
                                </p>

                            </div>


                            <div className="summary-card rejected-card">

                                <div className="summary-card-top">

                                    <span className="summary-icon">
                                        ×
                                    </span>

                                    <span className="summary-title">
                                        Rejected
                                    </span>

                                </div>

                                <strong>
                                    {rejected}
                                </strong>

                                <p>
                                    Rejected requests
                                </p>

                            </div>

                        </div>


                        {/* =================================================
                            SECONDARY STATISTICS
                        ================================================= */}

                        <div className="dashboard-secondary-grid">

                            <div className="dashboard-stat-card">

                                <span>
                                    Cancelled Requests
                                </span>

                                <strong>
                                    {cancelled}
                                </strong>

                            </div>


                            <div className="dashboard-stat-card">

                                <span>
                                    Awaiting Action
                                </span>

                                <strong>
                                    {pending}
                                </strong>

                            </div>


                            <div className="dashboard-stat-card">

                                <span>
                                    Completed Reviews
                                </span>

                                <strong>
                                    {approved +
                                        rejected}
                                </strong>

                            </div>

                        </div>


                        {/* =================================================
                            PENDING REQUESTS
                        ================================================= */}

                        <div className="section-card">

                            <div className="section-header">

                                <div>

                                    <span className="section-label">
                                        ACTION REQUIRED
                                    </span>

                                    <h3>
                                        Pending Requests
                                    </h3>

                                    <p>
                                        Leave requests
                                        waiting for your
                                        review.
                                    </p>

                                </div>


                                <button
                                    type="button"
                                    className="text-btn"
                                    onClick={() => {

                                        setRequestFilter(
                                            "Pending"
                                        );

                                        showSection(
                                            "requests"
                                        );

                                    }}
                                >
                                    View All
                                </button>

                            </div>


                            <div className="request-list">

                                {pendingRequests.length ===
                                0 ? (

                                    <div className="empty-state">

                                        <div className="empty-icon">
                                            ✓
                                        </div>

                                        <h4>
                                            No pending requests
                                        </h4>

                                        <p>
                                            There are no
                                            leave requests
                                            waiting for
                                            approval.
                                        </p>

                                    </div>

                                ) : (

                                    pendingRequests
                                        .slice(0, 5)
                                        .map(
                                            createRequestCard
                                        )

                                )}

                            </div>

                        </div>

                    </section>

                )}


                {/* ==================================================
                    P2/P3 — LEAVE REQUESTS
                ================================================== */}

                {activeSection ===
                    "requests" && (

                    <section className="content-section active-section">


                        <div className="section-card">


                            {/* Request Header */}

                            <div className="section-header">

                                <div>

                                    <span className="section-label">
                                        REQUEST MANAGEMENT
                                    </span>

                                    <h3>
                                        Employee Leave Requests
                                    </h3>

                                    <p>
                                        Review, approve,
                                        reject and inspect
                                        employee leave
                                        requests.
                                    </p>

                                </div>

                            </div>


                            {/* =================================================
                                FILTERS
                            ================================================= */}

                            <div className="request-filters">

                                {[
                                    "All",
                                    "Pending",
                                    "Approved",
                                    "Rejected",
                                    "Cancelled"
                                ].map(
                                    (filter) => (

                                        <button
                                            key={
                                                filter
                                            }
                                            type="button"
                                            className={
                                                requestFilter ===
                                                filter
                                                    ? "filter-btn active"
                                                    : "filter-btn"
                                            }
                                            onClick={() =>
                                                setRequestFilter(
                                                    filter
                                                )
                                            }
                                        >

                                            {filter}

                                            <span>

                                                {filter ===
                                                    "All" &&
                                                    total}

                                                {filter ===
                                                    "Pending" &&
                                                    pending}

                                                {filter ===
                                                    "Approved" &&
                                                    approved}

                                                {filter ===
                                                    "Rejected" &&
                                                    rejected}

                                                {filter ===
                                                    "Cancelled" &&
                                                    cancelled}

                                            </span>

                                        </button>

                                    )
                                )}

                            </div>


                            {/* =================================================
                                REQUEST LIST
                            ================================================= */}

                            <div className="request-list">

                                {filteredRequests.length ===
                                0 ? (

                                    <div className="empty-state">

                                        <div className="empty-icon">
                                            ▤
                                        </div>

                                        <h4>

                                            No{" "}

                                            {requestFilter !==
                                                "All" &&
                                                requestFilter.toLowerCase() +
                                                    " "}

                                            leave requests

                                        </h4>

                                        <p>
                                            There are currently
                                            no requests in this
                                            category.
                                        </p>

                                    </div>

                                ) : (

                                    filteredRequests.map(
                                        createRequestCard
                                    )

                                )}

                            </div>

                        </div>

                    </section>

                )}


                {/* ==================================================
                    P7 — NOTIFICATIONS
                ================================================== */}

                {activeSection ===
                    "notifications" && (

                    <section className="content-section active-section">

                        <div className="section-card">

                            <div className="section-header">

                                <div>

                                    <span className="section-label">
                                        UPDATES
                                    </span>

                                    <h3>
                                        Notifications
                                    </h3>

                                    <p>
                                        Stay updated about
                                        employee leave
                                        submissions and
                                        activity.
                                    </p>

                                </div>

                            </div>


                            <NotificationPanel />

                        </div>

                    </section>

                )}


                {/* ==================================================
                    P8 — PROFILE
                ================================================== */}

                {activeSection ===
                    "profile" && (

                    <section className="content-section active-section">


                        <div className="section-card">

                            <div className="section-header">

                                <div>

                                    <span className="section-label">
                                        ACCOUNT
                                    </span>

                                    <h3>
                                        Manager Profile
                                    </h3>

                                    <p>
                                        View your manager
                                        account information.
                                    </p>

                                </div>

                            </div>


                            {/* Profile Header */}

                            <div className="profile-header">

                                <div className="profile-avatar">

                                    {(
                                        manager?.name ||
                                        user?.name ||
                                        user?.email ||
                                        "M"
                                    )
                                        .charAt(0)
                                        .toUpperCase()}

                                </div>


                                <div>

                                    <h3>
                                        {manager?.name ||
                                            user?.name ||
                                            "Manager"}
                                    </h3>

                                    <p>
                                        {manager?.email ||
                                            user?.email ||
                                            "-"}
                                    </p>

                                    <span className="profile-role">
                                        Manager
                                    </span>

                                </div>

                            </div>


                            {/* Profile Details */}

                            <div className="profile-details">


                                <div className="profile-row">

                                    <span>
                                        Full Name
                                    </span>

                                    <strong>
                                        {manager?.name ||
                                            user?.name ||
                                            "-"}
                                    </strong>

                                </div>


                                <div className="profile-row">

                                    <span>
                                        Email Address
                                    </span>

                                    <strong>
                                        {manager?.email ||
                                            user?.email ||
                                            "-"}
                                    </strong>

                                </div>


                                <div className="profile-row">

                                    <span>
                                        Role
                                    </span>

                                    <strong>
                                        {manager?.role ||
                                            user?.role ||
                                            "manager"}
                                    </strong>

                                </div>


                                <div className="profile-row">

                                    <span>
                                        Account Status
                                    </span>

                                    <strong
                                        className={
                                            manager?.isActive
                                                ? "active-value"
                                                : "inactive-value"
                                        }
                                    >
                                        {manager?.isActive
                                            ? "Active"
                                            : "Inactive"}
                                    </strong>

                                </div>


                                <div className="profile-row">

                                    <span>
                                        Account Created
                                    </span>

                                    <strong>
                                        {formatDate(
                                            manager?.createdAt
                                        )}
                                    </strong>

                                </div>


                                <div className="profile-row">

                                    <span>
                                        Requests Managed
                                    </span>

                                    <strong>
                                        {total}
                                    </strong>

                                </div>

                            </div>

                        </div>


                        {/* Manager Activity Summary */}

                        <div className="section-card">

                            <div className="section-header">

                                <div>

                                    <h3>
                                        Management Summary
                                    </h3>

                                    <p>
                                        Your current leave
                                        management activity.
                                    </p>

                                </div>

                            </div>


                            <div className="profile-summary-grid">

                                <div>

                                    <span>
                                        Pending
                                    </span>

                                    <strong>
                                        {pending}
                                    </strong>

                                </div>


                                <div>

                                    <span>
                                        Approved
                                    </span>

                                    <strong>
                                        {approved}
                                    </strong>

                                </div>


                                <div>

                                    <span>
                                        Rejected
                                    </span>

                                    <strong>
                                        {rejected}
                                    </strong>

                                </div>


                                <div>

                                    <span>
                                        Cancelled
                                    </span>

                                    <strong>
                                        {cancelled}
                                    </strong>

                                </div>

                            </div>

                        </div>

                    </section>

                )}

            </main>


            {/* ==================================================
                P4 — LEAVE DETAILS MODAL
            ================================================== */}

            {selectedRequest && (

                <div
                    className="details-modal-overlay"
                    onClick={
                        closeRequestDetails
                    }
                >

                    <div
                        className="details-modal"
                        onClick={(event) =>
                            event.stopPropagation()
                        }
                    >

                        <div className="details-modal-header">

                            <div>

                                <span className="section-label">
                                    LEAVE DETAILS
                                </span>

                                <h3>
                                    Leave Request
                                </h3>

                            </div>


                            <button
                                type="button"
                                className="close-modal-btn"
                                onClick={
                                    closeRequestDetails
                                }
                                disabled={isUpdating}
                            >
                                ×
                            </button>

                        </div>


                        {/* Employee */}

                        <div className="details-employee">

                            <div className="details-avatar">

                                {(
                                    selectedRequest.employee?.name ||
                                    selectedRequest.employee?.email ||
                                    "E"
                                )
                                    .charAt(0)
                                    .toUpperCase()}

                            </div>


                            <div>

                                <h4>
                                    {selectedRequest.employee?.name ||
                                        "Employee"}
                                </h4>

                                <p>
                                    {selectedRequest.employee?.email ||
                                        "-"}
                                </p>

                            </div>


                            <span
                                className={`status ${getStatusClass(
                                    selectedRequest.status
                                )}`}
                            >
                                {selectedRequest.status}
                            </span>

                        </div>


                        {/* Leave Information */}

                        <div className="details-grid">


                            <div className="details-item">

                                <span>
                                    Leave Type
                                </span>

                                <strong>
                                    {formatLeaveType(
                                        selectedRequest.leaveType
                                    )}
                                </strong>

                            </div>


                            <div className="details-item">

                                <span>
                                    Duration
                                </span>

                                <strong>

                                    {
                                        calculateLeaveDays(
                                            selectedRequest.startDate,
                                            selectedRequest.endDate
                                        )
                                    }{" "}

                                    day

                                    {
                                        calculateLeaveDays(
                                            selectedRequest.startDate,
                                            selectedRequest.endDate
                                        ) === 1
                                            ? ""
                                            : "s"
                                    }

                                </strong>

                            </div>


                            <div className="details-item">

                                <span>
                                    Start Date
                                </span>

                                <strong>
                                    {formatDate(
                                        selectedRequest.startDate
                                    )}
                                </strong>

                            </div>


                            <div className="details-item">

                                <span>
                                    End Date
                                </span>

                                <strong>
                                    {formatDate(
                                        selectedRequest.endDate
                                    )}
                                </strong>

                            </div>


                            <div className="details-item">

                                <span>
                                    Applied On
                                </span>

                                <strong>
                                    {formatDateTime(
                                        selectedRequest.createdAt ||
                                        selectedRequest.appliedAt
                                    )}
                                </strong>

                            </div>


                            <div className="details-item">

                                <span>
                                    Reviewed On
                                </span>

                                <strong>
                                    {formatDateTime(
                                        selectedRequest.reviewedAt
                                    )}
                                </strong>

                            </div>

                        </div>


                        {/* Reason */}

                        <div className="details-text-block">

                            <span>
                                Employee Reason
                            </span>

                            <p>
                                {selectedRequest.reason ||
                                    "No reason provided."}
                            </p>

                        </div>


                        {/* Review */}

                        {selectedRequest.reviewComment && (

                            <div className="details-text-block review-block">

                                <span>
                                    Manager Review
                                </span>

                                <p>
                                    {selectedRequest.reviewComment}
                                </p>

                            </div>

                        )}


                        {/* Reviewed By */}

                        {selectedRequest.reviewedBy && (

                            <div className="reviewed-by-block">

                                <span>
                                    Reviewed By
                                </span>

                                <strong>
                                    {selectedRequest.reviewedBy.name ||
                                        selectedRequest.reviewedBy.email ||
                                        "-"}
                                </strong>

                            </div>

                        )}


                        {/* Actions */}

                        {selectedRequest.status ===
                            "Pending" && (

                            <div className="details-actions">

                                <button
                                    type="button"
                                    className="approve-btn"
                                    disabled={isUpdating}
                                    onClick={() =>
                                        approveRequest(
                                            selectedRequest._id
                                        )
                                    }
                                >
                                    {isUpdating
                                        ? "Processing..."
                                        : "Approve Leave"}
                                </button>


                                <button
                                    type="button"
                                    className="reject-btn"
                                    disabled={isUpdating}
                                    onClick={() =>
                                        openRejectDialog(
                                            selectedRequest
                                        )
                                    }
                                >
                                    Reject Leave
                                </button>

                            </div>

                        )}

                    </div>

                </div>

            )}


            {/* ==================================================
                P6 — REJECT MODAL
            ================================================== */}

            {rejectingRequest && (

                <div
                    className="reject-modal-overlay"
                    onClick={
                        closeRejectDialog
                    }
                >

                    <div
                        className="reject-modal"
                        onClick={(event) =>
                            event.stopPropagation()
                        }
                    >

                        <div className="reject-modal-header">

                            <div>

                                <span className="section-label">
                                    ACTION REQUIRED
                                </span>

                                <h3>
                                    Reject Leave Request
                                </h3>

                                <p>
                                    {rejectingRequest.employee?.name ||
                                        rejectingRequest.employee?.email ||
                                        "Employee"}
                                </p>

                            </div>


                            <button
                                type="button"
                                className="close-modal-btn"
                                onClick={
                                    closeRejectDialog
                                }
                                disabled={isUpdating}
                            >
                                ×
                            </button>

                        </div>


                        {/* Request summary */}

                        <div className="reject-request-summary">


                            <div>

                                <span>
                                    Leave Type
                                </span>

                                <strong>
                                    {formatLeaveType(
                                        rejectingRequest.leaveType
                                    )}
                                </strong>

                            </div>


                            <div>

                                <span>
                                    Duration
                                </span>

                                <strong>

                                    {
                                        calculateLeaveDays(
                                            rejectingRequest.startDate,
                                            rejectingRequest.endDate
                                        )
                                    }{" "}

                                    day

                                    {
                                        calculateLeaveDays(
                                            rejectingRequest.startDate,
                                            rejectingRequest.endDate
                                        ) === 1
                                            ? ""
                                            : "s"
                                    }

                                </strong>

                            </div>


                            <div>

                                <span>
                                    Dates
                                </span>

                                <strong>

                                    {formatDate(
                                        rejectingRequest.startDate
                                    )}

                                    {" - "}

                                    {formatDate(
                                        rejectingRequest.endDate
                                    )}

                                </strong>

                            </div>

                        </div>


                        {/* Reason */}

                        <div className="reject-form-group">

                            <label htmlFor="rejectReason">

                                Reason for rejection

                                <span>
                                    {" "}*
                                </span>

                            </label>


                            <textarea
                                id="rejectReason"
                                rows="5"
                                maxLength="500"
                                value={
                                    rejectReason
                                }
                                onChange={(
                                    event
                                ) =>
                                    setRejectReason(
                                        event.target.value
                                    )
                                }
                                placeholder="Explain why this leave request is being rejected..."
                                disabled={
                                    isUpdating
                                }
                            />


                            <div className="character-count">

                                {rejectReason.length}
                                /500

                            </div>

                        </div>


                        {/* Modal actions */}

                        <div className="reject-modal-actions">

                            <button
                                type="button"
                                className="cancel-modal-btn"
                                onClick={
                                    closeRejectDialog
                                }
                                disabled={
                                    isUpdating
                                }
                            >
                                Cancel
                            </button>


                            <button
                                type="button"
                                className="confirm-reject-btn"
                                onClick={
                                    rejectRequest
                                }
                                disabled={
                                    isUpdating ||
                                    !rejectReason.trim()
                                }
                            >
                                {isUpdating
                                    ? "Rejecting..."
                                    : "Reject Leave"}
                            </button>

                        </div>

                    </div>

                </div>

            )}

        </div>
    );
}


export default Manager;