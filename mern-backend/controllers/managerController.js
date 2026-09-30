const Leave = require("../models/Leave");
const Notification = require("../models/Notification");
const User = require("../models/User");


// ============================================================
// Allowed leave types
// ============================================================

const ALLOWED_LEAVE_TYPES = [
    "casual",
    "sick",
    "earned"
];


// ============================================================
// Calculate inclusive leave days
// ============================================================

const calculateLeaveDays = (startDate, endDate) => {
    const start = new Date(startDate);
    const end = new Date(endDate);

    start.setHours(0, 0, 0, 0);
    end.setHours(0, 0, 0, 0);

    const difference =
        end.getTime() - start.getTime();

    return Math.floor(
        difference / (1000 * 60 * 60 * 24)
    ) + 1;
};


// ============================================================
// Format date for notification messages
// ============================================================

const formatDate = (date) => {
    return new Date(date).toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric"
    });
};


// ============================================================
// Get employee IDs assigned to a manager
// ============================================================

const getManagerEmployeeIds = async (managerId) => {
    const employees = await User.find({
        role: "employee",
        reportingManager: managerId
    }).select("_id");

    return employees.map((employee) => employee._id);
};


// ============================================================
// Get manager dashboard
// ============================================================

const getManagerDashboard = async (req, res) => {
    try {
        const manager = req.user;

        // --------------------------------------------------------
        // Get only employees assigned to this manager
        // --------------------------------------------------------

        const employeeIds =
            await getManagerEmployeeIds(manager._id);

        const leaveFilter = {
            employee: {
                $in: employeeIds
            }
        };


        // --------------------------------------------------------
        // Count only assigned employees' leaves
        // --------------------------------------------------------

        const totalLeaves =
            await Leave.countDocuments(
                leaveFilter
            );

        const pendingLeaves =
            await Leave.countDocuments({
                ...leaveFilter,
                status: "Pending"
            });

        const approvedLeaves =
            await Leave.countDocuments({
                ...leaveFilter,
                status: "Approved"
            });

        const rejectedLeaves =
            await Leave.countDocuments({
                ...leaveFilter,
                status: "Rejected"
            });

        const cancelledLeaves =
            await Leave.countDocuments({
                ...leaveFilter,
                status: "Cancelled"
            });


        // --------------------------------------------------------
        // Response
        // --------------------------------------------------------

        res.status(200).json({
            message:
                "Manager dashboard data retrieved successfully",

            manager: {
                id: manager._id,
                name: manager.name,
                email: manager.email,
                role: manager.role
            },

            statistics: {
                totalLeaves,
                pendingLeaves,
                approvedLeaves,
                rejectedLeaves,
                cancelledLeaves
            }
        });

    } catch (error) {
        console.error(
            "Manager dashboard error:",
            error
        );

        res.status(500).json({
            message:
                "Server error while loading manager dashboard"
        });
    }
};


// ============================================================
// Get manager profile
// ============================================================

