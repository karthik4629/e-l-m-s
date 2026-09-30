const express = require("express");

const {
    getEmployeeDashboard,
    getEmployeeProfile
} = require("../controllers/employeeController");

const protect = require("../middleware/authMiddleware");
const authorizeRoles = require("../middleware/roleMiddleware");

const router = express.Router();


// Employee dashboard
router.get(
    "/dashboard",
    protect,
    authorizeRoles("employee"),
    getEmployeeDashboard
);


// Employee profile
router.get(
    "/profile",
    protect,
    authorizeRoles("employee"),
    getEmployeeProfile
);


module.exports = router;