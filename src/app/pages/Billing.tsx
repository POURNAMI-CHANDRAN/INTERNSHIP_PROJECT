import { useEffect, useState, useMemo, useCallback } from "react";
import axios from "axios";
import { 
  TrendingUp, 
  TrendingDown, 
  Clock, 
  Briefcase, 
  DollarSign, 
  Search, 
  RefreshCcw 
} from "lucide-react";

import {
  Chart as ChartJS,
  ArcElement,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Legend,
  Filler,
} from "chart.js";

import {
  Tooltip,
  Line,
  XAxis,
  YAxis,
  Bar,
  CartesianGrid,
  ResponsiveContainer,
  Area,
  BarChart,
  ComposedChart
} from "recharts";

ChartJS.register(
  ArcElement, CategoryScale, LinearScale, BarElement, 
  LineElement, PointElement, Legend, Filler
);

/* ---------------- HELPERS ---------------- */
const normalizeBilling = (b: any) => {
  let month = b.month;
  let year = b.year;
  if (!month && b.billing_month) {
    const d = new Date(b.billing_month);
    month = d.getUTCMonth() + 1;
    year = d.getUTCFullYear();
  }
  return {
    ...b,
    month,
    year,
    total_hours: b.total_hours ?? b.story_points_completed ?? 0,
    rate: b.rate_per_hour ?? b.billing_rate_per_point ?? 0,
  };
};

const monthMap: Record<string, number> = {
  Jan: 1,
  Feb: 2,
  Mar: 3,
  Apr: 4,
  May: 5,
  Jun: 6,
  Jul: 7,
  Aug: 8,
  Sep: 9,
  Oct: 10,
  Nov: 11,
  Dec: 12,
};

export default function PremiumBillingDashboard() {
  const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";
  const token = localStorage.getItem("token");
  const headers = useMemo(() => ({ Authorization: `Bearer ${token || ""}` }), [token]);

  const [billingData, setBillingData] = useState<any[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [projectFilter, setProjectFilter] = useState("All");
  const [monthFilter, setMonthFilter] = useState("All");

  const [selectedMonth, setSelectedMonth] = useState<number | null>(null);
  
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [billRes, projRes, empRes] = await Promise.all([
        axios.get(`${API_BASE}/api/billing`, { headers }),
        axios.get(`${API_BASE}/api/projects`, { headers }),
        axios.get(`${API_BASE}/api/employees`, { headers }),
      ]);
      setBillingData((billRes.data?.data || []).map(normalizeBilling));
      setProjects(projRes.data?.data || []);
      setEmployees(empRes.data?.data || []);
    } catch (err) {
      console.error("LOAD ERROR:", err);
    } finally {
      setLoading(false);
    }
  }, [API_BASE, headers]);

  useEffect(() => { loadData(); }, [loadData]);

  const filtered = useMemo(() => {
    return billingData.filter((b) => {
      if (projectFilter !== "All" && b.project_id?._id !== projectFilter) return false;
      if (monthFilter !== "All") {
        const key = `${b.year}-${String(b.month).padStart(2, "0")}`;
        if (key !== monthFilter) return false;
      }
      if (search) {
        const q = search.toLowerCase();
        return b.employee_id?.name?.toLowerCase().includes(q) || b.project_id?.name?.toLowerCase().includes(q);
      }
      return true;
    });
  }, [billingData, search, projectFilter, monthFilter]);

  /* ---------------- CALCULATIONS ---------------- */
  const totalRevenue = useMemo(() => filtered.reduce((s, b) => s + (b.total_revenue || 0), 0), [filtered]);
  const totalHours = useMemo(() => filtered.reduce((s, b) => s + (b.total_hours || 0), 0), [filtered]);
  
  const currentMonth = new Date().getMonth() + 1;
  const currentYear = new Date().getFullYear();
  const prevMonth = currentMonth === 1 ? 12 : currentMonth - 1;
  const prevYear = currentMonth === 1 ? currentYear - 1 : currentYear;

  const avgHourlyRate = totalHours > 0 ? totalRevenue / totalHours : 0;

  const currentRevenue = billingData
    .filter(
      (b) =>
        b.month === currentMonth &&
        b.year === currentYear
    )
    .reduce((s, b) => s + (b.total_revenue || 0), 0);

  const prevRevenue = billingData
    .filter(
      (b) =>
        b.month === prevMonth &&
        b.year === prevYear
    )
    .reduce((s, b) => s + (b.total_revenue || 0), 0);

  const growth =
    prevRevenue === 0
      ? currentRevenue > 0
        ? 100
        : 0
      : ((currentRevenue - prevRevenue) / prevRevenue) * 100;

  /* ---------------- CHART DATA ---------------- */
