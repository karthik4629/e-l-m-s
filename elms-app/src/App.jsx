import { BrowserRouter, Routes, Route } from "react-router-dom";

import Login from "./Login/login";
import Register from "./Login/register";
import ForgotPassword from "./Login/forgotPassword";
import ResetPassword from "./Login/resetPassword";

import Employee from "./Employee/employee";
import Manager from "./Manager/manager";
import Admin from "./Admin/admin";


function App() {

    return (

        <BrowserRouter>

            <Routes>

                {/* Login */}
                <Route
                    path="/"
                    element={<Login />}
                />

                {/* Registration */}
                <Route
                    path="/register"
                    element={<Register />}
                />

                {/* Forgot Password */}
                <Route
                    path="/forgot-password"
                    element={<ForgotPassword />}
                />

                {/* Reset Password */}
                <Route
                    path="/reset-password"
                    element={<ResetPassword />}
                />

                {/* Employee */}
                <Route
                    path="/employee"
                    element={<Employee />}
                />

                {/* Manager */}
                <Route
                    path="/manager"
                    element={<Manager />}
                />

                {/* Admin */}
                <Route
                    path="/admin"
                    element={<Admin />}
                />

            </Routes>

        </BrowserRouter>

    );
}

export default App;