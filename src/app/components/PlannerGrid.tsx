import { useMemo, useState } from "react";
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

/* ================= STATUS BADGE ================= */
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
    fte === 0 ? config.bench : fte < 1 ? config.partial : config.full;

  return (
    <span
      className={`inline-flex items-center rounded-md ${status.bg} px-2 py-1 text-[10px] font-bold uppercase tracking-wider ${status.text} ring-1 ring-inset ${status.ring}`}
    >
      {status.label}
    </span>
  );
};

/* ================= MAIN COMPONENT ================= */
export function ResourcePlanningGrid({
  employees = [],
  onSelectEmployee,
}: {
  employees: Employee[];
  onSelectEmployee?: (emp: Employee) => void;
}) {
  const [search, setSearch] = useState("");

  /* ================= FILTER ================= */
  const filteredEmployees = useMemo(() => {
    if (!search.trim()) return employees;

    const q = search.toLowerCase();

    return (employees || []).filter((emp) => {
      return (
        emp?.name?.toLowerCase()?.includes(q) ||
        emp?.employeeCode?.toLowerCase()?.includes(q) ||
        emp?.skills?.some((s) =>
          s?.name?.toLowerCase()?.includes(q)
        ) ||
        emp?.allocations?.some((a) =>
          a?.projectId?.name?.toLowerCase()?.includes(q)
        )
      );
    });
  }, [employees, search]);

  return (
    <div className="w-full rounded-2xl border border-slate-200 bg-white shadow-[0_8px_30px_rgb(0,0,0,0.04)] antialiased">

      {/* HEADER */}
      <div className="flex flex-col gap-4 border-b border-slate-100 p-6 lg:flex-row lg:items-center lg:justify-between bg-slate-50/30 rounded-t-2xl">

        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600">
            <Users className="h-5 w-5 text-white" />
          </div>

          <div>
            <h2 className="text-xl font-bold text-slate-900">
              Resource Allocation
            </h2>
            <p className="text-sm text-slate-500">
              Team utilization overview
            </p>
          </div>
        </div>

        {/* SEARCH */}
        <div className="flex items-center gap-3 flex-wrap">
          <div className="relative group">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

            <input
              type="text"
              placeholder="Filter by Name, Skill, Project..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-10 w-72 rounded-xl border border-slate-200 bg-white pl-10 pr-4 text-sm outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500"
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

      {/* ================= TABLE ================= */}
      <div className="w-full overflow-hidden">
        <table className="w-full table-auto border-separate border-spacing-0">

          {/* HEADER */}
          <thead>
            <tr className="bg-sky-50 text-[14px] uppercase tracking-wider text-sky-800">
              <th className="px-6 py-4 text-center">Member</th>
              <th className="px-4 py-4 text-center">Category</th>
              <th className="px-4 py-4 text-center">Skills</th>
              <th className="px-4 py-4 text-center">Projects</th>
              <th className="px-4 py-4 text-center">Capacity</th>
              <th className="px-6 py-4 text-center">Financials</th>
            </tr>
          </thead>

          {/* BODY */}
          <tbody>
            {filteredEmployees.map((emp) => {
              const allocations = emp.allocations || [];

              const totalHours = allocations.reduce(
                (sum, a) =>
                  sum + Number(a?.allocatedHours || 0),
                0
              );

              const fte = totalHours
                ? totalHours / HOURS_PER_MONTH
                : 0;

              const projects = [
                ...new Set(
                  allocations
                    .map((a) => a?.projectId?.name)
                    .filter(Boolean)
                ),
              ];

              const categories = [
                ...new Set(
                  allocations
                    .map((a) => a?.workCategoryId?.name)
                    .filter(Boolean)
                ),
              ];

              const initials =
                emp?.name
                  ?.split(" ")
                  ?.map((n) => n[0])
                  ?.join("")
                  ?.slice(0, 2)
                  ?.toUpperCase() || "U";

              return (
                <tr
                  key={emp._id}
                  onClick={() => onSelectEmployee?.(emp)}
                  className="cursor-pointer hover:bg-blue-50 border-b border-slate-100 transition"
                >

                  {/* MEMBER */}
                  <td className="px-6 py-5">
                    <div className="flex items-center gap-3">
                      <div>
                        <p className="font-bold text-[16px] text-slate-900">
                          {emp.name}
                        </p>
                        <p className="text-[12px] text-cyan-700">
                          {emp.employeeCode}
                        </p>
                      </div>
                    </div>
                  </td>

                  {/* CATEGORY */}
                  <td className="px-4 py-5 text-center font-medium text-indigo-900">
                    {categories.length ? (
                      categories.map((cat, i) => (
                        <span
                          key={i}
                          className="mx-1 px-2 py-1 bg-sky-50 text-sky-700 text-[10px] rounded-md"
                        >
                          {cat}
                        </span>
                      ))
                    ) : (
                      emp.primaryWorkCategoryId?.name || "Unassigned"
                    )}
                  </td>

                  {/* SKILLS */}
                  <td className="px-4 py-5 text-center">
                    <div className="flex flex-wrap gap-1.5 max-w-[240px] text-center justify-center">
                      {emp.skills?.map((s, i) => (
                        <span key={i} className="inline-flex items-center gap-1 rounded-md border border-slate-200 bg-sky-50 px-2 py-0.5 text-[10px] font-bold text-slate-700">
                          <Code2 className="h-2.5 w-2.5 text-sky-600" />
                          {s.name}
                        </span>
                      ))}
                    </div>
                  </td>

                  {/* PROJECTS */}
                  <td className="px-4 py-5 text-center">
                    <div className="flex flex-col gap-1">
                      {projects.length ? (
                        projects.map((p, i) => (
                          <span
                            key={i}
                            className="text-[12px] font-bold text-slate-700"
                          >
                            {p}
                          </span>
                        ))
                      ) : (
                        <span className="text-slate-400 text-xs">
                          Available
                        </span>
                      )}
                    </div>
                  </td>

                  {/* CAPACITY */}
                  <td className="px-4 py-5 text-center">
                    <div className="flex flex-col items-center">
                      <span className="font-black text-slate-900">
                        {Math.round(fte * 100)}%
                      </span>
                      <StatusBadge fte={fte} />
                    </div>
                  </td>

                  {/* FINANCIAL */}
                  <td className="px-6 py-5 text-center">
                    <div className="font-bold text-slate-900">
                      ₹{calculateRatePerHour(emp.hourlyCost || 0)}
                    </div>
                    <div className="text-[10px] text-slate-400">
                      / hour
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