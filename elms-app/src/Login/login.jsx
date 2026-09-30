import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./login.css";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

function Login() {
    // Store email entered by the user
    const [email, setEmail] = useState(
        localStorage.getItem("rememberedEmail") || ""
    );

    // Store password entered by the user
    const [password, setPassword] = useState("");

    // Store Remember Me checkbox value
    const [rememberMe, setRememberMe] = useState(
        localStorage.getItem("rememberedEmail") !== null
    );

    // Show or hide password
    const [showPassword, setShowPassword] = useState(false);

    // Store error message
    const [errorMessage, setErrorMessage] = useState("");

    // Loading state
    const [isLoading, setIsLoading] = useState(false);

    // Used for page navigation
    const navigate = useNavigate();


    // Handle login form
    const handleLogin = async (event) => {
        event.preventDefault();

        // Clear previous error
        setErrorMessage("");

        // Convert email to lowercase and remove extra spaces
        const enteredEmail = email.trim().toLowerCase();

        // Basic validation
        if (!enteredEmail || !password) {
            setErrorMessage("Please enter email and password.");
            return;
        }

        try {
            setIsLoading(true);

            // Send login request to backend
            const response = await fetch(
                `${API_URL}/api/auth/login`,
                {
                    method: "POST",

                    headers: {
                        "Content-Type": "application/json"
                    },

                    body: JSON.stringify({
                        email: enteredEmail,
                        password: password
                    })
                }
            );

            const data = await response.json();

            // Backend returned an error
            if (!response.ok) {
                setErrorMessage(
                    data.message || "Invalid email or password."
                );
                return;
            }

            // Validate successful login response
            if (!data.token || !data.user || !data.user.role) {
                setErrorMessage(
                    "Invalid response received from the server."
                );
                return;
            }

            // Store JWT token
            localStorage.setItem(
                "token",
                data.token
            );

            // Store logged-in user
            localStorage.setItem(
                "loggedInUser",
                JSON.stringify(data.user)
            );

            // Remember email
            if (rememberMe) {
                localStorage.setItem(
                    "rememberedEmail",
                    enteredEmail
                );
            } else {
                localStorage.removeItem(
                    "rememberedEmail"
                );
            }

            // Role-based navigation
            if (data.user.role === "employee") {
                navigate("/employee");
            } else if (data.user.role === "manager") {
                navigate("/manager");
            } else if (data.user.role === "admin") {
                navigate("/admin");
            } else {
                // Remove authentication data if role is invalid
                localStorage.removeItem("token");
                localStorage.removeItem("loggedInUser");

                setErrorMessage("Invalid user role.");
            }

        } catch (error) {
            console.error("Login error:", error);

            setErrorMessage(
                "Unable to connect to the server. Please make sure the backend is running."
            );
        } finally {
            setIsLoading(false);
        }
    };


    // Show / Hide password
    const handlePasswordToggle = () => {
        setShowPassword((previousValue) => !previousValue);
    };


    // Forgot password
    const handleForgotPassword = (event) => {
        event.preventDefault();

        if (isLoading) {
            return;
        }

        navigate("/forgot-password");
    };


    // Register button
    const handleRegister = () => {
        if (isLoading) {
            return;
        }

        navigate("/register");
    };


    return (
        <div className="page">

            <div className="login-card">

                {/* Project name */}
                <div className="logo">
                    <h1>Leave Desk</h1>
                </div>


                {/* Login heading */}
                <div className="login-heading">
                    <h2>Login</h2>

                    <p>
                        Sign in to manage your leave
                    </p>
                </div>


                {/* Login form */}
                <form onSubmit={handleLogin}>

                    {/* Email */}
                    <div className="input-group">

                        <label htmlFor="email">
                            Email
                        </label>

                        <input
                            type="email"
                            id="email"
                            placeholder="Enter your email"
                            value={email}
                            onChange={(event) => {
                                setEmail(event.target.value);
                                setErrorMessage("");
                            }}
                            autoComplete="email"
                            required
                            disabled={isLoading}
                        />

                    </div>


                    {/* Password */}
                    <div className="input-group">

                        <label htmlFor="password">
                            Password
                        </label>

                        <div className="password-box">

                            <input
                                type={
                                    showPassword
                                        ? "text"
                                        : "password"
                                }
                                id="password"
                                placeholder="Enter your password"
                                value={password}
                                onChange={(event) => {
                                    setPassword(event.target.value);
                                    setErrorMessage("");
                                }}
                                autoComplete="current-password"
                                required
                                disabled={isLoading}
                            />

                            <button
                                type="button"
                                onClick={handlePasswordToggle}
                                disabled={isLoading}
                                aria-label={
                                    showPassword
                                        ? "Hide password"
                                        : "Show password"
                                }
                            >
                                {showPassword
                                    ? "Hide"
                                    : "Show"}
                            </button>

                        </div>

                    </div>


                    {/* Remember Me + Forgot Password */}
                    <div className="login-options">

                        <label className="remember">

                            <input
                                type="checkbox"
                                id="rememberMe"
                                checked={rememberMe}
                                onChange={(event) =>
                                    setRememberMe(
                                        event.target.checked
                                    )
                                }
                                disabled={isLoading}
                            />

                            <span>
                                Remember me
                            </span>

                        </label>


                        <button
                            type="button"
                            className="forgot-password-link"
                            onClick={handleForgotPassword}
                            disabled={isLoading}
                        >
                            Forgot password?
                        </button>

                    </div>


                    {/* Login button */}
                    <button
                        type="submit"
                        className="login-btn"
                        disabled={isLoading}
                    >
                        {isLoading
                            ? "Logging in..."
                            : "Login"}
                    </button>


                    {/* Error message */}
                    {errorMessage && (
                        <p className="error-message">
                            {errorMessage}
                        </p>
                    )}


                    {/* Register section */}
                    <div className="register-section">

                        <p>
                            Don't have an account?
                        </p>

                        <button
                            type="button"
                            className="register-btn"
                            onClick={handleRegister}
                            disabled={isLoading}
                        >
                            Register
                        </button>

                    </div>

                </form>

            </div>

        </div>
    );
}


export default Login;