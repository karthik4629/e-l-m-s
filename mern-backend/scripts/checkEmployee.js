require("dotenv").config();
const mongoose = require("mongoose");
const User = require("../models/User");

async function checkEmployee() {
    try {
        await mongoose.connect(process.env.MONGO_URI);

        console.log("Connected to MongoDB\n");

        const user = await User.findById("6aa6470242c794fec99e6d35")
            .lean();

        if (!user) {
            console.log("Employee not found.");
            return;
        }

        console.log("Employee ID:", user._id);
        console.log("Name:", user.name);
        console.log("Email:", user.email);
        console.log("Role:", user.role);
        console.log("Reporting Manager:", user.reportingManager);
        console.log("Full document:");
        console.log(JSON.stringify(user, null, 2));

    } catch (error) {
        console.error("Check failed:", error);
        process.exitCode = 1;
    } finally {
        await mongoose.connection.close();
        console.log("\nMongoDB connection closed.");
    }
}

checkEmployee();