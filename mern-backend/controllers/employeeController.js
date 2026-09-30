const getEmployeeDashboard = async (req, res) => {
    try {
        const employee = req.user;

        res.status(200).json({
            message: "Employee dashboard data retrieved successfully",
            employee: {
                id: employee._id,
                name: employee.name,
                email: employee.email,
                role: employee.role,
                leaveBalances: employee.leaveBalances
            }
        });
    } catch (error) {
        console.error("Employee dashboard error:", error);

        res.status(500).json({
            message: "Server error while loading employee dashboard"
        });
    }
};
// Get employee profile
const getEmployeeProfile = async (req, res) => {
    try {
        const employee = req.user;

        res.status(200).json({
            message: "Employee profile retrieved successfully",
            employee: {
                id: employee._id,
                name: employee.name,
                email: employee.email,
                role: employee.role,
                leaveBalances: employee.leaveBalances,
                isActive: employee.isActive,
                createdAt: employee.createdAt
            }
        });

    } catch (error) {
        console.error("Employee profile error:", error);

        res.status(500).json({
            message: "Server error while loading employee profile"
        });
    }
};

module.exports = {
    getEmployeeDashboard,
    getEmployeeProfile
};