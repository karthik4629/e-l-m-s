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
// Get all leaves of logged-in employee
// ============================================================

const getMyLeaves = async (req, res) => {
    try {
        const leaves = await Leave.find({
            employee: req.user._id
        })
            .populate("reviewedBy", "name email")
            .sort({ createdAt: -1 });

        res.status(200).json({
            message:
                "Leave requests retrieved successfully",

            leaves
        });

    } catch (error) {
        console.error(
            "Get my leaves error:",
            error
        );

        res.status(500).json({
            message:
                "Server error while retrieving leave requests"
        });
    }
};


// ============================================================
// Create leave request
// ============================================================

const createLeave = async (req, res) => {
    try {
        const {
            leaveType,
            startDate,
            endDate,
            reason
        } = req.body;


        // --------------------------------------------------------
        // 1. Validate required fields
        // --------------------------------------------------------

        if (
            !leaveType ||
            !startDate ||
            !endDate ||
            !reason
        ) {
            return res.status(400).json({
                message:
                    "Leave type, start date, end date and reason are required"
            });
        }


        // --------------------------------------------------------
        // 2. Validate leave type
        // --------------------------------------------------------

        const normalizedLeaveType =
            String(leaveType)
                .trim()
                .toLowerCase();

        if (
            !ALLOWED_LEAVE_TYPES.includes(
                normalizedLeaveType
            )
        ) {
            return res.status(400).json({
                message:
                    "Invalid leave type. Allowed types are casual, sick and earned."
            });
        }


        // --------------------------------------------------------
        // 3. Validate reason
        // --------------------------------------------------------

        const cleanReason =
            String(reason).trim();

        if (cleanReason.length < 3) {
            return res.status(400).json({
                message:
                    "Leave reason must contain at least 3 characters"
            });
        }

        if (cleanReason.length > 500) {
            return res.status(400).json({
                message:
                    "Leave reason cannot exceed 500 characters"
            });
        }


        // --------------------------------------------------------
        // 4. Validate dates
        // --------------------------------------------------------

        const start =
            new Date(startDate);

        const end =
            new Date(endDate);

        if (
            isNaN(start.getTime()) ||
            isNaN(end.getTime())
        ) {
            return res.status(400).json({
                message:
                    "Invalid start date or end date"
            });
        }


        // --------------------------------------------------------
        // Normalize time
        // --------------------------------------------------------

        start.setHours(0, 0, 0, 0);
        end.setHours(0, 0, 0, 0);


        // --------------------------------------------------------
        // 5. Start date cannot be after end date
        // --------------------------------------------------------

        if (start > end) {
            return res.status(400).json({
                message:
                    "Start date cannot be after end date"
            });
        }


        // --------------------------------------------------------
        // 6. Start date cannot be in the past
        // --------------------------------------------------------

        const today =
            new Date();

        today.setHours(0, 0, 0, 0);

        if (start < today) {
            return res.status(400).json({
                message:
                    "Leave start date cannot be in the past"
            });
        }


        // --------------------------------------------------------
        // 7. Calculate leave days
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
        // 8. Get latest employee data
        // --------------------------------------------------------

        const employee =
            await User.findById(
                req.user._id
            );

        if (!employee) {
            return res.status(404).json({
                message:
                    "Employee account not found"
            });
        }


        // --------------------------------------------------------
        // 8A. Verify employee is active
        // --------------------------------------------------------

        if (!employee.isActive) {
            return res.status(403).json({
                message:
                    "Your account is inactive. You cannot apply for leave."
            });
        }


        // --------------------------------------------------------
        // 8B. Verify reporting manager is assigned
        // --------------------------------------------------------

        if (!employee.reportingManager) {
            return res.status(400).json({
                message:
                    "No reporting manager is assigned to your account. Please contact the administrator."
            });
        }


        // --------------------------------------------------------
        // 8C. Verify assigned manager exists and is active
        // --------------------------------------------------------

        const manager =
            await User.findOne({
                _id:
                    employee.reportingManager,

                role:
                    "manager",

                isActive:
                    true
            })
                .select(
                    "_id name email"
                );

        if (!manager) {
            return res.status(400).json({
                message:
                    "Your assigned reporting manager is unavailable. Please contact the administrator."
            });
        }


        // --------------------------------------------------------
        // 9. Get leave balance
        // --------------------------------------------------------

        const availableBalance =
            Number(
                employee.leaveBalances?.[
                    normalizedLeaveType
                ] || 0
            );


        // --------------------------------------------------------
        // 10. Check leave balance
        // --------------------------------------------------------

        if (
            leaveDays >
            availableBalance
        ) {
            return res.status(400).json({
                message:
                    `Insufficient ${normalizedLeaveType} leave balance`,

                leaveType:
                    normalizedLeaveType,

                requestedDays:
                    leaveDays,

                availableDays:
                    availableBalance
            });
        }


        // --------------------------------------------------------
        // 11. Check overlapping Pending/Approved leaves
        // --------------------------------------------------------

        const overlappingLeave =
            await Leave.findOne({
                employee:
                    employee._id,

                status: {
                    $in: [
                        "Pending",
                        "Approved"
                    ]
                },

                startDate: {
                    $lte:
                        end
                },

                endDate: {
                    $gte:
                        start
                }
            });


        if (overlappingLeave) {
            return res.status(400).json({
                message:
                    "The selected dates overlap with an existing pending or approved leave.",

                overlappingLeave: {
                    id:
                        overlappingLeave._id,

                    leaveType:
                        overlappingLeave.leaveType,

                    startDate:
                        overlappingLeave.startDate,

                    endDate:
                        overlappingLeave.endDate,

                    status:
                        overlappingLeave.status
                }
            });
        }


        // --------------------------------------------------------
        // 12. Create leave request
        // --------------------------------------------------------

        const leave =
            await Leave.create({
                employee:
                    employee._id,

                leaveType:
                    normalizedLeaveType,

                startDate:
                    start,

                endDate:
                    end,

                reason:
                    cleanReason,

                status:
                    "Pending"
            });


        // --------------------------------------------------------
        // 13. Notify ONLY assigned reporting manager
        // --------------------------------------------------------

        await Notification.create({
            recipient:
                manager._id,

            type:
                "leave_submitted",

            title:
                "New Leave Request",

            message:
                `${employee.name} submitted a ${normalizedLeaveType} leave request for ${leaveDays} day${leaveDays === 1 ? "" : "s"}.`,

            leave:
                leave._id,

            isRead:
                false
        });


        // --------------------------------------------------------
        // 14. Populate employee information
        // --------------------------------------------------------

        await leave.populate(
            "employee",
            "name email"
        );


        // --------------------------------------------------------
        // 15. Send response
        // --------------------------------------------------------

        res.status(201).json({
            message:
                "Leave request submitted successfully",

            leave,

            leaveDays,

            remainingBalance:
                availableBalance -
                leaveDays
        });

    } catch (error) {
        console.error(
            "Create leave error:",
            error
        );

        res.status(500).json({
            message:
                "Server error while creating leave request"
        });
    }
};


