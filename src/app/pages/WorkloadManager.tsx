import { useMemo, useState } from "react";
import useResourceHeatmapData from "../../hooks/useHeatMapData";
import { buildDepartments } from "../../utils/buildDepts";
import { LucideRefreshCw, LucideUsers, LucideZap, LucideAlertCircle, LucideCheckCircle2, LucideSearch } from "lucide-react";

const MONTHLY_CAPACITY = 160;
const CURRENT_MONTH = new Date().getMonth() + 1;

type Employee = any;
type Allocation = any;

function generateRebalancePlan(
  targetEmployee: any,
  employees: any[],
  workloadMap: Record<string, number>,
  capacity: number = 160
) {
  if (!targetEmployee) return [];

  const targetHours = workloadMap[targetEmployee._id] || 0;
  const targetPct = (targetHours / capacity) * 100;

  const targetDept =
    typeof targetEmployee.departmentId === "object"
      ? targetEmployee.departmentId?._id
      : targetEmployee.departmentId;

  const suggestions: any[] = [];

  // =========================================
  // OVERLOADED EMPLOYEE
  // =========================================
  if (targetPct > 100) {
    let excess = targetHours - capacity;

    const receivers = employees
      .filter((emp) => emp._id !== targetEmployee._id)
      .map((emp) => {
        const hours = workloadMap[emp._id] || 0;

        const dept =
          typeof emp.departmentId === "object"
            ? emp.departmentId?._id
            : emp.departmentId;

        return {
          emp,
          dept,
          free: capacity - hours,
          sameDept: dept === targetDept,
        };
      })
      .filter((x) => x.free > 15)
      .sort((a, b) => {
        // prioritize same department
        if (a.sameDept && !b.sameDept) return -1;
        if (!a.sameDept && b.sameDept) return 1;

        return b.free - a.free;
      });

    for (const r of receivers) {
      if (excess <= 0) break;

      const move = Math.min(excess, r.free, 40);

      suggestions.push({
        type: r.sameDept ? "same-dept" : "cross-dept",
        direction: "out",
        from: targetEmployee.name,
        to: r.emp.name,
        hours: Math.round(move),
      });

      excess -= move;
    }
  }

  // =========================================
  // UNDERUTILIZED EMPLOYEE
  // =========================================
else if (targetPct < 60) {
  let needed = Math.min(
    capacity * 0.8 - targetHours,
    capacity - targetHours
  );

  const donors = employees
    .filter((emp) => emp._id !== targetEmployee._id)
    .map((emp) => {
      const hours = workloadMap[emp._id] || 0;

      const dept =
        typeof emp.departmentId === "object"
          ? emp.departmentId?._id
          : emp.departmentId;

      return {
        emp,
        dept,
        hours,
        sameDept: dept === targetDept,

        // only transferable overload
        transferable: Math.max(0, hours - capacity * 0.9),
      };
    })
    .filter((x) => x.transferable > 10)
    .sort((a, b) => {
      // same department first
      if (a.sameDept && !b.sameDept) return -1;
      if (!a.sameDept && b.sameDept) return 1;

      return b.transferable - a.transferable;
    });

  for (const d of donors) {
    if (needed <= 0) break;

    const move = Math.min(
      needed,
      d.transferable,
      40
    );

    if (move <= 0) continue;

    suggestions.push({
      type: d.sameDept ? "same-dept" : "cross-dept",
      direction: "in",
      from: d.emp.name,
      to: targetEmployee.name,
      hours: Math.round(move),
    });

    needed -= move;
  }
}

  return suggestions;
}

