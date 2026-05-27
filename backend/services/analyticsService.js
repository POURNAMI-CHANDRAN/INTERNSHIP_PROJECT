import Allocation from "../models/Allocation.js";
import Employee from "../models/Employee.js";

const MONTHLY_CAPACITY = 160;

/* =====================================================
   SAFE HELPERS (ENTERPRISE GRADE)
===================================================== */

const n = (v) => Number(v || 0);

const normalizeBillingType = (a) =>
  a.billingType || (a.isBillable ? "Billable" : "Non-Billable");

const safeId = (v) => v?.toString?.() || "";

/* =====================================================
   CORE METRICS ENGINE (EMPLOYEE LEVEL)
===================================================== */

export const calculateEmployeeMetrics = (employee, allocations = []) => {
  let totalHours = 0;
  let billableHours = 0;
  let revenue = 0;
  let cost = 0;

  for (const a of allocations) {
    const hours = n(a.allocatedHours);
    totalHours += hours;

    const type = normalizeBillingType(a);

    const hourlyCost = n(employee.hourlyCost);
    const salary = n(employee.monthlySalary);

    const project = a.projectId || a.project_id;

    const rate =
      n(a.rateSnapshot) ||
      n(project?.billingRate) ||
      n(project?.fixedMonthlyRevenue);

    const isRevenueEligible =
      type === "Billable" &&
      project?.type === "Billable";

    if (isRevenueEligible) {
      billableHours += hours;

      if (project.billingModel === "Fixed") {
        revenue += rate * (hours / MONTHLY_CAPACITY);
      } else {
        revenue += hours * rate;
      }
    }

    const effectiveHourlyCost =
      salary > 0
        ? salary / MONTHLY_CAPACITY
        : hourlyCost > 0
          ? hourlyCost
          : 0;

    cost += effectiveHourlyCost * hours;
  }

  const utilizationPct = (billableHours / MONTHLY_CAPACITY) * 100;

  /* ================= INTELLIGENCE LAYER ================= */

  let utilizationBand = "BENCH";

  if (billableHours === 0) utilizationBand = "BENCH";
  else if (utilizationPct > 110) utilizationBand = "OVERUTILIZED";
  else if (utilizationPct < 50) utilizationBand = "UNDERUTILIZED";
  else utilizationBand = "HEALTHY";

  const margin = revenue - cost;

  const riskScore =
    billableHours === 0 ? 100 :
    utilizationPct < 50 ? 80 :
    utilizationPct > 110 ? 70 :
    30;

  return {
    employeeId: employee._id,
    name: employee.name,
    employeeId: employee.employeeId,
    location: employee.location,

    totalHours,
    billableHours,
    nonBillableHours: totalHours - billableHours,

    utilizationPct: Number(utilizationPct.toFixed(2)),
    utilizationBand,

    revenue: Number(revenue.toFixed(2)),
    cost: Number(cost.toFixed(2)),
    margin: Number(margin.toFixed(2)),

    isBench: billableHours === 0,

    
    flags: {
      financialBench: billableHours === 0,
      operationalBench: totalHours === 0,
    },


    /* 🔥 AI SIGNALS */
    riskScore,
    productivityScore: Number((revenue / (totalHours || 1)).toFixed(2)),
  };
};

/* =====================================================
   MONTH ENGINE (CORE DATA PIPELINE)
===================================================== */

export const getMonthData = async ({ month, year }) => {
  const employees = await Employee.find({ status: "Active" });

  const allocations = await Allocation.find({ month, year })
    .populate("projectId")
    .populate("employeeId");

  const grouped = new Map();

  for (const a of allocations) {
    const id = safeId(a.employeeId?._id);
    if (!id) continue;

    if (!grouped.has(id)) grouped.set(id, []);
    grouped.get(id).push(a);
  }

  const employeeMetrics = employees.map((emp) =>
    calculateEmployeeMetrics(emp, grouped.get(safeId(emp._id)) || [])
  );

  return {
    employees,
    allocations,
    employeeMetrics,
  };
};

/* =====================================================
   BENCH INTELLIGENCE
===================================================== */

export const getImpendingBench = async ({ month, year }) => {
  const { employeeMetrics } = await getMonthData({ month, year });

  return employeeMetrics.filter(
    (e) => e.isBench || e.utilizationPct < 30
  );
};

/* =====================================================
   UTILIZATION TREND (AI READY)
===================================================== */
export const getUtilizationTrend = async ({ months = 12, year }) => {
  try {
    const trend = await Allocation.aggregate([
      {
        $match: {
          year: Number(year),
          isBillable: true,
        },
      },

      {
        $group: {
          _id: "$month",

          billableHours: {
            $sum: "$allocatedHours",
          },
        },
      },

      {
        $sort: {
          _id: 1,
        },
      },
    ]);

    return trend.map((item) => ({
      period: `${item._id}/${year}`,
      billableHours: item.billableHours,
      year,
    }));
  } catch (err) {
    console.error("UTILIZATION TREND ERROR:", err);
    return [];
  }
};

/* =====================================================
   REVENUE INTELLIGENCE ENGINE
===================================================== */

export const getRevenueSummary = async ({ month, year }) => {
  const allocations = await Allocation.find({ month, year })
    .populate("projectId")
    .populate("employeeId");

  const map = new Map();

  for (const a of allocations) {
    const project = a.projectId;
    if (!project) continue;

    const key = safeId(project._id);

    if (!map.has(key)) {
      map.set(key, {
        projectId: key,
        project: project.name,
        revenue: 0,
        cost: 0,
        margin: 0,
      });
    }

    const item = map.get(key);

    const hours = n(a.allocatedHours);
    const rate = n(a.rateSnapshot || project.billingRate);
    const costRate = n(a.employeeId?.hourlyCost);

    const type = normalizeBillingType(a);

    if (type === "Billable") {
      item.revenue += project.billingModel === "Fixed"
        ? rate * (hours / MONTHLY_CAPACITY)
        : rate * hours;
    }

    item.cost += costRate * hours;
    item.margin = item.revenue - item.cost;
  }

  return Array.from(map.values())
    .map((p) => ({
      ...p,
      revenue: n(p.revenue.toFixed(2)),
      cost: n(p.cost.toFixed(2)),
      margin: n(p.margin.toFixed(2)),
    }))
    .sort((a, b) => b.revenue - a.revenue);
};