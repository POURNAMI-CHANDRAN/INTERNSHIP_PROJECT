import { useEffect, useState, useMemo, useCallback } from "react";
import axios from "axios";
import { 
  TrendingUp, 
  TrendingDown, 
  Clock, 
  Users, 
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
  Tooltip,
  Legend,
  Filler,
} from "chart.js";
import { Bar, Doughnut, Line } from "react-chartjs-2";

ChartJS.register(
  ArcElement, CategoryScale, LinearScale, BarElement, 
  LineElement, PointElement, Tooltip, Legend, Filler
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
    total_hours: b.total_hours || b.story_points_completed || 0,
    rate: b.rate_per_hour || b.billing_rate_per_point || 0,
  };
};

const CHART_COLORS = ["#3b82f6", "#8b5cf6", "#ec4899", "#10b981", "#f59e0b"];

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
  const currentRevenue = billingData.filter(b => b.month === currentMonth && b.year === currentYear).reduce((s, b) => s + (b.total_revenue || 0), 0);
  const prevRevenue = billingData.filter(b => b.month === (currentMonth === 1 ? 12 : currentMonth - 1)).reduce((s, b) => s + (b.total_revenue || 0), 0);
  const growth = prevRevenue === 0 ? 100 : ((currentRevenue - prevRevenue) / prevRevenue) * 100;

  /* ---------------- CHART DATA ---------------- */
  const commonOptions = { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'bottom' as const } } };

  const revenueByProject = {
    labels: projects.map(p => p.name),
    datasets: [{
      label: "Revenue (₹)",
      data: projects.map(p => filtered.filter(b => b.project_id?._id === p._id).reduce((s, b) => s + (b.total_revenue || 0), 0)),
      backgroundColor: "#3b82f6",
      borderRadius: 6,
    }]
  };

  const monthlyTrend = {
    labels: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"],
    datasets: [{
      fill: true,
      label: "Monthly Revenue",
      data: Array.from({ length: 12 }).map((_, i) => filtered.filter(b => b.month === i + 1).reduce((s, b) => s + (b.total_revenue || 0), 0)),
      borderColor: "#8b5cf6",
      backgroundColor: "rgba(139, 92, 246, 0.1)",
      tension: 0.4,
    }]
  };

  if (loading) return <div className="flex h-screen items-center justify-center text-slate-500 animate-pulse">Loading Dashboard...</div>;

  return (
    <div className="min-h-screen bg-slate-50 p-8 font-sans text-slate-900">
      {/* HEADER */}
      <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Financial Overview</h1>
          <p className="text-slate-500">Monitor your project billing and employee performance.</p>
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
        <StatCard title="Avg. Hourly Rate" value={`₹${(totalRevenue / totalHours || 0).toFixed(0)}`} icon={<TrendingUp className="text-pink-600"/>} />
      </div>

      {/* MAIN CHARTS */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <div className="lg:col-span-2 bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <h3 className="font-semibold mb-4">Revenue Trend</h3>
          <div className="h-64"><Line data={monthlyTrend} options={commonOptions} /></div>
        </div>
      </div>

      {/* TABLE */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
          <h3 className="font-semibold">Recent Billing Entries</h3>
          <input 
            type="month" 
            className="text-sm border border-slate-200 rounded px-2 py-1 outline-none"
            onChange={(e) => setMonthFilter(e.target.value)}
          />
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-500 uppercase text-[11px] font-bold">
              <tr>
                <th className="px-6 py-4">Project</th>
                <th className="px-6 py-4">Employee</th>
                <th className="px-6 py-4 text-center">Hours</th>
                <th className="px-6 py-4 text-right">Rate</th>
                <th className="px-6 py-4 text-right">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((b) => (
                <tr key={b._id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4 font-medium">{b.project_id?.name}</td>
                  <td className="px-6 py-4 text-slate-600">{b.employee_id?.name}</td>
                  <td className="px-6 py-4 text-center">{b.total_hours}</td>
                  <td className="px-6 py-4 text-right text-slate-500">₹{b.rate}</td>
                  <td className="px-6 py-4 text-right font-semibold text-blue-600">₹{b.total_revenue?.toLocaleString("en-IN")}</td>
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