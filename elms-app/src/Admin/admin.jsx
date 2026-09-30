import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./admin.css";
import NotificationPanel from "../components/NotificationPanel";

function Admin() {
    const navigate = useNavigate();

    const API_URL =
        import.meta.env.VITE_API_URL || "http://localhost:5000";

    // ==========================================
    // STATES
    // ==========================================

    const [loggedInUser] = useState(() => {
        try {
            return JSON.parse(
                localStorage.getItem("loggedInUser")
            );
        } catch {
            return null;
        }
    });

    const [activeSection, setActiveSection] =
        useState("dashboardSection");

    const [users, setUsers] = useState([]);
    const [employees, setEmployees] = useState([]);
    const [managers, setManagers] = useState([]);
    const [leaveRequests, setLeaveRequests] = useState([]);

    const [loading, setLoading] = useState(true);
    const [errorMessage, setErrorMessage] = useState("");
    const [successMessage, setSuccessMessage] = useState("");

    // ==========================================
    // LEAVE BALANCE STATES
    // ==========================================

    const [selectedEmployee, setSelectedEmployee] =
        useState("");

    const [casualBalance, setCasualBalance] =
        useState("");

    const [sickBalance, setSickBalance] =
        useState("");

    const [earnedBalance, setEarnedBalance] =
        useState("");

    // ==========================================
    // MANAGER ASSIGNMENT STATES
    // ==========================================

    const [selectedManagerByEmployee, setSelectedManagerByEmployee] =
        useState({});

    const [assigningManager, setAssigningManager] =
        useState(false);

    // ==========================================
    // CREATE USER STATES
    // ==========================================

    const [showCreateEmployee, setShowCreateEmployee] =
        useState(false);

    const [showCreateManager, setShowCreateManager] =
        useState(false);

    const [newUser, setNewUser] = useState({
        name: "",
        email: "",
        password: ""
    });

    const [creatingUser, setCreatingUser] =
        useState(false);

    const [updatingBalance, setUpdatingBalance] =
        useState(false);

    const [updatingStatus, setUpdatingStatus] =
        useState(false);

    // ==========================================
    // API HEADERS
    // ==========================================

    const getHeaders = useCallback(() => {
        const token =
            localStorage.getItem("token");

        return {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`
        };
    }, []);

    // ==========================================
    // HANDLE AUTH FAILURE
    // ==========================================

    const handleAuthFailure = useCallback(() => {
        localStorage.removeItem("token");
        localStorage.removeItem("loggedInUser");

        navigate("/");
    }, [navigate]);

    // ==========================================
    // LOAD LOGGED-IN USER / AUTHORIZATION
    // ==========================================

    useEffect(() => {
        const token =
            localStorage.getItem("token");

        if (!loggedInUser || !token) {
            navigate("/");
            return;
        }

        if (loggedInUser.role !== "admin") {
            if (loggedInUser.role === "employee") {
                navigate("/employee");
            } else if (loggedInUser.role === "manager") {
                navigate("/manager");
            } else {
                navigate("/");
            }
        }
    }, [loggedInUser, navigate]);

    // ==========================================
    // LOAD ADMIN DATA
    // ==========================================

    const loadData = useCallback(async () => {
        if (!loggedInUser) {
            return;
        }

        try {
            setLoading(true);
            setErrorMessage("");

            const headers = getHeaders();

            const [
                dashboardResponse,
                usersResponse,
                employeesResponse,
                managersResponse,
                leavesResponse,
                profileResponse
            ] = await Promise.all([
                fetch(
                    `${API_URL}/api/admin/dashboard`,
                    {
                        headers
                    }
                ),

                fetch(
                    `${API_URL}/api/admin/users`,
                    {
                        headers
                    }
                ),

                fetch(
                    `${API_URL}/api/admin/employees`,
                    {
                        headers
                    }
                ),

                fetch(
                    `${API_URL}/api/admin/managers`,
                    {
                        headers
                    }
                ),

                fetch(
                    `${API_URL}/api/admin/leaves`,
                    {
                        headers
                    }
                ),

                fetch(
                    `${API_URL}/api/admin/profile`,
                    {
                        headers
                    }
                )
            ]);

            const responses = [
                dashboardResponse,
                usersResponse,
                employeesResponse,
                managersResponse,
                leavesResponse,
                profileResponse
            ];

            // ==========================================
            // AUTHORIZATION CHECK
            // ==========================================

            if (
                responses.some(
                    (response) =>
                        response.status === 401 ||
                        response.status === 403
                )
            ) {
                handleAuthFailure();
                return;
            }

            // ==========================================
            // GENERAL API ERROR CHECK
            // ==========================================

            if (
                responses.some(
                    (response) =>
                        !response.ok
                )
            ) {
                throw new Error(
                    "Unable to load admin data."
                );
            }

            // ==========================================
            // READ RESPONSES
            // ==========================================

            const dashboardData =
                await dashboardResponse.json();

            const usersData =
                await usersResponse.json();

            const employeesData =
                await employeesResponse.json();

            const managersData =
                await managersResponse.json();

            const leavesData =
                await leavesResponse.json();

            const profileData =
                await profileResponse.json();

            // ==========================================
            // DEBUG
            // ==========================================

            console.log(
                "Admin dashboard data:",
                dashboardData
            );

            // ==========================================
            // SET DATA
            // ==========================================

            setUsers(
                usersData.users || []
            );

            setEmployees(
                employeesData.employees || []
            );

            setManagers(
                managersData.managers || []
            );

            setLeaveRequests(
                leavesData.leaves || []
            );

            // ==========================================
            // SET CURRENT MANAGER SELECTIONS
            // ==========================================

            const managerSelections = {};

            (employeesData.employees || []).forEach(
                (employee) => {
                    if (employee.reportingManager) {
                        managerSelections[employee._id] =
                            employee.reportingManager._id;
                    } else {
                        managerSelections[employee._id] = "";
                    }
                }
            );

            setSelectedManagerByEmployee(
                managerSelections
            );

            // ==========================================
            // UPDATE LOCAL ADMIN PROFILE
            // ==========================================

            if (profileData.admin) {
                const updatedAdmin = {
                    ...loggedInUser,
                    ...profileData.admin
                };

                localStorage.setItem(
                    "loggedInUser",
                    JSON.stringify(updatedAdmin)
                );
            }
        } catch (error) {
            console.error(
                "Admin data loading error:",
                error
            );

            setErrorMessage(
                error.message ||
                "Unable to load admin data."
            );
        } finally {
            setLoading(false);
        }
    }, [
        API_URL,
        getHeaders,
        handleAuthFailure,
        loggedInUser
    ]);

    // ==========================================
    // LOAD DATA WHEN USER IS READY
    // ==========================================

    useEffect(() => {
        if (!loggedInUser) {
            return;
        }

        const timer = setTimeout(() => {
            loadData();
        }, 0);

        return () => {
            clearTimeout(timer);
        };
    }, [loggedInUser, loadData]);

    // ==========================================
    // COUNTS
    // ==========================================

    const employeeCount =
        employees.length;

    const managerCount =
        managers.length;

    const activeEmployeeCount =
        employees.filter(
            (employee) =>
                employee.isActive
        ).length;

    const activeManagerCount =
        managers.filter(
            (manager) =>
                manager.isActive
        ).length;

    const assignedEmployeeCount =
        employees.filter(
            (employee) =>
                employee.reportingManager
        ).length;

    const unassignedEmployeeCount =
        employees.filter(
            (employee) =>
                !employee.reportingManager
        ).length;

    const pendingCount =
        leaveRequests.filter(
            (request) =>
                request.status === "Pending"
        ).length;

    const approvedCount =
        leaveRequests.filter(
            (request) =>
                request.status === "Approved"
        ).length;

    const rejectedCount =
        leaveRequests.filter(
            (request) =>
                request.status === "Rejected"
        ).length;

    // ==========================================
    // NAVIGATION
    // ==========================================

    const showSection = (sectionId) => {
        setActiveSection(sectionId);

        setErrorMessage("");
        setSuccessMessage("");
    };

    // ==========================================
    // LEAVE BALANCE
    // ==========================================

    const handleEmployeeSelect = (event) => {
        const employeeId =
            event.target.value;

        setSelectedEmployee(employeeId);

        const employee =
            employees.find(
                (item) =>
                    String(item._id) ===
                    String(employeeId)
            );

        if (employee?.leaveBalances) {
            setCasualBalance(
                employee.leaveBalances.casual ?? ""
            );

            setSickBalance(
                employee.leaveBalances.sick ?? ""
            );

            setEarnedBalance(
                employee.leaveBalances.earned ?? ""
            );
        } else {
            setCasualBalance("");
            setSickBalance("");
            setEarnedBalance("");
        }

        setErrorMessage("");
        setSuccessMessage("");
    };

    // ==========================================
    // UPDATE LEAVE BALANCE
    // ==========================================

    const handleBalanceSubmit = async (event) => {
        event.preventDefault();

        setErrorMessage("");
        setSuccessMessage("");

        if (!selectedEmployee) {
            setErrorMessage(
                "Please select an employee."
            );
            return;
        }

        if (
            casualBalance === "" ||
            sickBalance === "" ||
            earnedBalance === ""
        ) {
            setErrorMessage(
                "Please enter all leave balances."
            );
            return;
        }

        if (
            Number(casualBalance) < 0 ||
            Number(sickBalance) < 0 ||
            Number(earnedBalance) < 0
        ) {
            setErrorMessage(
                "Leave balances cannot be negative."
            );
            return;
        }

        try {
            setUpdatingBalance(true);

            const response =
                await fetch(
                    `${API_URL}/api/admin/employees/${selectedEmployee}/leave-balance`,
                    {
                        method: "PUT",
                        headers: getHeaders(),
                        body: JSON.stringify({
                            casual:
                                Number(casualBalance),

                            sick:
                                Number(sickBalance),

                            earned:
                                Number(earnedBalance)
                        })
                    }
                );

            const data =
                await response.json();

            if (
                response.status === 401 ||
                response.status === 403
            ) {
                handleAuthFailure();
                return;
            }

            if (!response.ok) {
                throw new Error(
                    data.message ||
                    "Unable to update leave balance."
                );
            }

            setSuccessMessage(
                "Employee leave balance updated successfully."
            );

            await loadData();
        } catch (error) {
            console.error(
                "Leave balance update error:",
                error
            );

            setErrorMessage(
                error.message ||
                "Unable to update leave balance."
            );
        } finally {
            setUpdatingBalance(false);
        }
    };

    // ==========================================
    // MANAGER SELECTION
    // ==========================================

    const handleManagerSelection = (
        employeeId,
        managerId
    ) => {
        setSelectedManagerByEmployee(
            (previous) => ({
                ...previous,
                [employeeId]: managerId
            })
        );

        setErrorMessage("");
        setSuccessMessage("");
    };

    // ==========================================
    // ASSIGN EMPLOYEE TO MANAGER
    // ==========================================

    const handleAssignManager = async (
        employee
    ) => {
        const managerId =
            selectedManagerByEmployee[
                employee._id
            ];

        setErrorMessage("");
        setSuccessMessage("");

        if (!managerId) {
            setErrorMessage(
                "Please select a manager before assigning."
            );
            return;
        }

        const selectedManager =
            managers.find(
                (manager) =>
                    String(manager._id) ===
                    String(managerId)
            );

        if (!selectedManager) {
            setErrorMessage(
                "Selected manager was not found."
            );
            return;
        }

        if (!selectedManager.isActive) {
            setErrorMessage(
                "Cannot assign an employee to an inactive manager."
            );
            return;
        }

        try {
            setAssigningManager(true);

            const response =
                await fetch(
                    `${API_URL}/api/admin/employees/${employee._id}/manager`,
                    {
                        method: "PUT",
                        headers: getHeaders(),
                        body: JSON.stringify({
                            managerId
                        })
                    }
                );

            const data =
                await response.json();

            if (
                response.status === 401 ||
                response.status === 403
            ) {
                handleAuthFailure();
                return;
            }

            if (!response.ok) {
                throw new Error(
                    data.message ||
                    "Unable to assign employee to manager."
                );
            }

            setSuccessMessage(
                `${employee.name || "Employee"} assigned to ${selectedManager.name || "manager"} successfully.`
            );

            await loadData();
        } catch (error) {
            console.error(
                "Assign manager error:",
                error
            );

            setErrorMessage(
                error.message ||
                "Unable to assign employee to manager."
            );
        } finally {
            setAssigningManager(false);
        }
    };

    // ==========================================
    // NEW USER INPUT
    // ==========================================

    const handleNewUserChange = (event) => {
        const {
            name,
            value
        } = event.target;

        setNewUser(
            (previous) => ({
                ...previous,
                [name]: value
            })
        );
    };

    // ==========================================
    // RESET CREATE USER FORM
    // ==========================================

    const resetNewUserForm = () => {
        setNewUser({
            name: "",
            email: "",
            password: ""
        });
    };

    // ==========================================
    // CREATE EMPLOYEE
    // ==========================================

    const handleCreateEmployee = async (event) => {
        event.preventDefault();

        setErrorMessage("");
        setSuccessMessage("");

        if (
            !newUser.name.trim() ||
            !newUser.email.trim() ||
            !newUser.password
        ) {
            setErrorMessage(
                "Name, email and password are required."
            );
            return;
        }

        try {
            setCreatingUser(true);

            const response =
                await fetch(
                    `${API_URL}/api/admin/employees`,
                    {
                        method: "POST",
                        headers: getHeaders(),
                        body: JSON.stringify({
                            name:
                                newUser.name.trim(),

                            email:
                                newUser.email
                                    .trim()
                                    .toLowerCase(),

                            password:
                                newUser.password
                        })
                    }
                );

            const data =
                await response.json();

            if (
                response.status === 401 ||
                response.status === 403
            ) {
                handleAuthFailure();
                return;
            }

            if (!response.ok) {
                throw new Error(
                    data.message ||
                    "Unable to create employee."
                );
            }

            setSuccessMessage(
                "Employee created successfully."
            );

            resetNewUserForm();
            setShowCreateEmployee(false);

            await loadData();
        } catch (error) {
            console.error(
                "Create employee error:",
                error
            );

            setErrorMessage(
                error.message ||
                "Unable to create employee."
            );
        } finally {
            setCreatingUser(false);
        }
    };

    // ==========================================
    // CREATE MANAGER
    // ==========================================

    const handleCreateManager = async (event) => {
        event.preventDefault();

        setErrorMessage("");
        setSuccessMessage("");

        if (
            !newUser.name.trim() ||
            !newUser.email.trim() ||
            !newUser.password
        ) {
            setErrorMessage(
                "Name, email and password are required."
            );
            return;
        }

        try {
            setCreatingUser(true);

            const response =
                await fetch(
                    `${API_URL}/api/admin/managers`,
                    {
                        method: "POST",
                        headers: getHeaders(),
                        body: JSON.stringify({
                            name:
                                newUser.name.trim(),

                            email:
                                newUser.email
                                    .trim()
                                    .toLowerCase(),

                            password:
                                newUser.password
                        })
                    }
                );

            const data =
                await response.json();

            if (
                response.status === 401 ||
                response.status === 403
            ) {
                handleAuthFailure();
                return;
            }

            if (!response.ok) {
                throw new Error(
                    data.message ||
                    "Unable to create manager."
                );
            }

            setSuccessMessage(
                "Manager created successfully."
            );

            resetNewUserForm();
            setShowCreateManager(false);

            await loadData();
        } catch (error) {
            console.error(
                "Create manager error:",
                error
            );

            setErrorMessage(
                error.message ||
                "Unable to create manager."
            );
        } finally {
            setCreatingUser(false);
        }
    };

    // ==========================================
    // ACTIVATE / DEACTIVATE USER
    // ==========================================

    const handleToggleUserStatus = async (user) => {
        const action =
            user.isActive
                ? "deactivate"
                : "activate";

        const confirmed =
            window.confirm(
                `Are you sure you want to ${action} ${user.email}?`
            );

        if (!confirmed) {
            return;
        }

        setErrorMessage("");
        setSuccessMessage("");

        try {
            setUpdatingStatus(true);

            const response =
                await fetch(
                    `${API_URL}/api/admin/users/${user._id}/status`,
                    {
                        method: "PUT",
                        headers: getHeaders(),
                        body: JSON.stringify({
                            isActive:
                                !user.isActive
                        })
                    }
                );

            const data =
                await response.json();

            if (
                response.status === 401 ||
                response.status === 403
            ) {
                handleAuthFailure();
                return;
            }

            if (!response.ok) {
                throw new Error(
                    data.message ||
                    "Unable to update user status."
                );
            }

            setSuccessMessage(
                data.message ||
                "User status updated successfully."
            );

            await loadData();
        } catch (error) {
            console.error(
                "User status error:",
                error
            );

            setErrorMessage(
                error.message ||
                "Unable to update user status."
            );
        } finally {
            setUpdatingStatus(false);
        }
    };

    // ==========================================
    // LOGOUT
    // ==========================================

    const handleLogout = () => {
        localStorage.removeItem("token");
        localStorage.removeItem("loggedInUser");

        navigate("/");
    };

    // ==========================================
    // RECENT LEAVES
    // ==========================================

    const recentLeaves =
        [...leaveRequests]
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
            )
            .slice(0, 3);

    // ==========================================
    // FORMAT DATE
    // ==========================================

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

    // ==========================================
    // FORMAT LEAVE TYPE
    // ==========================================

    const formatLeaveType = (type) => {
        if (!type) {
            return "-";
        }

        return type
            .replace(/_/g, " ")
            .replace(/\b\w/g, (letter) =>
                letter.toUpperCase()
            );
    };

    // ==========================================
    // REQUEST CARD
    // ==========================================

    const RequestCard = ({ request }) => {
        const employee =
            request.employee || {};

        return (
            <div className="request-card">

                <div className="request-top">

                    <div>

                        <h4>
                            {employee.name ||
                                employee.email ||
                                "Employee"}
                        </h4>

                        <span>
                            {employee.email ||
                                "Employee"}
                        </span>

                    </div>

                    <span
                        className={`status ${
                            request.status
                                ?.toLowerCase() || ""
                        }`}
                    >
                        {request.status}
                    </span>

                </div>

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

                </div>

                <div className="request-reason">

                    <span>
                        Reason
                    </span>

                    <p>
                        {request.reason ||
                            "No reason provided."}
                    </p>

                </div>

                {request.reviewComment && (
                    <div className="request-reason">

                        <span>
                            Review Comment
                        </span>

                        <p>
                            {request.reviewComment}
                        </p>

                    </div>
                )}

                {request.reviewedAt && (
                    <div className="request-reason">

                        <span>
                            Reviewed On
                        </span>

                        <p>
                            {formatDate(
                                request.reviewedAt
                            )}
                        </p>

                    </div>
                )}

            </div>
        );
    };

    // ==========================================
    // USER CARD
    // ==========================================

    const UserCard = ({ user }) => {
        return (
            <div className="user-card">

                <div>

                    <div className="user-email">
                        {user.name ||
                            "User"}
                    </div>

                    <span className="user-label">
                        {user.email}
                    </span>

                </div>

                <div>

                    <span
                        className={`role ${
                            user.role || ""
                        }`}
                    >
                        {user.role}
                    </span>

                </div>

                <div>

                    <span className="user-label">
                        {user.isActive
                            ? "Active"
                            : "Inactive"}
                    </span>

                </div>

                {user.role !== "admin" && (
                    <button
                        type="button"
                        className="text-btn"
                        disabled={updatingStatus}
                        onClick={() =>
                            handleToggleUserStatus(
                                user
                            )
                        }
                    >
                        {user.isActive
                            ? "Deactivate"
                            : "Activate"}
                    </button>
                )}

            </div>
        );
    };

    // ==========================================
    // EMPLOYEE MANAGER CARD
    // ==========================================

    const EmployeeManagerCard = ({
        employee
    }) => {
        const selectedManagerId =
            selectedManagerByEmployee[
                employee._id
            ] || "";

        return (
            <div className="request-card">

                <div className="request-top">

                    <div>

                        <h4>
                            {employee.name ||
                                "Employee"}
                        </h4>

                        <span>
                            {employee.email ||
                                "-"}
                        </span>

                    </div>

                    <span
                        className={`status ${
                            employee.isActive
                                ? "approved"
                                : "cancelled"
                        }`}
                    >
                        {employee.isActive
                            ? "Active"
                            : "Inactive"}
                    </span>

                </div>

                <div className="request-info">

                    <div className="info-item">

                        <span>
                            Current Manager
                        </span>

                        <strong>
                            {employee.reportingManager?.name ||
                                "Not assigned"}
                        </strong>

                    </div>

                    <div className="info-item">

                        <span>
                            Manager Email
                        </span>

                        <strong>
                            {employee.reportingManager?.email ||
                                "-"}
                        </strong>

                    </div>

                    <div className="info-item">

                        <span>
                            Employee Status
                        </span>

                        <strong>
                            {employee.isActive
                                ? "Active"
                                : "Inactive"}
                        </strong>

                    </div>

                </div>

                <div
                    className="form-grid"
                    style={{
                        marginTop: "15px"
                    }}
                >

                    <div className="form-group">

                        <label>
                            Assign Manager
                        </label>

                        <select
                            value={
                                selectedManagerId
                            }
                            onChange={(event) =>
                                handleManagerSelection(
                                    employee._id,
                                    event.target.value
                                )
                            }
                            disabled={
                                !employee.isActive ||
                                assigningManager
                            }
                        >

                            <option value="">
                                Select manager
                            </option>

                            {managers
                                .filter(
                                    (manager) =>
                                        manager.isActive
                                )
                                .map(
                                    (manager) => (
                                        <option
                                            key={
                                                manager._id
                                            }
                                            value={
                                                manager._id
                                            }
                                        >
                                            {manager.name ||
                                                "Manager"}
                                            {" - "}
                                            {manager.email}
                                        </option>
                                    )
                                )}

                        </select>

                    </div>

                    <div
                        className="form-group"
                        style={{
                            justifyContent: "flex-end"
                        }}
                    >

                        <button
                            type="button"
                            className="primary-btn"
                            disabled={
                                !employee.isActive ||
                                !selectedManagerId ||
                                assigningManager
                            }
                            onClick={() =>
                                handleAssignManager(
                                    employee
                                )
                            }
                        >
                            {assigningManager
                                ? "Assigning..."
                                : "Assign Manager"}
                        </button>

                    </div>

                </div>

            </div>
        );
    };

    // ==========================================
    // LOADING
    // ==========================================

    if (loading || !loggedInUser) {
        return (
            <div className="admin-loading">

                <h2>
                    Loading Admin Portal...
                </h2>

                <p>
                    Please wait.
                </p>

            </div>
        );
    }

    // ==========================================
    // JSX
    // ==========================================

    return (
        <div className="admin-layout">

            {/* =================================
                SIDEBAR
            ================================= */}

            <aside className="sidebar">

                <div className="brand">

                    <h1>
                        Leave Desk
                    </h1>

                    <span>
                        Admin Portal
                    </span>

                </div>

                <nav className="sidebar-nav">

                    <button
                        className={
                            activeSection ===
                            "dashboardSection"
                                ? "nav-item active"
                                : "nav-item"
                        }
                        onClick={() =>
                            showSection(
                                "dashboardSection"
                            )
                        }
                    >
                        Dashboard
                    </button>

                    <button
                        className={
                            activeSection ===
                            "usersSection"
                                ? "nav-item active"
                                : "nav-item"
                        }
                        onClick={() =>
                            showSection(
                                "usersSection"
                            )
                        }
                    >
                        Users
                    </button>

                    <button
                        className={
                            activeSection ===
                            "leavesSection"
                                ? "nav-item active"
                                : "nav-item"
                        }
                        onClick={() =>
                            showSection(
                                "leavesSection"
                            )
                        }
                    >
                        Leave Requests
                    </button>

                    <button
                        className={
                            activeSection ===
                            "notificationsSection"
                                ? "nav-item active"
                                : "nav-item"
                        }
                        onClick={() =>
                            showSection(
                                "notificationsSection"
                            )
                        }
                    >
                        Notifications
                    </button>

                    <button
                        className={
                            activeSection ===
                            "profileSection"
                                ? "nav-item active"
                                : "nav-item"
                        }
                        onClick={() =>
                            showSection(
                                "profileSection"
                            )
                        }
                    >
                        Profile
                    </button>

                </nav>

                <button
                    className="logout-btn"
                    onClick={handleLogout}
                >
                    Logout
                </button>

            </aside>

            {/* =================================
                MAIN CONTENT
            ================================= */}

            <main className="main-content">

                {/* =================================
                    TOPBAR
                ================================= */}

                <header className="topbar">

                    <div>

                        <h2>
                            Admin Dashboard
                        </h2>

                        <p>
                            Manage users, managers and
                            employee leave activities
                        </p>

                    </div>

                    <div className="user-info">

                        <div className="user-avatar">

                            {(
                                loggedInUser.name ||
                                loggedInUser.email ||
                                "A"
                            )
                                .charAt(0)
                                .toUpperCase()}

                        </div>

                        <div>

                            <span>
                                {loggedInUser.name ||
                                    loggedInUser.email}
                            </span>

                            <small>
                                Admin
                            </small>

                        </div>

                    </div>

                </header>

                {/* =================================
                    GLOBAL MESSAGES
                ================================= */}

                {errorMessage && (
                    <div className="manager-error">
                        {errorMessage}
                    </div>
                )}

                {successMessage && (
                    <div className="manager-success">
                        {successMessage}
                    </div>
                )}

                {/* =================================
                    DASHBOARD
                ================================= */}

                {activeSection ===
                    "dashboardSection" && (

                    <section className="content-section">

                        <div className="welcome-card">

                            <div>

                                <h3>
                                    Welcome to Leave Desk
                                </h3>

                                <p>
                                    Manage employees,
                                    managers and monitor
                                    employee leave activities.
                                </p>

                            </div>

                            <button
                                className="primary-btn"
                                onClick={() =>
                                    showSection(
                                        "usersSection"
                                    )
                                }
                            >
                                Manage Users
                            </button>

                        </div>

                        {/* MAIN COUNTS */}

                        <div className="summary-grid">

                            <div className="summary-card">

                                <span className="summary-title">
                                    Total Users
                                </span>

                                <strong>
                                    {users.length}
                                </strong>

                                <p>
                                    Registered users
                                </p>

                            </div>

                            <div className="summary-card">

                                <span className="summary-title">
                                    Employees
                                </span>

                                <strong>
                                    {employeeCount}
                                </strong>

                                <p>
                                    Registered employees
                                </p>

                            </div>

                            <div className="summary-card">

                                <span className="summary-title">
                                    Managers
                                </span>

                                <strong>
                                    {managerCount}
                                </strong>

                                <p>
                                    Registered managers
                                </p>

                            </div>

                            <div className="summary-card">

                                <span className="summary-title">
                                    Leave Requests
                                </span>

                                <strong>
                                    {leaveRequests.length}
                                </strong>

                                <p>
                                    Total leave requests
                                </p>

                            </div>

                        </div>

                        {/* LEAVE COUNTS */}

                        <div className="summary-grid">

                            <div className="summary-card">

                                <span className="summary-title">
                                    Pending
                                </span>

                                <strong>
                                    {pendingCount}
                                </strong>

                                <p>
                                    Requests awaiting action
                                </p>

                            </div>

                            <div className="summary-card">

                                <span className="summary-title">
                                    Approved
                                </span>

                                <strong>
                                    {approvedCount}
                                </strong>

                                <p>
                                    Approved requests
                                </p>

                            </div>

                            <div className="summary-card">

                                <span className="summary-title">
                                    Assigned Employees
                                </span>

                                <strong>
                                    {assignedEmployeeCount}
                                </strong>

                                <p>
                                    Employees with a manager
                                </p>

                            </div>

                            <div className="summary-card">

                                <span className="summary-title">
                                    Unassigned Employees
                                </span>

                                <strong>
                                    {unassignedEmployeeCount}
                                </strong>

                                <p>
                                    Employees awaiting assignment
                                </p>

                            </div>

                        </div>

                        {/* SYSTEM STATUS */}

                        <div className="summary-grid">

                            <div className="summary-card">

                                <span className="summary-title">
                                    Active Employees
                                </span>

                                <strong>
                                    {activeEmployeeCount}
                                </strong>

                                <p>
                                    Currently active
                                </p>

                            </div>

                            <div className="summary-card">

                                <span className="summary-title">
                                    Active Managers
                                </span>

                                <strong>
                                    {activeManagerCount}
                                </strong>

                                <p>
                                    Currently active
                                </p>

                            </div>

                            <div className="summary-card">

                                <span className="summary-title">
                                    Rejected
                                </span>

                                <strong>
                                    {rejectedCount}
                                </strong>

                                <p>
                                    Rejected requests
                                </p>

                            </div>

                            <div className="summary-card">

                                <span className="summary-title">
                                    System Status
                                </span>

                                <strong>
                                    Active
                                </strong>

                                <p>
                                    Leave Desk system
                                </p>

                            </div>

                        </div>

                        {/* RECENT LEAVES */}

                        <div className="section-card">

                            <div className="section-header">

                                <div>

                                    <h3>
                                        Recent Leave Requests
                                    </h3>

                                    <p>
                                        Latest requests in
                                        the system
                                    </p>

                                </div>

                                <button
                                    className="text-btn"
                                    onClick={() =>
                                        showSection(
                                            "leavesSection"
                                        )
                                    }
                                >
                                    View All
                                </button>

                            </div>

                            <div className="request-list">

                                {recentLeaves.length === 0 ? (

                                    <div className="empty-state">

                                        <h4>
                                            No leave requests
                                        </h4>

                                        <p>
                                            Leave requests
                                            will appear here.
                                        </p>

                                    </div>

                                ) : (

                                    recentLeaves.map(
                                        (request) => (
                                            <RequestCard
                                                key={
                                                    request._id
                                                }
                                                request={
                                                    request
                                                }
                                            />
                                        )
                                    )

                                )}

                            </div>

                        </div>

                    </section>
                )}

                {/* =================================
                    USERS
                ================================= */}

                {activeSection ===
                    "usersSection" && (

                    <section className="content-section">

                        {/* USER LIST */}

                        <div className="section-card">

                            <div className="section-header">

                                <div>

                                    <h3>
                                        Registered Users
                                    </h3>

                                    <p>
                                        View and manage users
                                        registered in Leave Desk
                                    </p>

                                </div>

                            </div>

                            <div className="user-list">

                                {users.length === 0 ? (

                                    <div className="empty-state">

                                        <h4>
                                            No users found
                                        </h4>

                                        <p>
                                            Registered users
                                            will appear here.
                                        </p>

                                    </div>

                                ) : (

                                    users.map(
                                        (user) => (
                                            <UserCard
                                                key={
                                                    user._id
                                                }
                                                user={
                                                    user
                                                }
                                            />
                                        )
                                    )

                                )}

                            </div>

                        </div>

                        {/* =================================
                            EMPLOYEE MANAGER ASSIGNMENT
                        ================================= */}

                        <div className="section-card">

                            <div className="section-header">

                                <div>

                                    <h3>
                                        Employee Manager Assignment
                                    </h3>

                                    <p>
                                        Assign each employee to
                                        their reporting manager
                                    </p>

                                </div>

                            </div>

                            {employees.length === 0 ? (

                                <div className="empty-state">

                                    <h4>
                                        No employees found
                                    </h4>

                                    <p>
                                        Create an employee
                                        account first.
                                    </p>

                                </div>

                            ) : (

                                <div className="request-list">

                                    {employees.map(
                                        (employee) => (
                                            <EmployeeManagerCard
                                                key={
                                                    employee._id
                                                }
                                                employee={
                                                    employee
                                                }
                                            />
                                        )
                                    )}

                                </div>

                            )}

                        </div>

                        {/* =================================
                            CREATE ACCOUNT
                        ================================= */}

                        <div className="section-card">

                            <div className="section-header">

                                <div>

                                    <h3>
                                        Create Account
                                    </h3>

                                    <p>
                                        Create employee or
                                        manager accounts
                                    </p>

                                </div>

                            </div>

                            <div className="create-account-actions">

                                <button
                                    className="primary-btn"
                                    type="button"
                                    onClick={() => {
                                        setShowCreateEmployee(
                                            !showCreateEmployee
                                        );

                                        setShowCreateManager(
                                            false
                                        );

                                        resetNewUserForm();

                                        setErrorMessage("");
                                        setSuccessMessage("");
                                    }}
                                >
                                    Create Employee
                                </button>

                                <button
                                    className="primary-btn"
                                    type="button"
                                    onClick={() => {
                                        setShowCreateManager(
                                            !showCreateManager
                                        );

                                        setShowCreateEmployee(
                                            false
                                        );

                                        resetNewUserForm();

                                        setErrorMessage("");
                                        setSuccessMessage("");
                                    }}
                                >
                                    Create Manager
                                </button>

                            </div>

                            {/* CREATE EMPLOYEE */}

                            {showCreateEmployee && (

                                <form
                                    onSubmit={
                                        handleCreateEmployee
                                    }
                                    style={{
                                        marginTop: "20px"
                                    }}
                                >

                                    <div className="form-grid">

                                        <div className="form-group">

                                            <label>
                                                Full Name
                                            </label>

                                            <input
                                                type="text"
                                                name="name"
                                                value={
                                                    newUser.name
                                                }
                                                onChange={
                                                    handleNewUserChange
                                                }
                                                placeholder="Enter full name"
                                                required
                                            />

                                        </div>

                                        <div className="form-group">

                                            <label>
                                                Email
                                            </label>

                                            <input
                                                type="email"
                                                name="email"
                                                value={
                                                    newUser.email
                                                }
                                                onChange={
                                                    handleNewUserChange
                                                }
                                                placeholder="Enter email"
                                                required
                                            />

                                        </div>

                                        <div className="form-group">

                                            <label>
                                                Password
                                            </label>

                                            <input
                                                type="password"
                                                name="password"
                                                value={
                                                    newUser.password
                                                }
                                                onChange={
                                                    handleNewUserChange
                                                }
                                                placeholder="Enter password"
                                                minLength="6"
                                                required
                                            />

                                        </div>

                                    </div>

                                    <button
                                        type="submit"
                                        className="primary-btn"
                                        disabled={
                                            creatingUser
                                        }
                                    >
                                        {creatingUser
                                            ? "Creating..."
                                            : "Create Employee"}
                                    </button>

                                </form>

                            )}

                            {/* CREATE MANAGER */}

                            {showCreateManager && (

                                <form
                                    onSubmit={
                                        handleCreateManager
                                    }
                                    style={{
                                        marginTop: "20px"
                                    }}
                                >

                                    <div className="form-grid">

                                        <div className="form-group">

                                            <label>
                                                Full Name
                                            </label>

                                            <input
                                                type="text"
                                                name="name"
                                                value={
                                                    newUser.name
                                                }
                                                onChange={
                                                    handleNewUserChange
                                                }
                                                placeholder="Enter full name"
                                                required
                                            />

                                        </div>

                                        <div className="form-group">

                                            <label>
                                                Email
                                            </label>

                                            <input
                                                type="email"
                                                name="email"
                                                value={
                                                    newUser.email
                                                }
                                                onChange={
                                                    handleNewUserChange
                                                }
                                                placeholder="Enter email"
                                                required
                                            />

                                        </div>

                                        <div className="form-group">

                                            <label>
                                                Password
                                            </label>

                                            <input
                                                type="password"
                                                name="password"
                                                value={
                                                    newUser.password
                                                }
                                                onChange={
                                                    handleNewUserChange
                                                }
                                                placeholder="Enter password"
                                                minLength="6"
                                                required
                                            />

                                        </div>

                                    </div>

                                    <button
                                        type="submit"
                                        className="primary-btn"
                                        disabled={
                                            creatingUser
                                        }
                                    >
                                        {creatingUser
                                            ? "Creating..."
                                            : "Create Manager"}
                                    </button>

                                </form>

                            )}

                        </div>

                        {/* =================================
                            LEAVE BALANCE
                        ================================= */}

                        <div className="section-card">

                            <div className="section-header">

                                <div>

                                    <h3>
                                        Employee Leave Balance
                                    </h3>

                                    <p>
                                        Assign or update an
                                        employee's leave balance
                                    </p>

                                </div>

                            </div>

                            <form
                                onSubmit={
                                    handleBalanceSubmit
                                }
                            >

                                <div className="form-grid">

                                    <div className="form-group">

                                        <label>
                                            Employee
                                        </label>

                                        <select
                                            value={
                                                selectedEmployee
                                            }
                                            onChange={
                                                handleEmployeeSelect
                                            }
                                            required
                                        >

                                            <option value="">
                                                Select employee
                                            </option>

                                            {employees.map(
                                                (employee) => (
                                                    <option
                                                        key={
                                                            employee._id
                                                        }
                                                        value={
                                                            employee._id
                                                        }
                                                    >
                                                        {employee.name ||
                                                            "Employee"}
                                                        {" - "}
                                                        {employee.email}
                                                    </option>
                                                )
                                            )}

                                        </select>

                                    </div>

                                    <div className="form-group">

                                        <label>
                                            Casual Leave
                                        </label>

                                        <input
                                            type="number"
                                            min="0"
                                            value={
                                                casualBalance
                                            }
                                            onChange={(event) =>
                                                setCasualBalance(
                                                    event.target.value
                                                )
                                            }
                                            placeholder="Casual leave"
                                            required
                                        />

                                    </div>

                                    <div className="form-group">

                                        <label>
                                            Sick Leave
                                        </label>

                                        <input
                                            type="number"
                                            min="0"
                                            value={
                                                sickBalance
                                            }
                                            onChange={(event) =>
                                                setSickBalance(
                                                    event.target.value
                                                )
                                            }
                                            placeholder="Sick leave"
                                            required
                                        />

                                    </div>

                                    <div className="form-group">

                                        <label>
                                            Earned Leave
                                        </label>

                                        <input
                                            type="number"
                                            min="0"
                                            value={
                                                earnedBalance
                                            }
                                            onChange={(event) =>
                                                setEarnedBalance(
                                                    event.target.value
                                                )
                                            }
                                            placeholder="Earned leave"
                                            required
                                        />

                                    </div>

                                </div>

                                <button
                                    type="submit"
                                    className="primary-btn"
                                    disabled={
                                        updatingBalance
                                    }
                                >
                                    {updatingBalance
                                        ? "Saving..."
                                        : "Save Leave Balance"}
                                </button>

                            </form>

                        </div>

                    </section>
                )}

                {/* =================================
                    LEAVE REQUESTS
                ================================= */}

                {activeSection ===
                    "leavesSection" && (

                    <section className="content-section">

                        <div className="section-card">

                            <div className="section-header">

                                <div>

                                    <h3>
                                        All Leave Requests
                                    </h3>

                                    <p>
                                        Monitor leave requests
                                        submitted by employees
                                    </p>

                                </div>

                            </div>

                            <div className="request-list">

                                {leaveRequests.length === 0 ? (

                                    <div className="empty-state">

                                        <h4>
                                            No leave requests
                                        </h4>

                                        <p>
                                            Employee leave requests
                                            will appear here.
                                        </p>

                                    </div>

                                ) : (

                                    [...leaveRequests]
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
                                        )
                                        .map(
                                            (request) => (
                                                <RequestCard
                                                    key={
                                                        request._id
                                                    }
                                                    request={
                                                        request
                                                    }
                                                />
                                            )
                                        )

                                )}

                            </div>

                        </div>

                    </section>
                )}

                {/* =================================
                    NOTIFICATIONS
                ================================= */}

                {activeSection ===
                    "notificationsSection" && (

                    <section className="content-section">

                        <div className="section-card">

                            <div className="section-header">

                                <div>

                                    <h3>
                                        Notifications
                                    </h3>

                                    <p>
                                        View system notifications
                                    </p>

                                </div>

                            </div>

                            <NotificationPanel />

                        </div>

                    </section>
                )}

                {/* =================================
                    PROFILE
                ================================= */}

                {activeSection ===
                    "profileSection" && (

                    <section className="content-section">

                        <div className="section-card">

                            <div className="section-header">

                                <div>

                                    <h3>
                                        My Profile
                                    </h3>

                                    <p>
                                        Administrator account
                                        information
                                    </p>

                                </div>

                            </div>

                            <div className="profile-details">

                                <div className="profile-row">

                                    <span>
                                        Name
                                    </span>

                                    <strong>
                                        {loggedInUser.name ||
                                            "-"}
                                    </strong>

                                </div>

                                <div className="profile-row">

                                    <span>
                                        Email
                                    </span>

                                    <strong>
                                        {loggedInUser.email ||
                                            "-"}
                                    </strong>

                                </div>

                                <div className="profile-row">

                                    <span>
                                        Role
                                    </span>

                                    <strong>
                                        {loggedInUser.role ||
                                            "admin"}
                                    </strong>

                                </div>

                                <div className="profile-row">

                                    <span>
                                        Account Status
                                    </span>

                                    <strong>
                                        Active
                                    </strong>

                                </div>

                                {loggedInUser.createdAt && (
                                    <div className="profile-row">

                                        <span>
                                            Account Created
                                        </span>

                                        <strong>
                                            {formatDate(
                                                loggedInUser.createdAt
                                            )}
                                        </strong>

                                    </div>
                                )}

                            </div>

                        </div>

                    </section>
                )}

            </main>

        </div>
    );
}

export default Admin;