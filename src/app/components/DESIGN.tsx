
import {
  Search,
  Users,
  Briefcase,
  Code2,
  Target,
  DollarSign,
} from "lucide-react";

const DEFAULT_MARGIN = 1.6;
const HOURS_PER_MONTH = 160;

function calculateRatePerHour(hourlyCost: number) {
  if (!hourlyCost) return 0;
  return Math.round(hourlyCost * DEFAULT_MARGIN);
}

type Allocation = {
  allocatedHours?: number;
  projectId?: { name?: string };
  workCategoryId?: { name?: string };
};

type Employee = {
  _id: string;
  name?: string;
  employeeCode?: string;
  hourlyCost?: number;
  allocations?: Allocation[];
  skills?: { name?: string }[];
  primaryWorkCategoryId?: { name?: string };
};

const StatusBadge = ({ fte }: { fte: number }) => {
  const config = {
    bench: {
      bg: "bg-red-50",
      text: "text-red-700",
      ring: "ring-red-600/20",
      label: "Bench",
    },
    partial: {
      bg: "bg-amber-50",
      text: "text-amber-700",
      ring: "ring-amber-600/20",
      label: "Partial",
    },
    full: {
      bg: "bg-emerald-50",
      text: "text-emerald-700",
      ring: "ring-emerald-600/20",
      label: "Full",
    },
  };

  const status =
    fte === 0
      ? config.bench
      : fte < 1
      ? config.partial
      : config.full;

  return (
    <span
      className={`inline-flex items-center rounded-md ${status.bg} px-2 py-1 text-[10px] font-bold uppercase tracking-wider ${status.text} ring-1 ring-inset ${status.ring}`}
    >
      {status.label}
    </span>
  );
};

