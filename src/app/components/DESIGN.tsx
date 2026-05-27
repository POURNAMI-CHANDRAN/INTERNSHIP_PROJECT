import { useEffect, useMemo, useState } from "react";
import {
  Users,
  Search,
  TrendingUpDown,
  Download,
  Clock3,
  User,
  Mail,
  SlidersHorizontal,
  FolderKanban,
  CheckCircle2,
  Loader2,
  ChevronDown,
} from "lucide-react";

import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from "recharts";
import { motion, AnimatePresence } from "framer-motion";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

/* =========================================================
   TYPES & CONSTANTS
========================================================= */
const MONTHLY_CAPACITY = 160;

type EmployeeStatus = "Fully Bench" | "Partial Bench" | "Fully Utilized" | "Overallocated";

interface StatusConfig {
  color: string;
  text: string;
  dot: string;
  bg: string;
  border: string;
}

const STATUS_THEMES: Record<EmployeeStatus, StatusConfig> = {
  "Fully Bench": {
    color: "#ef4444",
    text: "text-rose-700",
    dot: "bg-rose-500",
    bg: "bg-rose-50/60",
    border: "border-rose-100",
  },
  "Partial Bench": {
    color: "#f59e0b",
    text: "text-amber-700",
    dot: "bg-amber-500",
    bg: "bg-amber-50/60",
    border: "border-amber-100",
  },
  "Fully Utilized": {
    color: "#10b981",
    text: "text-emerald-700",
    dot: "bg-emerald-500",
    bg: "bg-emerald-50/60",
    border: "border-emerald-100",
  },
  "Overallocated": {
    color: "#7c3aed",
    text: "text-violet-700",
    dot: "bg-violet-500",
    bg: "bg-violet-50/60",
    border: "border-violet-100",
  },
};

/* =========================================================
   HELPERS
========================================================= */
function getEmployeeStatus(billableHours: number): EmployeeStatus {
  const h = Math.round(billableHours * 100) / 100;
  if (h === 0) return "Fully Bench";
  if (h > 0 && h < MONTHLY_CAPACITY) return "Partial Bench";
  if (Math.abs(h - MONTHLY_CAPACITY) < 0.01) return "Fully Utilized";
  return "Overallocated";
}

function formatMonth(month: number): string {
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  return months[month - 1] || "";
}

