const mongoose = require("mongoose");

const leaveSchema = new mongoose.Schema(
    {
        employee: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },

        leaveType: {
            type: String,
            enum: [
                "casual",
                "sick",
                "earned",
                "annual",
                "maternity",
                "paternity",
                "medical",
                "emergency",
                "unpaid",
                "compensatory",
                "bereavement",
                "study",
                "work_from_home"
            ],
            required: true
        },

        startDate: {
            type: Date,
            required: true
        },

        endDate: {
            type: Date,
            required: true
        },

        reason: {
            type: String,
            required: true,
            trim: true
        },

        status: {
            type: String,
            enum: [
                "Pending",
                "Approved",
                "Rejected",
                "Cancelled"
            ],
            default: "Pending"
        },

        reviewComment: {
            type: String,
            trim: true,
            default: null
        },

        appliedAt: {
            type: Date,
            default: Date.now
        },

        reviewedAt: {
            type: Date,
            default: null
        },

        reviewedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            default: null
        }
    },
    {
        timestamps: true
    }
);

module.exports = mongoose.model("Leave", leaveSchema);