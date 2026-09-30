const User = require("../models/User");
const Leave = require("../models/Leave");


// ============================================================
// Get admin dashboard
// ============================================================

const getAdminDashboard = async (req, res) => {
    try {
        // User statistics
        const totalUsers = await User.countDocuments();

        const totalEmployees = await User.countDocuments({
            role: "employee"
        });

        const totalManagers = await User.countDocuments({
            role: "manager"
        });

        const totalAdmins = await User.countDocuments({
            role: "admin"
        });


        // Leave statistics
        const totalLeaves = await Leave.countDocuments();

        const pendingLeaves = await Leave.countDocuments({
            status: "Pending"
        });

        const approvedLeaves = await Leave.countDocuments({
            status: "Approved"
        });

        const rejectedLeaves = await Leave.countDocuments({
            status: "Rejected"
        });

        const cancelledLeaves = await Leave.countDocuments({
            status: "Cancelled"
        });


        res.status(200).json({
            message: "Admin dashboard data retrieved successfully",

            admin: {
                id: req.user._id,
                name: req.user.name,
                email: req.user.email,
                role: req.user.role
            },

            userStatistics: {
                totalUsers,
                totalEmployees,
                totalManagers,
                totalAdmins
            },

            leaveStatistics: {
                totalLeaves,
                pendingLeaves,
                approvedLeaves,
                rejectedLeaves,
                cancelledLeaves
            }
        });

    } catch (error) {
        console.error("Admin dashboard error:", error);

        res.status(500).json({
            message: "Server error while loading admin dashboard"
        });
    }
};


// ============================================================
// Get all users for admin
// ============================================================

const getAdminUsers = async (req, res) => {
    try {
        const users = await User.find()
            .select("-password")
            .populate(
                "reportingManager",
                "name email role isActive"
            )
            .sort({
                createdAt: -1
            });

        res.status(200).json({
            message: "Users retrieved successfully",
            users
        });

    } catch (error) {
        console.error("Get admin users error:", error);

        res.status(500).json({
            message: "Server error while retrieving users"
        });
    }
};


// ============================================================
// Get all employees for admin
// ============================================================

const getAdminEmployees = async (req, res) => {
    try {
        const employees = await User.find({
            role: "employee"
        })
            .select("-password")
            .populate(
                "reportingManager",
                "name email role isActive"
            )
            .sort({
                createdAt: -1
            });

        res.status(200).json({
            message: "Employees retrieved successfully",
            employees
        });

    } catch (error) {
        console.error("Get admin employees error:", error);

        res.status(500).json({
            message: "Server error while retrieving employees"
        });
    }
};


// ============================================================
// Get all managers for admin
// ============================================================

const getAdminManagers = async (req, res) => {
    try {
        const managers = await User.find({
            role: "manager"
        })
            .select("-password")
            .sort({
                createdAt: -1
            });

        res.status(200).json({
            message: "Managers retrieved successfully",
            managers
        });

    } catch (error) {
        console.error("Get admin managers error:", error);

        res.status(500).json({
            message: "Server error while retrieving managers"
        });
    }
};


// ============================================================
// Get all leave requests for admin
// ============================================================

const getAdminLeaves = async (req, res) => {
    try {
        const leaves = await Leave.find()
            .populate(
                "employee",
                "name email role reportingManager"
            )
            .populate(
                "reviewedBy",
                "name email role"
            )
            .sort({
                createdAt: -1
            });

        res.status(200).json({
            message: "Leave requests retrieved successfully",
            leaves
        });

    } catch (error) {
        console.error("Get admin leaves error:", error);

        res.status(500).json({
            message: "Server error while retrieving leave requests"
        });
    }
};


// ============================================================
// Update employee leave balance
// ============================================================

