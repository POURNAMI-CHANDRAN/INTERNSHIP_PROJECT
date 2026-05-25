import Employee from "../models/Employee.js";
import Allocation from "../models/Allocation.js";
import WorkCategory from "../models/WorkCategory.js";

const MONTHLY_CAPACITY = 160;

/* =====================================================
   HELPERS
===================================================== */

const normalize = (text = "") =>
  String(
    typeof text === "object" && text !== null
      ? text.name || text.skillName || text.skill || ""
      : text
  )
    .toLowerCase()
    .trim();

const arrayNormalize = (arr = []) =>
  Array.isArray(arr)
    ? arr.map((item) => normalize(item)).filter(Boolean)
    : [];

const overlapScore = (required = [], employeeSkills = []) => {
  const req = arrayNormalize(required);
  const emp = arrayNormalize(employeeSkills);

  if (!req.length) return 0;

  let matched = 0;

  for (const skill of req) {
    if (emp.includes(skill)) matched++;
  }

  return Number(((matched / req.length) * 100).toFixed(2));
};

const experienceScore = (years) => {
  const y = Number(years || 0);
  if (y >= 8) return 100;
  if (y >= 5) return 85;
  if (y >= 3) return 70;
  if (y >= 1) return 55;
  return 30;
};

const costScore = (rate) => {
  const r = Number(rate || 0);
  if (r <= 25) return 100;
  if (r <= 40) return 85;
  if (r <= 60) return 70;
  if (r <= 90) return 55;
  return 35;
};

/* =====================================================
   CLEAN EMPLOYEE OUTPUT
===================================================== */

const cleanEmployee = (employee) => ({
  employeeId: employee.employeeId || "N/A",
  name: employee.name || "Unknown",
  workCategory: employee.workCategory || "",
  experienceYears: employee.experienceYears || 0,
  skills:
    employee.skills?.map((s) => s.name || s.skillName || s.skill || String(s)) || [],
});

/* =====================================================
   UTILIZATION
===================================================== */

export const getCurrentUtilization = async ({ month, year }) => {
  const rows = await Allocation.aggregate([
    { $match: { month, year } },
    { $group: { _id: "$employeeId", hours: { $sum: "$allocatedHours" } } },
  ]);

  const map = new Map();

  for (const row of rows) {
    map.set(row._id.toString(), Number(row.hours || 0));
  }

  return map;
};

/* =====================================================
   TREND SCORE (AI LAYER)
===================================================== */

const trendScore = (history = []) => {
  if (!Array.isArray(history) || history.length < 2) return 50;

  const diff = history[history.length - 1] - history[0];

  if (diff > 10) return 90;
  if (diff > 5) return 75;
  if (diff > 0) return 60;
  return 40;
};

/* =====================================================
   RESOURCE MATCHING (AI VERSION)
===================================================== */

export const recommendResources = async ({ month, year, requiredSkills = [], maxResults = 5 }) => {
  const employees = await Employee.find({ status: "Active" }).populate("skills");

  const utilizationMap = await getCurrentUtilization({ month, year });

  const ranked = employees.map((employee) => {
    const usedHours = utilizationMap.get(employee._id.toString()) || 0;

    const availableHours = Math.max(0, MONTHLY_CAPACITY - usedHours);

    const availabilityScore = Number(((availableHours / MONTHLY_CAPACITY) * 100).toFixed(2));

    const skillMatch = overlapScore(requiredSkills, employee.skills || []);

    const expScore = experienceScore(employee.experienceYears);

    const billRate = employee.billingRate || employee.hourlyRate || 0;

    const cScore = costScore(billRate);

    const finalScore = Number(
      (
        skillMatch * 0.4 +
        availabilityScore * 0.25 +
        expScore * 0.2 +
        cScore * 0.15
      ).toFixed(2)
    );

    return {
      ...cleanEmployee(employee),
      availableHours,
      utilizationPct: Number(((usedHours / MONTHLY_CAPACITY) * 100).toFixed(2)),
      skillMatch,
      finalScore,
      recommendation:
        finalScore >= 85 ? "BEST FIT" : finalScore >= 70 ? "GOOD FIT" : "PARTIAL FIT",
    };
  });

  return ranked.sort((a, b) => b.finalScore - a.finalScore).slice(0, maxResults);
};

/* =====================================================
   BENCH DEPLOYMENT (ADAPTIVE)
===================================================== */

export const recommendBenchDeployment = async ({ month, year }) => {
  const employees = await Employee.find({ status: "Active" }).populate("skills");

  const utilizationMap = await getCurrentUtilization({ month, year });

  const ranked = employees.map((employee) => {
    const used = utilizationMap.get(employee._id.toString()) || 0;

    const idleHours = MONTHLY_CAPACITY - used;

    return {
      ...cleanEmployee(employee),
      idleHours,
      utilizationPct: Number(((used / MONTHLY_CAPACITY) * 100).toFixed(2)),
    };
  });

  const avgIdle = ranked.reduce((sum, r) => sum + r.idleHours, 0) / (ranked.length || 1);

  return ranked
    .sort((a, b) => b.finalScore - a.finalScore)
    .slice(0, maxResults)
    .map(formatRecommendation);
};

/* =====================================================
   OVERLOADED STAFF
===================================================== */

export const recommendLoadBalancing = async ({ month, year }) => {
  const employees = await Employee.find({ status: "Active" });

  const utilizationMap = await getCurrentUtilization({ month, year });

  return employees
    .map((employee) => {
      const used = utilizationMap.get(employee._id.toString()) || 0;

      return {
        ...cleanEmployee(employee),
        allocatedHours: used,
        excessHours: Math.max(0, used - MONTHLY_CAPACITY),
        utilizationPct: Number(((used / MONTHLY_CAPACITY) * 100).toFixed(2)),
      };
    })
    .filter((e) => e.excessHours > 0)
    .sort((a, b) => b.excessHours - a.excessHours);
};

/* =====================================================
   EXECUTIVE SUMMARY (AI INSIGHTS)
===================================================== */

export const getRecommendationSummary = async ({ month, year, requiredSkills = [] }) => {
  const resources = await recommendResources({ month, year, requiredSkills });
  const bench = await recommendBenchDeployment({ month, year });
  const overloaded = await recommendLoadBalancing({ month, year });

  return {
    bestResources: resources,
    benchDeployment: bench,
    overloaded,

    insights: {
      benchRiskLevel: bench.length > 5 ? "HIGH" : "LOW",
      utilizationPressure: overloaded.length > 3 ? "CRITICAL" : "NORMAL",
      recommendation:
        bench.length > 5
          ? "Reallocate resources immediately"
          : "System stable",
    },
  };
};