const getManagerProfile = async (req, res) => {
    try {
        const manager = req.user;

        res.status(200).json({
            message:
                "Manager profile retrieved successfully",

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
            "Manager profile error:",
            error
        );

        res.status(500).json({
            message:
                "Server error while loading manager profile"
        });
    }
};


// ============================================================
// Get assigned employee leave requests
// ============================================================

const getManagerLeaves = async (req, res) => {
    try {
        const manager = req.user;

        // --------------------------------------------------------
        // Get employees assigned to this manager
        // --------------------------------------------------------

        const employeeIds =
            await getManagerEmployeeIds(manager._id);


        // --------------------------------------------------------
        // Get only their leave requests
        // --------------------------------------------------------

        const leaves = await Leave.find({
            employee: {
                $in: employeeIds
            }
        })
            .populate(
                "employee",
                "name email role reportingManager"
            )
            .populate(
                "reviewedBy",
                "name email"
            )
            .sort({
                createdAt: -1
            });


        // --------------------------------------------------------
        // Response
        // --------------------------------------------------------

        res.status(200).json({
            message:
                "Leave requests retrieved successfully",

            leaves
        });

    } catch (error) {
        console.error(
            "Get manager leaves error:",
            error
        );

        res.status(500).json({
            message:
                "Server error while retrieving leave requests"
        });
    }
};


// ============================================================
// Approve leave request
// ============================================================

const approveLeave = async (req, res) => {
    try {

        // --------------------------------------------------------
        // 1. Verify manager account
        // --------------------------------------------------------

        const manager = await User.findOne({
            _id: req.user._id,
            role: "manager"
        });

        if (!manager) {
            return res.status(404).json({
                message:
                    "Manager account not found"
            });
        }

        if (!manager.isActive) {
            return res.status(403).json({
                message:
                    "Your manager account is inactive"
            });
        }


        // --------------------------------------------------------
        // 2. Find leave request
        // --------------------------------------------------------

        const leave = await Leave.findById(
            req.params.id
        );

        if (!leave) {
            return res.status(404).json({
                message:
                    "Leave request not found"
            });
        }


        // --------------------------------------------------------
        // 3. Only pending leaves can be approved
        // --------------------------------------------------------

        if (leave.status !== "Pending") {
            return res.status(400).json({
                message:
                    `Cannot approve leave with status: ${leave.status}`
            });
        }


        // --------------------------------------------------------
        // 4. Validate leave type
        // --------------------------------------------------------

        if (
            !ALLOWED_LEAVE_TYPES.includes(
                leave.leaveType
            )
        ) {
            return res.status(400).json({
                message:
                    `Invalid leave type: ${leave.leaveType}`
            });
        }


        // --------------------------------------------------------
        // 5. Verify employee belongs to this manager
        // --------------------------------------------------------

        const employee = await User.findOne({
            _id: leave.employee,
            role: "employee",
            reportingManager: manager._id
        });

        if (!employee) {
            return res.status(403).json({
                message:
                    "You are not authorized to review this employee's leave request"
            });
        }


        // --------------------------------------------------------
        // 6. Verify employee is active
        // --------------------------------------------------------

        if (!employee.isActive) {
            return res.status(400).json({
                message:
                    "Cannot approve leave for an inactive employee"
            });
        }


        // --------------------------------------------------------
        // 7. Validate leave dates
        // --------------------------------------------------------

        const start = new Date(
            leave.startDate
        );

        const end = new Date(
            leave.endDate
        );

        if (
            isNaN(start.getTime()) ||
            isNaN(end.getTime())
        ) {
            return res.status(400).json({
                message:
                    "Leave contains invalid dates"
            });
        }


        if (start > end) {
            return res.status(400).json({
                message:
                    "Leave start date cannot be after end date"
            });
        }


        // --------------------------------------------------------
        // 8. Calculate leave days
        // --------------------------------------------------------

        const leaveDays =
            calculateLeaveDays(
                start,
                end
            );

        if (leaveDays <= 0) {
            return res.status(400).json({
                message:
                    "Invalid leave duration"
            });
        }


        // --------------------------------------------------------
        // 9. Check employee leave balance
        // --------------------------------------------------------

        if (
            !employee.leaveBalances ||
            employee.leaveBalances[
                leave.leaveType
            ] === undefined
        ) {
            return res.status(400).json({
                message:
                    `Leave balance is not configured for ${leave.leaveType} leave`
            });
        }


        const availableBalance =
            Number(
                employee.leaveBalances[
                    leave.leaveType
                ]
            );


        if (
            !Number.isFinite(
                availableBalance
            ) ||
            availableBalance < 0
        ) {
            return res.status(400).json({
                message:
                    `Invalid ${leave.leaveType} leave balance`
            });
        }


        // --------------------------------------------------------
        // 10. Check available balance
        // --------------------------------------------------------

        if (
            leaveDays > availableBalance
        ) {
            return res.status(400).json({
                message:
                    `Insufficient ${leave.leaveType} leave balance. Available: ${availableBalance}, Required: ${leaveDays}`,

                leaveType:
                    leave.leaveType,

                requestedDays:
                    leaveDays,

                availableDays:
                    availableBalance
            });
        }


        // --------------------------------------------------------
        // 11. Get manager review comment
        // --------------------------------------------------------

        const {
            reviewComment
        } = req.body;


        let cleanReviewComment = null;


        if (
            reviewComment !== undefined &&
            reviewComment !== null
        ) {
            cleanReviewComment =
                String(reviewComment).trim();


            if (
                cleanReviewComment.length > 500
            ) {
                return res.status(400).json({
                    message:
                        "Review comment cannot exceed 500 characters"
                });
            }


            if (
                cleanReviewComment.length === 0
            ) {
                cleanReviewComment = null;
            }
        }


        // --------------------------------------------------------
        // 12. Deduct employee leave balance
        // --------------------------------------------------------

        employee.leaveBalances[
            leave.leaveType
        ] =
            availableBalance - leaveDays;


        await employee.save();


        // --------------------------------------------------------
        // 13. Update leave request
        // --------------------------------------------------------

        leave.status =
            "Approved";

        leave.reviewComment =
            cleanReviewComment;

        leave.reviewedAt =
            new Date();

        leave.reviewedBy =
            manager._id;


        await leave.save();


        // --------------------------------------------------------
        // 14. Notify employee
        // --------------------------------------------------------

        await Notification.create({
            recipient:
                employee._id,

            type:
                "leave_approved",

            title:
                "Leave Request Approved",

            message:
                `Your ${leave.leaveType} leave request from ${formatDate(leave.startDate)} to ${formatDate(leave.endDate)} has been approved by ${manager.name}.`,

            leave:
                leave._id,

            isRead:
                false
        });


        // --------------------------------------------------------
        // 15. Populate response
        // --------------------------------------------------------

        await leave.populate(
            "employee",
            "name email leaveBalances"
        );

        await leave.populate(
            "reviewedBy",
            "name email"
        );


        // --------------------------------------------------------
        // 16. Send response
        // --------------------------------------------------------

        res.status(200).json({
            message:
                "Leave request approved successfully",

            leave,

            leaveDays,

            remainingBalance:
                employee.leaveBalances[
                    leave.leaveType
                ]
        });

    } catch (error) {
        console.error(
            "Approve leave error:",
            error
        );


        if (error.name === "CastError") {
            return res.status(400).json({
                message:
                    "Invalid leave ID"
            });
        }


        res.status(500).json({
            message:
                "Server error while approving leave request"
        });
    }
};


// ============================================================
// Reject leave request
// ============================================================

const rejectLeave = async (req, res) => {
    try {

        // --------------------------------------------------------
        // 1. Verify manager account
        // --------------------------------------------------------

        const manager = await User.findOne({
            _id: req.user._id,
            role: "manager"
        });

        if (!manager) {
            return res.status(404).json({
                message:
                    "Manager account not found"
            });
        }

        if (!manager.isActive) {
            return res.status(403).json({
                message:
                    "Your manager account is inactive"
            });
        }


        // --------------------------------------------------------
        // 2. Find leave request
        // --------------------------------------------------------

        const leave = await Leave.findById(
            req.params.id
        );

        if (!leave) {
            return res.status(404).json({
                message:
                    "Leave request not found"
            });
        }


        // --------------------------------------------------------
        // 3. Only pending leaves can be rejected
        // --------------------------------------------------------

        if (leave.status !== "Pending") {
            return res.status(400).json({
                message:
                    `Cannot reject leave with status: ${leave.status}`
            });
        }


        // --------------------------------------------------------
        // 4. Verify employee belongs to this manager
        // --------------------------------------------------------

        const employee = await User.findOne({
            _id: leave.employee,
            role: "employee",
            reportingManager: manager._id
        });

        if (!employee) {
            return res.status(403).json({
                message:
                    "You are not authorized to review this employee's leave request"
            });
        }


        // --------------------------------------------------------
        // 5. Get rejection reason
        // --------------------------------------------------------

        const {
            reviewComment
        } = req.body;


        if (
            !reviewComment ||
            !String(reviewComment).trim()
        ) {
            return res.status(400).json({
                message:
                    "Rejection reason is required"
            });
        }


        const cleanReviewComment =
            String(reviewComment).trim();


        if (
            cleanReviewComment.length < 3
        ) {
            return res.status(400).json({
                message:
                    "Rejection reason must contain at least 3 characters"
            });
        }


        if (
            cleanReviewComment.length > 500
        ) {
            return res.status(400).json({
                message:
                    "Rejection reason cannot exceed 500 characters"
            });
        }


        // --------------------------------------------------------
        // 6. Update leave
        // --------------------------------------------------------

        leave.status =
            "Rejected";

        leave.reviewComment =
            cleanReviewComment;

        leave.reviewedAt =
            new Date();

        leave.reviewedBy =
            manager._id;


        await leave.save();


        // --------------------------------------------------------
        // 7. Notify employee
        // --------------------------------------------------------

        await Notification.create({
            recipient:
                employee._id,

            type:
                "leave_rejected",

            title:
                "Leave Request Rejected",

            message:
                `Your ${leave.leaveType} leave request from ${formatDate(leave.startDate)} to ${formatDate(leave.endDate)} has been rejected by ${manager.name}. Reason: ${cleanReviewComment}`,

            leave:
                leave._id,

            isRead:
                false
        });


        // --------------------------------------------------------
        // 8. Populate response
        // --------------------------------------------------------

        await leave.populate(
            "employee",
            "name email"
        );

        await leave.populate(
            "reviewedBy",
            "name email"
        );


        // --------------------------------------------------------
        // 9. Send response
        // --------------------------------------------------------

        res.status(200).json({
            message:
                "Leave request rejected successfully",

            leave
        });

    } catch (error) {
        console.error(
            "Reject leave error:",
            error
        );


        if (error.name === "CastError") {
            return res.status(400).json({
                message:
                    "Invalid leave ID"
            });
        }


        res.status(500).json({
            message:
                "Server error while rejecting leave request"
        });
    }
};


// ============================================================
// Export controllers
// ============================================================

module.exports = {
    getManagerDashboard,
    getManagerProfile,
    getManagerLeaves,
    approveLeave,
    rejectLeave
};