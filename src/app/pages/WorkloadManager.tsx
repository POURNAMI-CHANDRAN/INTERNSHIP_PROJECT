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
import * as XLSX from "xlsx-js-style";

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

const getColor = (hours: number, fte: number) => {

  // 0.00 / 0.00
  if (hours === 0 && fte === 0) {
    return {
      bar: "bg-cyan-600",
      text: "text-cyan-600",
      label: "UNPLANNED",
    };
  }

  // Allocation exists without capacity
  if (hours > 0 && fte === 0) {
    return {
      bar: "bg-amber-500",
      text: "text-amber-500",
      label: "UNALLOCATED",
    };
  }

  // OVERLOADED
  if (fte > 1) {
    return {
      bar: "bg-rose-500",
      text: "text-rose-500",
      label: "OVER",
    };
  }

  // OPTIMAL
  if (fte === 1) {
    return {
      bar: "bg-emerald-500",
      text: "text-emerald-600",
      label: "OPTIMAL",
    };
  }

  // UNDERLOADED
  return {
    bar: "bg-[#c904bb]",
    text: "text-[#c904bb]",
    label: "UNDER",
  };
};


const handleExport = () => {

  const exportData: any[] = [];

  // GROUP EMPLOYEES
  const groupedEmployees: Record<string, RowType[]> = {};

  rows.forEach((row) => {
    if (!groupedEmployees[row.name]) {
      groupedEmployees[row.name] = [];
    }

    groupedEmployees[row.name].push(row);
  });

  // LOOP EMPLOYEE GROUPS
  Object.entries(groupedEmployees).forEach(
    ([employeeName, employeeRows]) => {

      // MONTH TOTALS
      const employeeTotals: Record<
        string,
        { hours: number; fte: number }
      > = {};

      MONTHS.forEach((m) => {
        employeeTotals[m] = {
          hours: 0,
          fte: 0,
        };
      });

      // PROJECT ROWS
      employeeRows.forEach((row) => {

        const rowData: any = {
          Resource: row.name,
          Project: row.project,
        };

        MONTHS.forEach((month, idx) => {

          const hours = row.map[idx + 1] || 0;

          const fte = hours / MONTHLY_CAPACITY;

          // TOTALS
          employeeTotals[month].hours += hours;
          employeeTotals[month].fte += fte;

          rowData[month] =
            hours === 0
              ? "-"
              : `${fte.toFixed(2)} FTE • ${hours}h`;
        });

        exportData.push(rowData);
      });

      // TOTAL ROW
      const totalRow: any = {
        Resource: `${employeeName} TOTAL`,
        Project: "",
      };

      MONTHS.forEach((month) => {

        totalRow[month] =
          employeeTotals[month].hours === 0
            ? "-"
            : `${employeeTotals[month].fte.toFixed(2)} FTE • ${
                employeeTotals[month].hours
              }h`;
      });

      exportData.push(totalRow);

      // EMPTY SPACING ROW
      exportData.push({});
    }
  );

  // CREATE SHEET
  const worksheet = XLSX.utils.json_to_sheet(exportData);

  // COLUMN WIDTHS
  const colWidths: number[] = exportData.reduce(
    (widths: number[], row: any) => {

      Object.keys(row).forEach((key, i) => {

        const value = row[key]
          ? row[key].toString()
          : "";

        widths[i] = Math.max(
          widths[i] || key.length,
          value.length + 4
        );
      });

      return widths;

    },
    []
  );

  worksheet["!cols"] = colWidths.map((w: number) => ({
    wch: Math.min(w, 45),
  }));

  // ROW HEIGHTS
  worksheet["!rows"] = exportData.map(() => ({
    hpt: 28,
  }));

  // RANGE
  const range = XLSX.utils.decode_range(
    worksheet["!ref"] || ""
  );

  // STYLE ALL CELLS
  for (let R = range.s.r; R <= range.e.r; ++R) {

    for (let C = range.s.c; C <= range.e.c; ++C) {

      const cellAddress = XLSX.utils.encode_cell({
        r: R,
        c: C,
      });

      const cell = worksheet[cellAddress];

      if (!cell) continue;

      // DEFAULT STYLE
      cell.s = {
        alignment: {
          horizontal: "center",
          vertical: "center",
          wrapText: true,
        },

        border: {
          top: {
            style: "thin",
            color: { rgb: "CBD5E1" },
          },
          bottom: {
            style: "thin",
            color: { rgb: "CBD5E1" },
          },
          left: {
            style: "thin",
            color: { rgb: "CBD5E1" },
          },
          right: {
            style: "thin",
            color: { rgb: "CBD5E1" },
          },
        },
      };

      // HEADER ROW
      if (R === 0) {

        cell.s = {
          ...cell.s,

          font: {
            bold: true,
            color: { rgb: "000000" },
            sz: 12,
          },

          fill: {
            fgColor: { rgb: "FCF0A9" },
          },
        };
      }

      // TOTAL ROWS
      const firstCell = worksheet[
        XLSX.utils.encode_cell({
          r: R,
          c: 0,
        })
      ];

      if (
        firstCell &&
        typeof firstCell.v === "string" &&
        firstCell.v.includes("TOTAL")
      ) {

        // COLOR ENTIRE ROW
        for (let col = 0; col <= range.e.c; col++) {

          const totalCellAddress =
            XLSX.utils.encode_cell({
              r: R,
              c: col,
            });

          const totalCell =
            worksheet[totalCellAddress];

          // CREATE EMPTY CELL IF MISSING
          if (!totalCell) {
            worksheet[totalCellAddress] = {
              t: "s",
              v: "",
            };
          }

          worksheet[totalCellAddress].s = {
            alignment: {
              horizontal: "center",
              vertical: "center",
              wrapText: true,
            },

            font: {
              bold: true,
              color: { rgb: "0F172A" },
              sz: 11,
            },

            fill: {
              fgColor: { rgb: "DBEAFE" },
            },

            border: {
              top: {
                style: "thin",
                color: { rgb: "94A3B8" },
              },
              bottom: {
                style: "thin",
                color: { rgb: "94A3B8" },
              },
              left: {
                style: "thin",
                color: { rgb: "94A3B8" },
              },
              right: {
                style: "thin",
                color: { rgb: "94A3B8" },
              },
            },
          };
        }
      }
    }
  }

  // CREATE WORKBOOK
  const workbook = XLSX.utils.book_new();

  XLSX.utils.book_append_sheet(
    workbook,
    worksheet,
    "Workload Matrix"
  );

  // EXPORT FILE
  XLSX.writeFile(
    workbook,
    `WORKLOAD MATRIX.xlsx`
  );
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
            onClick={() => refetch()}
            className="p-2 rounded-lg border hover:bg-slate-100"
          >
            <LucideRefreshCcw
              className={loading ? "animate-spin" : ""}
              size={16}
            />
          </button>

          <button onClick={handleExport}
            className="px-4 py-2 bg-sky-600 text-white rounded-lg hover:bg-sky-800">
            <LucideDownload size={16} className="inline mr-2" />
            Export
          </button>
        </div>
      </header>

      {/* TABLE */}
      <div className="flex-1 overflow-auto p-4">
        <div className="rounded-xl border bg-white shadow-sm overflow-auto">

          <table className="w-full table-fixed border-separate border-spacing-0">
          <thead className="top-0 z-[50] bg-sky-50 shadow-sm">
            <tr>
              {/* LEFT STICKY COLUMN HEADER */}
              <th className="left-0 z-[60] bg-sky-50 p-4 text-center text-indigo-900 border-r w-72">
                RESOURCE
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
                          ? "bg-rose-100 text-rose-600"
                          : "bg-blue-100 text-blue-600"
                      }`}
                    >
                      <LucideUserCircle2 size={24} />
                    </div>

                    <div>
                      <div className="text-md font-bold">{row.project}</div>
                      <div className="text-md font-medium text-blue-600">{row.name}</div>
                    </div>
                  </td>

                  {/* MONTH CELLS */}
                  {MONTHS.map((_, i) => {
                    const month = i + 1;
                    const hours = row.map[month] || 0;
                    const fte = hours / MONTHLY_CAPACITY;
                    const pct = Math.round(fte * 100);

                    const color = getColor(hours, fte);

                    return (
                      <td key={i} className="p-3 text-center">
                        <div className="flex flex-col items-center gap-1">
                          <span className={`text-[10px] font-extrabold ${color.text}`}>
                            {hours ? fte.toFixed(2) : "0.00"}
                          </span>

                          <div className="h-2 w-14 bg-slate-200 rounded-full overflow-hidden">
                            <div
                              className={`${color.bar} h-full transition-all`}
                              style={{ width: `${Math.min(pct, 100)}%` }}
                            />
                          </div>

                          <span
                            className={`text-[10px] font-bold ${
                              color.text
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


