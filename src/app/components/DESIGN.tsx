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
  RefreshCcw,
  Download,
  Trophy,
  Filter,
  ChevronRight,
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

import { Doughnut, Line } from "react-chartjs-2";

ChartJS.register(
  ArcElement,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Tooltip,
  Legend,
  Filler
);

/* ================= HELPERS ================= */

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

const CHART_COLORS = [
  "rgba(99, 102, 241, 0.8)",  // Indigo
  "rgba(16, 185, 129, 0.8)",  // Emerald
  "rgba(245, 158, 11, 0.8)",  // Amber
  "rgba(239, 68, 68, 0.8)",   // Rose
  "rgba(139, 92, 246, 0.8)",  // Violet
  "rgba(6, 182, 212, 0.8)",   // Cyan
];

export default function PremiumBillingDashboard() {
  const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";
  const token = localStorage.getItem("token");

  const headers = useMemo(() => ({
    Authorization: `Bearer ${token || ""}`,
  }), [token]);

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

  /* ================= CALCULATIONS ================= */
  const totalRevenue = useMemo(() => filtered.reduce((s, b) => s + (b.total_revenue || 0), 0), [filtered]);
  const totalHours = useMemo(() => filtered.reduce((s, b) => s + (b.total_hours || 0), 0), [filtered]);
  const currentMonth = new Date().getMonth() + 1;
  const currentYear = new Date().getFullYear();

  const currentRevenue = billingData.filter(b => b.month === currentMonth && b.year === currentYear).reduce((s, b) => s + (b.total_revenue || 0), 0);
  const prevRevenue = billingData.filter(b => {
    const prevMonth = currentMonth === 1 ? 12 : currentMonth - 1;
    return b.month === prevMonth && b.year === (currentMonth === 1 ? currentYear - 1 : currentYear);
  }).reduce((s, b) => s + (b.total_revenue || 0), 0);

  const growth = prevRevenue === 0 ? 100 : ((currentRevenue - prevRevenue) / prevRevenue) * 100;
  const avgRate = totalRevenue / (totalHours || 1);
  const avgHoursPerEmployee = totalHours / (employees.length || 1);

  const topEmployees = Object.values(
    filtered.reduce((acc: any, b) => {
      const name = b.employee_id?.name || "Unknown";
      if (!acc[name]) acc[name] = { name, revenue: 0, hours: 0 };
      acc[name].revenue += b.total_revenue || 0;
      acc[name].hours += b.total_hours || 0;
      return acc;
    }, {})
  ).sort((a: any, b: any) => b.revenue - a.revenue);

  /* ================= CHARTS ================= */
  const commonOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: "#1e293b",
        padding: 12,
        titleFont: { size: 14, weight: 'bold' as const },
        bodyFont: { size: 13 },
        cornerRadius: 8,
      }
    },
    scales: {
      y: { grid: { display: true, color: "rgba(0,0,0,0.04)" }, border: { display: false } },
      x: { grid: { display: false } }
    }
  };

  const monthlyTrend = {
    labels: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"],
    datasets: [{
      fill: true,
      label: "Revenue",
      data: Array.from({ length: 12 }).map((_, i) =>
        filtered.filter(b => b.month === i + 1 && b.year === currentYear).reduce((s, b) => s + (b.total_revenue || 0), 0)
      ),
      borderColor: "#6366f1",
      backgroundColor: "rgba(99, 102, 241, 0.1)",
      tension: 0.4,
      pointRadius: 4,
      pointBackgroundColor: "#fff",
      pointBorderWidth: 2,
    }],
  };

  if (loading) return (
    <div className="min-h-screen bg-slate-50 p-8 flex flex-col gap-6">
      <div className="flex justify-between items-center mb-4 animate-pulse">
        <div className="h-10 w-48 bg-slate-200 rounded-lg" />
        <div className="h-10 w-96 bg-slate-200 rounded-lg" />
      </div>
      <div className="grid grid-cols-5 gap-6">
        {[1, 2, 3, 4, 5].map(i => <div key={i} className="h-32 bg-white rounded-2xl animate-pulse shadow-sm" />)}
      </div>
      <div className="h-96 bg-white rounded-2xl animate-pulse shadow-sm" />
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50/50 p-6 lg:p-10 font-sans text-slate-900 selection:bg-indigo-100">
      
      {/* HEADER SECTION */}
      <header className="mb-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl font-black text-slate-800 tracking-tight flex items-center gap-3">
            <div className="h-10 w-2 bg-indigo-600 rounded-full" />
            Billing <span className="text-indigo-600">Intelligence</span>
          </h1>
          <p className="text-slate-500 font-medium mt-2">Real-time financial performance & utilization tracking.</p>
        </div>

        <div className="flex flex-wrap items-center gap-3 bg-white p-2 rounded-2xl shadow-sm border border-slate-200/60">
          <div className="relative group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4 group-focus-within:text-indigo-500 transition-colors" />
            <input
              className="pl-9 pr-4 py-2 border-none rounded-xl outline-none bg-slate-50 w-48 lg:w-64 text-sm focus:ring-2 focus:ring-indigo-500/20 transition-all"
              placeholder="Search employee or project..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          
          <div className="h-6 w-px bg-slate-200 mx-1" />

          <select
            value={projectFilter}
            onChange={(e) => setProjectFilter(e.target.value)}
            className="px-3 py-2 text-sm border-none bg-transparent font-semibold text-slate-600 outline-none cursor-pointer hover:text-indigo-600 transition-colors"
          >
            <option value="All">All Projects</option>
            {projects.map((p) => <option key={p._id} value={p._id}>{p.name}</option>)}
          </select>

          <button
            onClick={() => { setSearch(""); setProjectFilter("All"); setMonthFilter("All"); }}
            className="p-2 hover:bg-slate-100 rounded-xl transition-colors text-slate-400 hover:text-slate-600"
          >
            <RefreshCcw size={18} />
          </button>

          <button
            onClick={() => {}} // Export Logic
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold rounded-xl transition-all shadow-lg shadow-indigo-200"
          >
            <Download size={16} />
            Export Report
          </button>
        </div>
      </header>

      {/* KPI GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-6 mb-10">
        <StatCard title="Gross Revenue" value={`₹${totalRevenue.toLocaleString("en-IN")}`} icon={<DollarSign className="text-indigo-600" />} trend={growth} />
        <StatCard title="Billable Hours" value={`${totalHours.toLocaleString()}h`} icon={<Clock className="text-emerald-600" />} />
        <StatCard title="Active Projects" value={projects.length} icon={<Briefcase className="text-amber-600" />} />
        <StatCard title="Hourly Efficiency" value={`₹${avgRate.toFixed(0)}`} icon={<TrendingUp className="text-violet-600" />} />
        <StatCard title="Team Utilization" value={`${avgHoursPerEmployee.toFixed(1)}h`} icon={<Users className="text-rose-600" />} />
      </div>

      {/* CHARTS & INSIGHTS */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8 mb-10">
        <div className="xl:col-span-2 bg-white rounded-3xl border border-slate-200 p-8 shadow-sm">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-xl font-bold text-slate-800">Revenue Performance</h3>
            <div className="flex gap-4 text-xs font-bold uppercase tracking-wider text-slate-400">
              <span className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-indigo-500" /> Current Year</span>
            </div>
          </div>
          <div className="h-80">
            <Line data={monthlyTrend} options={commonOptions} />
          </div>
        </div>

        <div className="bg-white rounded-3xl border border-slate-200 p-8 shadow-sm flex flex-col">
          <h3 className="text-xl font-bold text-slate-800 mb-8">Top Contributors</h3>
          <div className="space-y-6 flex-1 overflow-auto pr-2">
            {topEmployees.slice(0, 5).map((emp: any, idx) => (
              <div key={emp.name} className="flex items-center justify-between group cursor-default">
                <div className="flex items-center gap-4">
                  <div className={`h-10 w-10 rounded-xl flex items-center justify-center font-bold text-sm ${idx === 0 ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-500'}`}>
                    {idx + 1}
                  </div>
                  <div>
                    <p className="font-bold text-slate-700 group-hover:text-indigo-600 transition-colors">{emp.name}</p>
                    <p className="text-xs font-semibold text-slate-400 uppercase tracking-tighter">{emp.hours} Billable Hours</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-black text-slate-800">₹{emp.revenue.toLocaleString("en-IN")}</p>
                </div>
              </div>
            ))}
          </div>
          <button className="mt-8 w-full py-3 bg-slate-50 hover:bg-indigo-50 text-slate-500 hover:text-indigo-600 rounded-2xl text-sm font-bold transition-all flex items-center justify-center gap-2">
            View All Staff <ChevronRight size={16} />
          </button>
        </div>
      </div>

      {/* TABLE SECTION */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-8 py-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <h3 className="text-lg font-bold text-slate-800">Detailed Billing Ledger</h3>
          <span className="px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full text-xs font-bold">
            {filtered.length} Entries Found
          </span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="text-slate-400 text-[11px] uppercase tracking-[0.1em] font-black border-b border-slate-100">
                <th className="px-8 py-5 text-left">Project details</th>
                <th className="px-8 py-5 text-left">Associate</th>
                <th className="px-8 py-5 text-center">Volume (Hrs)</th>
                <th className="px-8 py-5 text-right">Standard Rate</th>
                <th className="px-8 py-5 text-right">Total Billing</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filtered.map((b) => (
                <tr key={b._id} className="hover:bg-slate-50/80 transition-colors group">
                  <td className="px-8 py-5 font-bold text-slate-700">{b.project_id?.name}</td>
                  <td className="px-8 py-5">
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-2 rounded-full bg-emerald-400" />
                      <span className="text-slate-600 font-medium">{b.employee_id?.name}</span>
                    </div>
                  </td>
                  <td className="px-8 py-5 text-center font-mono font-bold text-slate-500">{b.total_hours}</td>
                  <td className="px-8 py-5 text-right text-slate-400 font-medium">₹{b.rate}</td>
                  <td className="px-8 py-5 text-right">
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

/* ================= KPI CARD COMPONENT ================= */
function StatCard({ title, value, icon, trend }: any) {
  return (
    <div className="bg-white p-7 rounded-[2rem] border border-slate-200 shadow-sm hover:shadow-xl hover:shadow-indigo-500/5 hover:-translate-y-1 transition-all duration-300">
      <div className="flex justify-between items-start mb-6">
        <div className="p-3 bg-slate-50 rounded-2xl group-hover:bg-indigo-50 transition-colors">
          {icon}
        </div>
        {trend !== undefined && (
          <div className={`flex items-center px-2.5 py-1 rounded-lg text-[11px] font-black tracking-wider uppercase ${trend >= 0 ? "bg-emerald-50 text-emerald-600" : "bg-rose-50 text-rose-600"}`}>
            {trend >= 0 ? <TrendingUp size={12} className="mr-1" /> : <TrendingDown size={12} className="mr-1" />}
            {Math.abs(trend).toFixed(1)}%
          </div>
        )}
      </div>
      <p className="text-xs font-bold text-slate-400 uppercase tracking-widest leading-none mb-2">{title}</p>
      <h4 className="text-3xl font-black text-slate-800 tracking-tight">{value}</h4>
    </div>
  );
}



