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
  billingRate?: number;
  marginMultiplier?: number;
  allocations?: Allocation[];
  skills?: { name?: string }[];
  primaryWorkCategoryId?: { name?: string };
  roleId?: { name?: string };
};

/* ================= STATUS BADGE ================= */
const StatusBadge = ({ fte }: { fte: number }) => {

  const allocatedHours = Math.round(fte * HOURS_PER_MONTH);
  const benchHours = HOURS_PER_MONTH - allocatedHours;

  const isFullyBench = allocatedHours === 0;
  const isFullyAllocated = allocatedHours >= HOURS_PER_MONTH;

  return (
    <span
      className={`
        inline-flex items-center rounded-md
        px-2 py-1 text-[10px]
        font-bold tracking-wider ring-1
        ${
          isFullyBench
            ? "bg-red-50 text-red-700 ring-red-600/20"
            : isFullyAllocated
            ? "bg-emerald-50 text-emerald-700 ring-emerald-600/20"
            : "bg-amber-50 text-amber-700 ring-amber-600/20"
        }
      `}
    >
      {allocatedHours}h • {benchHours}h
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

      {/* ================= TABLE ================= */}
      <div className="w-full overflow-hidden">
        <table className="w-full table-auto border-separate border-spacing-0">

          {/* HEADER */}
          <thead>
            <tr className="bg-sky-50 text-[14px] uppercase tracking-wider text-sky-800">
              <th className="px-6 py-4 text-center">Member</th>
              <th className="px-4 py-4 text-center">Designation</th>
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
                        <p className="text-[12px] text-amber-900 font-semibold">
                          {emp.employeeCode}
                        </p>
                      </div>
                    </div>
                  </td>

                  {/* CATEGORY */}
                  <td className="px-4 py-5 text-center font-medium text-indigo-900">

                    <div className="flex flex-col items-center gap-2">

                      {/* CATEGORY */}
                      <div className="flex flex-wrap justify-center gap-1">
                        {categories.length ? (
                          categories.map((cat, i) => (
                            <span
                              key={i}
                              className="
                                px-2 py-1 rounded-md
                                bg-sky-50 text-sky-700
                                text-[12px] font-semibold
                              "
                            >
                              {cat}
                            </span>
                          ))
                        ) : (
                          <span className="text-indigo-900 text-sm font-semibold">
                            {emp.primaryWorkCategoryId?.name || "Unassigned"}
                          </span>
                        )}
                      </div>

                      {/* ROLE */}
                      <div className="text-[12px] text-cyan-700 font-semibold">
                        {emp.roleId?.name || "No Role Assigned"}
                      </div>

                    </div>

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

                      {(() => {

                        // TOTAL HOURS FOR EMPLOYEE
                        const totalHours = emp.allocations?.reduce(
                          (sum: number, a: any) =>
                            sum + Number(a?.allocatedHours || 0), 0) || 0;

                        // CONVERT HOURS -> FTE
                        const totalFTE = totalHours / HOURS_PER_MONTH;

                        return (
                          <>
                            <span className="font-black text-cyan-900">
                              {totalFTE.toFixed(2)} FTE
                            </span>

                            <StatusBadge fte={totalFTE}/>
                          </>
                        );
                      })()}
                    </div>
                  </td>

                {/* FINANCIAL */}
                <td className="px-6 py-5 text-center">

                  {(() => {

                    const hourlyCost = emp.hourlyCost || 0;

                    // Finance controlled multiplier
                    const multiplier = emp.marginMultiplier || DEFAULT_MARGIN;

                    // Final billing rate
                    const billingRate =
                      emp.billingRate ||
                      Math.round(hourlyCost * multiplier);

                    return (
                      <div className="flex flex-col items-center">

                        {/* BILLING RATE */}
                        <div className="font-bold text-slate-900 text-[15px]">
                          ${billingRate}
                        </div>

                        {/* DETAILS */}
                        <div className="text-[10px] text-slate-500">
                          Cost: ${hourlyCost}
                        </div>

                        <div className="text-[10px] text-cyan-700 font-semibold">
                          {multiplier}x Margin
                        </div>

                      </div>
                    );
                  })()}

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