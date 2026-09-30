require("dotenv").config();
const mongoose = require("mongoose");
const Leave = require("../models/Leave");

async function migrateLeaveStatus() {
    try {
        await mongoose.connect(process.env.MONGO_URI);

        console.log("Connected to MongoDB");

        const result = await Leave.updateMany(
            { status: "pending" },
            { $set: { status: "Pending" } }
        );

        console.log(`Matched: ${result.matchedCount}`);
        console.log(`Modified: ${result.modifiedCount}`);

        console.log("Leave status migration completed successfully.");
    } catch (error) {
        console.error("Migration failed:", error);
        process.exitCode = 1;
    } finally {
        await mongoose.connection.close();
        console.log("MongoDB connection closed.");
    }
}

migrateLeaveStatus();