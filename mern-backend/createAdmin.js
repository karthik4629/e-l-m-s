const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const dotenv = require("dotenv");

const User = require("./models/User");

dotenv.config();

const createAdmin = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);

        console.log("MongoDB connected");

        const adminEmail = "admin.test@gmail.com";
        const adminPassword = "Admin@12345";

        const existingAdmin = await User.findOne({
            email: adminEmail
        });

        if (existingAdmin) {
            console.log("Admin account already exists.");
            console.log(`Email: ${existingAdmin.email}`);
            console.log(`Role: ${existingAdmin.role}`);

            await mongoose.connection.close();
            return;
        }

        const hashedPassword = await bcrypt.hash(adminPassword, 10);

        const admin = await User.create({
            name: "System Admin",
            email: adminEmail,
            password: hashedPassword,
            role: "admin",
            leaveBalances: {
                casual: 0,
                sick: 0,
                earned: 0
            },
            isActive: true
        });

        console.log("");
        console.log("=================================");
        console.log("ADMIN ACCOUNT CREATED SUCCESSFULLY");
        console.log("=================================");
        console.log(`Name: ${admin.name}`);
        console.log(`Email: ${admin.email}`);
        console.log(`Password: ${adminPassword}`);
        console.log(`Role: ${admin.role}`);
        console.log("=================================");

        await mongoose.connection.close();
    } catch (error) {
        console.error("Failed to create admin:", error.message);

        try {
            await mongoose.connection.close();
        } catch (closeError) {
            // Ignore connection close errors
        }

        process.exit(1);
    }
};

createAdmin();