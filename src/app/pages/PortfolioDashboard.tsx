import { useMemo, useState } from "react";
import { 
  Clock, DollarSign, Users, TrendingUp, Plus, ExternalLink,
  Search, Filter, Download, Calendar as CalendarIcon 
} from "lucide-react";

import { useAnalytics } from "../../hooks/useAnalytics";
import { useResourceData } from "../../hooks/useResourceData";

import EmployeeDrawer from "../components/EmployeeDrawer";
import { KpiCard } from "../components/KPICard";
import { ResourcePlanningGrid } from "../components/PlannerGrid";
import { AllocateModal } from "../components/AllocateModal";
import { canEditEmployee } from "../../utils/auth";

/* ================= CONSTANTS ================= */
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const CURRENT_YEAR = new Date().getFullYear();
const START_YEAR = 2020;
const FUTURE_YEARS = 5;
const YEARS = Array.from({ length: CURRENT_YEAR - START_YEAR + 1 + FUTURE_YEARS }, (_, i) => START_YEAR + i);

export function PortfolioDashboard() {
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [year, setYear] = useState(new Date().getFullYear());
  const [search, setSearch] = useState("");
  const [selectedEmployee, setSelectedEmployee] = useState<any>(null);
  const [showAllocate, setShowAllocate] = useState(false);

  const canEdit = canEditEmployee();
  const { loading, utilization, bench, revenue } = useAnalytics(month, year);
  const { employees, projects, workCategories, refetchEmployees, departments } = useResourceData(month, year);

  const filteredEmployees = useMemo(() => {
    if (!search.trim()) return employees;
    const q = search.toLowerCase();
    return employees.filter((e: any) =>
      e.name.toLowerCase().includes(q) || e.employeeCode.toLowerCase().includes(q)
    );
  }, [employees, search]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-sky-600"></div>
      </div>
    );
  }

  /* ================= CALCULATIONS ================= */
  const avgUtilization = utilization.length > 0
    ? Math.round(utilization.reduce((s: number, u: any) => s + u.utilization, 0) / utilization.length)
    : 0;
  const totalBench = bench.reduce((s: number, b: any) => s + b.benchHours, 0);
  const totalRevenue = revenue.reduce((s: number, r: any) => s + r.revenue, 0);
  const totalAvailableHours = utilization.length * 160;

  return (
    <div className="max-w-[1600px] mx-auto p-4 lg:p-8 space-y-8 animate-in fade-in duration-500">
      
      {/* ================= HEADER & CONTROLS ================= */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Resource Portfolio</h1>
          <p className="text-slate-500 text-sm font-medium flex items-center gap-2">
            <CalendarIcon size={14} />
            {MONTHS[month - 1]} {year} Overview
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex bg-slate-100 p-1 rounded-lg border border-slate-200">
            <select 
              value={month} 
              onChange={(e) => setMonth(+e.target.value)}
              className="bg-transparent text-sm font-medium px-3 py-1.5 focus:outline-none cursor-pointer"
            >
              {MONTHS.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
            </select>
            <div className="w-px h-4 bg-slate-300 self-center" />
            <select 
              value={year} 
              onChange={(e) => setYear(+e.target.value)}
              className="bg-transparent text-sm font-medium px-3 py-1.5 focus:outline-none cursor-pointer"
            >
              {YEARS.map((y) => <option key={y} value={y}>{y}</option>)}
            </select>
          </div>

          <button className="p-2 text-slate-600 hover:bg-slate-100 rounded-lg border border-slate-200 transition-colors">
            <Download size={18} />
          </button>

          {canEdit && (
            <button
              onClick={() => setShowAllocate(true)}
              className="bg-sky-600 hover:bg-sky-700 text-white px-4 py-2 rounded-lg shadow-sm shadow-sky-200 transition-all flex items-center gap-2 font-medium"
            >
              <Plus size={18} />
              <span>New Allocation</span>
            </button>
          )}
        </div>
      </header>

      {/* ================= MAIN CONTENT AREA ================= */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        {/* Table Toolbar */}
        <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row justify-between gap-4">
          <div className="relative max-w-sm w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text"
              placeholder="Search by name or employee code..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 outline-none transition-all bg-white text-sm"
            />
          </div>
          <div className="flex items-center gap-2">
           <button className="flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm font-bold text-slate-600 hover:bg-white hover:shadow-sm transition-all">
            Print
           </button>
           <button className="flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-2 text-xs font-bold text-white shadow-md hover:bg-slate-800 transition-all active:scale-95">
            <ExternalLink className="h-3.5 w-3.5" />
              Export CSV
           </button>
            <button className="flex items-center gap-2 text-sm font-medium text-slate-600 px-3 py-2 hover:bg-white rounded-md border border-transparent hover:border-slate-200 transition-all">
              <Filter size={16} />
              Filter
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <ResourcePlanningGrid
            employees={filteredEmployees}
            onSelectEmployee={setSelectedEmployee}
          />
        </div>
      </div>

      {/* ================= MODALS & DRAWERS ================= */}
      {selectedEmployee && (
        <EmployeeDrawer
          employee={selectedEmployee}
          onClose={() => setSelectedEmployee(null)}
          canEdit={canEdit}
          projects={projects}
          workCategories={workCategories}
          departments={departments}
          refetchEmployees={refetchEmployees}
        />
      )}

      {showAllocate && (
        <AllocateModal
          mode="create"
          employees={employees}
          projects={projects}
          workCategories={workCategories}
          onClose={() => setShowAllocate(false)}
          onSuccess={async () => {
            await refetchEmployees();
            setShowAllocate(false);
          }}
        />
      )}
    </div>
  );
}