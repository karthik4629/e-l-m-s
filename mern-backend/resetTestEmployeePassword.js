require("dotenv").config();

const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const User = require("./models/User");

const resetPassword = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);

        const newPassword = "Employee@12345";

        const hashedPassword = await bcrypt.hash(newPassword, 10);

        const user = await User.findOneAndUpdate(
            { email: "arshad.test@gmail.com" },
            { password: hashedPassword },
            { new: true }
        );

        if (!user) {
            console.log("Employee not found");
            process.exit(1);
        }

        console.log("Employee password reset successfully");
        console.log(`Email: ${user.email}`);
        console.log("New password: Employee@12345");

        await mongoose.disconnect();
    } catch (error) {
        console.error("Password reset error:", error);
        process.exit(1);
    }
};

resetPassword();