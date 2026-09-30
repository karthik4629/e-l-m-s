require("dotenv").config();
const mongoose = require("mongoose");
const User = require("../models/User");

async function checkManager() {
    try {
        await mongoose.connect(process.env.MONGO_URI);

        console.log("Connected to MongoDB\n");

        const managers = await User.find({
            role: "manager"
        }).select("_id name email role isActive").lean();

        console.log("Managers:");

        managers.forEach((manager, index) => {
            console.log(`\nManager ${index + 1}:`);
            console.log("ID:", manager._id);
            console.log("Name:", manager.name);
            console.log("Email:", manager.email);
            console.log("Role:", manager.role);
            console.log("Active:", manager.isActive);
        });

    } catch (error) {
        console.error("Check failed:", error);
        process.exitCode = 1;
    } finally {
        await mongoose.connection.close();
        console.log("\nMongoDB connection closed.");
    }
}

checkManager();