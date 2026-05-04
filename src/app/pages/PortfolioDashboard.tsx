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
const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
const CURRENT_YEAR = new Date().getFullYear();
const START_YEAR = 2020;
const FUTURE_YEARS = 5;

const YEARS = Array.from(
  { length: CURRENT_YEAR - START_YEAR + 1 + FUTURE_YEARS },
  (_, i) => START_YEAR + i
);

const CAPACITY = 160;

/* ================= COMPONENT ================= */
export function PortfolioDashboard() {
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [year, setYear] = useState(new Date().getFullYear());
  const [search, setSearch] = useState("");
  const [selectedEmployee, setSelectedEmployee] = useState<any>(null);
  const [showAllocate, setShowAllocate] = useState(false);

  const canEdit = canEditEmployee();

  const { loading, utilization, bench, revenue } = useAnalytics(month, year);
  const { employees, projects, workCategories, refetchEmployees, departments } =
    useResourceData(month, year);

  /* ================= SEARCH ================= */
  const filteredEmployees = useMemo(() => {
    if (!search.trim()) return employees;

    const q = search.toLowerCase();
    return employees.filter((e: any) =>
      e.name.toLowerCase().includes(q) ||
      e.employeeCode.toLowerCase().includes(q)
    );
  }, [employees, search]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-sky-600"></div>
      </div>
    );
  }

  /* ================= CORRECT CALCULATIONS ================= */

  // ✅ ALWAYS use full employee list
  const totalEmployees = employees.length;

  // ✅ total allocated hours
  const totalBookedHours = utilization.reduce(
    (sum: number, u: any) => sum + (u.allocatedHours || 0),
    0
  );

  // ✅ total capacity
  const totalCapacity = totalEmployees * CAPACITY;

  // ✅ total FTE (most important metric)
  const totalFTE = totalBookedHours / CAPACITY;

  // ✅ utilization %
  const avgUtilization =
    totalCapacity > 0
      ? Math.round((totalBookedHours / totalCapacity) * 100)
      : 0;

  // ✅ bench hours (true bench, not derived incorrectly)
  const totalBench = Math.max(totalCapacity - totalBookedHours, 0);

  // ✅ revenue (already computed backend using FTE × rate)
  const totalRevenue = revenue.reduce(
    (sum: number, r: any) => sum + (r.revenue || 0),
    0
  );

  return (
    <div className="max-w-[1600px] mx-auto p-4 lg:p-8 space-y-8 animate-in fade-in duration-500">

      {/* ================= HEADER ================= */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Resource Portfolio
          </h1>
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
              className="bg-transparent text-sm font-medium px-3 py-1.5"
            >
              {MONTHS.map((m, i) => (
                <option key={i} value={i + 1}>{m}</option>
              ))}
            </select>

            <div className="w-px h-4 bg-slate-300 self-center" />

            <select
              value={year}
              onChange={(e) => setYear(+e.target.value)}
              className="bg-transparent text-sm font-medium px-3 py-1.5"
            >
              {YEARS.map((y) => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </div>

          <button className="p-2 text-slate-600 hover:bg-slate-100 rounded-lg border">
            <Download size={18} />
          </button>

          {canEdit && (
            <button
              onClick={() => setShowAllocate(true)}
              className="bg-sky-600 hover:bg-sky-700 text-white px-4 py-2 rounded-lg flex items-center gap-2"
            >
              <Plus size={18} />
              New Allocation
            </button>
          )}
        </div>
      </header>

      {/* ================= KPI CARDS =================
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KpiCard title="Total FTE" value={totalFTE.toFixed(2)} icon={<Users size={16} />} />
        <KpiCard title="Utilization" value={`${avgUtilization}%`} icon={<TrendingUp size={16} />} />
        <KpiCard title="Bench Hours" value={`${totalBench}h`} icon={<Clock size={16} />} />
        <KpiCard title="Revenue" value={`₹${totalRevenue.toLocaleString("en-IN")}`} icon={<DollarSign size={16} />} />
      </div> */}

      {/* ================= TABLE ================= */}
      <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
        <div className="p-4 border-b flex justify-between gap-4">
          <div className="relative max-w-sm w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input
              type="text"
              placeholder="Search..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border rounded-lg text-sm"
            />
          </div>
        </div>

        <ResourcePlanningGrid
          employees={filteredEmployees}
          onSelectEmployee={setSelectedEmployee}
        />
      </div>

      {/* DRAWER */}
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

      {/* MODAL */}
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