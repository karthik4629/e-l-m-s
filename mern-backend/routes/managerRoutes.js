const express = require("express");

const {
    getManagerDashboard,
    getManagerProfile,
    getManagerLeaves,
    approveLeave,
    rejectLeave
} = require("../controllers/managerController");

const protect = require("../middleware/authMiddleware");
const authorizeRoles = require("../middleware/roleMiddleware");

const router = express.Router();


// Manager dashboard
router.get(
    "/dashboard",
    protect,
    authorizeRoles("manager"),
    getManagerDashboard
);


// Manager profile
router.get(
    "/profile",
    protect,
    authorizeRoles("manager"),
    getManagerProfile
);


// Get all employee leave requests
router.get(
    "/leaves",
    protect,
    authorizeRoles("manager"),
    getManagerLeaves
);


// Approve leave request
router.put(
    "/leaves/:id/approve",
    protect,
    authorizeRoles("manager"),
    approveLeave
);


// Reject leave request
router.put(
    "/leaves/:id/reject",
    protect,
    authorizeRoles("manager"),
    rejectLeave
);


module.exports = router;