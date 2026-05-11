import Employee from "../models/Employee.js";
import Allocation from "../models/Allocation.js";

export const getBenchResources = async (req, res) => {
  try {
    const employees = await Employee.find({
      status: "Active",
    })
      .populate("departmentId")
      .populate("skills");

    const result = [];

    for (const emp of employees) {
      const allocations = await Allocation.find({
        employeeId: emp._id,
      });

      const allocatedHours = allocations.reduce(
        (sum, a) => sum + (a.allocatedHours || 0),
        0
      );

      const utilization = Math.round(
        (allocatedHours / 160) * 100
      );

      const bench = Math.max(0, 100 - utilization);

      let status = "Bench";

      if (utilization === 0) {
        status = "Fully Bench";
      } else if (utilization < 70) {
        status = "Partial Bench";
      } else if (utilization <= 100) {
        status = "Billable";
      } else {
        status = "Overallocated";
      }

      result.push({
        employee: emp,
        allocatedHours,
        utilization,
        bench,
        status,
      });
    }

    res.json(result);
  } catch (err) {
    res.status(500).json({
      message: err.message,
    });
  }
};