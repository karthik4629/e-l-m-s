const express = require("express");

const {
    getMyLeaves,
    createLeave,
    getLeaveById,
    cancelLeave
} = require("../controllers/leaveController");

const protect = require("../middleware/authMiddleware");
const authorizeRoles = require("../middleware/roleMiddleware");

const router = express.Router();


// Get logged-in employee's leave requests
router.get(
    "/my",
    protect,
    authorizeRoles("employee"),
    getMyLeaves
);


// Apply for leave
router.post(
    "/",
    protect,
    authorizeRoles("employee"),
    createLeave
);


// Get one leave request by ID
router.get(
    "/:id",
    protect,
    authorizeRoles("employee"),
    getLeaveById
);


// Cancel leave request
router.put(
    "/:id/cancel",
    protect,
    authorizeRoles("employee"),
    cancelLeave
);


module.exports = router;