// ============================================================
// Get leave by ID
// ============================================================

const getLeaveById = async (req, res) => {
    try {
        const leave =
            await Leave.findOne({
                _id:
                    req.params.id,

                employee:
                    req.user._id
            })
                .populate(
                    "employee",
                    "name email"
                )
                .populate(
                    "reviewedBy",
                    "name email"
                );


        if (!leave) {
            return res.status(404).json({
                message:
                    "Leave request not found"
            });
        }


        res.status(200).json({
            message:
                "Leave request retrieved successfully",

            leave
        });

    } catch (error) {
        console.error(
            "Get leave by ID error:",
            error
        );


        if (
            error.name ===
            "CastError"
        ) {
            return res.status(400).json({
                message:
                    "Invalid leave ID"
            });
        }


        res.status(500).json({
            message:
                "Server error while retrieving leave request"
        });
    }
};


// ============================================================
// Cancel leave request
// ============================================================

const cancelLeave = async (req, res) => {
    try {
        const leave =
            await Leave.findOne({
                _id:
                    req.params.id,

                employee:
                    req.user._id
            });


        if (!leave) {
            return res.status(404).json({
                message:
                    "Leave request not found"
            });
        }


        // --------------------------------------------------------
        // Only pending leaves can be cancelled
        // --------------------------------------------------------

        if (
            leave.status !==
            "Pending"
        ) {
            return res.status(400).json({
                message:
                    `Cannot cancel leave with status: ${leave.status}`
            });
        }


        // --------------------------------------------------------
        // Get latest employee data
        // --------------------------------------------------------

        const employee =
            await User.findById(
                req.user._id
            );

        if (!employee) {
            return res.status(404).json({
                message:
                    "Employee account not found"
            });
        }


        // --------------------------------------------------------
        // Verify reporting manager is assigned
        // --------------------------------------------------------

        if (!employee.reportingManager) {
            return res.status(400).json({
                message:
                    "No reporting manager is assigned to your account."
            });
        }


        // --------------------------------------------------------
        // Find assigned active manager
        // --------------------------------------------------------

        const manager =
            await User.findOne({
                _id:
                    employee.reportingManager,

                role:
                    "manager",

                isActive:
                    true
            })
                .select(
                    "_id name email"
                );


        if (!manager) {
            return res.status(400).json({
                message:
                    "Your assigned reporting manager is unavailable."
            });
        }


        // --------------------------------------------------------
        // Update leave status
        // --------------------------------------------------------

        leave.status =
            "Cancelled";

        await leave.save();


        // --------------------------------------------------------
        // Notify ONLY assigned reporting manager
        // --------------------------------------------------------

        await Notification.create({
            recipient:
                manager._id,

            type:
                "leave_cancelled",

            title:
                "Leave Request Cancelled",

            message:
                `${employee.name} cancelled their ${leave.leaveType} leave request.`,

            leave:
                leave._id,

            isRead:
                false
        });


        // --------------------------------------------------------
        // Send response
        // --------------------------------------------------------

        res.status(200).json({
            message:
                "Leave request cancelled successfully",

            leave
        });

    } catch (error) {
        console.error(
            "Cancel leave error:",
            error
        );


        if (
            error.name ===
            "CastError"
        ) {
            return res.status(400).json({
                message:
                    "Invalid leave ID"
            });
        }


        res.status(500).json({
            message:
                "Server error while cancelling leave request"
        });
    }
};


// ============================================================
// Export controller functions
// ============================================================

module.exports = {
    getMyLeaves,
    createLeave,
    getLeaveById,
    cancelLeave
};