const monthlyTrend = useMemo(() => {
  const revenueMap: Record<number, number> = {};

  filtered.forEach((b) => {
    if (b.year === currentYear) {
      revenueMap[b.month] =
        (revenueMap[b.month] || 0) + (b.total_revenue || 0);
    }
  });

  const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

  return months.map((month, index) => ({
    month,
    revenue: revenueMap[index + 1] || 0,
    monthNumber: index + 1,
  }));
}, [filtered, currentYear]);

/* ---------------- DRILL DOWN DATA ---------------- */

const projectDrilldown = useMemo(() => {
  if (selectedMonth == null) return [];

  const revenueMap: Record<string, number> = {};

  filtered.forEach((b) => {
    const month = Number(b.month);
    const year = Number(b.year);

    console.log("Checking:", {
      month,
      year,
      selectedMonth,
      currentYear,
      revenue: b.total_revenue,
      project: b.project_id?.name,
    });

    if (
      month === Number(selectedMonth) &&
      year === Number(currentYear)
    ) {
      const projectName =
        b.project_id?.name || "Unknown Project";

      revenueMap[projectName] =
        (revenueMap[projectName] || 0) +
        Number(b.total_revenue || 0);
    }
  });

  console.log("Revenue Map:", revenueMap);

  return Object.entries(revenueMap)
    .map(([project, revenue]) => ({
      project,
      revenue,
    }))
    .sort((a, b) => b.revenue - a.revenue);
}, [selectedMonth, filtered, currentYear]);

  const selectedMonthRevenue = projectDrilldown.reduce((sum, p) => sum + p.revenue, 0);

  if (loading) return <div className="flex h-screen items-center justify-center text-slate-500 animate-pulse">Loading Dashboard...</div>;

  return (
    <div className="min-h-screen bg-slate-50 p-8 font-sans text-slate-900">
      {/* HEADER */}
      <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
       <div className="flex items-center gap-3">
        <div className="bg-sky-600 p-2.5 rounded-xl shadow-lg shadow-sky-200">
          <DollarSign className="text-white" size={28} />
        </div>

        {/* TEXT BLOCK */}
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Financial<span className="text-sky-600"> Overview</span>
          </h1>

          <p className="text-slate-500 font-medium">Monitor your project billing and employee performance.</p>
        </div>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
            <input 
              className="pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none w-64 bg-white"
              placeholder="Search employee or project..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <button 
            onClick={() => { setSearch(""); setProjectFilter("All"); setMonthFilter("All"); }}
            className="p-2 text-slate-500 hover:bg-slate-200 rounded-lg transition-colors"
          >
            <RefreshCcw className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* KPI CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard title="Total Revenue" value={`₹${totalRevenue.toLocaleString("en-IN")}`} icon={<DollarSign className="text-blue-600"/>} trend={growth} />
        <StatCard title="Billable Hours" value={`${totalHours} hrs`} icon={<Clock className="text-emerald-600"/>} />
        <StatCard title="Projects" value={projects.length} icon={<Briefcase className="text-purple-600"/>} />
        <StatCard title="Avg. Hourly Rate" value={`₹${avgHourlyRate.toFixed(0)}`} icon={<TrendingUp className="text-pink-600"/>} />
      </div>

    <div className="grid grid-cols-1 xl:grid-cols-3 gap-8 mb-10">
      <div className="xl:col-span-2 bg-white rounded-3xl border border-slate-200 p-8 shadow-sm">
              
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">

        <div>
          <p className="text-xs font-black uppercase tracking-widest text-slate-400 mb-2">
            Total Revenue
          </p>

          <div className="flex items-center gap-4">
            <h2 className="text-4xl font-black text-slate-900">
              ₹{totalRevenue.toLocaleString("en-IN")}
            </h2>

            <div
              className={`px-3 py-1 rounded-full text-xs font-bold ${
                growth >= 0
                  ? "bg-emerald-50 text-emerald-600"
                  : "bg-rose-50 text-rose-600"
              }`}
            >
              {growth >= 0 ? "+" : ""}
              {growth.toFixed(1)}%
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="flex items-center gap-2 text-xs font-semibold text-slate-500">
            <div className="w-3 h-3 rounded-full bg-indigo-500" />
            Revenue Trend
          </span>
        </div>
      </div>

    {/* Chart */}
    <div className="h-80">
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={monthlyTrend}>

          {/* Light grid (Power BI style) */}
          <CartesianGrid
            stroke="#e5e7eb"
            strokeDasharray="3 3"
            vertical={false}
          />

          {/* X Axis */}
          <XAxis
            dataKey="month"
            tick={{ fill: "#64748b", fontSize: 12 }}
            axisLine={false}
            tickLine={false}
          />

          {/* Y Axis */}
          <YAxis
            tick={{ fill: "#64748b", fontSize: 12 }}
            axisLine={false}
            tickLine={false}
          />

          {/* Tooltip */}
          <Tooltip
            contentStyle={{
              backgroundColor: "#fff",
              border: "none",
              borderRadius: "12px",
              boxShadow: "0px 6px 20px rgba(0,0,0,0.08)"
            }}
            labelStyle={{ color: "#0f172a", fontWeight: 600 }}
          />

          {/* Area (Power BI shading) */}
          <Area
            type="monotone"
            dataKey="revenue"
            stroke="none"
            fill="url(#colorRevenue)"
          />

          {/* Line (main visual) */}
          <Line
            type="monotone"
            dataKey="revenue"
            stroke="#6366f1"
            strokeWidth={3}
            dot={(props: any) => {
              const { cx, cy, payload } = props;

              const hasRevenue = payload.revenue > 0;

              return (
                <g
                  key={`dot-${payload.monthNumber}`}
                  onClick={() => {
                    if (!hasRevenue) return;

                    setSelectedMonth((prev) =>
                      prev === payload.monthNumber
                        ? null
                        : payload.monthNumber
                    );
                  }}
                  style={{
                    cursor: hasRevenue ? "pointer" : "default",
                    opacity: hasRevenue ? 1 : 0.35,
                  }}
                >
                  <circle
                    cx={cx}
                    cy={cy}
                    r={5}
                    fill={
                      selectedMonth === payload.monthNumber
                        ? "#6366f1"
                        : "#fff"
                    }
                    stroke="#6366f1"
                    strokeWidth={
                      selectedMonth === payload.monthNumber ? 5 : 3
                    }
                  />
                </g>
              );
            }}
            activeDot={{
              r: 7,
              stroke: "#6366f1",
              strokeWidth: 3,
              fill: "#fff"
            }}
          />

          {/* Gradient */}
          <defs>
            <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#6366f1" stopOpacity={0.3} />
              <stop offset="100%" stopColor="#6366f1" stopOpacity={0.02} />
            </linearGradient>
          </defs>

        </ComposedChart>
      </ResponsiveContainer>
    </div>

    {/* DRILL DOWN PANEL */}
    {selectedMonth && projectDrilldown.length > 0 && (
      <div className="mt-8 border-t border-slate-100 pt-6">

        <div className="flex items-center justify-between mb-5">
        <div>
          {/* Updated Drilldown Heading */}
          <h3 className="text-lg font-bold text-slate-800">
            {[" ", "Jan ", "Feb ", "Mar ", "Apr ", "May ", "Jun ", "Jul ", "Aug ", "Sep ", "Oct ", "Nov ", "Dec "]
            [selectedMonth]} 
             Revenue Breakdown
          </h3>

          <div className="flex items-center gap-3 mt-1">
            <p className="text-sm text-slate-500">
              Project contribution for selected month
            </p>

            <span className="px-3 py-1 rounded-full bg-indigo-50 text-indigo-700 text-xs font-bold">
              ₹{selectedMonthRevenue.toLocaleString("en-IN")}
            </span>
          </div>
        </div>

          <button
            onClick={() => setSelectedMonth(null)}
            className="text-sm font-semibold text-indigo-600 hover:text-indigo-800"
          >
            Clear
          </button>
        </div>

        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={projectDrilldown}>
              <CartesianGrid
                strokeDasharray="3 3"
                vertical={false}
                stroke="#e2e8f0"
              />

              <XAxis
                dataKey="project"
                tick={{ fill: "#64748b", fontSize: 12 }}
                axisLine={false}
                tickLine={false}
              />

              <YAxis
                tick={{ fill: "#64748b", fontSize: 12 }}
                axisLine={false}
                tickLine={false}
              />

              <Tooltip
              formatter={(value: number) =>
                [`₹${value.toLocaleString("en-IN")}`, "Revenue"]
              }
              contentStyle={{
                borderRadius: "12px",
                border: "none",
                boxShadow: "0 6px 20px rgba(0,0,0,0.08)",
              }}
            />

              <Bar
                dataKey="revenue"
                radius={[8, 8, 0, 0]}
                fill="#6366f1"
                animationDuration={700}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    )}
  </div>
</div>

      {/* TABLE */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
          <h3 className="text-lg font-bold text-indigo-800">Detailed Billing Ledger</h3>
          <input 
            type="month" 
            className="text-sm border border-slate-200 rounded px-2 py-1 outline-none"
            onChange={(e) => setMonthFilter(e.target.value)}
          />
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="text-cyan-700 text-[14px] uppercase tracking-[0.1em] font-black border-b border-slate-100">
                <th className="px-8 py-5 text-center">Project Details</th>
                <th className="px-8 py-5 text-center">Associate</th>
                <th className="px-8 py-5 text-center">Volume (Hrs)</th>
                <th className="px-8 py-5 text-center">Standard Rate</th>
                <th className="px-8 py-5 text-center">Total Billing</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-sky-50">
              {filtered.map((b) => (
                <tr key={b._id} className="hover:bg-sky-50/80 transition-colors group">
                  <td className="px-8 py-5 font-bold text-slate-700">{b.project_id?.name}</td>
                  <td className="px-8 py-5">
                    <div className="flex items-center justify-center gap-2">
                      <span className="text-slate-700 text-center font-medium">{b.employee_id?.name}</span>
                    </div>
                  </td>
                  <td className="px-8 py-5 text-center font-mono font-bold text-slate-500">{b.total_hours}</td>
                  <td className="px-8 py-5 text-center text-yellow-700 font-medium">₹{b.rate}</td>
                  <td className="px-8 py-5 text-center">
                    <span className="font-black text-indigo-600">₹{b.total_revenue?.toLocaleString("en-IN")}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

/* ---------------- SUB-COMPONENTS ---------------- */
function StatCard({ title, value, icon, trend }: any) {
  return (
    <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
      <div className="flex justify-between items-start mb-4">
        <div className="p-2 bg-slate-50 rounded-lg">{icon}</div>
        {trend !== undefined && (
          <span className={`flex items-center text-xs font-medium ${trend >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
            {trend >= 0 ? <TrendingUp className="w-3 h-3 mr-1"/> : <TrendingDown className="w-3 h-3 mr-1"/>}
            {Math.abs(trend).toFixed(1)}%
          </span>
        )}
      </div>
      <p className="text-sm text-slate-500 font-medium">{title}</p>
      <h4 className="text-2xl font-bold mt-1">{value}</h4>
    </div>
  );
}