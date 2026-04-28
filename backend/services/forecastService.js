import { getMonthData } from "./analyticsService.js";

const MONTHLY_CAPACITY = 160;

/* =====================================================
   HELPERS
===================================================== */
const avg = (arr = []) => {
  if (!arr.length) return 0;
  return arr.reduce((a, b) => a + b, 0) / arr.length;
};

const growthRate = (values = []) => {
  if (values.length < 2) return 0;

  const first = values[0];
  const last = values[values.length - 1];

  if (first === 0) return 0;

  return (last - first) / first;
};

/* =====================================================
   BUILD MONTH HISTORY
===================================================== */
export const buildHistory = async ({
  months = []
}) => {
  const history = [];

  for (const item of months) {
    const { employeeMetrics } =
      await getMonthData({
        month: item.month,
        year: item.year
      });

    const totalRevenue =
      employeeMetrics.reduce(
        (sum, e) => sum + e.revenue,
        0
      );

    const totalCost =
      employeeMetrics.reduce(
        (sum, e) => sum + e.allocatedCost,
        0
      );

    const avgUtilization =
      employeeMetrics.length === 0
        ? 0
        : employeeMetrics.reduce(
            (sum, e) =>
              sum + e.utilizationPct,
            0
          ) / employeeMetrics.length;

    const benchCount =
      employeeMetrics.filter(
        e => e.isBench
      ).length;

    history.push({
      month: item.month,
      year: item.year,
      revenue: Number(
        totalRevenue.toFixed(2)
      ),
      cost: Number(
        totalCost.toFixed(2)
      ),
      utilization: Number(
        avgUtilization.toFixed(2)
      ),
      benchCount
    });
  }

  return history;
};

/* =====================================================
   REVENUE FORECAST
===================================================== */
export const forecastRevenue = async ({
  months = []
}) => {
  const history =
    await buildHistory({ months });

  const revenues = history.map(
    x => x.revenue
  );

  const averageRevenue =
    avg(revenues);

  const rate =
    growthRate(revenues);

  const nextRevenue =
    averageRevenue *
    (1 + rate / 2);

  return {
    history,
    forecast: {
      nextMonthRevenue: Number(
        nextRevenue.toFixed(2)
      ),
      confidence:
        revenues.length >= 6
          ? "HIGH"
          : "MEDIUM"
    }
  };
};

/* =====================================================
   BENCH FORECAST
===================================================== */
export const forecastBench = async ({
  months = []
}) => {
  const history =
    await buildHistory({ months });

  const benchValues =
    history.map(
      x => x.benchCount
    );

  const averageBench =
    avg(benchValues);

  const trend =
    growthRate(benchValues);

  const nextBench =
    Math.max(
      0,
      Math.round(
        averageBench +
          averageBench *
            (trend / 2)
      )
    );

  return {
    history,
    forecast: {
      nextMonthBench:
        nextBench,
      risk:
        nextBench >= 5
          ? "HIGH"
          : nextBench >= 2
          ? "MEDIUM"
          : "LOW"
    }
  };
};

/* =====================================================
   UTILIZATION FORECAST
===================================================== */
export const forecastUtilization =
  async ({ months = [] }) => {
    const history =
      await buildHistory({
        months
      });

    const values =
      history.map(
        x => x.utilization
      );

    const average =
      avg(values);

    const trend =
      growthRate(values);

    const nextUtilization =
      Math.min(
        120,
        Math.max(
          0,
          average +
            average *
              (trend / 2)
        )
      );

    return {
      history,
      forecast: {
        nextMonthUtilization:
          Number(
            nextUtilization.toFixed(
              2
            )
          ),
        status:
          nextUtilization < 60
            ? "UNDERUTILIZED"
            : nextUtilization >
              100
            ? "OVERALLOCATED"
            : "HEALTHY"
      }
    };
  };

/* =====================================================
   HIRING DEMAND FORECAST
===================================================== */
export const forecastHiringDemand =
  async ({
    currentEmployees = 0,
    months = []
  }) => {
    const util =
      await forecastUtilization({
        months
      });

    const nextUtil =
      util.forecast
        .nextMonthUtilization;

    let recommendedHires = 0;

    if (nextUtil > 95) {
      recommendedHires =
        Math.ceil(
          (nextUtil - 95) / 10
        );
    }

    return {
      currentEmployees,
      forecastUtilization:
        nextUtil,
      recommendedHires,
      message:
        recommendedHires > 0
          ? `Hire ${recommendedHires} resources soon`
          : "No urgent hiring needed"
    };
  };

/* =====================================================
   EXECUTIVE FORECAST SUMMARY
===================================================== */
export const getForecastSummary =
  async ({
    months = [],
    currentEmployees = 0
  }) => {
    const revenue =
      await forecastRevenue({
        months
      });

    const bench =
      await forecastBench({
        months
      });

    const utilization =
      await forecastUtilization(
        {
          months
        }
      );

    const hiring =
      await forecastHiringDemand(
        {
          currentEmployees,
          months
        }
      );

    return {
      revenue:
        revenue.forecast,
      bench:
        bench.forecast,
      utilization:
        utilization.forecast,
      hiring
    };
  };