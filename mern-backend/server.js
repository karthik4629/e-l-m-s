const express = require("express");
const cors = require("cors");
require("dotenv").config();

const connectDB = require("./config/db");

const authRoutes = require("./routes/authRoutes");
const employeeRoutes = require("./routes/employeeRoutes");
const leaveRoutes = require("./routes/leaveRoutes");
const managerRoutes = require("./routes/managerRoutes");
const adminRoutes = require("./routes/adminRoutes");
const notificationRoutes = require("./routes/notificationRoutes");
const passwordRoutes = require("./routes/passwordRoutes");

const app = express();


// Connect MongoDB
connectDB();


// Middleware
app.use(cors());
app.use(express.json());


// Authentication routes
app.use("/api/auth", authRoutes);
app.use("/api/auth", passwordRoutes);


// Employee routes
app.use("/api/employee", employeeRoutes);


// Leave routes
app.use("/api/leaves", leaveRoutes);


// Manager routes
app.use("/api/manager", managerRoutes);
// Admin routes
app.use("/api/admin", adminRoutes);


// Test route
app.get("/", (req, res) => {
    res.json({
        message: "ELMS Backend is running successfully"
    });
});
// Notification routes
app.use("/api/notifications", notificationRoutes);


// Start server
const PORT = process.env.PORT || 5000;

app.listen(PORT, "0.0.0.0", () => {
    console.log(`ELMS Backend running on port ${PORT}`);
});