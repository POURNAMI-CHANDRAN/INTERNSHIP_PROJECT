import { getMonthData } from "./analyticsService.js";

const avg = (arr = []) =>
  arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : 0;

const growthRate = (arr = []) => {
  if (arr.length < 2) return 0;
  if (arr[0] === 0) return 0;
  return (arr[arr.length - 1] - arr[0]) / arr[0];
};

/* ================= BUILD HISTORY ================= */
export const buildHistory = async ({ months = [] }) => {
  const history = [];

  for (const m of months) {
    const { employeeMetrics = [] } = await getMonthData(m);

    const revenue = employeeMetrics.reduce((s, e) => s + (e.revenue || 0), 0);
    const cost = employeeMetrics.reduce((s, e) => s + (e.allocatedCost || 0), 0);
    const utilization =
      employeeMetrics.length > 0
        ? employeeMetrics.reduce((s, e) => s + (e.utilizationPct || 0), 0) /
          employeeMetrics.length
        : 0;

    const benchCount = employeeMetrics.filter((e) => e.isBench).length;

    history.push({
      month: m.month,
      year: m.year,
      revenue,
      cost,
      utilization,
      benchCount,
    });
  }

  return history;
};

/* ================= REVENUE FORECAST ================= */
export const forecastRevenue = async ({ months = [] }) => {
  const history = await buildHistory({ months });

  const revenues = history.map((x) => x.revenue);

  const avgRevenue = avg(revenues);
  const trend = growthRate(revenues);

  const next = avgRevenue * (1 + trend / 2);

  return {
    history,
    forecast: {
      nextMonthRevenue: Number(next.toFixed(2)),
      confidence: revenues.length >= 6 ? "HIGH" : "MEDIUM",
    },
  };
};

/* ================= BENCH FORECAST ================= */
export const forecastBench = async ({ months = [] }) => {
  const history = await buildHistory({ months });

  const values = history.map((x) => x.benchCount);

  const avgBench = avg(values);
  const trend = growthRate(values);

  const next = Math.max(0, Math.round(avgBench + avgBench * (trend / 2)));

  return {
    history,
    forecast: {
      nextMonthBench: next,
      risk: next >= 5 ? "HIGH" : next >= 2 ? "MEDIUM" : "LOW",
    },
  };
};

/* ================= UTILIZATION FORECAST ================= */
export const forecastUtilization = async ({ months = [] }) => {
  const history = await buildHistory({ months });

  const values = history.map((x) => x.utilization);

  const avgUtil = avg(values);
  const trend = growthRate(values);

  const next = Math.min(120, Math.max(0, avgUtil + avgUtil * (trend / 2)));

  return {
    history,
    forecast: {
      nextMonthUtilization: Number(next.toFixed(2)),
      status:
        next < 60 ? "UNDERUTILIZED" : next > 100 ? "OVERALLOCATED" : "HEALTHY",
    },
  };
};