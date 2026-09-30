const crypto = require("crypto");
const bcrypt = require("bcryptjs");

const User = require("../models/User");
const PasswordResetToken = require("../models/PasswordResetToken");

// Forgot Password
const forgotPassword = async (req, res) => {
    try {
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({
                message: "Email is required"
            });
        }

        const normalizedEmail = email.toLowerCase().trim();

        const user = await User.findOne({
            email: normalizedEmail
        });

        // Do not reveal whether an email exists
        if (!user) {
            return res.status(200).json({
                message:
                    "If an account exists with this email, password reset instructions will be provided."
            });
        }

        // Delete previous reset tokens
        await PasswordResetToken.deleteMany({
            user: user._id
        });

        // Generate secure random token
        const resetToken = crypto
            .randomBytes(32)
            .toString("hex");

        // Hash token before storing it
        const hashedToken = crypto
            .createHash("sha256")
            .update(resetToken)
            .digest("hex");

        // Token valid for 15 minutes
        const expiresAt = new Date(
            Date.now() + 15 * 60 * 1000
        );

        await PasswordResetToken.create({
            user: user._id,
            token: hashedToken,
            expiresAt
        });

        /*
         * Development only.
         * Later this token will be sent through email.
         */
        res.status(200).json({
            message:
                "Password reset token generated successfully.",
            resetToken
        });

    } catch (error) {
        console.error("Forgot password error:", error);

        res.status(500).json({
            message:
                "Server error while processing forgot password request."
        });
    }
};


// Reset Password
const resetPassword = async (req, res) => {
    try {
        const {
            token,
            newPassword
        } = req.body;

        if (!token || !newPassword) {
            return res.status(400).json({
                message:
                    "Reset token and new password are required"
            });
        }

        // Basic password validation
        if (newPassword.length < 6) {
            return res.status(400).json({
                message:
                    "New password must be at least 6 characters"
            });
        }

        // Hash the token received from the user
        const hashedToken = crypto
            .createHash("sha256")
            .update(token)
            .digest("hex");

        // Find valid token
        const resetToken = await PasswordResetToken.findOne({
            token: hashedToken,
            expiresAt: {
                $gt: new Date()
            }
        });

        if (!resetToken) {
            return res.status(400).json({
                message:
                    "Invalid or expired password reset token"
            });
        }

        // Find the user
        const user = await User.findById(
            resetToken.user
        );

        if (!user) {
            return res.status(404).json({
                message: "User not found"
            });
        }

        // Hash the new password
        const hashedPassword = await bcrypt.hash(
            newPassword,
            10
        );

        // Update password
        user.password = hashedPassword;

        await user.save();

        // Delete used reset token
        await PasswordResetToken.deleteOne({
            _id: resetToken._id
        });

        res.status(200).json({
            message:
                "Password reset successfully. You can now login with your new password."
        });

    } catch (error) {
        console.error("Reset password error:", error);

        res.status(500).json({
            message:
                "Server error while resetting password."
        });
    }
};


module.exports = {
    forgotPassword,
    resetPassword
};