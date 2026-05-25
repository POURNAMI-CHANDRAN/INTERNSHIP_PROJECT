import { useEffect, useMemo, useState, FC } from "react";
import {
  Search,
  TrendingUpDown,
  Download,
  Clock3,
  AlertCircle,
  Briefcase,
  Users
} from "lucide-react";

import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
} from "recharts";

import { motion, AnimatePresence } from "framer-motion";

import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

/* =========================================================
   TYPES & INTERFACES
========================================================= */

interface Role {
  _id: string;
  name: string;
}

interface Employee {
  _id: string;
  name: string;
  email: string;
  employeeId: string;
  roleId?: Role;
}

interface BackendProject {
  _id: string;
  name: string;
  billable: boolean;
  allocatedHours: number;
}

interface BackendMonthlyForecast {
  month: number;
  year: number;
  totalAllocation?: number;
  billableHours?: number;
  projects?: BackendProject[];
}

interface BackendBenchItem {
  employee: Employee;
  totalAllocation?: number;
  billableAllocation?: number;
  monthlyBench?: BackendMonthlyForecast[];
}

interface ProcessedMonthlyForecast {
  month: number;
  year: number;
  totalHours: number;
  billableHours: number;
  nonBillableHours: number;
  totalFTE: number;
  billableFTE: number;
  benchHours: number;
  benchFTE: number;
  utilization: number;
  status: string;
  projects: BackendProject[];
}

interface ProcessedBenchItem {
  employee: Employee;
  totalHours: number;
  billableHours: number;
  nonBillableHours: number;
  totalFTE: number;
  billableFTE: number;
  nonBillableFTE: number;
  utilization: number;
  benchHours: number;
  benchFTE: number;
  status: string;
  monthlyForecast: ProcessedMonthlyForecast[];
}

interface StatusTheme {
  color: string;
  text: string;
  dot: string;
  bg: string;
  border: string;
}

/* =========================================================
   CONSTANTS
========================================================= */

const MONTHLY_CAPACITY = 160;

const STATUS_THEMES: Record<string, StatusTheme> = {
  Billable: {
    color: "#10b981",
    text: "text-emerald-700",
    dot: "bg-emerald-500",
    bg: "bg-emerald-50",
    border: "border-emerald-200",
  },
  "Partial Bench": {
    color: "#f59e0b",
    text: "text-amber-700",
    dot: "bg-amber-500",
    bg: "bg-amber-50",
    border: "border-amber-200",
  },
  "Fully Bench": {
    color: "#ef4444",
    text: "text-rose-700",
    dot: "bg-rose-500",
    bg: "bg-rose-50",
    border: "border-rose-200",
  },
  Overallocated: {
    color: "#7c3aed",
    text: "text-violet-700",
    dot: "bg-violet-500",
    bg: "bg-violet-50",
    border: "border-violet-200",
  },
};

/* =========================================================
   HELPERS
========================================================= */

function getEmployeeStatus(billableHours: number): string {
  if (billableHours <= 0) return "Fully Bench";
  if (billableHours < 112) return "Partial Bench";
  if (billableHours <= 160) return "Billable";
  return "Overallocated";
}

function formatMonth(month: number): string {
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  return months[month - 1] || "Unknown";
}

/* =========================================================
   MAIN COMPONENT
========================================================= */

