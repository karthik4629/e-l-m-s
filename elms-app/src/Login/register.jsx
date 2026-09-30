import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./register.css";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

function Register() {
    const navigate = useNavigate();

    const [formData, setFormData] = useState({
        name: "",
        email: "",
        password: "",
        confirmPassword: ""
    });

    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    const [isLoading, setIsLoading] = useState(false);

    const handleChange = (event) => {
        const { name, value } = event.target;

        setFormData((previous) => ({
            ...previous,
            [name]: value
        }));

        setError("");
        setSuccess("");
    };

    const handleSubmit = async (event) => {
        event.preventDefault();

        setError("");
        setSuccess("");

        const name = formData.name.trim();
        const email = formData.email.trim().toLowerCase();
        const password = formData.password;
        const confirmPassword = formData.confirmPassword;

        if (!name || !email || !password || !confirmPassword) {
            setError("Please fill in all fields.");
            return;
        }

        if (password.length < 6) {
            setError("Password must contain at least 6 characters.");
            return;
        }

        if (password !== confirmPassword) {
            setError("Passwords do not match.");
            return;
        }

        try {
            setIsLoading(true);

            const response = await fetch(
                `${API_URL}/api/auth/register`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({
                        name,
                        email,
                        password
                    })
                }
            );

            const data = await response.json();

            if (!response.ok) {
                throw new Error(
                    data.message || "Registration failed."
                );
            }

            setSuccess(
                "Account created successfully. Redirecting to login..."
            );

            setFormData({
                name: "",
                email: "",
                password: "",
                confirmPassword: ""
            });

            setTimeout(() => {
                navigate("/");
            }, 1500);
        } catch (error) {
            console.error("Registration error:", error);

            setError(
                error.message ||
                "Unable to create account. Please try again."
            );
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="register-container">

            {/* =========================================
                LEFT - REGISTER FORM
            ========================================== */}

            <div className="register-card">

                <div className="register-header">
                    <div className="mobile-brand">
                        <span className="brand-icon">✓</span>
                        <span>ELMS</span>
                    </div>

                    <h1>Create Account</h1>

                    <p>
                        Register as an employee to use the
                        Employee Leave Management System.
                    </p>
                </div>

                <form
                    className="register-form"
                    onSubmit={handleSubmit}
                >

                    {/* FULL NAME */}

                    <div className="input-group">
                        <label htmlFor="name">
                            Full Name
                        </label>

                        <input
                            id="name"
                            type="text"
                            name="name"
                            value={formData.name}
                            onChange={handleChange}
                            placeholder="Enter your full name"
                            autoComplete="name"
                            disabled={isLoading}
                        />
                    </div>


                    {/* EMAIL */}

                    <div className="input-group">
                        <label htmlFor="email">
                            Email
                        </label>

                        <input
                            id="email"
                            type="email"
                            name="email"
                            value={formData.email}
                            onChange={handleChange}
                            placeholder="Enter your email"
                            autoComplete="email"
                            disabled={isLoading}
                        />
                    </div>


                    {/* PASSWORD */}

                    <div className="input-group">
                        <label htmlFor="password">
                            Password
                        </label>

                        <div className="password-wrapper">
                            <input
                                id="password"
                                type={
                                    showPassword
                                        ? "text"
                                        : "password"
                                }
                                name="password"
                                value={formData.password}
                                onChange={handleChange}
                                placeholder="Enter password"
                                autoComplete="new-password"
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
                                        ? "Hide password"
                                        : "Show password"
                                }
                            >
                                {showPassword ? "🙈" : "👁"}
                            </button>
                        </div>
                    </div>


                    {/* CONFIRM PASSWORD */}

                    <div className="input-group">
                        <label htmlFor="confirmPassword">
                            Confirm Password
                        </label>

                        <div className="password-wrapper">
                            <input
                                id="confirmPassword"
                                type={
                                    showConfirmPassword
                                        ? "text"
                                        : "password"
                                }
                                name="confirmPassword"
                                value={formData.confirmPassword}
                                onChange={handleChange}
                                placeholder="Confirm password"
                                autoComplete="new-password"
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
                                {showConfirmPassword ? "🙈" : "👁"}
                            </button>
                        </div>
                    </div>


                    {/* ROLE */}

                    <div className="input-group role-group">
                        <label htmlFor="role">
                            Account Role
                        </label>

                        <input
                            id="role"
                            type="text"
                            value="Employee"
                            disabled
                            readOnly
                        />

                        <p className="role-info">
                            Public registration is available only
                            for employees. Managers and admins are
                            created by an administrator.
                        </p>
                    </div>


                    {/* ERROR */}

                    {error && (
                        <div className="error-message">
                            <span className="message-icon">!</span>
                            {error}
                        </div>
                    )}


                    {/* SUCCESS */}

                    {success && (
                        <div className="success-message">
                            <span className="message-icon">✓</span>
                            {success}
                        </div>
                    )}


                    {/* SUBMIT */}

                    <button
                        type="submit"
                        className="register-button"
                        disabled={isLoading}
                    >
                        {isLoading
                            ? "Creating Account..."
                            : "Create Account"}
                    </button>


                    {/* LOGIN */}

                    <div className="back-to-login">
                        <span>
                            Already have an account?
                        </span>

                        <button
                            type="button"
                            onClick={() => navigate("/")}
                            disabled={isLoading}
                        >
                            Login
                        </button>
                    </div>

                </form>
            </div>


            {/* =========================================
                RIGHT - ELMS HERO SECTION
            ========================================== */}

            <div className="register-hero">

                {/* Decorative background */}

                <div className="hero-glow hero-glow-one"></div>
                <div className="hero-glow hero-glow-two"></div>


                {/* BRAND */}

                <div className="hero-brand">
                    <div className="hero-logo">
                        <span>✓</span>
                    </div>

                    <div>
                        <h2>ELMS</h2>
                        <p>
                            Employee Leave Management System
                        </p>
                    </div>
                </div>


                {/* MAIN TITLE */}

                <div className="hero-content">

                    <div className="hero-text">

                        <span className="hero-small-title">
                            SMART LEAVE MANAGEMENT
                        </span>

                        <h1>
                            Plan Your Time,
                            <br />
                            <span>Build a Better</span>
                            <br />
                            Tomorrow
                        </h1>

                        <p className="hero-description">
                            A simple and efficient way to manage
                            your leaves, track your balance and
                            stay connected with your team.
                        </p>

                    </div>


                    {/* FEATURE CARDS */}

                    <div className="feature-grid">

                        <div className="feature-item">
                            <div className="feature-icon">
                                📅
                            </div>

                            <div>
                                <strong>
                                    Easy Leave
                                </strong>

                                <span>
                                    Application
                                </span>
                            </div>
                        </div>


                        <div className="feature-item">
                            <div className="feature-icon">
                                ◷
                            </div>

                            <div>
                                <strong>
                                    Track Leave
                                </strong>

                                <span>
                                    Balance
                                </span>
                            </div>
                        </div>


                        <div className="feature-item">
                            <div className="feature-icon">
                                🔔
                            </div>

                            <div>
                                <strong>
                                    Real-time
                                </strong>

                                <span>
                                    Notifications
                                </span>
                            </div>
                        </div>


                        <div className="feature-item">
                            <div className="feature-icon">
                                ✓
                            </div>

                            <div>
                                <strong>
                                    Secure &
                                </strong>

                                <span>
                                    Reliable
                                </span>
                            </div>
                        </div>

                    </div>

                </div>


                {/* =====================================
                    CALENDAR VISUAL
                ====================================== */}

                <div className="hero-visual">

                    <div className="calendar-shadow"></div>

                    <div className="calendar-card">

                        <div className="calendar-top">
                            <div className="calendar-ring"></div>
                            <div className="calendar-ring"></div>
                            <div className="calendar-ring"></div>
                            <div className="calendar-ring"></div>
                        </div>

                        <div className="calendar-header">
                            <span>LEAVE CALENDAR</span>

                            <div className="calendar-month">
                                2026
                            </div>
                        </div>

                        <div className="calendar-grid">

                            <span>M</span>
                            <span>T</span>
                            <span>W</span>
                            <span>T</span>
                            <span>F</span>

                            <div></div>
                            <div></div>

                            <b>1</b>
                            <b>2</b>
                            <b>3</b>
                            <b>4</b>
                            <b>5</b>

                            <b>6</b>
                            <b className="active-day">7</b>
                            <b>8</b>
                            <b>9</b>
                            <b>10</b>

                            <b>11</b>
                            <b className="leave-day">12</b>
                            <b>13</b>
                            <b>14</b>
                            <b>15</b>

                            <b>16</b>
                            <b>17</b>
                            <b>18</b>
                            <b className="active-day">19</b>
                            <b>20</b>

                            <b>21</b>
                            <b>22</b>
                            <b>23</b>
                            <b>24</b>
                            <b>25</b>

                        </div>

                    </div>


                    {/* TAKE YOUR LEAVE CARD */}

                    <div className="leave-note">

                        <div className="leave-note-icon">
                            ✓
                        </div>

                        <div>
                            <small>
                                MANAGE YOUR TIME
                            </small>

                            <strong>
                                Take Your Leave
                            </strong>
                        </div>

                    </div>


                    {/* CLOCK */}

                    <div className="hero-clock">
                        <div className="clock-hand hour"></div>
                        <div className="clock-hand minute"></div>
                        <div className="clock-center"></div>
                    </div>


                    {/* PLANT */}

                    <div className="hero-plant">
                        <div className="plant-leaf leaf-one"></div>
                        <div className="plant-leaf leaf-two"></div>
                        <div className="plant-leaf leaf-three"></div>
                        <div className="plant-pot"></div>
                    </div>

                </div>


                {/* BOTTOM MESSAGE */}

                <div className="hero-footer">
                    <span className="footer-dot"></span>

                    <span>
                        Organize your leave. Stay productive.
                    </span>
                </div>

            </div>

        </div>
    );
}

export default Register;