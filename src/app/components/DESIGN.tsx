import React, { useEffect, useMemo, useState } from "react";
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  AreaChart,
  Area,
  CartesianGrid,
  Legend,
} from "recharts";

/* ================= TYPES ================= */

type KPI = {
  totalEmployees: number;
  billableEmployees: number;
  nonBillableEmployees: number;
  utilizationPct: number;
  revenue: number;
};

type ChartItem = {
  name?: string;
  value?: number;
  project?: string;
  hours?: number;
};

type RevenueTrend = {
  period: string;
  billableHours: number;
};

type BenchForecast = {
  current: number;
  riskLevel: "LOW" | "MEDIUM" | "HIGH";
};

type DashboardResponse = {
  kpis: KPI;
  charts: {
    billableVsNonBillable: ChartItem[];
    projectAllocation: ChartItem[];
    revenueTrend: RevenueTrend[];
  };
  forecasts: {
    benchForecast: BenchForecast;
  };
  revenueByProject: {
    project: string;
    revenue: number;
    cost: number;
    margin: number;
  }[];
};

/* ================= CONFIG ================= */

const COLORS = ["#6366f1", "#22c55e", "#f59e0b", "#ef4444"];

/* ================= COMPONENT ================= */

export default function Dashboard() {
  const [data, setData] = useState<DashboardResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [year, setYear] = useState(new Date().getFullYear());

  useEffect(() => {
    fetch(`http://localhost:5000/api/analytics/dashboard?month=${month}&year=${year}`)
      .then((res) => res.json())
      .then((res) => {
        setData(res.data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [month, year]);

  /* ================= SAFE DERIVED DATA ================= */

  const kpis = data?.kpis;
  const charts = data?.charts;
  const revenueByProject = data?.revenueByProject || [];

  const allocationData = useMemo(
    () =>
      charts?.projectAllocation?.map((p) => ({
        project: p.project ?? "Unknown",
        hours: p.hours ?? 0,
      })) || [],
    [charts]
  );

  const billableVsNon = useMemo(
    () => charts?.billableVsNonBillable || [],
    [charts]
  );

  const revenueTrend = useMemo(
    () => charts?.revenueTrend || [],
    [charts]
  );

  /* ================= LOADING ================= */

  if (loading) {
    return (
      <div className="p-10 text-gray-500 text-lg">Loading Enterprise BI...</div>
    );
  }

  if (!data) {
    return (
      <div className="p-10 text-red-500 text-lg">Failed to load dashboard</div>
    );
  }

  return (
    <div className="p-6 bg-gray-50 min-h-screen space-y-6">

<div className="flex gap-4 items-center mb-4">

  <select
    value={month}
    onChange={(e) => setMonth(Number(e.target.value))}
    className="border p-2 rounded"
  >
    {[1,2,3,4,5,6,7,8,9,10,11,12].map((m) => (
      <option key={m} value={m}>
        Month {m}
      </option>
    ))}
  </select>

  <select
    value={year}
    onChange={(e) => setYear(Number(e.target.value))}
    className="border p-2 rounded"
  >
    {[2024, 2025, 2026].map((y) => (
      <option key={y} value={y}>
        {y}
      </option>
    ))}
  </select>

</div>
      {/* ================= KPI CARDS ================= */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">

        <Card title="Total Employees" value={kpis?.totalEmployees} />
        <Card title="Billable" value={kpis?.billableEmployees} />
        <Card title="Non-Billable" value={kpis?.nonBillableEmployees} />
        <Card title="Utilization %" value={`${kpis?.utilizationPct}%`} />
      </div>

      {/* ================= GRAPHS ================= */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

        {/* BILLABLE VS NON BILLABLE */}
        <div className="bg-white p-4 rounded-xl shadow">
          <h2 className="font-semibold mb-3">Billable vs Non-Billable</h2>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={billableVsNon}
                dataKey="value"
                nameKey="name"
                outerRadius={90}
              >
                {billableVsNon.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* PROJECT ALLOCATION */}
        <div className="bg-white p-4 rounded-xl shadow">
          <h2 className="font-semibold mb-3">Project Allocation</h2>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={allocationData}>
              <XAxis dataKey="project" hide />
              <YAxis />
              <Tooltip />
              <Bar dataKey="hours" fill="#6366f1" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* REVENUE TREND */}
        <div className="bg-white p-4 rounded-xl shadow col-span-2">
          <h2 className="font-semibold mb-3">Revenue Trend</h2>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={revenueTrend}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="period" />
              <YAxis />
              <Tooltip />
              <Area type="monotone" dataKey="billableHours" fill="#6366f1" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* ================= REVENUE BY PROJECT ================= */}
      <div className="bg-white p-4 rounded-xl shadow">
        <h2 className="font-semibold mb-3">Revenue by Project</h2>

        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-gray-500">
              <th>Project</th>
              <th>Revenue</th>
              <th>Cost</th>
              <th>Margin</th>
            </tr>
          </thead>
          <tbody>
            {revenueByProject.map((p, i: number) => (
              <tr key={i} className="border-t">
                <td>{p.project}</td>
                <td>₹{p.revenue}</td>
                <td>₹{p.cost}</td>
                <td className={p.margin < 0 ? "text-red-500" : "text-green-600"}>
                  ₹{p.margin}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* ================= BENCH ALERT ================= */}
      <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-xl">
        <h2 className="font-semibold">Bench Forecast</h2>
        <p>
          Current Bench: <b>{data.forecasts.benchForecast.current}</b> employees
        </p>
        <p>Risk Level: <b>{data.forecasts.benchForecast.riskLevel}</b></p>
      </div>

    </div>
  );
}

/* ================= CARD COMPONENT ================= */

function Card({
  title,
  value,
}: {
  title: string;
  value: React.ReactNode;
}) {
  return (
    <div className="bg-white p-4 rounded-xl shadow">
      <p className="text-gray-500 text-sm">{title}</p>
      <h3 className="text-2xl font-bold">{value}</h3>
    </div>
  );
}