export function WorkloadManager() {
  const year = 2026;
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [selectedMonth, setSelectedMonth] = useState(CURRENT_MONTH);
  const [selectedDepartment, setSelectedDepartment] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  const { employees = [], allocations = [], departments = [], loading, error, refetch } = useResourceHeatmapData(year);

  // --- DATA PROCESSING ---
  const monthAllocations = useMemo(() => {
    return allocations.filter((a: Allocation) => 
      Number(a.month) === Number(selectedMonth) && Number(a.year) === Number(year)
    );
  }, [allocations, selectedMonth, year]);

  const workloadMap = useMemo(() => {
    const map: Record<string, number> = {};
    monthAllocations.forEach((a: Allocation) => {
      const empId = String(a.employeeId);
      map[empId] = (map[empId] || 0) + Number(a.allocatedHours || 0);
    });
    return map;
  }, [monthAllocations]);

  const filteredEmployees = useMemo(() => {
    return employees
      .filter((emp: Employee) => {
        const matchesDept = selectedDepartment === "all" || emp.departmentId?._id === selectedDepartment;
        const matchesSearch = emp.name.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesDept && matchesSearch;
      })
      .sort((a: Employee, b: Employee) => {
        const aHours = workloadMap[String(a._id)] || 0;
        const bHours = workloadMap[String(b._id)] || 0;
        return bHours - aHours;
      });
  }, [employees, selectedDepartment, workloadMap, searchQuery]);

  const stats = useMemo(() => {
    let over = 0, under = 0, optimal = 0, totalHours = 0;
    filteredEmployees.forEach((emp: Employee) => {
      const hours = workloadMap[String(emp._id)] || 0;
      totalHours += hours;
      const pct = (hours / MONTHLY_CAPACITY) * 100;
      if (pct > 100) over++;
      else if (pct < 60) under++;
      else optimal++;
    });
    return { over, under, optimal, avg: filteredEmployees.length ? Math.round(totalHours / (filteredEmployees.length * MONTHLY_CAPACITY) * 100) : 0 };
  }, [filteredEmployees, workloadMap]);

    const rebalancePlan = useMemo(() => {
      if (!selectedEmployee) return [];

      return generateRebalancePlan(
        selectedEmployee,
        filteredEmployees,
        workloadMap,
        MONTHLY_CAPACITY
      );
    }, [selectedEmployee, filteredEmployees, workloadMap]);

  if (loading) return (
    <div className="flex h-screen items-center justify-center bg-white">
      <div className="flex flex-col items-center gap-4">
        <div className="h-12 w-12 border-4 border-slate-200 border-t-indigo-600 rounded-full animate-spin" />
        <span className="text-slate-500 font-medium animate-pulse">Analyzing Resource Matrix...</span>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen bg-[#FDFDFD] text-slate-900 font-sans selection:bg-indigo-100 selection:text-indigo-900">
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        
        {/* PREMIUM HEADER */}
        <header className="px-10 pt-10 pb-6 border-b border-slate-100 bg-white/80 backdrop-blur-md sticky top-0 z-20">
          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">

              <div className="flex items-center gap-2 mb-1">
                <div className="p-2 bg-sky-500 rounded-lg text-white shadow-lg shadow-sky-200">
                  <LucideZap size={18} />
                </div>    
              <h1 className="text-4xl font-extrabold tracking-tight text-slate-900">Workload <span className="text-sky-400 font-sm">Manager</span></h1>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              {/* SEARCH BAR */}
              <div className="relative group">
                <LucideSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors" size={16} />
                <input 
                  type="text" 
                  placeholder="Search team..." 
                  className="w-64 pl-10 pr-4 py-2.5 bg-slate-100 border border-transparent focus:border-sky-400 focus:bg-white rounded-xl text-sm transition-all outline-none shadow-sm"                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>

              <select 
                value={selectedMonth} 
                onChange={(e) => setSelectedMonth(Number(e.target.value))}
                className="bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-semibold hover:border-slate-300 transition-all outline-none cursor-pointer"
              >
                {Array.from({ length: 12 }).map((_, i) => (
                  <option key={i} value={i + 1}>{new Date(0, i).toLocaleString("default", { month: "long" })}</option>
                ))}
              </select>

              <button 
                onClick={refetch}
                className="flex items-center gap-2 bg-slate-900 hover:bg-indigo-600 text-white px-5 py-2.5 rounded-xl text-sm font-bold transition-all active:scale-95 shadow-sm"
              >
                <LucideRefreshCw size={16} />
                Refresh
              </button>
            </div>
          </div>

          {/* QUICK KPI TILES */}
          <div className="grid grid-cols-4 gap-4 mt-6">
            <StatCard label="Overloaded" value={stats.over} color="red" icon={<LucideAlertCircle size={14}/>} />
            <StatCard label="Optimal" value={stats.optimal} color="emerald" icon={<LucideCheckCircle2 size={14}/>} />
            <StatCard label="Under" value={stats.under} color="amber" icon={<LucideUsers size={14}/>} />
            <StatCard label="Utilization" value={`${stats.avg}%`} color="indigo" icon={<LucideZap size={14}/>} />
          </div>
        </header>

        {/* MAIN CONTENT AREA WITH SMOOTH SCROLL */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden px-6 lg:px-10 py-8 scroll-smooth bg-slate-50/60">
          <div className="max-w-7xl mx-auto space-y-4">
            
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest">Team Breakdown</h3>
              <span className="text-xs text-slate-400 font-medium">{filteredEmployees.length} Resources Active</span>
            </div>

            {filteredEmployees.map((emp: Employee) => {
              const hours = workloadMap[String(emp._id)] || 0;
              const pct = Math.round((hours / MONTHLY_CAPACITY) * 100);
              const isOver = pct > 100;
              const isUnder = pct < 60;
              const fte = (hours / MONTHLY_CAPACITY).toFixed(2);
              const remaining = MONTHLY_CAPACITY - hours;
              
              return (
                <div 
                  key={emp._id}
                  className="group relative bg-white border border-slate-200/60 rounded-2xl p-5 flex items-center gap-8 hover:shadow-xl hover:shadow-slate-200/50 hover:border-indigo-200 transition-all duration-300"
                >
                  {/* Status Indicator Bar */}
                  <div className={`absolute left-0 top-6 bottom-6 w-1 rounded-r-full ${isOver ? 'bg-rose-500' : isUnder ? 'bg-amber-500' : 'bg-emerald-500'}`} />

                  {/* Employee Info */}
                  <div className="flex-1 min-w-[200px]">
                    <h4 className="text-lg font-bold text-slate-800 group-hover:text-indigo-600 transition-colors">{emp.name}</h4>
                    <p className="text-sm text-slate-400 font-medium">{emp.departmentId?.name || "Independent Contractor"}</p>
                  </div>

                  {/* Progress Visualization */}
                  <div className="flex-[2] hidden md:block">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-bold text-indigo-800 uppercase tracking-tighter">Utilization</span>
                      <span className={`text-sm font-black ${isOver ? 'text-red-600' : 'text-indigo-700'}`}>{pct}%</span>
                    </div>
                    <div className="h-2.5 w-full bg-sky-50 rounded-full overflow-hidden p-0.5">
                      <div 
                        className={`h-full rounded-full transition-all duration-1000 ${isOver ? 'bg-rose-500' : isUnder ? 'bg-amber-500' : 'bg-green-500'}`}
                        style={{
                          width: `${Math.min(pct, 100)}%`,
                          boxShadow:
                            pct > 100
                              ? "0 0 12px rgba(239,68,68,0.45)"
                              : "none",
                        }}
                      />
                    </div>

                    <div className="text-xs mt-1 text-sky-800 flex gap-3">
                      <span>{hours}h</span>
                      <span>{fte} FTE</span>
                      <span>{remaining}h left</span>
                    </div>
                  </div>

                  {/* Stats & Actions */}
                  <div className="flex items-center gap-12">
                    <div className="text-right">
                      <div className="text-sm font-bold text-slate-700">{hours}h</div>
                      <div className="text-[11px] font-medium text-slate-400 uppercase tracking-tighter">Total Logged</div>
                    </div>

                    <button
                      disabled={!(isOver || isUnder)}
                      onClick={() => setSelectedEmployee(emp)}
                      className={`px-5 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all
                      ${
                        isOver || isUnder
                          ? "bg-slate-900 text-white hover:bg-sky-600 shadow-md active:scale-95"
                          : "bg-slate-100 text-slate-300 cursor-not-allowed"
                      }`}
                    >
                      Rebalance
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </main>

      {/* --- REUSE MODAL LOGIC WITH IMPROVED STYLING --- */}

      {/* MODAL */}
      {selectedEmployee && (
        <div className="fixed inset-0 z-[999] flex items-center justify-center bg-black/40 backdrop-blur-sm px-4">
          <div className="relative bg-white w-full max-w-lg rounded-3xl p-8 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-200">

          <div className="mb-5">
            <h2 className="text-2xl font-black text-slate-800">
              Rebalance {selectedEmployee.name}
            </h2>
          </div>

          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 mb-5">
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-slate-500">
                Current Utilization
              </span>

              <span className="text-lg font-black text-sky-600">
                {Math.round(
                  ((workloadMap[selectedEmployee._id] || 0) /
                    MONTHLY_CAPACITY) *
                    100
                )}
                %
              </span>
            </div>
          </div>

            <p className="text-sm text-gray-500">
              Suggested Actions:
            </p>

            {rebalancePlan.length === 0 ? (
            <div className="bg-emerald-50 border border-emerald-100 text-emerald-700 rounded-2xl p-4 mt-4 text-sm font-medium">
              No rebalance action required.
              Resource utilization is already healthy.
            </div>
            ) : (
            <ul className="mt-4 space-y-3">
              {rebalancePlan.map((t, i) => (
                <li
                  key={i}
                  className="flex items-center justify-between bg-white border border-slate-200 px-4 py-3 rounded-2xl text-sm hover:border-sky-200 hover:shadow-sm transition-all"                  >
                  <div className="flex flex-col">
                    <span className="font-semibold">
                      {t.from} → {t.to}
                    </span>
                    <span className="text-xs text-gray-500">
                      {t.type === "same-dept"
                        ? "Same Department"
                        : "Cross Department"}
                    </span>
                  </div>

                  <span className="text-[10px] uppercase font-black tracking-wider text-indigo-400">
                    {t.direction === "out"
                      ? "Shift Work"
                      : "Receive Work"}
                  </span>
                </li>
              ))}
            </ul>
            )}

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


function StatCard({ label, value, color, icon }: any) {
  const colors: any = {
    red: "bg-red-50 text-red-600 border-red-100",
    emerald: "bg-emerald-50 text-emerald-600 border-emerald-100",
    amber: "bg-amber-50 text-amber-600 border-amber-100",
    indigo: "bg-indigo-50 text-indigo-600 border-indigo-100",
  };

  return (
    <div className={`p-5 rounded-2xl border ${colors[color]} transition-transform hover:-translate-y-1 duration-300`}>
      <div className="flex items-center gap-2 mb-2 opacity-70">
        {icon}
        <span className="text-[10px] font-black uppercase tracking-widest">{label}</span>
      </div>
      <div className="text-2xl font-black">{value}</div>
    </div>
  );
}
