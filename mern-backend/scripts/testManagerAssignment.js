require("dotenv").config();
const mongoose = require("mongoose");
const User = require("../models/User");

const employeeId = "6aa6470242c794fec99e6d35";
const managerId = "6aad30d212338f24bcd5e5a5";

async function test() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log("Connected to MongoDB");

        const employee = await User.findById(employeeId);
        const manager = await User.findById(managerId);

        console.log("Employee:", employee?.name);
        console.log("Manager:", manager?.name);

        employee.reportingManager = manager._id;
        await employee.save();

        const verify = await User.findById(employeeId)
            .select("-password")
            .populate("reportingManager", "name email role");

        console.log("\nAfter save:");
        console.log("Reporting Manager:", verify.reportingManager);

    } catch (error) {
        console.error("TEST ERROR:", error);
    } finally {
        await mongoose.connection.close();
        console.log("\nMongoDB connection closed.");
    }
}

test();
