import Employee from "../models/Employee.js";
import Allocation from "../models/Allocation.js";
import Project from "../models/Project.js";
import {
  getMonthData,
  getRevenueSummary,
  getUtilizationTrend,
} from "../services/analyticsService.js";

const toNumber = (v, f) => Number(v || f);

export const getEnterpriseDashboard = async (req, res) => {
  try {
    const month = toNumber(req.query.month, new Date().getMonth() + 1);
    const year = toNumber(req.query.year, new Date().getFullYear());

    const { employeeMetrics, allocations } = await getMonthData({ month, year });
    const revenueSummary = await getRevenueSummary({ month, year });
    const trend = await getUtilizationTrend({months: 12, year});

    const totalEmployees = employeeMetrics.length;

    const billableEmployees = employeeMetrics.filter(e => e.billableHours > 0);
    const nonBillableEmployees = employeeMetrics.filter(e => e.billableHours === 0);

    const utilizationPct = totalEmployees
      ? Math.round(
          employeeMetrics.reduce((s, e) => s + e.utilizationPct, 0) / totalEmployees
        )
      : 0;

    const revenue = revenueSummary.reduce((s, r) => s + r.revenue, 0);

    // PROJECT ALLOCATION (BI-ready)
    const projectMap = new Map();

    allocations.forEach(a => {
      const name = a.projectId?.name || "Unknown";
      projectMap.set(name, (projectMap.get(name) || 0) + (a.allocatedHours || 0));
    });

    const projectAllocation = [...projectMap.entries()].map(([project, hours]) => ({
      project,
      hours,
    }));

    // REVENUE BY PROJECT
    const revenueByProject = revenueSummary.map(r => ({
      project: r.project,
      revenue: r.revenue,
      cost: r.cost,
      margin: r.margin
    }));

    // BENCH FORECAST (enterprise logic)
    const benchForecast = {
      current: nonBillableEmployees.length,
      riskLevel:
        nonBillableEmployees.length > totalEmployees * 0.5
          ? "HIGH"
          : "MEDIUM"
    };

    res.json({
      success: true,
      meta: {
        month,
        year,
        generatedAt: new Date().toISOString(),
        source: "analytics-engine-v1"
      },
      data: {
        kpis: {
          totalEmployees,
          billableEmployees: billableEmployees.length,
          nonBillableEmployees: nonBillableEmployees.length,
          utilizationPct,
          revenue
        },

        charts: {
          billableVsNonBillable: [
            { name: "Billable", value: billableEmployees.length },
            { name: "Non-Billable", value: nonBillableEmployees.length }
          ],

          projectAllocation,

          revenueTrend: trend
        },

        forecasts: {
          benchForecast
        },

        revenueByProject
      }
    });

  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};