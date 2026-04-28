import {
  getMonthData,
  getRevenueSummary,
  getUtilizationTrend
} from "./analyticsService.js";

const MONTHLY_CAPACITY = 160;

/* =====================================================
   DASHBOARD SUMMARY
===================================================== */
export const getDashboardSummary = async ({ month, year }) => {
  const { employeeMetrics } = await getMonthData({ month, year });

  const totalEmployees = employeeMetrics.length;
  const benchEmployees = employeeMetrics.filter(e => e.isBench);
  const underutilized = employeeMetrics.filter(
    e => e.utilizationBand === "UNDERUTILIZED"
  );
  const overallocated = employeeMetrics.filter(
    e => e.totalAllocatedHours > MONTHLY_CAPACITY
  );

  const totalRevenue = employeeMetrics.reduce(
    (sum, e) => sum + e.revenue,
    0
  );

  const totalCost = employeeMetrics.reduce(
    (sum, e) => sum + e.allocatedCost,
    0
  );

  const totalMargin = totalRevenue - totalCost;

  const avgUtilization =
    totalEmployees === 0
      ? 0
      : Number(
          (
            employeeMetrics.reduce(
              (sum, e) => sum + e.utilizationPct,
              0
            ) / totalEmployees
          ).toFixed(2)
        );

  return {
    totalEmployees,
    benchCount: benchEmployees.length,
    underutilizedCount: underutilized.length,
    overallocatedCount: overallocated.length,
    avgUtilization,
    totalRevenue: Number(totalRevenue.toFixed(2)),
    totalCost: Number(totalCost.toFixed(2)),
    totalMargin: Number(totalMargin.toFixed(2))
  };
};

/* =====================================================
   BENCH INSIGHTS
===================================================== */
export const getBenchInsights = async ({ month, year }) => {
  const { employeeMetrics } = await getMonthData({ month, year });

  const bench = employeeMetrics
    .filter(e => e.isBench)
    .map(e => {
      const idleHours = MONTHLY_CAPACITY;
      const hourlyCost =
        e.allocatedCost > 0
          ? e.allocatedCost / MONTHLY_CAPACITY
          : 0;

      const benchCost = Number(
        (idleHours * hourlyCost).toFixed(2)
      );

      return {
        employeeId: e.employeeId,
        employeeCode: e.employeeCode,
        name: e.name,
        benchHours: idleHours,
        benchCost,
        risk: "HIGH",
        recommendation:
          "Assign to billable project immediately"
      };
    });

  const totalBenchCost = bench.reduce(
    (sum, e) => sum + e.benchCost,
    0
  );

  return {
    count: bench.length,
    totalBenchCost: Number(totalBenchCost.toFixed(2)),
    employees: bench
  };
};

/* =====================================================
   UTILIZATION INSIGHTS
===================================================== */
export const getUtilizationInsights = async ({
  month,
  year
}) => {
  const { employeeMetrics } = await getMonthData({
    month,
    year
  });

  const underutilized = employeeMetrics.filter(
    e => e.utilizationPct < 50 && !e.isBench
  );

  const healthy = employeeMetrics.filter(
    e =>
      e.utilizationPct >= 80 &&
      e.utilizationPct <= 100
  );

  const overallocated = employeeMetrics.filter(
    e => e.totalAllocatedHours > MONTHLY_CAPACITY
  );

  return {
    underutilized,
    healthy,
    overallocated
  };
};

/* =====================================================
   TOP PERFORMERS (MARGIN)
===================================================== */
export const getTopPerformers = async ({
  month,
  year,
  limit = 10
}) => {
  const { employeeMetrics } = await getMonthData({
    month,
    year
  });

  return employeeMetrics
    .sort((a, b) => b.margin - a.margin)
    .slice(0, limit)
    .map((e, index) => ({
      rank: index + 1,
      employeeId: e.employeeId,
      name: e.name,
      revenue: e.revenue,
      cost: e.allocatedCost,
      margin: e.margin
    }));
};

/* =====================================================
   PROJECT REVENUE INSIGHTS
===================================================== */
export const getProjectInsights = async ({
  month,
  year
}) => {
  const projects = await getRevenueSummary({
    month,
    year
  });

  const topRevenue = [...projects]
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 5);

  const topMargin = [...projects]
    .sort((a, b) => b.margin - a.margin)
    .slice(0, 5);

  return {
    topRevenue,
    topMargin
  };
};

/* =====================================================
   EXECUTIVE SUMMARY
===================================================== */
export const getExecutiveSummary = async ({
  month,
  year
}) => {
  const dashboard =
    await getDashboardSummary({
      month,
      year
    });

  const bench =
    await getBenchInsights({
      month,
      year
    });

  const topPerformers =
    await getTopPerformers({
      month,
      year,
      limit: 5
    });

  const trend =
    await getUtilizationTrend(6);

  return {
    dashboard,
    bench,
    topPerformers,
    trend
  };
};