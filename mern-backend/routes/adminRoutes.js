const express = require("express");

const {
    getAdminDashboard,
    getAdminUsers,
    getAdminEmployees,
    getAdminManagers,
    getAdminLeaves,
    updateEmployeeLeaveBalance,
    createEmployee,
    createManager,
    assignEmployeeToManager,
    toggleUserStatus,
    getAdminProfile
} = require("../controllers/adminController");

const protect = require("../middleware/authMiddleware");
const authorizeRoles = require("../middleware/roleMiddleware");

const router = express.Router();


// ============================================================
// Admin dashboard
// ============================================================

router.get(
    "/dashboard",
    protect,
    authorizeRoles("admin"),
    getAdminDashboard
);


// ============================================================
// Get all users
// ============================================================

router.get(
    "/users",
    protect,
    authorizeRoles("admin"),
    getAdminUsers
);


// ============================================================
// Get all employees
// ============================================================

router.get(
    "/employees",
    protect,
    authorizeRoles("admin"),
    getAdminEmployees
);


// ============================================================
// Get all managers
// ============================================================

router.get(
    "/managers",
    protect,
    authorizeRoles("admin"),
    getAdminManagers
);


// ============================================================
// Get all leave requests
// ============================================================

router.get(
    "/leaves",
    protect,
    authorizeRoles("admin"),
    getAdminLeaves
);


// ============================================================
// Update employee leave balance
// ============================================================

router.put(
    "/employees/:id/leave-balance",
    protect,
    authorizeRoles("admin"),
    updateEmployeeLeaveBalance
);


// ============================================================
// Create employee by admin
// ============================================================

router.post(
    "/employees",
    protect,
    authorizeRoles("admin"),
    createEmployee
);


// ============================================================
// Create manager by admin
// ============================================================

router.post(
    "/managers",
    protect,
    authorizeRoles("admin"),
    createManager
);


// ============================================================
// Assign employee to manager
// ============================================================

router.put(
    "/employees/:employeeId/manager",
    protect,
    authorizeRoles("admin"),
    assignEmployeeToManager
);


// ============================================================
// Activate or deactivate user
// ============================================================

router.put(
    "/users/:id/status",
    protect,
    authorizeRoles("admin"),
    toggleUserStatus
);


// ============================================================
// Get admin profile
// ============================================================

router.get(
    "/profile",
    protect,
    authorizeRoles("admin"),
    getAdminProfile
);


module.exports = router;