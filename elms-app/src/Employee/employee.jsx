import {
    useCallback,
    useEffect,
    useState
} from "react";

import { useNavigate } from "react-router-dom";

import "./employee.css";
import NotificationPanel from "../components/NotificationPanel";

const API_URL =
    import.meta.env.VITE_API_URL || "http://localhost:5000";

function Employee() {
    const navigate = useNavigate();

    const [employee, setEmployee] = useState(null);

    const [leaveBalances, setLeaveBalances] = useState({
        casual: 0,
        sick: 0,
        earned: 0
    });

    const [leaves, setLeaves] = useState([]);

    const [activeSection, setActiveSection] =
        useState("dashboard");

    const [isLoading, setIsLoading] =
        useState(true);

    const [error, setError] =
        useState("");

    const [success, setSuccess] =
        useState("");

    const [leaveForm, setLeaveForm] = useState({
        leaveType: "casual",
        startDate: "",
        endDate: "",
        reason: ""
    });

    const [leaveDays, setLeaveDays] =
        useState(0);

    /* =====================================================
       P3 - CALENDAR STATE
    ===================================================== */

    const [calendarDate, setCalendarDate] =
        useState(new Date());

    const [
        selectedCalendarLeave,
        setSelectedCalendarLeave
    ] = useState(null);


    /* =====================================================
       AUTHENTICATION
    ===================================================== */

    const getToken = useCallback(() => {
        return localStorage.getItem("token");
    }, []);


    const handleLogout = () => {
        localStorage.removeItem("token");
        localStorage.removeItem("loggedInUser");

        navigate("/");
    };


    const handleUnauthorized = useCallback(() => {
        localStorage.removeItem("token");
        localStorage.removeItem("loggedInUser");

        navigate("/");
    }, [navigate]);


    /* =====================================================
       LOAD EMPLOYEE DATA
    ===================================================== */

    const loadEmployeeData = useCallback(async () => {
        try {
            setIsLoading(true);
            setError("");

            const token = getToken();

            if (!token) {
                navigate("/");
                return;
            }


            /* Employee dashboard */

            const dashboardResponse = await fetch(
                `${API_URL}/api/employee/dashboard`,
                {
                    method: "GET",
                    headers: {
                        Authorization:
                            `Bearer ${token}`
                    }
                }
            );

            const dashboardData =
                await dashboardResponse.json();


            if (
                dashboardResponse.status === 401 ||
                dashboardResponse.status === 403
            ) {
                handleUnauthorized();
                return;
            }


            if (!dashboardResponse.ok) {
                throw new Error(
                    dashboardData.message ||
                    "Unable to load employee dashboard."
                );
            }


            /* Employee leaves */

            const leavesResponse = await fetch(
                `${API_URL}/api/leaves/my`,
                {
                    method: "GET",
                    headers: {
                        Authorization:
                            `Bearer ${token}`
                    }
                }
            );

            const leavesData =
                await leavesResponse.json();


            if (
                leavesResponse.status === 401 ||
                leavesResponse.status === 403
            ) {
                handleUnauthorized();
                return;
            }


            if (!leavesResponse.ok) {
                throw new Error(
                    leavesData.message ||
                    "Unable to load leave requests."
                );
            }


            const employeeData =
                dashboardData.employee;


            setEmployee(employeeData);


            setLeaveBalances({
                casual: Number(
                    employeeData?.leaveBalances?.casual ||
                    0
                ),

                sick: Number(
                    employeeData?.leaveBalances?.sick ||
                    0
                ),

                earned: Number(
                    employeeData?.leaveBalances?.earned ||
                    0
                )
            });


            setLeaves(
                Array.isArray(leavesData.leaves)
                    ? leavesData.leaves
                    : []
            );

        } catch (error) {

            console.error(
                "Employee data loading error:",
                error
            );

            setError(
                error.message ||
                "Unable to load employee data."
            );

        } finally {

            setIsLoading(false);
        }
    }, [
        getToken,
        handleUnauthorized,
        navigate
    ]);


    useEffect(() => {
        const timer = setTimeout(() => {
            loadEmployeeData();
        }, 0);

        return () => clearTimeout(timer);
    }, [loadEmployeeData]);


    /* =====================================================
       LEAVE FORM
    ===================================================== */

    const calculateLeaveDays = (
        startDate,
        endDate
    ) => {

        if (!startDate || !endDate) {
            return 0;
        }


        const start =
            new Date(
                `${startDate}T00:00:00`
            );

        const end =
            new Date(
                `${endDate}T00:00:00`
            );


        if (end < start) {
            return 0;
        }


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


    const handleLeaveChange = (event) => {

        const {
            name,
            value
        } = event.target;


        const updatedForm = {
            ...leaveForm,
            [name]: value
        };


        setLeaveForm(updatedForm);


        if (
            updatedForm.startDate &&
            updatedForm.endDate
        ) {

            const days =
                calculateLeaveDays(
                    updatedForm.startDate,
                    updatedForm.endDate
                );

            setLeaveDays(days);

        } else {

            setLeaveDays(0);
        }
    };


    const getSelectedLeaveBalance = () => {

        return Number(
            leaveBalances[
                leaveForm.leaveType
            ] || 0
        );
    };


    /* =====================================================
       OVERLAPPING LEAVE VALIDATION
    ===================================================== */

    const hasOverlappingLeave = () => {

        if (
            !leaveForm.startDate ||
            !leaveForm.endDate
        ) {
            return false;
        }


        const newStart =
            new Date(
                `${leaveForm.startDate}T00:00:00`
            );


        const newEnd =
            new Date(
                `${leaveForm.endDate}T00:00:00`
            );


        return leaves.some((leave) => {

            if (
                leave.status !== "Pending" &&
                leave.status !== "Approved"
            ) {
                return false;
            }


            if (
                !leave.startDate ||
                !leave.endDate
            ) {
                return false;
            }


            const existingStart =
                new Date(
                    `${String(
                        leave.startDate
                    ).substring(0, 10)}T00:00:00`
                );


            const existingEnd =
                new Date(
                    `${String(
                        leave.endDate
                    ).substring(0, 10)}T00:00:00`
                );


            return (
                newStart <= existingEnd &&
                newEnd >= existingStart
            );
        });
    };


    /* =====================================================
       APPLY LEAVE
    ===================================================== */

    const handleApplyLeave = async (event) => {

        event.preventDefault();

        setError("");
        setSuccess("");


        try {

            const token = getToken();


            if (!token) {
                navigate("/");
                return;
            }


            if (!leaveForm.leaveType) {

                setError(
                    "Please select a leave type."
                );

                return;
            }


            if (!leaveForm.startDate) {

                setError(
                    "Please select a start date."
                );

                return;
            }


            if (!leaveForm.endDate) {

                setError(
                    "Please select an end date."
                );

                return;
            }


            if (!leaveForm.reason.trim()) {

                setError(
                    "Please enter a reason for your leave."
                );

                return;
            }


            const today = new Date();

            today.setHours(
                0,
                0,
                0,
                0
            );


            const startDate =
                new Date(
                    `${leaveForm.startDate}T00:00:00`
                );


            const endDate =
                new Date(
                    `${leaveForm.endDate}T00:00:00`
                );


            if (startDate < today) {

                setError(
                    "Leave start date cannot be in the past."
                );

                return;
            }


            if (endDate < startDate) {

                setError(
                    "End date cannot be before start date."
                );

                return;
            }


            const days =
                calculateLeaveDays(
                    leaveForm.startDate,
                    leaveForm.endDate
                );


            if (days <= 0) {

                setError(
                    "Please select valid leave dates."
                );

                return;
            }


            const availableBalance =
                getSelectedLeaveBalance();


            if (days > availableBalance) {

                setError(
                    `Insufficient ${formatLeaveType(
                        leaveForm.leaveType
                    )} balance. Available: ${availableBalance} day${availableBalance === 1 ? "" : "s"}.`
                );

                return;
            }


            if (hasOverlappingLeave()) {

                setError(
                    "You already have a pending or approved leave request overlapping these dates."
                );

                return;
            }


            const response =
                await fetch(
                    `${API_URL}/api/leaves`,
                    {
                        method: "POST",

                        headers: {
                            "Content-Type":
                                "application/json",

                            Authorization:
                                `Bearer ${token}`
                        },

                        body: JSON.stringify({
                            leaveType:
                                leaveForm.leaveType,

                            startDate:
                                leaveForm.startDate,

                            endDate:
                                leaveForm.endDate,

                            reason:
                                leaveForm.reason.trim()
                        })
                    }
                );


            const data =
                await response.json();


            if (
                response.status === 401 ||
                response.status === 403
            ) {

                handleUnauthorized();

                return;
            }


            if (!response.ok) {

                throw new Error(
                    data.message ||
                    "Unable to apply leave."
                );
            }


            setSuccess(
                `Leave request submitted successfully for ${days} day${days === 1 ? "" : "s"}.`
            );


            setLeaveForm({
                leaveType: "casual",
                startDate: "",
                endDate: "",
                reason: ""
            });


            setLeaveDays(0);


            await loadEmployeeData();


            setActiveSection("my-leaves");

        } catch (error) {

            console.error(
                "Apply leave error:",
                error
            );

            setError(
                error.message ||
                "Unable to apply leave."
            );
        }
    };


    /* =====================================================
       CANCEL LEAVE
    ===================================================== */

    const handleCancelLeave = async (leaveId) => {

        const confirmed =
            window.confirm(
                "Are you sure you want to cancel this leave request?"
            );


        if (!confirmed) {
            return;
        }


        try {

            setError("");
            setSuccess("");


            const token = getToken();


            if (!token) {
                navigate("/");
                return;
            }


            const response =
                await fetch(
                    `${API_URL}/api/leaves/${leaveId}/cancel`,
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


            if (
                response.status === 401 ||
                response.status === 403
            ) {

                handleUnauthorized();

                return;
            }


            if (!response.ok) {

                throw new Error(
                    data.message ||
                    "Unable to cancel leave."
                );
            }


            setSuccess(
                "Leave request cancelled successfully."
            );


            await loadEmployeeData();

        } catch (error) {

            console.error(
                "Cancel leave error:",
                error
            );

            setError(
                error.message ||
                "Unable to cancel leave."
            );
        }
    };


    /* =====================================================
       DATE / LEAVE HELPERS
    ===================================================== */

    const formatDate = (date) => {

        if (!date) {
            return "-";
        }


        const parsedDate =
            new Date(date);


        if (
            Number.isNaN(
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


    const formatLeaveType = (leaveType) => {

        if (!leaveType) {
            return "-";
        }


        const formatted =
            String(leaveType)
                .replace(/_/g, " ")
                .replace(/-/g, " ");


        return formatted
            .split(" ")
            .map(
                (word) =>
                    word.charAt(0).toUpperCase() +
                    word.slice(1)
            )
            .join(" ");
    };


    const getStatusClass = (status) => {

        switch (status) {

            case "Approved":
                return "status-approved";

            case "Rejected":
                return "status-rejected";

            case "Cancelled":
                return "status-cancelled";

            case "Pending":
                return "status-pending";

            default:
                return "";
        }
    };


    /* =====================================================
       P3 - CALENDAR HELPERS
    ===================================================== */

    const getCalendarMonthName = (date) => {

        return date.toLocaleDateString(
            "en-IN",
            {
                month: "long",
                year: "numeric"
            }
        );
    };


    const getCalendarDays = (date) => {

        const year =
            date.getFullYear();

        const month =
            date.getMonth();


        const firstDay =
            new Date(
                year,
                month,
                1
            );


        const lastDay =
            new Date(
                year,
                month + 1,
                0
            );


        const startDay =
            firstDay.getDay();


        const totalDays =
            lastDay.getDate();


        const days = [];


        /* Empty cells before first day */

        for (
            let i = 0;
            i < startDay;
            i++
        ) {

            days.push(null);
        }


        /* Current month */

        for (
            let day = 1;
            day <= totalDays;
            day++
        ) {

            days.push(
                new Date(
                    year,
                    month,
                    day
                )
            );
        }


        return days;
    };


    const getLeaveForDate = (date) => {

        if (!date) {
            return [];
        }


        const dateString =
            `${date.getFullYear()}-${String(
                date.getMonth() + 1
            ).padStart(2, "0")}-${String(
                date.getDate()
            ).padStart(2, "0")}`;


        return leaves.filter((leave) => {

            if (
                !leave.startDate ||
                !leave.endDate
            ) {
                return false;
            }


            const start =
                String(
                    leave.startDate
                ).substring(0, 10);


            const end =
                String(
                    leave.endDate
                ).substring(0, 10);


            return (
                dateString >= start &&
                dateString <= end
            );
        });
    };


    const isToday = (date) => {

        if (!date) {
            return false;
        }


        const today =
            new Date();


        return (
            date.getFullYear() ===
                today.getFullYear() &&

            date.getMonth() ===
                today.getMonth() &&

            date.getDate() ===
                today.getDate()
        );
    };


    const goToPreviousMonth = () => {

        setCalendarDate(
            new Date(
                calendarDate.getFullYear(),
                calendarDate.getMonth() - 1,
                1
            )
        );


        setSelectedCalendarLeave(null);
    };


    const goToNextMonth = () => {

        setCalendarDate(
            new Date(
                calendarDate.getFullYear(),
                calendarDate.getMonth() + 1,
                1
            )
        );


        setSelectedCalendarLeave(null);
    };


    const goToCurrentMonth = () => {

        setCalendarDate(
            new Date()
        );


        setSelectedCalendarLeave(null);
    };


    const getCalendarLeaveClass = (status) => {

        switch (status) {

            case "Approved":
                return "calendar-leave-approved";

            case "Pending":
                return "calendar-leave-pending";

            case "Rejected":
                return "calendar-leave-rejected";

            case "Cancelled":
                return "calendar-leave-cancelled";

            default:
                return "calendar-leave-default";
        }
    };


    /* =====================================================
       DASHBOARD CALCULATIONS
    ===================================================== */

    const totalLeaveBalance =
        Number(leaveBalances.casual || 0) +
        Number(leaveBalances.sick || 0) +
        Number(leaveBalances.earned || 0);


    const pendingLeaves =
        leaves.filter(
            (leave) =>
                leave.status === "Pending"
        ).length;


    const approvedLeaves =
        leaves.filter(
            (leave) =>
                leave.status === "Approved"
        ).length;


    const rejectedLeaves =
        leaves.filter(
            (leave) =>
                leave.status === "Rejected"
        ).length;


    const cancelledLeaves =
        leaves.filter(
            (leave) =>
                leave.status === "Cancelled"
        ).length;


    const todayForUpcoming =
        new Date();


    todayForUpcoming.setHours(
        0,
        0,
        0,
        0
    );


    const upcomingLeaves =
        leaves
            .filter((leave) => {

                if (!leave.startDate) {
                    return false;
                }


                const startDate =
                    new Date(
                        leave.startDate
                    );


                startDate.setHours(
                    0,
                    0,
                    0,
                    0
                );


                return (
                    startDate >=
                        todayForUpcoming &&

                    leave.status !==
                        "Cancelled" &&

                    leave.status !==
                        "Rejected"
                );
            })
            .sort(
                (a, b) =>
                    new Date(a.startDate) -
                    new Date(b.startDate)
            );


    const upcomingLeave =
        upcomingLeaves[0] || null;


    const clearMessages = () => {

        setError("");
        setSuccess("");
    };


    /* =====================================================
       LOADING
    ===================================================== */

    if (isLoading) {

        return (
            <div className="employee-loading">

                <h2>
                    Loading Employee Dashboard
                </h2>

                <p>
                    Please wait while your leave information is being loaded.
                </p>

            </div>
        );
    }


    /* =====================================================
       MAIN UI
    ===================================================== */

    return (
        <div className="employee-container">


            {/* =================================================
                SIDEBAR
            ================================================= */}

            <aside className="employee-sidebar">


                <div className="employee-logo">

                    <h2>
                        ELMS
                    </h2>

                    <p>
                        Employee Leave Management
                    </p>

                </div>


                <nav className="employee-navigation">


                    <button
                        type="button"
                        className={
                            activeSection === "dashboard"
                                ? "active"
                                : ""
                        }
                        onClick={() => {

                            clearMessages();

                            setActiveSection(
                                "dashboard"
                            );

                        }}
                    >
                        Dashboard
                    </button>


                    <button
                        type="button"
                        className={
                            activeSection === "apply-leave"
                                ? "active"
                                : ""
                        }
                        onClick={() => {

                            clearMessages();

                            setActiveSection(
                                "apply-leave"
                            );

                        }}
                    >
                        Apply Leave
                    </button>


                    <button
                        type="button"
                        className={
                            activeSection === "my-leaves"
                                ? "active"
                                : ""
                        }
                        onClick={() => {

                            clearMessages();

                            setActiveSection(
                                "my-leaves"
                            );

                        }}
                    >
                        My Leaves
                    </button>


                    <button
                        type="button"
                        className={
                            activeSection === "leave-balance"
                                ? "active"
                                : ""
                        }
                        onClick={() => {

                            clearMessages();

                            setActiveSection(
                                "leave-balance"
                            );

                        }}
                    >
                        Leave Balance
                    </button>


                    <button
                        type="button"
                        className={
                            activeSection === "leave-calendar"
                                ? "active"
                                : ""
                        }
                        onClick={() => {

                            clearMessages();

                            setActiveSection(
                                "leave-calendar"
                            );

                        }}
                    >
                        Leave Calendar
                    </button>


                    <button
                        type="button"
                        className={
                            activeSection === "leave-details"
                                ? "active"
                                : ""
                        }
                        onClick={() => {

                            clearMessages();

                            setActiveSection(
                                "leave-details"
                            );

                        }}
                    >
                        Leave Details & Status
                    </button>


                    <button
                        type="button"
                        className={
                            activeSection === "notifications"
                                ? "active"
                                : ""
                        }
                        onClick={() => {

                            clearMessages();

                            setActiveSection(
                                "notifications"
                            );

                        }}
                    >
                        Notifications
                    </button>


                    <button
                        type="button"
                        className={
                            activeSection === "profile"
                                ? "active"
                                : ""
                        }
                        onClick={() => {

                            clearMessages();

                            setActiveSection(
                                "profile"
                            );

                        }}
                    >
                        Profile
                    </button>


                </nav>


                <button
                    type="button"
                    className="employee-logout"
                    onClick={handleLogout}
                >
                    Logout
                </button>


            </aside>


            {/* =================================================
                MAIN
            ================================================= */}

            <main className="employee-main">


                {/* HEADER */}

                <header className="employee-header">

                    <div>

                        <h1>
                            Employee Portal
                        </h1>

                        <p>
                            Manage your leave requests and employee information.
                        </p>

                    </div>


                    <div className="employee-header-user">

                        <strong>
                            {employee?.name || "Employee"}
                        </strong>

                        <span>
                            {employee?.email || ""}
                        </span>

                    </div>

                </header>


                {/* GLOBAL ERROR */}

                {error && (

                    <div className="employee-error">
                        {error}
                    </div>

                )}


                {/* GLOBAL SUCCESS */}

                {success && (

                    <div className="employee-success">
                        {success}
                    </div>

                )}


                {/* =================================================
                    P1 - DASHBOARD
                ================================================= */}

                {activeSection === "dashboard" && (

                    <section className="employee-section">


                        <div className="section-header">

                            <h2>
                                Employee Dashboard
                            </h2>

                            <p>
                                Here's your leave overview and recent activity.
                            </p>

                        </div>


                        {/* BALANCES */}

                        <div className="leave-balance-grid">


                            <div className="leave-balance-card">

                                <h3>
                                    Casual Leave
                                </h3>

                                <strong>
                                    {leaveBalances.casual}
                                </strong>

                                <span>
                                    Days available
                                </span>

                            </div>


                            <div className="leave-balance-card">

                                <h3>
                                    Sick Leave
                                </h3>

                                <strong>
                                    {leaveBalances.sick}
                                </strong>

                                <span>
                                    Days available
                                </span>

                            </div>


                            <div className="leave-balance-card">

                                <h3>
                                    Earned Leave
                                </h3>

                                <strong>
                                    {leaveBalances.earned}
                                </strong>

                                <span>
                                    Days available
                                </span>

                            </div>


                            <div className="leave-balance-card">

                                <h3>
                                    Total Balance
                                </h3>

                                <strong>
                                    {totalLeaveBalance}
                                </strong>

                                <span>
                                    Total available days
                                </span>

                            </div>


                        </div>


                        {/* STATUS */}

                        <div className="dashboard-status-grid">


                            <div className="dashboard-status-card">

                                <span>
                                    Pending
                                </span>

                                <strong>
                                    {pendingLeaves}
                                </strong>

                                <small>
                                    Awaiting review
                                </small>

                            </div>


                            <div className="dashboard-status-card">

                                <span>
                                    Approved
                                </span>

                                <strong>
                                    {approvedLeaves}
                                </strong>

                                <small>
                                    Approved requests
                                </small>

                            </div>


                            <div className="dashboard-status-card">

                                <span>
                                    Rejected
                                </span>

                                <strong>
                                    {rejectedLeaves}
                                </strong>

                                <small>
                                    Rejected requests
                                </small>

                            </div>


                            <div className="dashboard-status-card">

                                <span>
                                    Cancelled
                                </span>

                                <strong>
                                    {cancelledLeaves}
                                </strong>

                                <small>
                                    Cancelled requests
                                </small>

                            </div>


                        </div>


                        {/* UPCOMING + QUICK ACTIONS */}

                        <div className="dashboard-two-column">


                            <div className="employee-card dashboard-upcoming-card">

                                <div className="card-header">

                                    <h3>
                                        Upcoming Leave
                                    </h3>

                                </div>


                                {upcomingLeave ? (

                                    <div className="upcoming-leave-content">


                                        <div className="upcoming-leave-title">

                                            <h4>
                                                {formatLeaveType(
                                                    upcomingLeave.leaveType
                                                )}
                                            </h4>


                                            <span
                                                className={
                                                    getStatusClass(
                                                        upcomingLeave.status
                                                    )
                                                }
                                            >
                                                {upcomingLeave.status}
                                            </span>

                                        </div>


                                        <div className="upcoming-leave-dates">


                                            <div>

                                                <strong>
                                                    From
                                                </strong>

                                                <span>
                                                    {formatDate(
                                                        upcomingLeave.startDate
                                                    )}
                                                </span>

                                            </div>


                                            <div>

                                                <strong>
                                                    To
                                                </strong>

                                                <span>
                                                    {formatDate(
                                                        upcomingLeave.endDate
                                                    )}
                                                </span>

                                            </div>


                                        </div>


                                        <p className="upcoming-leave-reason">

                                            {upcomingLeave.reason}

                                        </p>


                                    </div>

                                ) : (

                                    <div className="empty-state">

                                        <h4>
                                            No upcoming leave
                                        </h4>

                                        <p>
                                            You currently have no upcoming leave requests.
                                        </p>

                                    </div>

                                )}

                            </div>


                            <div className="employee-card dashboard-quick-actions">


                                <div className="card-header">

                                    <h3>
                                        Quick Actions
                                    </h3>

                                </div>


                                <button
                                    type="button"
                                    className="dashboard-action-button"
                                    onClick={() => {

                                        clearMessages();

                                        setActiveSection(
                                            "apply-leave"
                                        );

                                    }}
                                >

                                    <span>
                                        +
                                    </span>

                                    Apply Leave

                                </button>


                                <button
                                    type="button"
                                    className="dashboard-action-button"
                                    onClick={() => {

                                        clearMessages();

                                        setActiveSection(
                                            "my-leaves"
                                        );

                                    }}
                                >

                                    <span>
                                        →
                                    </span>

                                    View My Leaves

                                </button>


                                <button
                                    type="button"
                                    className="dashboard-action-button"
                                    onClick={() => {

                                        clearMessages();

                                        setActiveSection(
                                            "notifications"
                                        );

                                    }}
                                >

                                    <span>
                                        !
                                    </span>

                                    Notifications

                                </button>


                            </div>


                        </div>


                        {/* RECENT LEAVES */}

                        <div className="employee-card">


                            <div className="card-header">

                                <h3>
                                    Recent Leave Requests
                                </h3>


                                <button
                                    type="button"
                                    onClick={() => {

                                        clearMessages();

                                        setActiveSection(
                                            "my-leaves"
                                        );

                                    }}
                                >
                                    View All
                                </button>

                            </div>


                            {leaves.length === 0 ? (

                                <div className="empty-state">

                                    <h4>
                                        No leave requests
                                    </h4>

                                    <p>
                                        You have not submitted any leave requests yet.
                                    </p>

                                </div>

                            ) : (

                                <div className="leave-table-wrapper">

                                    <table className="leave-table">

                                        <thead>

                                            <tr>

                                                <th>
                                                    Leave Type
                                                </th>

                                                <th>
                                                    From
                                                </th>

                                                <th>
                                                    To
                                                </th>

                                                <th>
                                                    Status
                                                </th>

                                            </tr>

                                        </thead>


                                        <tbody>

                                            {leaves
                                                .slice(0, 5)
                                                .map(
                                                    (leave) => (

                                                        <tr
                                                            key={
                                                                leave._id
                                                            }
                                                        >

                                                            <td>
                                                                {formatLeaveType(
                                                                    leave.leaveType
                                                                )}
                                                            </td>

                                                            <td>
                                                                {formatDate(
                                                                    leave.startDate
                                                                )}
                                                            </td>

                                                            <td>
                                                                {formatDate(
                                                                    leave.endDate
                                                                )}
                                                            </td>

                                                            <td>

                                                                <span
                                                                    className={
                                                                        getStatusClass(
                                                                            leave.status
                                                                        )
                                                                    }
                                                                >
                                                                    {
                                                                        leave.status
                                                                    }
                                                                </span>

                                                            </td>

                                                        </tr>

                                                    )
                                                )}

                                        </tbody>

                                    </table>

                                </div>

                            )}

                        </div>


                    </section>
                )}


                {/* =================================================
                    P2 - APPLY LEAVE
                ================================================= */}

                {activeSection === "apply-leave" && (

                    <section className="employee-section">


                        <div className="section-header">

                            <h2>
                                Apply Leave
                            </h2>

                            <p>
                                Submit a new leave request for manager approval.
                            </p>

                        </div>


                        <div className="employee-card">


                            <form
                                className="leave-form"
                                onSubmit={handleApplyLeave}
                            >


                                <div className="form-group">

                                    <label htmlFor="leaveType">
                                        Leave Type
                                    </label>


                                    <select
                                        id="leaveType"
                                        name="leaveType"
                                        value={
                                            leaveForm.leaveType
                                        }
                                        onChange={
                                            handleLeaveChange
                                        }
                                        required
                                    >

                                        <option value="casual">
                                            Casual Leave
                                        </option>

                                        <option value="sick">
                                            Sick Leave
                                        </option>

                                        <option value="earned">
                                            Earned Leave
                                        </option>

                                    </select>

                                </div>


                                <div className="selected-leave-balance">

                                    <span>
                                        Available Balance
                                    </span>


                                    <strong>

                                        {
                                            getSelectedLeaveBalance()
                                        }

                                        {" "}

                                        day
                                        {
                                            getSelectedLeaveBalance() ===
                                            1
                                                ? ""
                                                : "s"
                                        }

                                    </strong>

                                </div>


                                <div className="form-row">


                                    <div className="form-group">

                                        <label htmlFor="startDate">
                                            Start Date
                                        </label>


                                        <input
                                            id="startDate"
                                            type="date"
                                            name="startDate"
                                            value={
                                                leaveForm.startDate
                                            }
                                            min={
                                                new Date()
                                                    .toISOString()
                                                    .split("T")[0]
                                            }
                                            onChange={
                                                handleLeaveChange
                                            }
                                            required
                                        />

                                    </div>


                                    <div className="form-group">

                                        <label htmlFor="endDate">
                                            End Date
                                        </label>


                                        <input
                                            id="endDate"
                                            type="date"
                                            name="endDate"
                                            value={
                                                leaveForm.endDate
                                            }
                                            min={
                                                leaveForm.startDate ||
                                                new Date()
                                                    .toISOString()
                                                    .split("T")[0]
                                            }
                                            onChange={
                                                handleLeaveChange
                                            }
                                            required
                                        />

                                    </div>


                                </div>


                                <div className="form-group">

                                    <label>
                                        Leave Duration
                                    </label>


                                    <div className="leave-days-display">

                                        <strong>
                                            {leaveDays}
                                        </strong>

                                        <span>
                                            {
                                                leaveDays === 1
                                                    ? "Day"
                                                    : "Days"
                                            }
                                        </span>

                                    </div>

                                </div>


                                <div className="form-group">

                                    <label htmlFor="reason">
                                        Reason
                                    </label>


                                    <textarea
                                        id="reason"
                                        name="reason"
                                        value={
                                            leaveForm.reason
                                        }
                                        onChange={
                                            handleLeaveChange
                                        }
                                        placeholder="Enter the reason for your leave..."
                                        rows="5"
                                        required
                                    />

                                </div>


                                <div className="form-actions">


                                    <button
                                        type="submit"
                                        className="primary-button"
                                    >
                                        Apply Leave
                                    </button>


                                    <button
                                        type="button"
                                        className="secondary-button"
                                        onClick={() => {

                                            setLeaveForm({
                                                leaveType: "casual",
                                                startDate: "",
                                                endDate: "",
                                                reason: ""
                                            });

                                            setLeaveDays(0);

                                            setError("");
                                            setSuccess("");

                                        }}
                                    >
                                        Clear
                                    </button>


                                </div>


                            </form>


                        </div>


                    </section>
                )}


                {/* =================================================
                    MY LEAVES
                ================================================= */}

                {activeSection === "my-leaves" && (

                    <section className="employee-section">


                        <div className="section-header">

                            <h2>
                                My Leaves
                            </h2>

                            <p>
                                View and manage your submitted leave requests.
                            </p>

                        </div>


                        <div className="employee-card">


                            {leaves.length === 0 ? (

                                <div className="empty-state">

                                    <h4>
                                        No leave requests
                                    </h4>

                                    <p>
                                        You have not submitted any leave requests yet.
                                    </p>

                                </div>

                            ) : (

                                <div className="leave-list">

                                    {leaves.map(
                                        (leave) => {

                                            const duration =
                                                calculateLeaveDays(
                                                    String(
                                                        leave.startDate
                                                    ).substring(
                                                        0,
                                                        10
                                                    ),

                                                    String(
                                                        leave.endDate
                                                    ).substring(
                                                        0,
                                                        10
                                                    )
                                                );


                                            return (

                                                <div
                                                    className="leave-request-card"
                                                    key={
                                                        leave._id
                                                    }
                                                >


                                                    <div className="leave-request-header">


                                                        <div>

                                                            <h3>
                                                                {formatLeaveType(
                                                                    leave.leaveType
                                                                )}
                                                            </h3>

                                                            <p>
                                                                Applied:{" "}
                                                                {formatDate(
                                                                    leave.appliedAt ||
                                                                    leave.createdAt
                                                                )}
                                                            </p>

                                                        </div>


                                                        <span
                                                            className={
                                                                getStatusClass(
                                                                    leave.status
                                                                )
                                                            }
                                                        >
                                                            {
                                                                leave.status
                                                            }
                                                        </span>


                                                    </div>


                                                    <div className="leave-request-details">


                                                        <div>

                                                            <strong>
                                                                From
                                                            </strong>

                                                            <span>
                                                                {formatDate(
                                                                    leave.startDate
                                                                )}
                                                            </span>

                                                        </div>


                                                        <div>

                                                            <strong>
                                                                To
                                                            </strong>

                                                            <span>
                                                                {formatDate(
                                                                    leave.endDate
                                                                )}
                                                            </span>

                                                        </div>


                                                        <div>

                                                            <strong>
                                                                Duration
                                                            </strong>

                                                            <span>
                                                                {duration}
                                                                {" "}
                                                                day
                                                                {
                                                                    duration ===
                                                                    1
                                                                        ? ""
                                                                        : "s"
                                                                }
                                                            </span>

                                                        </div>


                                                    </div>


                                                    <div className="leave-request-details">

                                                        <div>

                                                            <strong>
                                                                Reason
                                                            </strong>

                                                            <span>
                                                                {
                                                                    leave.reason ||
                                                                    "-"
                                                                }
                                                            </span>

                                                        </div>

                                                    </div>


                                                    {leave.reviewComment && (

                                                        <div className="review-comment">

                                                            <strong>
                                                                Manager Review
                                                            </strong>

                                                            <p>
                                                                {
                                                                    leave.reviewComment
                                                                }
                                                            </p>

                                                        </div>

                                                    )}


                                                    {leave.reviewedAt && (

                                                        <div className="reviewed-info">

                                                            <span>
                                                                Reviewed
                                                            </span>

                                                            <strong>
                                                                {formatDate(
                                                                    leave.reviewedAt
                                                                )}
                                                            </strong>

                                                        </div>

                                                    )}


                                                    {leave.status ===
                                                        "Pending" && (

                                                        <div className="leave-request-actions">

                                                            <button
                                                                type="button"
                                                                className="cancel-leave-button"
                                                                onClick={() =>
                                                                    handleCancelLeave(
                                                                        leave._id
                                                                    )
                                                                }
                                                            >
                                                                Cancel Leave
                                                            </button>

                                                        </div>

                                                    )}


                                                </div>

                                            );
                                        }
                                    )}

                                </div>

                            )}

                        </div>


                    </section>
                )}


                {/* =================================================
                    LEAVE BALANCE
                ================================================= */}

                {activeSection === "leave-balance" && (

                    <section className="employee-section">


                        <div className="section-header">

                            <h2>
                                Leave Balance
                            </h2>

                            <p>
                                Your currently available leave balance.
                            </p>

                        </div>


                        <div className="leave-balance-grid">


                            <div className="leave-balance-card">

                                <h3>
                                    Casual Leave
                                </h3>

                                <strong>
                                    {leaveBalances.casual}
                                </strong>

                                <span>
                                    Days available
                                </span>

                            </div>


                            <div className="leave-balance-card">

                                <h3>
                                    Sick Leave
                                </h3>

                                <strong>
                                    {leaveBalances.sick}
                                </strong>

                                <span>
                                    Days available
                                </span>

                            </div>


                            <div className="leave-balance-card">

                                <h3>
                                    Earned Leave
                                </h3>

                                <strong>
                                    {leaveBalances.earned}
                                </strong>

                                <span>
                                    Days available
                                </span>

                            </div>


                            <div className="leave-balance-card">

                                <h3>
                                    Total Balance
                                </h3>

                                <strong>
                                    {totalLeaveBalance}
                                </strong>

                                <span>
                                    Total available days
                                </span>

                            </div>


                        </div>


                    </section>
                )}


                {/* =================================================
                    P3 - REAL LEAVE CALENDAR
                ================================================= */}

                {activeSection === "leave-calendar" && (

                    <section className="employee-section">


                        <div className="section-header">

                            <h2>
                                Leave Calendar
                            </h2>

                            <p>
                                View your leave requests on a monthly calendar.
                            </p>

                        </div>


                        <div className="employee-card leave-calendar-card">


                            {/* CALENDAR HEADER */}

                            <div className="calendar-header">


                                <button
                                    type="button"
                                    className="calendar-nav-button"
                                    onClick={
                                        goToPreviousMonth
                                    }
                                >
                                    ←
                                </button>


                                <div className="calendar-title">

                                    <h3>
                                        {getCalendarMonthName(
                                            calendarDate
                                        )}
                                    </h3>


                                    <button
                                        type="button"
                                        className="calendar-today-button"
                                        onClick={
                                            goToCurrentMonth
                                        }
                                    >
                                        Today
                                    </button>

                                </div>


                                <button
                                    type="button"
                                    className="calendar-nav-button"
                                    onClick={
                                        goToNextMonth
                                    }
                                >
                                    →
                                </button>


                            </div>


                            {/* LEGEND */}

                            <div className="calendar-legend">


                                <div className="calendar-legend-item">

                                    <span className="legend-dot legend-approved"></span>

                                    Approved

                                </div>


                                <div className="calendar-legend-item">

                                    <span className="legend-dot legend-pending"></span>

                                    Pending

                                </div>


                                <div className="calendar-legend-item">

                                    <span className="legend-dot legend-rejected"></span>

                                    Rejected

                                </div>


                                <div className="calendar-legend-item">

                                    <span className="legend-dot legend-cancelled"></span>

                                    Cancelled

                                </div>


                            </div>


                            {/* CALENDAR */}

                            <div className="leave-calendar">


                                <div className="calendar-weekdays">

                                    <div>
                                        Sun
                                    </div>

                                    <div>
                                        Mon
                                    </div>

                                    <div>
                                        Tue
                                    </div>

                                    <div>
                                        Wed
                                    </div>

                                    <div>
                                        Thu
                                    </div>

                                    <div>
                                        Fri
                                    </div>

                                    <div>
                                        Sat
                                    </div>

                                </div>


                                <div className="calendar-grid">


                                    {getCalendarDays(
                                        calendarDate
                                    ).map(
                                        (
                                            date,
                                            index
                                        ) => {


                                            if (!date) {

                                                return (

                                                    <div
                                                        key={`empty-${index}`}
                                                        className="calendar-day calendar-empty"
                                                    />

                                                );
                                            }


                                            const dateLeaves =
                                                getLeaveForDate(
                                                    date
                                                );


                                            return (

                                                <div
                                                    key={date.toISOString()}
                                                    className={
                                                        `calendar-day ${
                                                            isToday(
                                                                date
                                                            )
                                                                ? "calendar-today"
                                                                : ""
                                                        }`
                                                    }
                                                >


                                                    <div className="calendar-date-number">

                                                        {
                                                            date.getDate()
                                                        }

                                                    </div>


                                                    <div className="calendar-leaves">


                                                        {dateLeaves.map(
                                                            (
                                                                leave
                                                            ) => (

                                                                <button
                                                                    type="button"
                                                                    key={
                                                                        leave._id
                                                                    }
                                                                    className={
                                                                        `calendar-leave ${
                                                                            getCalendarLeaveClass(
                                                                                leave.status
                                                                            )
                                                                        }`
                                                                    }
                                                                    onClick={() =>
                                                                        setSelectedCalendarLeave(
                                                                            leave
                                                                        )
                                                                    }
                                                                    title={`${formatLeaveType(
                                                                        leave.leaveType
                                                                    )} - ${leave.status}`}
                                                                >

                                                                    {formatLeaveType(
                                                                        leave.leaveType
                                                                    )}

                                                                </button>

                                                            )
                                                        )}


                                                    </div>


                                                </div>

                                            );
                                        }
                                    )}


                                </div>


                            </div>


                            {/* SELECTED LEAVE DETAILS */}

                            {selectedCalendarLeave && (

                                <div className="calendar-selected-leave">


                                    <div className="calendar-selected-header">


                                        <div>

                                            <span>
                                                Selected Leave
                                            </span>

                                            <h3>
                                                {formatLeaveType(
                                                    selectedCalendarLeave.leaveType
                                                )}
                                            </h3>

                                        </div>


                                        <button
                                            type="button"
                                            className="calendar-close-button"
                                            onClick={() =>
                                                setSelectedCalendarLeave(
                                                    null
                                                )
                                            }
                                        >
                                            ×
                                        </button>


                                    </div>


                                    <div className="calendar-selected-status">

                                        <span>
                                            Status
                                        </span>


                                        <strong
                                            className={
                                                getStatusClass(
                                                    selectedCalendarLeave.status
                                                )
                                            }
                                        >
                                            {
                                                selectedCalendarLeave.status
                                            }
                                        </strong>

                                    </div>


                                    <div className="calendar-selected-details">


                                        <div>

                                            <span>
                                                Start Date
                                            </span>

                                            <strong>
                                                {formatDate(
                                                    selectedCalendarLeave.startDate
                                                )}
                                            </strong>

                                        </div>


                                        <div>

                                            <span>
                                                End Date
                                            </span>

                                            <strong>
                                                {formatDate(
                                                    selectedCalendarLeave.endDate
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
                                                        String(
                                                            selectedCalendarLeave.startDate
                                                        ).substring(
                                                            0,
                                                            10
                                                        ),

                                                        String(
                                                            selectedCalendarLeave.endDate
                                                        ).substring(
                                                            0,
                                                            10
                                                        )
                                                    )
                                                }

                                                {" "}

                                                day
                                                {
                                                    calculateLeaveDays(
                                                        String(
                                                            selectedCalendarLeave.startDate
                                                        ).substring(
                                                            0,
                                                            10
                                                        ),

                                                        String(
                                                            selectedCalendarLeave.endDate
                                                        ).substring(
                                                            0,
                                                            10
                                                        )
                                                    ) === 1
                                                        ? ""
                                                        : "s"
                                                }

                                            </strong>

                                        </div>


                                    </div>


                                    <div className="calendar-selected-reason">

                                        <span>
                                            Reason
                                        </span>

                                        <p>
                                            {
                                                selectedCalendarLeave.reason ||
                                                "-"
                                            }
                                        </p>

                                    </div>


                                    {selectedCalendarLeave.reviewComment && (

                                        <div className="calendar-selected-review">

                                            <span>
                                                Manager Review
                                            </span>

                                            <p>
                                                {
                                                    selectedCalendarLeave.reviewComment
                                                }
                                            </p>

                                        </div>

                                    )}


                                </div>

                            )}


                        </div>


                    </section>
                )}


                {/* =================================================
                    LEAVE DETAILS & STATUS
                ================================================= */}

                {activeSection === "leave-details" && (

                    <section className="employee-section">


                        <div className="section-header">

                            <h2>
                                Leave Details & Status
                            </h2>

                            <p>
                                Detailed information about your leave requests.
                            </p>

                        </div>


                        <div className="employee-card">


                            {leaves.length === 0 ? (

                                <div className="empty-state">

                                    <h4>
                                        No leave requests
                                    </h4>

                                    <p>
                                        Leave details will appear here after you submit a request.
                                    </p>

                                </div>

                            ) : (

                                <div className="leave-list">


                                    {leaves.map(
                                        (leave) => {

                                            const duration =
                                                calculateLeaveDays(
                                                    String(
                                                        leave.startDate
                                                    ).substring(
                                                        0,
                                                        10
                                                    ),

                                                    String(
                                                        leave.endDate
                                                    ).substring(
                                                        0,
                                                        10
                                                    )
                                                );


                                            return (

                                                <div
                                                    className="leave-request-card"
                                                    key={`details-${leave._id}`}
                                                >


                                                    <div className="leave-request-header">


                                                        <div>

                                                            <h3>
                                                                {formatLeaveType(
                                                                    leave.leaveType
                                                                )}
                                                            </h3>

                                                            <p>
                                                                Applied:{" "}
                                                                {formatDate(
                                                                    leave.appliedAt ||
                                                                    leave.createdAt
                                                                )}
                                                            </p>

                                                        </div>


                                                        <span
                                                            className={
                                                                getStatusClass(
                                                                    leave.status
                                                                )
                                                            }
                                                        >
                                                            {
                                                                leave.status
                                                            }
                                                        </span>


                                                    </div>


                                                    <div className="leave-request-details">


                                                        <div>

                                                            <strong>
                                                                Start Date
                                                            </strong>

                                                            <span>
                                                                {formatDate(
                                                                    leave.startDate
                                                                )}
                                                            </span>

                                                        </div>


                                                        <div>

                                                            <strong>
                                                                End Date
                                                            </strong>

                                                            <span>
                                                                {formatDate(
                                                                    leave.endDate
                                                                )}
                                                            </span>

                                                        </div>


                                                        <div>

                                                            <strong>
                                                                Duration
                                                            </strong>

                                                            <span>
                                                                {duration}
                                                                {" "}
                                                                day
                                                                {
                                                                    duration ===
                                                                    1
                                                                        ? ""
                                                                        : "s"
                                                                }
                                                            </span>

                                                        </div>


                                                    </div>


                                                    <div className="leave-request-details">


                                                        <div>

                                                            <strong>
                                                                Reason
                                                            </strong>

                                                            <span>
                                                                {
                                                                    leave.reason ||
                                                                    "-"
                                                                }
                                                            </span>

                                                        </div>


                                                    </div>


                                                    {leave.reviewComment && (

                                                        <div className="review-comment">

                                                            <strong>
                                                                Manager Review
                                                            </strong>

                                                            <p>
                                                                {
                                                                    leave.reviewComment
                                                                }
                                                            </p>

                                                        </div>

                                                    )}


                                                </div>

                                            );

                                        }
                                    )}


                                </div>

                            )}

                        </div>


                    </section>
                )}


                {/* =================================================
                    NOTIFICATIONS
                ================================================= */}

                {activeSection === "notifications" && (

                    <section className="employee-section">


                        <div className="section-header">

                            <h2>
                                Notifications
                            </h2>

                            <p>
                                Stay updated about your leave requests.
                            </p>

                        </div>


                        <div className="employee-card">

                            <NotificationPanel />

                        </div>


                    </section>
                )}


                {/* =================================================
                    PROFILE
                ================================================= */}

                {activeSection === "profile" && (

                    <section className="employee-section">


                        <div className="section-header">

                            <h2>
                                Profile
                            </h2>

                            <p>
                                View your employee account information.
                            </p>

                        </div>


                        <div className="employee-card">


                            <div className="profile-details">


                                <div className="profile-row">

                                    <strong>
                                        Name
                                    </strong>

                                    <span>
                                        {employee?.name || "-"}
                                    </span>

                                </div>


                                <div className="profile-row">

                                    <strong>
                                        Email
                                    </strong>

                                    <span>
                                        {employee?.email || "-"}
                                    </span>

                                </div>


                                <div className="profile-row">

                                    <strong>
                                        Role
                                    </strong>

                                    <span>
                                        {employee?.role || "-"}
                                    </span>

                                </div>


                                <div className="profile-row">

                                    <strong>
                                        Account Status
                                    </strong>

                                    <span>
                                        {employee?.isActive
                                            ? "Active"
                                            : "Inactive"}
                                    </span>

                                </div>


                                <div className="profile-row">

                                    <strong>
                                        Account Created
                                    </strong>

                                    <span>
                                        {formatDate(
                                            employee?.createdAt
                                        )}
                                    </span>

                                </div>


                            </div>


                            <div className="profile-leave-balance">


                                <h3>
                                    Leave Balance
                                </h3>


                                <div className="profile-balance-grid">


                                    <div>

                                        <strong>
                                            Casual
                                        </strong>

                                        <span>
                                            {leaveBalances.casual}
                                        </span>

                                    </div>


                                    <div>

                                        <strong>
                                            Sick
                                        </strong>

                                        <span>
                                            {leaveBalances.sick}
                                        </span>

                                    </div>


                                    <div>

                                        <strong>
                                            Earned
                                        </strong>

                                        <span>
                                            {leaveBalances.earned}
                                        </span>

                                    </div>


                                </div>


                            </div>


                        </div>


                    </section>
                )}


            </main>

        </div>
    );
}

export default Employee;