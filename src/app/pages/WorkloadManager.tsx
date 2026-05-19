import React, { useMemo, useState } from "react";
import {
  LucideChevronLeft,
  LucideChevronRight,
  LucideDownload,
  LucideRefreshCcw,
  LucideUserCircle2,
  LucideSearch,
} from "lucide-react";

import useResourceHeatmapData from "../../hooks/useHeatMapData";

const MONTHLY_CAPACITY = 160;

const MONTHS = [
  "Jan","Feb","Mar","Apr","May","Jun",
  "Jul","Aug","Sep","Oct","Nov","Dec"
];

type Employee = {
  _id: string;
  name: string;
  primaryWorkCategoryId?: {
    name: string;
  };
};

type Allocation = {
  employeeId: string;
  projectId?: {
    name: string;
  };
  allocatedHours: number;
  month: number;
  year: number;
};

type RowType = {
  id: string;
  name: string;
  project: string;
  category: string;
  bench: boolean;
  map: Record<number, number>;
};

export function WorkloadManager() {
  const [year, setYear] = useState(2026);
  const [query, setQuery] = useState("");

  const { employees = [], allocations = [], loading, refetch } =
    useResourceHeatmapData(year) as {
      employees: Employee[];
      allocations: Allocation[];
      loading: boolean;
      refetch: () => void;
    };

  const rows = useMemo<RowType[]>(() => {
    return employees
      .flatMap((emp) => {
        const empAlloc = allocations.filter(
          (a) => a.employeeId === emp._id && a.year === year
        );

        if (!empAlloc.length) {
          return [
            {
              id: emp._id,
              name: emp.name,
              project: "Bench",
              category: emp.primaryWorkCategoryId?.name || "General",
              bench: true,
              map: {} as Record<number, number>,
            },
          ];
        }

        const grouped: Record<string, Record<number, number>> = {};

        empAlloc.forEach((a) => {
          const projectName = a.projectId?.name || "Internal";

          if (!grouped[projectName]) {
            grouped[projectName] = {};
          }

          grouped[projectName][a.month] =
            (grouped[projectName][a.month] || 0) +
            (a.allocatedHours || 0);
        });

        return Object.entries(grouped).map(([project, map]) => ({
          id: `${emp._id}-${project}`,
          name: emp.name,
          project,
          category: emp.primaryWorkCategoryId?.name || "General",
          bench: false,
          map,
        }));
      })
      .filter((r) =>
        `${r.name}${r.project}`
          .toLowerCase()
          .includes(query.toLowerCase())
      );
  }, [employees, allocations, year, query]);

  const getColor = (pct: number) => {
    if (pct === 0) return "bg-slate-200 text-slate-400";
    if (pct < 70) return "bg-cyan-500 text-cyan-600";
    if (pct < 95) return "bg-emerald-500 text-emerald-600";
    if (pct <= 100) return "bg-amber-500 text-amber-600";
    return "bg-rose-500 text-rose-600";
  };

  return (
    <div className="h-screen flex flex-col bg-gradient-to-br from-slate-50 to-white text-slate-900">

      {/* HEADER */}
      <header className="h-16 flex items-center justify-between px-6 border-b bg-white shadow-sm">
        <h1 className="text-lg font-bold">
          Workload<span className="text-blue-600"> Matrix</span>
        </h1>

        <div className="flex items-center gap-4">
          {/* SEARCH */}
          <div className="relative">
            <LucideSearch size={16} className="absolute left-3 top-2.5 text-slate-400" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search..."
              className="pl-9 pr-3 h-9 w-64 rounded-lg border bg-slate-50 focus:ring-2 focus:ring-blue-200 outline-none"
            />
          </div>

          {/* YEAR CONTROL */}
          <div className="flex items-center border rounded-lg px-2 py-1 bg-white">
            <button onClick={() => setYear(year - 1)}>
              <LucideChevronLeft size={16} />
            </button>
            <span className="px-3 font-semibold">{year}</span>
            <button onClick={() => setYear(year + 1)}>
              <LucideChevronRight size={16} />
            </button>
          </div>

          <button
            onClick={refetch}
            className="p-2 rounded-lg border hover:bg-slate-100"
          >
            <LucideRefreshCcw
              className={loading ? "animate-spin" : ""}
              size={16}
            />
          </button>

          <button className="px-4 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800">
            <LucideDownload size={16} className="inline mr-2" />
            Export
          </button>
        </div>
      </header>

      {/* TABLE */}
      <div className="flex-1 overflow-auto p-4">
        <div className="rounded-xl border bg-white shadow-sm overflow-auto">

          <table className="w-full table-fixed border-separate border-spacing-0">
          <thead className="sticky top-0 z-[50] bg-sky-50 shadow-sm">
            <tr>
              {/* LEFT STICKY COLUMN HEADER */}
              <th className="sticky left-0 z-[60] bg-sky-50 p-4 text-center text-indigo-800 border-r w-72">
                Resource
              </th>

              {/* MONTH HEADERS */}
              {MONTHS.map((m, idx) => (
                <th
                  key={idx}
                  className="p-3 text-center text-md text-slate-800"
                >
                  <div className="flex flex-col items-center">
                    <span>{m}</span>
                    <span className="text-[10px] text-slate-400">160h</span>
                  </div>
                </th>
              ))}
            </tr>
          </thead>

            <tbody>
              {rows.map((row) => (
                <tr key={row.id} className="hover:bg-sky-50 transition">

                  {/* LEFT COLUMN */}
                  <td className="sticky left-0 bg-white border-r p-3 flex gap-3 items-center">
                    <div
                      className={`p-2 rounded-lg ${
                        row.bench
                          ? "bg-amber-100 text-amber-600"
                          : "bg-blue-100 text-blue-600"
                      }`}
                    >
                      <LucideUserCircle2 size={24} />
                    </div>

                    <div>
                      <div className="text-md font-semibold">{row.project}</div>
                      <div className="text-md text-slate-500">{row.name}</div>
                    </div>
                  </td>

                  {/* MONTH CELLS */}
                  {MONTHS.map((_, i) => {
                    const month = i + 1;
                    const hours = row.map[month] || 0;
                    const fte = hours / MONTHLY_CAPACITY;
                    const pct = Math.round(fte * 100);

                    const color = getColor(pct);

                    return (
                      <td key={i} className="p-3 text-center">
                        <div className="flex flex-col items-center gap-1">
                          <span className="text-xs font-bold">
                            {hours ? fte.toFixed(2) : "—"}
                          </span>

                          <div className="h-2 w-14 bg-slate-200 rounded-full overflow-hidden">
                            <div
                              className={`${color.split(" ")[0]} h-full transition-all`}
                              style={{ width: `${Math.min(pct, 100)}%` }}
                            />
                          </div>

                          <span
                            className={`text-[10px] font-semibold ${
                              color.split(" ")[1]
                            }`}
                          >
                            {hours ? "FTE" : "Free"}
                          </span>
                        </div>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>

        </div>
      </div>
    </div>
  );
}