/* =========================================================
   MAIN DASHBOARD COMPONENT
========================================================= */
export default function PremiumBenchManagement() {
  const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

  const [loading, setLoading] = useState(true);
  const [benchData, setBenchData] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [roleFilter, setRoleFilter] = useState("All");
  const [sortBy, setSortBy] = useState("bench");
  const [selectedEmployee, setSelectedEmployee] = useState<any | null>(null);

  useEffect(() => {
    fetchBenchData();
  }, []);

  const fetchBenchData = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE}/api/bench`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });
      const data = await res.json();

      const formatted = data.map((item: any) => {
        const totalHours = item.totalAllocation || 0;
        const billableHours = item.billableAllocation || 0;
        const nonBillableHours = totalHours - billableHours;

        const totalFTE = Number((totalHours / MONTHLY_CAPACITY).toFixed(2));
        const billableFTE = Number((billableHours / MONTHLY_CAPACITY).toFixed(2));
        const nonBillableFTE = Number((nonBillableHours / MONTHLY_CAPACITY).toFixed(2));
        const utilization = Number(((billableHours / MONTHLY_CAPACITY) * 100).toFixed(1));

        const benchHours = Math.max(0, MONTHLY_CAPACITY - billableHours);
        const benchFTE = Number((benchHours / MONTHLY_CAPACITY).toFixed(2));
        const status = getEmployeeStatus(billableHours);

        const monthlyForecast = (item.monthlyBench || []).map((m: any) => {
          const mTotalHours = m.totalAllocation || 0;
          const mBillableHours = m.billableHours || 0;
          const mBenchHours = Math.max(0, MONTHLY_CAPACITY - mBillableHours);

          return {
            ...m,
            totalHours: mTotalHours,
            billableHours: mBillableHours,
            nonBillableHours: mTotalHours - mBillableHours,
            totalFTE: Number((mTotalHours / MONTHLY_CAPACITY).toFixed(2)),
            billableFTE: Number((mBillableHours / MONTHLY_CAPACITY).toFixed(2)),
            benchHours: mBenchHours,
            benchFTE: Number((mBenchHours / MONTHLY_CAPACITY).toFixed(2)),
            utilization: Number(((mBillableHours / MONTHLY_CAPACITY) * 100).toFixed(1)),
            status: getEmployeeStatus(mBillableHours),
          };
        });

        return {
          ...item,
          totalHours,
          billableHours,
          nonBillableHours,
          totalFTE,
          billableFTE,
          nonBillableFTE,
          utilization,
          benchHours,
          benchFTE,
          status,
          monthlyForecast,
        };
      });

      setBenchData(formatted);
    } catch (err) {
      console.error("Error loading workforce engine data:", err);
    } finally {
      setLoading(false);
    }
  };

  /* =========================================================
     COMPUTED STATS
  ========================================================= */
  const stats = useMemo(() => {
    const total = benchData.length;
    const billable = benchData.filter((e) => e.status === "Fully Utilized" || e.status === "Overallocated").length;
    const partial = benchData.filter((e) => e.status === "Partial Bench").length;
    const bench = benchData.filter((e) => e.status === "Fully Bench").length;

    return {
      total,
      billable,
      partial,
      bench,
      overallFTE: benchData.reduce((a, c) => a + (c.totalFTE || 0), 0),
      benchFTE: benchData.reduce((a, c) => a + (c.benchFTE || 0), 0),
      billableFTE: benchData.reduce((a, c) => a + (c.billableFTE || 0), 0),
    };
  }, [benchData]);

  /* =========================================================
     FILTERED & SORTED DATA
  ========================================================= */
  const filteredData = useMemo(() => {
    let data = benchData.filter((item) => {
      const employee = item.employee;
      const text = `${employee.name} ${employee.email} ${employee.employeeId} ${employee.roleId?.name || ""}`.toLowerCase();
      
      const matchesSearch = text.includes(search.toLowerCase());
      const matchesStatus = statusFilter === "All" || item.status === statusFilter;
      const matchesRole = roleFilter === "All" || (employee.roleId?.name || "Unassigned") === roleFilter;

      return matchesSearch && matchesStatus && matchesRole;
    });

    data.sort((a, b) => {
      if (sortBy === "name") return a.employee.name.localeCompare(b.employee.name);
      if (sortBy === "fte") return b.totalFTE - a.totalFTE;
      return b.benchHours - a.benchHours;
    });

    return data;
  }, [benchData, search, statusFilter, roleFilter, sortBy]);

  const exportReport = () => {
    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.text("Workforce Bench Forecast Report", 14, 20);
    
    autoTable(doc, {
      startY: 30,
      head: [["Employee", "Role", "Billable Hours", "Bench Hours", "Billable FTE", "Status"]],
      body: filteredData.map((item) => [
        item.employee.name,
        item.employee.roleId?.name || "N/A",
        `${item.billableHours}h`,
        `${item.benchHours}h`,
        item.billableFTE,
        item.status,
      ]),
    });
    doc.save("WORKFORCE_BENCH_REPORT.pdf");
  };

  if (loading) return <LoadingScreen />;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 antialiased font-sans">
      
      {/* =====================================================
          HEADER / NAVBAR
      ===================================================== */}
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-slate-200/80 px-6 lg:px-12 py-4">
        <div className="max-w-[1700px] mx-auto flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center gap-3.5">
            <div className="p-2.5 rounded-xl bg-slate-900 text-white shadow-sm">
              <TrendingUpDown size={24} />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-slate-900">Workforce Intelligence Desk</h1>
              <p className="text-xs text-slate-500 font-medium">Real-time resource capacity & future allocation insights</p>
            </div>
          </div>

          <button
            onClick={exportReport}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold shadow-sm transition-all duration-200 group"
          >
            <Download size={14} className="text-slate-400 group-hover:text-white transition-colors" />
            Export Intelligence Ledger
          </button>
        </div>
      </header>

      {/* =====================================================
          MAIN DASHBOARD BODY
      ===================================================== */}
      <div className="max-w-[1700px] mx-auto p-6 lg:p-12 space-y-6">
        
        {/* TOP LEVEL EXECUTIVE STATS CARDS */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-gradient-to-br from-slate-900 to-slate-800 text-white rounded-2xl p-6 shadow-md relative overflow-hidden flex flex-col justify-between h-[140px]">
            <div className="absolute top-0 right-0 p-4 opacity-10 pointer-events-none">
              <Users size={90} />
            </div>
            <p className="text-[10px] uppercase font-bold tracking-widest text-slate-400">Consolidated Billable Load</p>
            <div className="flex items-baseline gap-2 mt-1">
              <h2 className="text-4xl font-black tracking-tight">{stats.billableFTE.toFixed(2)}</h2>
              <span className="text-xs font-semibold text-slate-400">Total FTE</span>
            </div>
            <div className="text-[11px] text-slate-400 font-medium border-t border-slate-700/50 pt-2 flex justify-between">
              <span>Active Talent Payload:</span>
              <span className="text-white font-bold">{stats.total} Heads</span>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 border border-slate-200/60 shadow-sm flex flex-col justify-between h-[140px]">
            <p className="text-[10px] uppercase font-bold tracking-widest text-slate-400">Strategic Bench Capacity</p>
            <div className="flex items-baseline gap-2 mt-1">
              <h2 className="text-4xl font-black tracking-tight text-amber-500">{stats.benchFTE.toFixed(2)}</h2>
              <span className="text-xs font-semibold text-slate-400">FTE Overhead</span>
            </div>
            <div className="text-[11px] text-slate-500 font-medium border-t border-slate-100 pt-2 flex justify-between">
              <span>Partial / Full Bench Ratio:</span>
              <span className="text-slate-900 font-bold">{stats.partial}P / {stats.bench}F</span>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-5 border border-slate-200/60 shadow-sm flex items-center justify-between h-[140px]">
            <div className="space-y-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Saturation</h3>
              <div className="text-2xl font-black text-slate-800">
                {Math.round((stats.billableFTE / (stats.overallFTE || 1)) * 100 || 0)}%
              </div>
              <p className="text-[10px] font-medium text-slate-400 leading-none">Optimal Target window: 85%</p>
            </div>
            <div className="h-full w-[140px] relative flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={[
                      { name: "Utilized", value: stats.billable || 1 },
                      { name: "Partial", value: stats.partial },
                      { name: "Bench", value: stats.bench },
                    ]}
                    dataKey="value"
                    innerRadius={28}
                    outerRadius={44}
                    paddingAngle={2}
                  >
                    <Cell fill="#10b981" stroke="#fff" strokeWidth={1.5} />
                    <Cell fill="#f59e0b" stroke="#fff" strokeWidth={1.5} />
                    <Cell fill="#ef4444" stroke="#fff" strokeWidth={1.5} />
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* =====================================================
            RE-ENGINEERED HORIZONTAL CONTROLS COMPONENT
        ===================================================== */}
        <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm p-4 flex flex-col lg:flex-row items-center justify-between gap-4">
          
          {/* SEARCH FIELD */}
          <div className="w-full lg:max-w-xs relative">
            <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search ID, Name, Email..."
              className="w-full bg-slate-50 border border-slate-200/80 rounded-xl py-2 pl-9 pr-4 text-xs font-medium placeholder:text-slate-400 outline-none focus:bg-white focus:border-slate-400 transition-all"
            />
          </div>

          {/* STATUS SELECTOR TABS */}
          <div className="w-full lg:w-auto overflow-x-auto no-scrollbar flex items-center gap-1.5 bg-slate-100/80 p-1 rounded-xl border border-slate-200/20">
            {["All", "Fully Utilized", "Partial Bench", "Fully Bench", "Overallocated"].map((status) => (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all duration-150 ${
                  statusFilter === status
                    ? "bg-white text-slate-900 shadow-sm font-bold"
                    : "text-slate-500 hover:text-slate-900"
                }`}
              >
                {status === "All" ? "All Operational Statuses" : status}
              </button>
            ))}
          </div>

          {/* RIGHT ALIGNED DROPDOWNS */}
          <div className="w-full lg:w-auto flex flex-col sm:flex-row items-center gap-3 ml-auto">
            {/* ROLE DROPDOWN */}
            <div className="w-full sm:w-48 relative">
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="w-full appearance-none bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 pr-8 text-xs font-semibold text-slate-700 outline-none focus:bg-white focus:border-slate-400 transition-all"
              >
                <option value="All">All Corporate Roles</option>
                {[...new Set(benchData.map((e) => e.employee.roleId?.name || "Unassigned"))].map((role: any) => (
                  <option key={role} value={role}>{role}</option>
                ))}
              </select>
              <ChevronDown size={12} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            </div>

            {/* SORT REGISTER BUTTON CLUSTER */}
            <div className="w-full sm:w-auto flex items-center bg-slate-100 p-1 rounded-xl">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-2 hidden sm:inline">Sort:</span>
              {[
                { id: "bench", label: "Bench" },
                { id: "fte", label: "FTE" },
                { id: "name", label: "Name" }
              ].map((opt) => (
                <button
                  key={opt.id}
                  onClick={() => setSortBy(opt.id)}
                  className={`px-3 py-1.5 rounded-lg text-[10px] font-bold tracking-tight transition-all text-center ${
                    sortBy === opt.id ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-800"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* FULLY VISIBLE DATA LEDGER TABLE */}
        <main>
          <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <div>
                <h2 className="text-sm font-bold text-slate-900">Resource Ledger Registry</h2>
                <p className="text-xs text-slate-400 font-medium">Select any employee record profile block to view forecast analytics dashboards</p>
              </div>
              <span className="px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 text-[10px] font-bold tracking-wider uppercase">
                {filteredData.length} records matched
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-100 text-[10px] font-bold uppercase tracking-wider text-slate-400 bg-white">
                    <th className="px-6 py-4 font-semibold">Employee Particulars</th>
                    <th className="px-6 py-4 font-semibold text-center">Billable Allocation</th>
                    <th className="px-6 py-4 font-semibold text-center">Available Bench Capacity</th>
                    <th className="px-6 py-4 font-semibold text-right">Status Tier</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100/70 text-xs">
                  {filteredData.length > 0 ? (
                    filteredData.map((item) => {
                      const theme = STATUS_THEMES[item.status as EmployeeStatus] || STATUS_THEMES["Fully Bench"];
                      return (
                        <tr
                          key={item.employee._id}
                          onClick={() => setSelectedEmployee(item)}
                          className="hover:bg-slate-50/60 cursor-pointer transition-colors duration-150 group"
                        >
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className="h-9 w-9 rounded-xl bg-slate-100 group-hover:bg-slate-900 group-hover:text-white text-slate-700 font-bold flex items-center justify-center text-sm transition-all duration-200">
                                {item.employee.name.charAt(0)}
                              </div>
                              <div>
                                <p className="font-bold text-slate-900 leading-snug">{item.employee.name}</p>
                                <p className="text-[10px] text-slate-400 font-medium tracking-tight">{item.employee.employeeId} • {item.employee.roleId?.name || "Unassigned"}</p>
                              </div>
                            </div>
                          </td>

                          <td className="px-6 py-4 text-center">
                            <span className="font-bold text-slate-800 block text-sm leading-tight">{item.billableHours}h</span>
                            <span className="text-[10px] text-slate-400 font-medium">{item.billableFTE} FTE Value</span>
                          </td>
                          
                          <td className="px-6 py-4 text-center">
                            <span className={`font-bold block text-sm leading-tight ${item.benchHours > 0 ? "text-amber-600" : "text-slate-400"}`}>
                              {item.benchHours}h
                            </span>
                            <span className="text-[10px] text-slate-400 font-medium">{item.benchFTE} FTE Value</span>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-[10px] font-bold tracking-wide uppercase border ${theme.bg} ${theme.text} ${theme.border}`}>
                              <span className={`h-1.5 w-1.5 rounded-full ${theme.dot}`} />
                              {item.status}
                            </span>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={4} className="px-6 py-16 text-center text-slate-400 font-medium">
                        No resource indexes match your parameters. Change filters to update the viewport grid.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </main>
      </div>

      {/* =====================================================
          PREMIUM EXPANDED SIDE DRAWER
      ===================================================== */}
      <AnimatePresence>
        {selectedEmployee && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedEmployee(null)}
              className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50"
            />

            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 26, stiffness: 220 }}
              className="fixed right-0 top-0 h-full w-full max-w-[540px] bg-white z-[60] shadow-2xl border-l border-slate-200 overflow-y-auto flex flex-col"
            >
              <div className="p-6 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-slate-900 text-white">
                    <User size={18} />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-900">Resource Profile Ledger</h3>
                    <p className="text-xs text-slate-400 font-medium">Detailed allocation & timeline forecasts</p>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedEmployee(null)}
                  className="px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-xs font-bold text-slate-600 transition-all shadow-sm"
                >
                  Dismiss
                </button>
              </div>

              <div className="p-6 space-y-8 flex-1">
                <div className="bg-slate-50 rounded-2xl p-5 border border-slate-200/50 flex flex-col gap-3">
                  <div>
                    <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 px-2 py-0.5 rounded bg-slate-200/60 inline-block mb-1.5">
                      {selectedEmployee.employee.roleId?.name || "Corporate Domain Unassigned"}
                    </span>
                    <h2 className="text-xl font-black tracking-tight text-slate-900">{selectedEmployee.employee.name}</h2>
                  </div>

                  <div className="space-y-1 text-xs font-semibold text-slate-500 pt-2 border-t border-slate-200/60">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 size={13} className="text-slate-400" />
                      <span>Registry ID: <strong className="text-slate-700">{selectedEmployee.employee.employeeId}</strong></span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Mail size={13} className="text-slate-400" />
                      <span>Contact: <strong className="text-slate-700">{selectedEmployee.employee.email}</strong></span>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Current Window Capacity Metrics</h4>
                  <div className="grid grid-cols-2 gap-3">
                    <MetricCard title="Billable Allocation" value={`${selectedEmployee.billableHours} Hours`} sub={`${selectedEmployee.billableFTE} FTE Value`} />
                    <MetricCard title="Bench Overhead" value={`${selectedEmployee.benchHours} Hours`} sub={`${selectedEmployee.benchFTE} FTE Value`} highlight={selectedEmployee.benchHours > 0} />
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
                    <Clock3 size={15} className="text-slate-400" />
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">Strategic Monthly Horizon Forecast</h4>
                  </div>

                  <div className="space-y-3">
                    {selectedEmployee.monthlyForecast && selectedEmployee.monthlyForecast.length > 0 ? (
                      selectedEmployee.monthlyForecast
                        .sort((a: any, b: any) => new Date(a.year, a.month).getTime() - new Date(b.year, b.month).getTime())
                        .map((month: any) => {
                          const mTheme = STATUS_THEMES[month.status as EmployeeStatus] || STATUS_THEMES["Fully Bench"];
                          return (
                            <div key={`${month.month}-${month.year}`} className={`rounded-xl border p-4 transition-all bg-white shadow-sm hover:shadow-md/50 ${mTheme.border}`}>
                              <div className="flex justify-between items-start border-b border-slate-100 pb-2.5 mb-3">
                                <div>
                                  <h5 className="font-bold text-slate-900 text-sm leading-none">{formatMonth(month.month)} {month.year}</h5>
                                  <span className="text-[10px] text-slate-400 font-medium">Predictive Cycle State</span>
                                </div>
                                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[9px] font-bold tracking-wide uppercase border ${mTheme.bg} ${mTheme.text}`}>
                                  {month.status}
                                </span>
                              </div>

                              <div className="grid grid-cols-2 gap-y-2 gap-x-4 text-xs">
                                <div className="flex justify-between py-0.5 border-b border-slate-50">
                                  <span className="text-slate-400 font-medium">Billable Allocation:</span>
                                  <span className="font-bold text-slate-800">{month.billableHours}h ({month.billableFTE} FTE)</span>
                                </div>
                                <div className="flex justify-between py-0.5 border-b border-slate-50">
                                  <span className="text-slate-400 font-medium">Bench Capacity:</span>
                                  <span className={`font-bold ${month.benchHours > 0 ? "text-amber-600" : "text-slate-700"}`}>{month.benchHours}h ({month.benchFTE} FTE)</span>
                                </div>
                              </div>

                              <div className="mt-3.5 pt-2.5 border-t border-slate-100">
                                <p className="text-[10px] uppercase font-bold tracking-wider text-slate-400 mb-2 flex items-center gap-1">
                                  <FolderKanban size={11} /> Project Task Loadout
                                </p>
                                <div className="flex flex-wrap gap-1.5">
                                  {month.projects && month.projects.length > 0 ? (
                                    month.projects.map((p: any) => (
                                      <span
                                        key={p._id}
                                        className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded-md border ${
                                          p.billable 
                                            ? "bg-emerald-50 text-emerald-800 border-emerald-100" 
                                            : "bg-amber-50 text-amber-800 border-amber-100"
                                        }`}
                                      >
                                        {p.name} • {p.allocatedHours}h
                                      </span>
                                    ))
                                  ) : (
                                    <span className="text-[10px] text-slate-400 italic font-medium">No system allocations committed to this execution window.</span>
                                  )}
                                </div>
                              </div>
                            </div>
                          );
                        })
                    ) : (
                      <p className="text-xs text-slate-400 italic font-medium">No forward forecast logs found for this candidate.</p>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

/* =========================================================
   SUB-COMPONENTS (PREMIUM LOOK)
========================================================= */
function LoadingScreen() {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center gap-3">
      <Loader2 size={32} className="animate-spin text-slate-900" />
      <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest animate-pulse">Syncing Engine Records...</p>
    </div>
  );
}

interface MetricCardProps {
  title: string;
  value: string;
  sub: string;
  highlight?: boolean;
}

function MetricCard({ title, value, sub, highlight = false }: MetricCardProps) {
  return (
    <div className={`p-4 rounded-xl border transition-all ${highlight ? "bg-amber-50/40 border-amber-200/80" : "bg-white border-slate-200/60"} shadow-sm`}>
      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{title}</p>
      <p className={`text-lg font-extrabold tracking-tight mt-1 ${highlight ? "text-amber-700" : "text-slate-900"}`}>{value}</p>
      <p className="text-[10px] text-slate-400 font-medium mt-0.5">{sub}</p>
    </div>
  );
}