export default function PremiumBenchManagement() {
  const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [benchData, setBenchData] = useState<ProcessedBenchItem[]>([]);
  const [search, setSearch] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("All");
  const [roleFilter, setRoleFilter] = useState<string>("All");
  const [sortBy, setSortBy] = useState<string>("bench");
  const [selectedEmployee, setSelectedEmployee] = useState<ProcessedBenchItem | null>(null);

  /* =========================================================
     FETCH REAL TIME DATA
  ========================================================= */
  const fetchBenchData = async () => {
    try {
      setLoading(true);
      setError(null);
      const token = localStorage.getItem("token");
      
      const res = await fetch(`${API_BASE}/api/bench`, {
        headers: {
          Authorization: `Bearer ${token || ""}`,
          "Content-Type": "application/json"
        },
      });

      if (!res.ok) {
        throw new Error(`Server responded with status ${res.status}`);
      }

      const data: BackendBenchItem[] = await res.json();

      const formatted: ProcessedBenchItem[] = data.map((item) => {
        const totalHours = item.totalAllocation || 0;
        const billableHours = item.billableAllocation || 0;
        const nonBillableHours = Math.max(0, totalHours - billableHours);

        const totalFTE = Number((totalHours / MONTHLY_CAPACITY).toFixed(2));
        const billableFTE = Number((billableHours / MONTHLY_CAPACITY).toFixed(2));
        const nonBillableFTE = Number((nonBillableHours / MONTHLY_CAPACITY).toFixed(2));
        const utilization = Number(((billableHours / MONTHLY_CAPACITY) * 100).toFixed(1));
        const benchHours = Math.max(0, MONTHLY_CAPACITY - billableHours);
        const benchFTE = Number((benchHours / MONTHLY_CAPACITY).toFixed(2));
        const status = getEmployeeStatus(billableHours);

        const monthlyForecast: ProcessedMonthlyForecast[] = (item.monthlyBench || []).map((m) => {
          const monthTotalHours = m.totalAllocation || 0;
          const monthBillableHours = m.billableHours || 0;
          const monthNonBillableHours = Math.max(0, monthTotalHours - monthBillableHours);

          return {
            month: m.month,
            year: m.year,
            totalHours: monthTotalHours,
            billableHours: monthBillableHours,
            nonBillableHours: monthNonBillableHours,
            totalFTE: Number((monthTotalHours / MONTHLY_CAPACITY).toFixed(2)),
            billableFTE: Number((monthBillableHours / MONTHLY_CAPACITY).toFixed(2)),
            benchHours: Math.max(0, MONTHLY_CAPACITY - monthBillableHours),
            benchFTE: Number((Math.max(0, MONTHLY_CAPACITY - monthBillableHours) / MONTHLY_CAPACITY).toFixed(2)),
            utilization: Number(((monthBillableHours / MONTHLY_CAPACITY) * 100).toFixed(1)),
            status: getEmployeeStatus(monthBillableHours),
            projects: m.projects || [],
          };
        });

        return {
          employee: item.employee,
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
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to fetch workforce database insights.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBenchData();
  }, []);

  /* =========================================================
     COMPUTED METRICS (STATS)
  ========================================================= */
  const stats = useMemo(() => {
    const total = benchData.length;
    return {
      total,
      billable: benchData.filter((e) => e.status === "Billable").length,
      partial: benchData.filter((e) => e.status === "Partial Bench").length,
      bench: benchData.filter((e) => e.status === "Fully Bench").length,
      overallFTE: benchData.reduce((acc, curr) => acc + curr.totalFTE, 0),
      benchFTE: benchData.reduce((acc, curr) => acc + curr.benchFTE, 0),
      billableFTE: benchData.reduce((acc, curr) => acc + curr.billableFTE, 0),
    };
  }, [benchData]);

  /* =========================================================
     FILTERED & SORTED DATA EVALUATIONS
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

  const uniqueRoles = useMemo(() => {
    return Array.from(new Set(benchData.map((e) => e.employee.roleId?.name || "Unassigned")));
  }, [benchData]);

  /* =========================================================
     EXPORT GENERATION ENGINE
  ========================================================= */
  const exportReport = () => {
    const doc = new jsPDF();
    doc.setFontSize(20);
    doc.text("Workforce & Bench Prediction Forecast", 14, 20);
    doc.setFontSize(10);
    doc.text(`Generated on: ${new Date().toLocaleDateString()} | Total Scope: ${filteredData.length} records`, 14, 26);

    autoTable(doc, {
      startY: 32,
      head: [["Employee ID", "Full Name", "Assigned Corporate Role", "Billable Hrs", "Bench Allocation", "FTE Load", "Core Status"]],
      body: filteredData.map((item) => [
        item.employee.employeeId,
        item.employee.name,
        item.employee.roleId?.name || "Unassigned",
        `${item.billableHours}h`,
        `${item.benchHours}h`,
        item.billableFTE.toFixed(2),
        item.status,
      ]),
      theme: "striped",
      headStyles: { fillHexColor: "#4f46e5" } as any,
    });

    doc.save(`WORKFORCE_BENCH_PREDICTION_REPORT_${new Date().toISOString().split('T')[0]}.pdf`);
  };

  /* =========================================================
     LAYOUT DISPATCHER STATES
  ========================================================= */
  if (loading) return <LoadingScreen />;
  if (error) return <ErrorFallback stateError={error} retryAction={fetchBenchData} />;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 antialiased font-sans">
      {/* GLOBAL TOP NAVIGATION */}
      <nav className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-slate-200 px-6 py-4">
        <div className="max-w-[1600px] mx-auto flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center gap-3.5">
            <div className="p-2.5 rounded-xl bg-indigo-600 text-white shadow-md shadow-indigo-100">
              <TrendingUpDown size={24} />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-slate-900">Workforce Forecast</h1>
              <p className="text-xs text-slate-500 font-medium">Predictive Allocation & Bench Capacity Optimization</p>
            </div>
          </div>
          <button
            onClick={exportReport}
            disabled={filteredData.length === 0}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 disabled:bg-slate-300 text-white font-semibold text-sm transition-all shadow-sm cursor-pointer"
          >
            <Download size={16} />
            Export Operational PDF
          </button>
        </div>
      </nav>

      {/* PRIMARY CONTAINER DASHBOARD FRAMEWORK */}
      <div className="max-w-[1600px] mx-auto p-4 sm:p-6 lg:p-8 grid grid-cols-12 gap-6">
        
        {/* FILTERS MANAGEMENT PANEL */}
        <aside className="col-span-12 lg:col-span-3 space-y-6">
          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-5">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Search Personnel</label>
              <div className="relative">
                <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="ID, Name, Role or Email..."
                  className="w-full bg-slate-50 text-sm border border-slate-200 rounded-xl py-2.5 pl-10 pr-4 outline-none focus:border-indigo-500 focus:bg-white transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Operational Sorting</label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="w-full bg-slate-50 text-sm border border-slate-200 rounded-xl px-3 py-2.5 outline-none focus:border-indigo-500 focus:bg-white transition-all"
              >
                <option value="bench">Sort by Bench Volume</option>
                <option value="name">Sort by Employee Name</option>
                <option value="fte">Sort by Assignment FTE Load</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Filter Corporate Role</label>
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="w-full bg-slate-50 text-sm border border-slate-200 rounded-xl px-3 py-2.5 outline-none focus:border-indigo-500 focus:bg-white transition-all"
              >
                <option value="All">All Roles / Functions</option>
                {uniqueRoles.map((role) => (
                  <option key={role} value={role}>{role}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Availability Matrix Status</label>
              <div className="space-y-1.5">
                {["All", "Billable", "Partial Bench", "Fully Bench", "Overallocated"].map((status) => {
                  const isActive = statusFilter === status;
                  return (
                    <button
                      key={status}
                      onClick={() => setStatusFilter(status)}
                      className={`w-full text-left px-3.5 py-2 rounded-xl text-sm font-semibold transition-all ${
                        isActive 
                          ? "bg-indigo-50 text-indigo-700 font-bold border border-indigo-100" 
                          : "text-slate-600 hover:bg-slate-50 border border-transparent"
                      }`}
                    >
                      {status}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </aside>

        {/* WORKFORCE REGISTRY INTERACTIVE DATA GRID */}
        <main className="col-span-12 lg:col-span-6 space-y-4">
          <div className="bg-white rounded-2xl overflow-hidden border border-slate-200 shadow-sm">
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-white">
              <h2 className="text-base font-bold text-slate-900">Workforce Utilization Registry</h2>
              <span className="px-2.5 py-1 rounded-full bg-slate-100 text-[11px] font-bold text-slate-600 tracking-wide">
                {filteredData.length} MET CONSTRAINTS
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/70 border-b border-slate-100 text-slate-400 text-[11px] font-bold uppercase tracking-wider">
                    <th className="px-6 py-3.5">Resource Identity</th>
                    <th className="px-6 py-3.5">Billable Allocation</th>
                    <th className="px-6 py-3.5">Available Bench</th>
                    <th className="px-6 py-3.5">Status Descriptor</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm">
                  {filteredData.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-6 py-12 text-center text-slate-400">
                        No active resources match your target system filters.
                      </td>
                    </tr>
                  ) : (
                    filteredData.map((item) => {
                      const theme = STATUS_THEMES[item.status] || STATUS_THEMES["Fully Bench"];
                      return (
                        <tr
                          key={item.employee._id}
                          onClick={() => setSelectedEmployee(item)}
                          className="hover:bg-indigo-50/30 cursor-pointer transition-colors group"
                        >
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className="h-9 w-9 rounded-xl bg-slate-100 group-hover:bg-indigo-100 text-slate-700 group-hover:text-indigo-700 flex items-center justify-center font-bold text-sm transition-colors">
                                {item.employee.name.charAt(0)}
                              </div>
                              <div>
                                <p className="font-semibold text-slate-900 group-hover:text-indigo-600 transition-colors">{item.employee.name}</p>
                                <p className="text-xs text-slate-400 font-medium">{item.employee.employeeId} • {item.employee.roleId?.name || "Unassigned"}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <span className="font-semibold text-slate-800">{item.billableHours}h</span>
                            <span className="block text-[11px] font-medium text-slate-400">{item.billableFTE.toFixed(2)} FTE</span>
                          </td>
                          <td className="px-6 py-4">
                            <span className="font-semibold text-slate-800">{item.benchHours}h</span>
                            <span className="block text-[11px] font-medium text-slate-400">{item.benchFTE.toFixed(2)} FTE</span>
                          </td>
                          <td className="px-6 py-4">
                            <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[11px] font-bold uppercase tracking-wide ${theme.bg} ${theme.text} ${theme.border}`}>
                              <div className={`h-1.5 w-1.5 rounded-full ${theme.dot}`} />
                              {item.status}
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </main>

        {/* METRICS VISUALIZATION & KPI PANEL */}
        <aside className="col-span-12 lg:col-span-3 space-y-6">
          {/* SYSTEM SUMMARY CARD */}
          <div className="bg-slate-900 text-white rounded-2xl p-5 shadow-lg relative overflow-hidden">
            <div className="absolute right-0 bottom-0 translate-x-4 translate-y-4 opacity-5 pointer-events-none">
              <Users size={160} />
            </div>
            <p className="text-[10px] uppercase font-bold tracking-widest text-slate-400">Aggregated Load Efficiency</p>
            <h3 className="text-4xl font-extrabold tracking-tight mt-1 text-white">{stats.billableFTE.toFixed(2)} <span className="text-xs font-medium text-slate-400">Total FTE</span></h3>
            
            <div className="grid grid-cols-2 gap-4 border-t border-slate-800 pt-4 mt-5">
              <div>
                <span className="text-[10px] block font-semibold uppercase tracking-wider text-slate-400">Idle Load Cap</span>
                <span className="text-lg font-bold text-slate-200">{stats.benchFTE.toFixed(2)}</span>
              </div>
              <div>
                <span className="text-[10px] block font-semibold uppercase tracking-wider text-slate-400">Total Capital</span>
                <span className="text-lg font-bold text-slate-200">{stats.total}</span>
              </div>
            </div>
          </div>

          {/* DISTRIBUTION GRAPH SUMMARY */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-4">Workforce Headcount Split</h3>
            <div className="h-[200px] flex items-center justify-center relative">
              {stats.total === 0 ? (
                <p className="text-xs text-slate-400">No active operational data.</p>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={[
                        { name: "Billable Load", value: stats.billable },
                        { name: "Partial Bench", value: stats.partial },
                        { name: "Fully Bench Isolation", value: stats.bench },
                      ]}
                      dataKey="value"
                      innerRadius={45}
                      outerRadius={70}
                      paddingAngle={4}
                    >
                      <Cell fill="#10b981" />
                      <Cell fill="#f59e0b" />
                      <Cell fill="#ef4444" />
                    </Pie>
                    <Tooltip contentStyle={{ fontSize: '12px', borderRadius: '8px' }} />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>
        </aside>
      </div>

      {/* DETAILED EMPLOYEES INSIGHTS COMPONENT DRAWER PANEL */}
      <AnimatePresence>
        {selectedEmployee && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedEmployee(null)}
              className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50"
            />
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed right-0 top-0 h-full w-full max-w-[480px] bg-white border-l border-slate-200 z-[60] shadow-2xl overflow-y-auto flex flex-col"
            >
              {/* DRAWER TOP BAR */}
              <div className="p-6 border-b border-slate-100 flex justify-between items-start sticky top-0 bg-white z-10">
                <div>
                  <h2 className="text-lg font-bold text-slate-900">{selectedEmployee.employee.name}</h2>
                  <p className="text-xs font-semibold text-indigo-600 uppercase tracking-wider">{selectedEmployee.employee.employeeId}</p>
                  <p className="text-xs font-medium text-slate-400 mt-0.5">{selectedEmployee.employee.email}</p>
                </div>
                <button
                  onClick={() => setSelectedEmployee(null)}
                  className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs transition-colors cursor-pointer"
                >
                  Close Panel
                </button>
              </div>

              {/* DRAWER INTERNALS CONTENT BODY */}
              <div className="p-6 space-y-6 flex-1">
                <div className="grid grid-cols-2 gap-4">
                  <MetricCard title="Billable Performance" value={`${selectedEmployee.billableHours} Hours`} sub={`${selectedEmployee.billableFTE.toFixed(2)} FTE Loading`} />
                  <MetricCard title="Available Idle Capacity" value={`${selectedEmployee.benchHours} Hours`} sub={`${selectedEmployee.benchFTE.toFixed(2)} FTE Loading`} />
                </div>

                {/* HISTORICAL TIMELINE FORWARD PROJECTIONS */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-slate-800">
                    <Clock3 size={16} className="text-indigo-600" />
                    <h3 className="text-sm font-bold tracking-tight">Timeline Allocation Projections</h3>
                  </div>

                  <div className="space-y-3">
                    {selectedEmployee.monthlyForecast.length === 0 ? (
                      <p className="text-xs text-slate-400 py-4">No future project forecasting mapped to this user identifier profile.</p>
                    ) : (
                      selectedEmployee.monthlyForecast
                        .sort((a, b) => new Date(a.year, a.month - 1).getTime() - new Date(b.year, b.month - 1).getTime())
                        .map((month) => {
                          const theme = STATUS_THEMES[month.status] || STATUS_THEMES["Fully Bench"];
                          return (
                            <div key={`${month.month}-${month.year}`} className={`rounded-xl border p-4 transition-all ${theme.bg} ${theme.border}`}>
                              <div className="flex justify-between items-center mb-3">
                                <div>
                                  <h4 className="font-bold text-sm text-slate-900">{formatMonth(month.month)} {month.year}</h4>
                                  <span className="text-[10px] text-slate-400 font-medium">Forward Allocation Window</span>
                                </div>
                                <span className={`px-2 py-0.5 rounded-md border text-[10px] font-bold uppercase tracking-wider ${theme.bg} ${theme.text} ${theme.border}`}>
                                  {month.status}
                                </span>
                              </div>

                              <div className="grid grid-cols-2 gap-3 bg-white/60 rounded-lg p-2.5 text-xs">
                                <div>
                                  <span className="text-[10px] font-semibold text-slate-400 block">Billable Load</span>
                                  <span className="font-bold text-slate-800">{month.billableHours}h <span className="font-medium text-slate-400 text-[10px]">({month.billableFTE.toFixed(2)} FTE)</span></span>
                                </div>
                                <div>
                                  <span className="text-[10px] font-semibold text-slate-400 block">System Bench</span>
                                  <span className="font-bold text-slate-800">{month.benchHours}h <span className="font-medium text-slate-400 text-[10px]">({month.benchFTE.toFixed(2)} FTE)</span></span>
                                </div>
                              </div>

                              {/* CONDITIONAL MAP TARGETS */}
                              {month.projects && month.projects.length > 0 && (
                                <div className="mt-3 pt-3 border-t border-slate-200/50">
                                  <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block mb-1.5">Project Breakdown</span>
                                  <div className="flex flex-wrap gap-1.5">
                                    {month.projects.map((proj) => (
                                      <div
                                        key={proj._id}
                                        className={`px-2 py-1 rounded-md text-[10px] font-medium inline-flex items-center gap-1 border ${
                                          proj.billable 
                                            ? "bg-emerald-50 text-emerald-700 border-emerald-200" 
                                            : "bg-slate-50 text-slate-600 border-slate-200"
                                        }`}
                                      >
                                        <Briefcase size={10} />
                                        <span>{proj.name} • <span className="font-bold">{proj.allocatedHours}h</span></span>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          );
                        })
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
   COMPACT ATOMIC VIEW COMPONENTS
========================================================= */

interface MetricCardProps {
  title: string;
  value: string;
  sub: string;
}

const MetricCard: FC<MetricCardProps> = ({ title, value, sub }) => (
  <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
    <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block">{title}</span>
    <h4 className="text-xl font-extrabold text-slate-800 mt-1">{value}</h4>
    <p className="text-[11px] font-medium text-slate-500 mt-0.5">{sub}</p>
  </div>
);

const LoadingScreen: FC = () => (
  <div className="h-screen w-full flex flex-col items-center justify-center bg-slate-50">
    <motion.div
      animate={{ rotate: 360 }}
      transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
      className="h-10 w-10 border-3 border-indigo-600 border-t-transparent rounded-full shadow-sm"
    />
    <p className="mt-4 text-[10px] uppercase tracking-widest font-bold text-slate-400">Synchronizing Prediction Engine...</p>
  </div>
);

interface ErrorFallbackProps {
  stateError: string;
  retryAction: () => void;
}

const ErrorFallback: FC<ErrorFallbackProps> = ({ stateError, retryAction }) => (
  <div className="h-screen w-full flex flex-col items-center justify-center bg-slate-50 p-6 text-center">
    <div className="p-3 bg-rose-50 text-rose-600 rounded-full mb-3 border border-rose-100">
      <AlertCircle size={28} />
    </div>
    <h3 className="text-base font-bold text-slate-900">Database Stream Interrupted</h3>
    <p className="text-xs text-slate-400 max-w-sm mt-1 mb-4 font-medium">{stateError}</p>
    <button
      onClick={retryAction}
      className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs rounded-xl shadow-md transition-all cursor-pointer"
    >
      Re-establish Handshake Connection
    </button>
  </div>
);
