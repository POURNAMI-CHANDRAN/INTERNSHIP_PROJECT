import { useMemo, useState } from "react";
import useResourceHeatmapData from "../../hooks/useHeatMapData";
import {
  LucideRefreshCw,
  LucideSearch,
  LucideAlertCircle,
  LucideCheckCircle2,
  LucideUsers,
  LucideZap,
} from "lucide-react";

/* ================= CONSTANTS ================= */

const MONTHLY_CAPACITY = 160;
const CURRENT_MONTH = new Date().getMonth() + 1;

/* ================= TYPES ================= */

type Employee = any;
type Allocation = any;

type Status = "over" | "under" | "optimal";

/* ================= HELPERS ================= */

const getStatus = (pct: number): Status => {
  if (pct > 110) return "over";
  if (pct < 60) return "under";
  return "optimal";
};

const STATUS_COLORS: Record<Status, string> = {
  over: "bg-blue-500",
  under: "bg-indigo-400",
  optimal: "bg-emerald-500",
};

/* ================= COMPONENT ================= */

export function WorkloadManager() {
  const year = 2026;

  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [selectedMonth, setSelectedMonth] = useState(CURRENT_MONTH);
  const [searchQuery, setSearchQuery] = useState("");

  const {
    employees = [],
    allocations = [],
    loading,
    refetch,
  } = useResourceHeatmapData(year);

  /* ================= DATA ================= */

  const monthAllocations = useMemo(() => {
    return allocations.filter(
      (a: Allocation) =>
        Number(a.month) === selectedMonth && Number(a.year) === year
    );
  }, [allocations, selectedMonth]);

  const workloadMap = useMemo(() => {
    const map: Record<string, number> = {};
    for (const a of monthAllocations) {
      const id = String(a.employeeId);
      map[id] = (map[id] || 0) + Number(a.allocatedHours || 0);
    }
    return map;
  }, [monthAllocations]);

  /* ================= FILTER + SORT ================= */

  const filteredEmployees = useMemo(() => {
    return employees
      .filter((e: Employee) =>
        e.name.toLowerCase().includes(searchQuery.toLowerCase())
      )
      .sort((a: Employee, b: Employee) => {
        return (workloadMap[String(b._id)] || 0) -
          (workloadMap[String(a._id)] || 0);
      });
  }, [employees, workloadMap, searchQuery]);

  /* ================= KPI ================= */

  const stats = useMemo(() => {
    let over = 0, under = 0, optimal = 0, total = 0;

    filteredEmployees.forEach((emp: Employee) => {
      const hours = workloadMap[String(emp._id)] || 0;
      total += hours;

      const pct = (hours / MONTHLY_CAPACITY) * 100;
      const status = getStatus(pct);

      if (status === "over") over++;
      else if (status === "under") under++;
      else optimal++;
    });

    return {
      over,
      under,
      optimal,
      avg: filteredEmployees.length
        ? Math.round((total / (filteredEmployees.length * MONTHLY_CAPACITY)) * 100)
        : 0,
    };
  }, [filteredEmployees, workloadMap]);

  /* ================= LOADING ================= */

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="h-10 w-10 border-4 border-gray-200 border-t-indigo-500 rounded-full animate-spin" />
      </div>
    );
  }

  /* ================= UI ================= */

  return (
    <div className="flex h-screen flex-col bg-slate-50">

      {/* HEADER */}
      <header className="p-8 bg-white border-b">
        <div className="flex justify-between items-end">
          <div>
            <h1 className="text-3xl font-bold">Workload Manager</h1>
            <p className="text-sm text-slate-500">Enterprise Resource View</p>
          </div>

          {/* Controls */}
          <div className="flex gap-3">
            <input
              placeholder="Search..."
              className="px-3 py-2 rounded-lg border"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />

            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(Number(e.target.value))}
              className="px-3 py-2 rounded-lg border"
            >
              {Array.from({ length: 12 }).map((_, i) => (
                <option key={i} value={i + 1}>
                  {new Date(0, i).toLocaleString("default", { month: "long" })}
                </option>
              ))}
            </select>

            <button onClick={refetch} className="bg-black text-white px-4 rounded-lg">
              Refresh
            </button>
          </div>
        </div>

        {/* KPI */}
        <div className="grid grid-cols-4 gap-4 mt-6">
          <Stat label="Overloaded" value={stats.over} color="blue" />
          <Stat label="Optimal" value={stats.optimal} color="emerald" />
          <Stat label="Underused" value={stats.under} color="indigo" />
          <Stat label="Avg Utilization" value={`${stats.avg}%`} color="slate" />
        </div>
      </header>

      {/* LIST */}
      <div className="flex-1 overflow-auto p-8 space-y-4">
        {filteredEmployees.map((emp: Employee) => {
          const hours = workloadMap[String(emp._id)] || 0;
          const pct = Math.round((hours / MONTHLY_CAPACITY) * 100);
          const status = getStatus(pct);

          const fte = (hours / MONTHLY_CAPACITY).toFixed(2);
          const remaining = MONTHLY_CAPACITY - hours;

          return (
            <div key={emp._id} className="bg-white p-5 rounded-xl border flex items-center gap-6">

              {/* NAME */}
              <div className="w-60">
                <div className="font-semibold">{emp.name}</div>
                <div className="text-xs text-gray-400">
                  {emp.departmentId?.name || "Unassigned"}
                </div>
              </div>

              {/* BAR */}
              <div className="flex-1">
                <div className="flex justify-between text-xs mb-1">
                  <span>Utilization</span>
                  <span>{pct}%</span>
                </div>

                <div className="h-2 bg-gray-200 rounded-full">
                  <div
                    className={`${STATUS_COLORS[status]} h-full rounded-full`}
                    style={{ width: `${Math.min(pct, 100)}%` }}
                  />
                </div>

                <div className="text-xs mt-1 text-gray-500 flex gap-3">
                  <span>{hours}h</span>
                  <span>{fte} FTE</span>
                  <span>{remaining}h left</span>
                </div>
              </div>

              {/* ACTION */}
              <button
                disabled={status === "optimal"}
                onClick={() => setSelectedEmployee(emp)}
                className={`px-4 py-2 rounded-lg text-xs font-bold ${
                  status !== "optimal"
                    ? "bg-black text-white"
                    : "bg-gray-100 text-gray-400"
                }`}
              >
                Rebalance
              </button>
            </div>
          );
        })}
      </div>

      {/* MODAL */}
      {selectedEmployee && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/30">
          <div className="bg-white p-8 rounded-xl w-[400px]">

            <h2 className="text-lg font-bold mb-2">
              Rebalance {selectedEmployee.name}
            </h2>

            <p className="text-sm text-gray-500">
              Suggested actions:
            </p>

            <ul className="mt-3 text-sm list-disc pl-5 text-gray-600">
              <li>Shift workload to underutilized employees</li>
              <li>Reduce overload above 110%</li>
              <li>Target 80–100% optimal range</li>
            </ul>

            <button
              onClick={() => setSelectedEmployee(null)}
              className="mt-6 w-full bg-black text-white py-2 rounded-lg"
            >
              Close
            </button>

          </div>
        </div>
      )}
    </div>
  );
}

/* ================= KPI COMPONENT ================= */

function Stat({ label, value, color }: any) {
  const colors: any = {
    blue: "bg-blue-50 text-blue-600",
    emerald: "bg-emerald-50 text-emerald-600",
    indigo: "bg-indigo-50 text-indigo-600",
    slate: "bg-gray-100 text-gray-700",
  };

  return (
    <div className={`p-4 rounded-lg ${colors[color]}`}>
      <div className="text-xs font-bold">{label}</div>
      <div className="text-xl font-black">{value}</div>
    </div>
  );
}