const updateEmployeeLeaveBalance = async (req, res) => {
    try {
        const { id } = req.params;
        const { casual, sick, earned } = req.body;

        const employee = await User.findOne({
            _id: id,
            role: "employee"
        });

        if (!employee) {
            return res.status(404).json({
                message: "Employee not found"
            });
        }

        if (
            casual !== undefined &&
            (typeof casual !== "number" || casual < 0)
        ) {
            return res.status(400).json({
                message:
                    "Casual leave balance must be a non-negative number"
            });
        }

        if (
            sick !== undefined &&
            (typeof sick !== "number" || sick < 0)
        ) {
            return res.status(400).json({
                message:
                    "Sick leave balance must be a non-negative number"
            });
        }

        if (
            earned !== undefined &&
            (typeof earned !== "number" || earned < 0)
        ) {
            return res.status(400).json({
                message:
                    "Earned leave balance must be a non-negative number"
            });
        }

        if (casual !== undefined) {
            employee.leaveBalances.casual = casual;
        }

        if (sick !== undefined) {
            employee.leaveBalances.sick = sick;
        }

        if (earned !== undefined) {
            employee.leaveBalances.earned = earned;
        }

        await employee.save();

        res.status(200).json({
            message:
                "Employee leave balance updated successfully",

            employee: {
                id: employee._id,
                name: employee.name,
                email: employee.email,
                role: employee.role,
                leaveBalances: employee.leaveBalances
            }
        });

    } catch (error) {
        console.error(
            "Update employee leave balance error:",
            error
        );

        if (error.name === "CastError") {
            return res.status(400).json({
                message: "Invalid employee ID"
            });
        }

        res.status(500).json({
            message:
                "Server error while updating leave balance"
        });
    }
};


// ============================================================
// Create employee by admin
// ============================================================

const createEmployee = async (req, res) => {
    try {
        const {
            name,
            email,
            password
        } = req.body;

        if (!name || !email || !password) {
            return res.status(400).json({
                message:
                    "Name, email and password are required"
            });
        }

        const existingUser = await User.findOne({
            email: email.toLowerCase()
        });

        if (existingUser) {
            return res.status(409).json({
                message: "Email already registered"
            });
        }

        const bcrypt = require("bcryptjs");

        const hashedPassword =
            await bcrypt.hash(password, 10);

        const employee = await User.create({
            name,
            email: email.toLowerCase(),
            password: hashedPassword,
            role: "employee"
        });

        res.status(201).json({
            message: "Employee created successfully",

            employee: {
                id: employee._id,
                name: employee.name,
                email: employee.email,
                role: employee.role,
                leaveBalances: employee.leaveBalances,
                reportingManager:
                    employee.reportingManager,
                isActive: employee.isActive,
                createdAt: employee.createdAt
            }
        });

    } catch (error) {
        console.error(
            "Create employee error:",
            error
        );

        res.status(500).json({
            message:
                "Server error while creating employee"
        });
    }
};


// ============================================================
// Create manager by admin
// ============================================================

const createManager = async (req, res) => {
    try {
        const {
            name,
            email,
            password
        } = req.body;

        if (!name || !email || !password) {
            return res.status(400).json({
                message:
                    "Name, email and password are required"
            });
        }

        const existingUser = await User.findOne({
            email: email.toLowerCase()
        });

        if (existingUser) {
            return res.status(409).json({
                message: "Email already registered"
            });
        }

        const bcrypt = require("bcryptjs");

        const hashedPassword =
            await bcrypt.hash(password, 10);

        const manager = await User.create({
            name,
            email: email.toLowerCase(),
            password: hashedPassword,
            role: "manager"
        });

        res.status(201).json({
            message: "Manager created successfully",

            manager: {
                id: manager._id,
                name: manager.name,
                email: manager.email,
                role: manager.role,
                isActive: manager.isActive,
                createdAt: manager.createdAt
            }
        });

    } catch (error) {
        console.error(
            "Create manager error:",
            error
        );

        res.status(500).json({
            message:
                "Server error while creating manager"
        });
    }
};


// ============================================================
// Assign employee to manager
// ============================================================

