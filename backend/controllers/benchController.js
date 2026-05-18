import Employee from "../models/Employee.js";
import Allocation from "../models/Allocation.js";
import Project from "../models/Project.js";

const MONTHLY_CAPACITY = 160;

export const getBenchResources = async (req, res) => {
  try {
    const employees = await Employee.find({
      status: "Active",
    })
      .populate("roleId")
      .populate("skills");

    const result = [];

    for (const emp of employees) {
      const allocations = await Allocation.find({
        employeeId: emp._id,
      }).populate("projectId");

      // ✅ TOTAL ALLOCATION (ALL WORK)
      const totalAllocatedHours = allocations.reduce(
        (sum, a) => sum + (a.allocatedHours || 0),
        0
      );

      // ✅ BILLABLE ALLOCATION (ONLY BILLABLE WORK)
      const billableHours = allocations
        .filter((a) => a.isBillable)
        .reduce((sum, a) => sum + (a.allocatedHours || 0), 0);

      // ✅ ✅ ✅ FIXED UTILIZATION LOGIC

      // Real Total Allocation (fallback to capacity if none)
      const totalAllocation =
        totalAllocatedHours > 0 ? totalAllocatedHours : MONTHLY_CAPACITY;

      // ✅ CORRECT UTILIZATION (as per requirement)
      const utilization =
        totalAllocation > 0
          ? Math.round((billableHours / totalAllocation) * 100)
          : 0;

      // ✅ KEEP THIS OPTIONAL (if needed in UI)
      const capacityUtilization =
        Math.round((totalAllocatedHours / MONTHLY_CAPACITY) * 100) || 0;

      const bench = Math.max(0, 100 - utilization);

      // ✅ STATUS BASED ON CORRECT UTILIZATION
      let status = "Fully Bench";

      if (utilization === 0) {
        status = "Fully Bench";
      } else if (utilization < 70) {
        status = "Partial Bench";
      } else if (utilization <= 100) {
        status = "Billable";
      } else {
        status = "Overallocated";
      }

      // ✅ ✅ MONTHLY BREAKDOWN (FIXED)
      const monthlyMap = {};

      allocations.forEach((a) => {
        const key = `${a.month}-${a.year}`;

        if (!monthlyMap[key]) {
          monthlyMap[key] = {
            month: a.month,
            year: a.year,
            allocatedHours: 0,
            billableHours: 0,
            projects: [],
          };
        }

        monthlyMap[key].allocatedHours += a.allocatedHours || 0;

        if (a.isBillable) {
          monthlyMap[key].billableHours += a.allocatedHours || 0;
        }

        monthlyMap[key].projects.push({
          _id: a.projectId?._id,
          name:
            a.projectId?.projectName ||
            a.projectId?.name ||
            "Unnamed Project",
          allocatedHours: a.allocatedHours,
          billable: a.isBillable,
        });
      });

      const monthlyBench = Object.values(monthlyMap).map((m) => {
        const monthlyTotal =
          m.allocatedHours > 0 ? m.allocatedHours : MONTHLY_CAPACITY;

        // ✅ FIXED Monthly Utilization
        const monthlyUtilization =
          monthlyTotal > 0
            ? Math.round((m.billableHours / monthlyTotal) * 100)
            : 0;

        const monthlyBenchPercent = Math.max(
          0,
          100 - monthlyUtilization
        );

        let monthlyStatus = "Fully Bench";

        if (monthlyUtilization === 0) {
          monthlyStatus = "Fully Bench";
        } else if (monthlyUtilization < 70) {
          monthlyStatus = "Partial Bench";
        } else if (monthlyUtilization <= 100) {
          monthlyStatus = "Billable";
        } else {
          monthlyStatus = "Overallocated";
        }

        return {
          ...m,
          totalAllocation: monthlyTotal,
          utilization: monthlyUtilization,
          bench: monthlyBenchPercent,
          status: monthlyStatus,
        };
      });

      result.push({
        employee: emp,

        // ✅ RAW DATA
        totalAllocation: totalAllocatedHours,
        billableAllocation: billableHours,

        // ✅ FIXED UTILIZATION
        utilization, // 🔥 now correct (Billable / Total)
        capacityUtilization, // optional view (Total / 160)

        billableUtilization: utilization, // keep consistency

        bench,
        status,

        monthlyBench,
      });
    }

    res.json(result);
  } catch (err) {
    res.status(500).json({
      message: err.message,
    });
  }
};
