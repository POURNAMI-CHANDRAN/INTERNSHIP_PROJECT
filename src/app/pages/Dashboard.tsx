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
import { 
  Users, 
  Briefcase, 
  TrendingUp, 
  AlertCircle, 
  Calendar,
  LayoutDashboard,
  PieChart as PieIcon
} from "lucide-react"; 

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
  year: number;
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

// const COLORS = ["#6366f1", "#8b5cf6", "#ec4899", "#f43f5e"];
const AREA_GRADIENT = "url(#colorRevenue)";
const PIECOLORS = {
          Billable: "#A855F7",
          "Non-Billable": "#09a5bd",
          Bench: "#94A3B8",
          Contract: "#FACC15"};

const COLOR_ARRAY = ["#6366f1", "#94a3b8", "#f59e0b", "#10b981", "#ec4899"];
/* ================= COMPONENT ================= */

export default function Dashboard() {
  const [data, setData] = useState<DashboardResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [year, setYear] = useState(new Date().getFullYear());

  useEffect(() => {
    setLoading(true);
    fetch(`http://localhost:5000/api/analytics/dashboard?month=${month}&year=${year}`)
      .then((res) => res.json())
      .then((res) => {
        setData(res.data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [month, year]);

  const kpis = data?.kpis;
  const charts = data?.charts;
useEffect(() => {
  console.log("YEAR:", year);
  console.log("FILTERED:", revenueTrend);
  console.log("ALL:", charts?.revenueTrend);
}, [year, charts]);
  const revenueByProject = data?.revenueByProject || [];

  const allocationData = useMemo(() =>
    (charts?.projectAllocation || [])
      .map((p) => ({
        project: p.project ?? "Unknown",
        hours: p.hours ?? 0,
      }))
      .sort((a, b) => b.hours - a.hours)  
  , [charts]);

  const billableVsNon = useMemo(() => charts?.billableVsNonBillable || [], [charts]);
  const revenueTrend = useMemo(() => {
    return (charts?.revenueTrend || []).map((item) => {
      const [month, itemYear] = item.period.split("/");

      return {
        ...item,
        month: Number(month),
        parsedYear: Number(itemYear),
      };
    }).filter((item) => item.parsedYear === year);
  }, [charts, year]);

  const total = billableVsNon.reduce((s, d) => s + (d.value || 0), 0);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600 mb-4"></div>
        <p className="text-slate-600 font-medium animate-pulse">Synchronizing Intelligence...</p>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50">
        <div className="bg-white p-8 rounded-2xl shadow-xl text-center max-w-sm">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-slate-800">Connection Failed</h2>
          <p className="text-gray-800 mt-2">We couldn't retrieve the analytics data. Please check your connection.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 bg-white min-h-screen font-sans text-slate-900">
      {/* HEADER SECTION */}
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
          <div className="flex items-center gap-4">

          {/* ICON BOX */}
          <div className="bg-sky-600 p-2.5 rounded-xl shadow-lg shadow-sky-200">
            <LayoutDashboard className="text-white" size={28} />
          </div>

          {/* TEXT BLOCK */}
          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              Executive <span className="text-sky-600">Insights</span>
            </h1>

          <p className="text-slate-600 font-medium">Real-time resource and revenue performance</p>
          </div>
        </div>

        <div className="flex gap-3 bg-white p-1.5 rounded-xl shadow-sm border border-slate-200">
          <div className="flex items-center px-3 text-slate-400">
            <Calendar size={18} />
          </div>
          <select
            value={month}
            onChange={(e) => setMonth(Number(e.target.value))}
            className="bg-transparent font-semibold py-2 outline-none cursor-pointer text-slate-700"
          >
            {Array.from({ length: 12 }, (_, i) => (
              <option key={i + 1} value={i + 1}>
                {new Date(0, i).toLocaleString('default', { month: 'long' })}
              </option>
            ))}
          </select>

          <div className="w-px bg-slate-200 my-1 mx-1"></div>
          <select
            value={year}
            onChange={(e) => setYear(Number(e.target.value))}
            className="bg-transparent font-semibold py-2 pr-4 outline-none cursor-pointer text-slate-700"
          >
            {[2024, 2025, 2026].map((y) => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
        </div>
      </div>

      {/* KPI CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card title="Head Count" value={kpis?.totalEmployees} icon={<Users className="text-indigo-600" size={20}/>} trend="+2% vs last mo" />
        <Card title="Billable Talent" value={kpis?.billableEmployees} icon={<Briefcase className="text-emerald-600" size={20}/>} />
        <Card title="Available Bench" value={kpis?.nonBillableEmployees} icon={<PieIcon className="text-amber-600" size={20}/>} />
        <Card title="Utilization" value={`${kpis?.utilizationPct}%`} icon={<TrendingUp className="text-fuchsia-600" size={20}/>} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
        {/* REVENUE TREND - EXPANDED */}
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-bold">
              Revenue Growth Trend
            </h2>

            <span className="text-xs font-bold uppercase tracking-wider text-amber-800">
              Monthly Billable Hours ({year})
            </span>
          </div>

          <ResponsiveContainer width="100%" height={320}>
            <AreaChart data={revenueTrend}>

              <defs>
                <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                </linearGradient>
              </defs>

              <CartesianGrid
                strokeDasharray="3 3"
                vertical={false}
                stroke="#f1f5f9"
              />

              <XAxis
                dataKey="period"
                axisLine={false}
                tickLine={false}
                tick={{
                  fill: "#111827",
                  fontSize: 12,
                  fontWeight: 600,
                }}
                dy={10}
              />

              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{
                  fill: "#111827",
                  fontSize: 12,
                  fontWeight: 600,
                }}
              />

              <Tooltip
                formatter={(value) => [`${value} hrs`, "Billable Hours"]}
                contentStyle={{
                  backgroundColor: "rgba(255,255,255,0.9)",
                  backdropFilter: "blur(8px)",
                  borderRadius: "12px",
                  border: "1px solid #e5e7eb",
                }}
                labelStyle={{
                  color: "#9502ba",
                  fontWeight: "bold",
                }}
                itemStyle={{
                  color: "#8183f7",
                  fontWeight: "bold",
                }}
              />

              <Area
                type="monotone"
                dataKey="billableHours"
                name="Billable Hours"
                stroke="#6366f1"
                strokeWidth={3}
                fillOpacity={1}
                fill={AREA_GRADIENT}
                animationDuration={800}
              />

            </AreaChart>
          </ResponsiveContainer>

          {revenueTrend.length === 0 && (
            <div className="text-center text-slate-500 text-sm mt-4">
              No Revenue Trend Data Available for {year}
            </div>
          )}
        </div>

        {/* PIE CHART */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 space-y-6">

          <div className={`p-5 rounded-2xl border flex items-start gap-4 transition-all ${
            data.forecasts.benchForecast.riskLevel === 'HIGH' 
              ? 'bg-rose-50 border-rose-200'
              : 'bg-indigo-50 border-indigo-200'
          }`}>
            
            {/* ICON */}
            <div className={`p-3 rounded-xl ${
              data.forecasts.benchForecast.riskLevel === 'HIGH'
                ? 'bg-rose-500'
                : 'bg-indigo-500'
            } text-white shadow-sm`}>
              <AlertCircle size={20} />
            </div>

            {/* CONTENT */}
            <div className="flex-1">
              <p className="text-xs uppercase tracking-wider text-slate-800 font-extrabold">
                Bench Forecast
              </p>

              <p className="mt-1 text-sm text-slate-600">
                {data.forecasts.benchForecast.current} employees unassigned
              </p>

              <div className="mt-3 flex items-center justify-between">
                <span className={`text-xs font-bold uppercase px-3 py-1 rounded-full ${
                  data.forecasts.benchForecast.riskLevel === 'HIGH'
                    ? 'bg-rose-200 text-rose-700'
                    : 'bg-indigo-200 text-indigo-700'
                }`}>
                  {data.forecasts.benchForecast.riskLevel} RISK
                </span>
              </div>
            </div>
          </div>

          <h2 className="text-lg font-bold mb-6 text-slate-800 tracking-tight">Workforce Mix</h2>

          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={billableVsNon}
                innerRadius={75}
                outerRadius={100}
                paddingAngle={3}
                cornerRadius={10}
                stroke="none" 
                dataKey="value"
                nameKey="name"
                animationDuration={800}
                animationBegin={200}
              >
                {billableVsNon.map((entry, i) => (
                <Cell
                  key={`cell-${i}`}
                  fill={PIECOLORS[entry.name as keyof typeof PIECOLORS] || COLOR_ARRAY[i % COLOR_ARRAY.length]} 
                  style={{
                    transition: "all 0.25s ease",
                    cursor: "pointer"
                  }}
                />
                ))}
              </Pie>

              {/* CENTER SUMMARY */}
              <text
                x="50%"
                y="45%"
                textAnchor="middle"
                dominantBaseline="middle"
                className="fill-slate-800 text-[10px] font-semibold uppercase tracking-widest"
              >
                TOTAL HEADCOUNT
              </text>

              <text
                x="50%"
                y="58%"
                textAnchor="middle"
                dominantBaseline="middle"
                className="fill-slate-900 text-3xl font-extrabold"
              >
                {total}
              </text>

              <Tooltip
                contentStyle={{
                  backgroundColor: "rgba(255,255,255,0.95)",
                  backdropFilter: "blur(10px)",
                  borderRadius: "14px",
                  border: "1px solid #e5e7eb",
                  padding: "12px"
                }}
                itemStyle={{
                  fontSize: "14px",
                  fontWeight: 600,
                  color: "#111827"
                }}
                labelStyle={{
                  display: "none"   
                }}
              />

              <Legend
                verticalAlign="bottom"
                iconType="circle"
                iconSize={8}
                wrapperStyle={{ 
                  paddingTop: "20px",
                  fontSize: "12px", 
                  fontWeight: 500,
                  color: "#64748b",
                  textTransform: "uppercase",
                  letterSpacing: "0.05em"
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
        </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* REVENUE TABLE */}
        <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="p-6 border-b border-slate-50">
            <h2 className="text-lg font-bold">Project P&L Analysis</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50/50 text-sky-800 uppercase text-[14px] font-extrabold tracking-widest">
                  <th className="px-6 py-4 text-center">Project Name</th>
                  <th className="px-6 py-4 text-center">Revenue</th>
                  <th className="px-6 py-4 text-center">Direct Cost</th>
                  <th className="px-6 py-4 text-center">Net Margin</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {revenueByProject.map((p, i) => (
                  <tr key={i} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-6 py-4 font-semibold text-slate-700">{p.project}</td>
                    <td className="px-6 py-4 text-slate-600 text-center">₹{p.revenue.toLocaleString()}</td>
                    <td className="px-6 py-4 text-slate-600 text-center">₹{p.cost.toLocaleString()}</td>
                    <td className={`px-6 py-4 text-center font-bold ${p.margin < 0 ? "text-rose-500" : "text-emerald-600"}`}>
                      {p.margin < 0 ? '-' : '+'}₹{Math.abs(p.margin).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* SIDEBAR: BAR CHART & ALERT */}
        <div className="space-y-8">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
            <h2 className="text-lg font-bold mb-6">Hours per Project</h2>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={allocationData} layout="vertical" margin={{ left: 10, right: 10 }}>
                <XAxis type="number" hide />
                <YAxis
                  dataKey="project"
                  type="category"
                  axisLine={false}
                  tickLine={false}
                  tick={false}
                  width={60}
                  label={{
                    value: "Projects",
                    angle: -90,
                    position: "insideLeft",
                    style: {
                      fill: "#06109c",
                      fontSize: 18,
                      fontWeight: 600,
                      textAnchor: "middle",
                    },
                  }}
                />    
                <Tooltip
                formatter={(value) => [`${value} hrs`, "Hours"]}
                cursor={{ fill: "transparent" }}
                contentStyle={{
                  backgroundColor: "rgba(255,255,255,0.9)",
                  backdropFilter: "blur(8px)",
                  borderRadius: "12px",
                  border: "1px solid #90daf5"
                }}
                labelStyle={{ color: "#9502ba", fontWeight: "bold" }}
                itemStyle={{ color: "#8183f7", fontWeight: "bold" }}
                />
                <defs>
                  <linearGradient id="barGradient" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="#3fc3eb" />
                    <stop offset="100%" stopColor="#8b5cf6" />
                  </linearGradient>
                </defs>

                <Bar
                  dataKey="hours"
                  name={"Hours"}
                  fill="url(#barGradient)"   
                  radius={[0, 8, 8, 0]}
                  barSize={16}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>

        </div>
      </div>
    </div>
  );
}

/* ================= ENHANCED CARD COMPONENT ================= */

function Card({
  title,
  value,
  icon,
  trend
}: {
  title: string;
  value: React.ReactNode;
  icon?: React.ReactNode;
  trend?: string;
}) {
  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow group">
      <div className="flex items-center justify-between mb-4">
        <div className="p-2.5 bg-slate-50 rounded-xl group-hover:bg-white group-hover:ring-1 ring-slate-100 transition-all">
          {icon}
        </div>
        {trend && <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-lg">{trend}</span>}
      </div>
      <p className="text-sky-900 text-bold font-medium">{title}</p>
      <h3 className="text-2xl font-extrabold text-slate-800 mt-1">{value}</h3>
    </div>
  );
}