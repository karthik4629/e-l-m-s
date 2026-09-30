import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./forgotPassword.css";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

function ForgotPassword() {
    const [email, setEmail] = useState("");
    const [message, setMessage] = useState("");
    const [errorMessage, setErrorMessage] = useState("");
    const [resetToken, setResetToken] = useState("");
    const [isLoading, setIsLoading] = useState(false);

    const navigate = useNavigate();

    // Handle forgot password
    const handleForgotPassword = async (event) => {
        event.preventDefault();

        setMessage("");
        setErrorMessage("");
        setResetToken("");

        // Validate email
        if (!email.trim()) {
            setErrorMessage("Please enter your registered email.");
            return;
        }

        try {
            setIsLoading(true);

            // Send request to backend
            const response = await fetch(
                `${API_URL}/api/auth/forgot-password`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({
                        email: email.trim().toLowerCase()
                    })
                }
            );

            const data = await response.json();

            // Backend error
            if (!response.ok) {
                setErrorMessage(
                    data.message || "Unable to process your request."
                );
                return;
            }

            // Success message
            setMessage(
                data.message || "Password reset instructions generated successfully."
            );

            /*
             * Development mode:
             * Backend currently returns resetToken.
             *
             * Later, this token should be sent
             * through email instead.
             */
            if (data.resetToken) {
                setResetToken(data.resetToken);
            }
        } catch (error) {
            console.error("Forgot password error:", error);

            setErrorMessage(
                "Unable to connect to the server. Please make sure the backend is running."
            );
        } finally {
            setIsLoading(false);
        }
    };

    // Continue to reset password
    const handleContinue = () => {
        if (!resetToken) {
            return;
        }

        navigate("/reset-password", {
            state: {
                token: resetToken
            }
        });
    };

    // Back to login
    const handleBackToLogin = () => {
        navigate("/");
    };

    return (
        <div className="forgot-password-container">
            <div className="forgot-password-card">

                {/* Header */}
                <div className="forgot-password-header">
                    <h1>Forgot Password?</h1>

                    <p>
                        Enter your registered email address
                        to reset your password.
                    </p>
                </div>

                {/* Form */}
                <form
                    className="forgot-password-form"
                    onSubmit={handleForgotPassword}
                >

                    {/* Email */}
                    <div className="input-group">
                        <label htmlFor="email">
                            Email Address
                        </label>

                        <input
                            type="email"
                            id="email"
                            placeholder="Enter your registered email"
                            value={email}
                            onChange={(event) => {
                                setEmail(event.target.value);
                                setErrorMessage("");
                                setMessage("");
                                setResetToken("");
                            }}
                            autoComplete="email"
                            required
                            disabled={isLoading}
                        />
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

                    {/* Development token */}
                    {resetToken && (
                        <div className="reset-token-section">
                            <p>
                                Development reset token:
                            </p>

                            <textarea
                                value={resetToken}
                                readOnly
                                rows="4"
                            />

                            <button
                                type="button"
                                className="reset-button"
                                onClick={handleContinue}
                            >
                                Continue to Reset Password
                            </button>
                        </div>
                    )}

                    {/* Submit */}
                    <button
                        type="submit"
                        className="forgot-password-button"
                        disabled={isLoading}
                    >
                        {isLoading
                            ? "Processing..."
                            : "Send Reset Instructions"}
                    </button>
                </form>

                {/* Back to login */}
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

export default ForgotPassword;