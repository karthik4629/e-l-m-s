require("dotenv").config();
const mongoose = require("mongoose");
const Leave = require("../models/Leave");

async function checkLeaveStatuses() {
    try {
        await mongoose.connect(process.env.MONGO_URI);

        console.log("Connected to MongoDB\n");

        const leaves = await Leave.find({})
            .select("_id employee status leaveType startDate endDate")
            .lean();

        console.log(`Total leaves found: ${leaves.length}\n`);

        leaves.forEach((leave, index) => {
            console.log(`Leave ${index + 1}`);
            console.log("ID:", leave._id);
            console.log("Employee ID:", leave.employee);
            console.log("Status:", JSON.stringify(leave.status));
            console.log("Leave Type:", leave.leaveType);
            console.log("Start:", leave.startDate);
            console.log("End:", leave.endDate);
            console.log("-----------------------------");
        });

    } catch (error) {
        console.error("Check failed:", error);
        process.exitCode = 1;
    } finally {
        await mongoose.connection.close();
        console.log("\nMongoDB connection closed.");
    }
}

checkLeaveStatuses();