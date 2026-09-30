import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import "./resetPassword.css";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

function ResetPassword() {
    const navigate = useNavigate();
    const location = useLocation();

    // Get reset token from Forgot Password page
    const tokenFromPage = location.state?.token || "";

    const [token, setToken] = useState(tokenFromPage);
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");

    const [message, setMessage] = useState("");
    const [errorMessage, setErrorMessage] = useState("");
    const [isLoading, setIsLoading] = useState(false);

    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);


    // Handle reset password
    const handleResetPassword = async (event) => {
        event.preventDefault();

        setMessage("");
        setErrorMessage("");

        const trimmedToken = token.trim();

        // Validate token
        if (!trimmedToken) {
            setErrorMessage("Reset token is required.");
            return;
        }

        // Validate password
        if (!newPassword) {
            setErrorMessage("Please enter a new password.");
            return;
        }

        if (newPassword.length < 6) {
            setErrorMessage(
                "Password must be at least 6 characters."
            );
            return;
        }

        // Confirm password
        if (newPassword !== confirmPassword) {
            setErrorMessage("Passwords do not match.");
            return;
        }

        try {
            setIsLoading(true);

            const response = await fetch(
                `${API_URL}/api/auth/reset-password`,
                {
                    method: "POST",

                    headers: {
                        "Content-Type": "application/json"
                    },

                    body: JSON.stringify({
                        token: trimmedToken,
                        newPassword
                    })
                }
            );

            let data = {};

            try {
                data = await response.json();
            } catch {
                data = {};
            }

            if (!response.ok) {
                setErrorMessage(
                    data.message ||
                    "Unable to reset password."
                );
                return;
            }

            setMessage(
                data.message ||
                "Password reset successfully."
            );

            // Clear password fields
            setNewPassword("");
            setConfirmPassword("");

            // Keep form disabled while redirecting
            setTimeout(() => {
                navigate("/");
            }, 2000);

        } catch (error) {
            console.error(
                "Reset password error:",
                error
            );

            setErrorMessage(
                "Unable to connect to the server. Please make sure the backend is running."
            );
        } finally {
            setIsLoading(false);
        }
    };


    // Back to login
    const handleBackToLogin = () => {
        navigate("/");
    };


    return (
        <div className="reset-password-container">

            <div className="reset-password-card">

                {/* Header */}
                <div className="reset-password-header">
                    <h1>
                        Reset Password
                    </h1>

                    <p>
                        Create a new password for your account.
                    </p>
                </div>


                {/* Form */}
                <form
                    className="reset-password-form"
                    onSubmit={handleResetPassword}
                >

                    {/* Reset Token */}
                    <div className="input-group">

                        <label htmlFor="token">
                            Reset Token
                        </label>

                        <textarea
                            id="token"
                            value={token}
                            onChange={(event) => {
                                setToken(event.target.value);
                                setErrorMessage("");
                            }}
                            placeholder="Enter your reset token"
                            rows="4"
                            required
                            disabled={isLoading}
                        />

                    </div>


                    {/* New Password */}
                    <div className="input-group">

                        <label htmlFor="newPassword">
                            New Password
                        </label>

                        <div className="password-wrapper">

                            <input
                                type={
                                    showPassword
                                        ? "text"
                                        : "password"
                                }
                                id="newPassword"
                                placeholder="Enter new password"
                                value={newPassword}
                                onChange={(event) => {
                                    setNewPassword(
                                        event.target.value
                                    );
                                    setErrorMessage("");
                                }}
                                autoComplete="new-password"
                                required
                                disabled={isLoading}
                            />

                            <button
                                type="button"
                                className="password-toggle"
                                onClick={() =>
                                    setShowPassword(
                                        (previous) => !previous
                                    )
                                }
                                disabled={isLoading}
                                aria-label={
                                    showPassword
                                        ? "Hide new password"
                                        : "Show new password"
                                }
                            >
                                {showPassword
                                    ? "Hide"
                                    : "Show"}
                            </button>

                        </div>

                    </div>


                    {/* Confirm Password */}
                    <div className="input-group">

                        <label htmlFor="confirmPassword">
                            Confirm New Password
                        </label>

                        <div className="password-wrapper">

                            <input
                                type={
                                    showConfirmPassword
                                        ? "text"
                                        : "password"
                                }
                                id="confirmPassword"
                                placeholder="Confirm new password"
                                value={confirmPassword}
                                onChange={(event) => {
                                    setConfirmPassword(
                                        event.target.value
                                    );
                                    setErrorMessage("");
                                }}
                                autoComplete="new-password"
                                required
                                disabled={isLoading}
                            />

                            <button
                                type="button"
                                className="password-toggle"
                                onClick={() =>
                                    setShowConfirmPassword(
                                        (previous) => !previous
                                    )
                                }
                                disabled={isLoading}
                                aria-label={
                                    showConfirmPassword
                                        ? "Hide confirm password"
                                        : "Show confirm password"
                                }
                            >
                                {showConfirmPassword
                                    ? "Hide"
                                    : "Show"}
                            </button>

                        </div>

                    </div>


                    {/* Error */}
                    {errorMessage && (
                        <div className="error-message">
                            {errorMessage}
                        </div>
                    )}


                    {/* Success */}
                    {message && (
                        <div className="success-message">
                            {message}
                        </div>
                    )}


                    {/* Reset Button */}
                    <button
                        type="submit"
                        className="reset-password-button"
                        disabled={isLoading}
                    >
                        {isLoading
                            ? "Resetting Password..."
                            : "Reset Password"}
                    </button>

                </form>


                {/* Back to Login */}
                <div className="back-to-login">

                    <button
                        type="button"
                        onClick={handleBackToLogin}
                        disabled={isLoading}
                    >
                        ← Back to Login
                    </button>

                </div>

            </div>

        </div>
    );
}

export default ResetPassword;