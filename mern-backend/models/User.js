const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
            trim: true
        },

        email: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true
        },

        password: {
            type: String,
            required: true
        },

        role: {
            type: String,
            enum: ["employee", "manager", "admin"],
            default: "employee"
        },

        // Manager assigned to this employee
        reportingManager: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            default: null
        },

        leaveBalances: {
            casual: {
                type: Number,
                default: 12
            },

            sick: {
                type: Number,
                default: 10
            },

            earned: {
                type: Number,
                default: 15
            }
        },

        isActive: {
            type: Boolean,
            default: true
        }
    },
    {
        timestamps: true
    }
);

module.exports = mongoose.model("User", userSchema);