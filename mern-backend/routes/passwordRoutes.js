const express = require("express");

const {
    forgotPassword,
    resetPassword
} = require("../controllers/passwordController");

const router = express.Router();

// Forgot password
router.post(
    "/forgot-password",
    forgotPassword
);

// Reset password
router.post(
    "/reset-password",
    resetPassword
);

module.exports = router;