export function ResourcePlanningGrid({
  employees = [],
  onSelectEmployee,
}: {
  employees: Employee[];
  onSelectEmployee?: (emp: Employee) => void;
})
{
  return (
    <div className="w-full rounded-2xl border border-slate-200 bg-white shadow-[0_8px_30px_rgb(0,0,0,0.04)] antialiased">
      {/* HEADER */}
      <div className="flex flex-col gap-4 border-b border-slate-100 p-6 lg:flex-row lg:items-center lg:justify-between bg-slate-50/30 rounded-t-2xl">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 shadow-lg shadow-blue-200">
              <Users className="h-5 w-5 text-white" />
            </div>

            <div>
              <h2 className="text-xl font-bold tracking-tight text-slate-900 leading-none">
                Resource Allocation
              </h2>

              <p className="text-sm text-slate-500 mt-1">
                Comprehensive overview of team utilization and skill
                distribution
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <div className="relative group">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 transition-colors group-focus-within:text-blue-500" />

            <input
              type="text"
              placeholder="Filter by Name, Skill, or Project..."
              className="h-10 w-72 rounded-xl border border-slate-200 bg-white pl-10 pr-4 text-sm transition-all focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none"
            />
          </div>

          <p className="text-slate-500 whitespace-nowrap">
            Total Headcount:{" "}
            <span className="text-slate-900 font-bold">
              {employees.length}
            </span>
          </p>
        </div>
      </div>


      {/* ================= DATA GRID ================= */}
      <div className="w-full overflow-hidden">
        <table className="w-full table-auto border-separate border-spacing-0">
          <thead>
            <tr className="bg-sky-50/80 text-[12px] uppercase tracking-[0.1em] text-sky-900">
              <th className="px-6 py-4 text-center font-bold border-b border-slate-100">Member</th>
              <th className="px-4 py-4 text-center font-bold border-b border-slate-100">Category</th>
              <th className="px-4 py-4 text-center font-bold border-b border-slate-100">Skill Inventory</th>
              <th className="px-4 py-4 text-center font-bold border-b border-slate-100">Active Engagements</th>
              <th className="px-4 py-4 text-center font-bold border-b border-slate-100">Capacity</th>
              <th className="px-6 py-4 text-center font-bold border-b border-slate-100">Financials</th>
            </tr>
          </thead>

          <tbody>
           {employees.map((emp) => {
              const allocations: Allocation[] = emp.allocations || [];

              const totalHours = allocations.reduce(
                (sum: number, a: any) =>
                 sum + Number(a?.allocatedHours || 0),
                 0
                );

                const fte = Number((totalHours / HOURS_PER_MONTH).toFixed(2));

                const projects = [...new Set(allocations
                                             .map((a: any) => a?.projectId?.name)
                                             .filter(Boolean)),
                                 ];

                const initials = emp?.name
                                    ?.split(" ")
                                    ?.map((n: string) => n[0])
                                    ?.join("")
                                    ?.slice(0, 2)
                                    ?.toUpperCase() || "U";

                const categories = [
                  ...new Set(
                    allocations
                      .map((a) => a.workCategoryId?.name)
                      .filter((name): name is string => !!name)
                  ),
                ];

              return (
                <tr
                  key={emp._id}
                  onClick={() => onSelectEmployee?.(emp)}
                  className="group cursor-pointer hover:bg-blue-50/40 border-b border-slate-100 transition-colors"
                >
                  {/* MEMBER */}
                  <td className="px-6 py-5">
                    <div className="flex items-center gap-3">
                      <div className="relative shrink-0">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-sky-600 text-sm font-bold text-white shadow-inner">
                          {initials}
                        </div>
                        <div className={`absolute -bottom-0.5 -right-0.5 h-3 w-3 
                          rounded-full border-2 border-white 
                          ${fte >= 1 ? "bg-emerald-500" : fte > 0 ? "bg-amber-400" : "bg-rose-300"}`} />
                      </div>
                      <div className="flex flex-col">
                        <p className="text-sm font-bold text-slate-900 group-hover:text-blue-600">{emp.name}</p>
                        <p className="text-[10px] font-medium text-slate-400">ID: {emp.employeeCode}</p>
                      </div>
                    </div>
                  </td>

                  {/* CATEGORY */}
                  <td className="px-4 py-5">
                    <div className="flex flex-wrap gap-1.5 justify-center">
                      {categories.length ? (
                        categories.map((cat, i) => (
                          <span
                            key={i}
                            className="px-2 py-1 rounded-md bg-sky-50 text-sky-700 text-[10px] font-bold border border-sky-100"
                          >
                            {cat}
                          </span>
                        ))
                      ) : (
                        <div className="flex items-center gap-2">
                          <Briefcase className="h-4 w-4 text-blue-500 shrink-0" />
                          <span className="text-xs text-slate-400">
                            {emp.primaryWorkCategoryId?.name || "Unassigned"}
                          </span>
                        </div>
                      )}
                    </div>
                  </td>

                  {/* SKILLS */}
                  <td className="px-4 py-5">
                    <div className="flex flex-wrap gap-1.5 max-w-[240px] text-center justify-center">
                      {emp.skills?.map((s: any, i: number) => (
                        <span key={i} className="inline-flex items-center gap-1 rounded-md border border-slate-200 bg-sky-50 px-2 py-0.5 text-[10px] font-bold text-slate-700">
                          <Code2 className="h-2.5 w-2.5 text-sky-600" />
                          {s.name}
                        </span>
                      ))}
                    </div>
                  </td>

                  {/* PROJECTS - THE "STRAIGHT LINE" FIX */}
                  <td className="px-4 py-5">
                    <div className="flex flex-col gap-2 min-w-[200px] justify-center items-start">
                    {allocations.length ? (
                      allocations.map((a: any, i: number) => (
                        <div
                          key={i}
                          className="flex flex-col text-[11px] font-bold text-slate-700"
                        >
                          <div className="flex items-center gap-2">
                            <div className="flex shrink-0 w-4 items-center justify-center">
                              <Target className="h-3.5 w-3.5 text-sky-500" />
                            </div>

                            <span className="truncate">
                              {a?.projectId?.name}
                            </span>
                          </div>

                          <span className="ml-6 text-[10px] text-slate-400">
                            {a?.workCategoryId?.name || "General"}
                          </span>
                        </div>
                      ))
                    ) : (
                      <div className="flex items-center gap-2 text-slate-400 italic text-[11px]">
                        <div className="w-4 h-0.5 bg-slate-200 shrink-0" />
                        <span>Available for Allocations</span>
                      </div>
                    )}
                    </div>
                  </td>

                  {/* CAPACITY - Centered */}
                  <td className="px-4 py-5 text-center">
                    <div className="flex flex-col items-center justify-center gap-1">
                      <span className="text-sm font-black text-slate-800 tabular-nums">
                        {Math.round(fte * 100)}%
                      </span>
                      <StatusBadge fte={fte} />
                    </div>
                  </td>

                  {/* FINANCIALS - Right Aligned */}
                  <td className="px-6 py-5 text-right">
                    <div className="flex flex-col items-center justify-center">
                      <div className="flex items-center gap-1 text-base font-black text-slate-900 tabular-nums">
                        <DollarSign className="h-3.5 w-3.5 text-slate-400" />
                        {calculateRatePerHour(Number(emp.hourlyCost || 0)).toLocaleString()}
                      </div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                        Hourly Rate
                      </span>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}