const assignEmployeeToManager = async (req, res) => {
    try {
        const { employeeId } = req.params;
        const { managerId } = req.body;


        // --------------------------------------------------------
        // 1. Validate manager ID
        // --------------------------------------------------------

        if (!managerId) {
            return res.status(400).json({
                message: "Manager ID is required"
            });
        }


        // --------------------------------------------------------
        // 2. Find employee
        // --------------------------------------------------------

        const employee = await User.findOne({
            _id: employeeId,
            role: "employee"
        });

        if (!employee) {
            return res.status(404).json({
                message: "Employee not found"
            });
        }


        // --------------------------------------------------------
        // 3. Check employee status
        // --------------------------------------------------------

        if (!employee.isActive) {
            return res.status(400).json({
                message:
                    "Cannot assign an inactive employee"
            });
        }


        // --------------------------------------------------------
        // 4. Find manager
        // --------------------------------------------------------

        const manager = await User.findOne({
            _id: managerId,
            role: "manager"
        });

        if (!manager) {
            return res.status(404).json({
                message: "Manager not found"
            });
        }


        // --------------------------------------------------------
        // 5. Check manager status
        // --------------------------------------------------------

        if (!manager.isActive) {
            return res.status(400).json({
                message:
                    "Cannot assign employee to an inactive manager"
            });
        }


        // --------------------------------------------------------
        // 6. Assign manager
        // --------------------------------------------------------

        employee.reportingManager = manager._id;

        await employee.save();


        // --------------------------------------------------------
        // 7. Get updated employee
        // --------------------------------------------------------

        const updatedEmployee =
            await User.findById(employee._id)
                .select("-password")
                .populate(
                    "reportingManager",
                    "name email role isActive"
                );


        // --------------------------------------------------------
        // 8. Send response
        // --------------------------------------------------------

        res.status(200).json({
            message:
                "Employee assigned to manager successfully",

            employee: updatedEmployee
        });

    } catch (error) {
        console.error(
            "Assign employee to manager error:",
            error
        );

        if (error.name === "CastError") {
            return res.status(400).json({
                message:
                    "Invalid employee ID or manager ID"
            });
        }

        res.status(500).json({
            message:
                "Server error while assigning employee to manager"
        });
    }
};


// ============================================================
// Get admin profile
// ============================================================

const getAdminProfile = async (req, res) => {
    try {
        const admin = req.user;

        res.status(200).json({
            message:
                "Admin profile retrieved successfully",

            admin: {
                id: admin._id,
                name: admin.name,
                email: admin.email,
                role: admin.role,
                isActive: admin.isActive,
                createdAt: admin.createdAt
            }
        });

    } catch (error) {
        console.error(
            "Admin profile error:",
            error
        );

        res.status(500).json({
            message:
                "Server error while loading admin profile"
        });
    }
};


// ============================================================
// Activate or deactivate a user
// ============================================================

const toggleUserStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { isActive } = req.body;


        // --------------------------------------------------------
        // Validate isActive
        // --------------------------------------------------------

        if (typeof isActive !== "boolean") {
            return res.status(400).json({
                message:
                    "isActive must be true or false"
            });
        }


        // --------------------------------------------------------
        // Find user
        // --------------------------------------------------------

        const user = await User.findById(id);

        if (!user) {
            return res.status(404).json({
                message: "User not found"
            });
        }


        // --------------------------------------------------------
        // Prevent admin from deactivating themselves
        // --------------------------------------------------------

        if (
            user._id.toString() ===
            req.user._id.toString()
        ) {
            return res.status(400).json({
                message:
                    "You cannot change your own account status"
            });
        }


        // --------------------------------------------------------
        // Update status
        // --------------------------------------------------------

        user.isActive = isActive;

        await user.save();


        // --------------------------------------------------------
        // Send response
        // --------------------------------------------------------

        res.status(200).json({
            message:
                `User ${
                    isActive
                        ? "activated"
                        : "deactivated"
                } successfully`,

            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                isActive: user.isActive
            }
        });

    } catch (error) {
        console.error(
            "Toggle user status error:",
            error
        );

        if (error.name === "CastError") {
            return res.status(400).json({
                message:
                    "Invalid user ID"
            });
        }

        res.status(500).json({
            message:
                "Server error while updating user status"
        });
    }
};


// ============================================================
// Export controllers
// ============================================================

module.exports = {
    getAdminDashboard,
    getAdminUsers,
    getAdminEmployees,
    getAdminManagers,
    getAdminLeaves,
    updateEmployeeLeaveBalance,
    createEmployee,
    createManager,
    assignEmployeeToManager,
    getAdminProfile,
    toggleUserStatus
};