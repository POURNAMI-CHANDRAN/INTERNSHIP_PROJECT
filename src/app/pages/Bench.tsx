import { useEffect, useMemo, useState } from "react";
import {
  Users,
  Search,
  TrendingUpDown,
  Download,
  Clock3,
  User,
  Mail,
  SlidersHorizontal,
  IdCard,
  FolderKanban,
  CheckCircle2,
  Loader2,
  ChevronDown,
} from "lucide-react";

import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from "recharts";
import { motion, AnimatePresence } from "framer-motion";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx-js-style";

/* =========================================================
   TYPES & CONSTANTS
========================================================= */
const MONTHLY_CAPACITY = 160;

type EmployeeStatus = "Fully Bench" | "Partial Bench" | "Fully Utilized" | "Overallocated";

interface StatusConfig {
  color: string;
  text: string;
  dot: string;
  bg: string;
  border: string;
}

const STATUS_THEMES: Record<EmployeeStatus, StatusConfig> = {
  "Fully Bench": {
    color: "#ef4444",
    text: "text-rose-700",
    dot: "bg-rose-500",
    bg: "bg-rose-50/60",
    border: "border-rose-100",
  },
  "Partial Bench": {
    color: "#f59e0b",
    text: "text-amber-700",
    dot: "bg-amber-500",
    bg: "bg-amber-50/60",
    border: "border-amber-100",
  },
  "Fully Utilized": {
    color: "#10b981",
    text: "text-emerald-700",
    dot: "bg-emerald-500",
    bg: "bg-emerald-50/60",
    border: "border-emerald-100",
  },
  "Overallocated": {
    color: "#7c3aed",
    text: "text-violet-700",
    dot: "bg-violet-500",
    bg: "bg-violet-50/60",
    border: "border-violet-100",
  },
};

/* =========================================================
   HELPERS
========================================================= */
function getEmployeeStatus(billableHours: number): EmployeeStatus {
  const h = Math.round(billableHours * 100) / 100;
  if (h === 0) return "Fully Bench";
  if (h > 0 && h < MONTHLY_CAPACITY) return "Partial Bench";
  if (Math.abs(h - MONTHLY_CAPACITY) < 0.01) return "Fully Utilized";
  return "Overallocated";
}

function formatMonth(month: number): string {
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  return months[month - 1] || "";
}

/* =========================================================
   MAIN DASHBOARD COMPONENT
========================================================= */
export default function PremiumBenchManagement() {
  const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

  const [loading, setLoading] = useState(true);
  const [benchData, setBenchData] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [roleFilter, setRoleFilter] = useState("All");
  const [sortBy, setSortBy] = useState("bench");
  const [selectedEmployee, setSelectedEmployee] = useState<any | null>(null);

  useEffect(() => {
    fetchBenchData();
  }, []);

  const fetchBenchData = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE}/api/bench`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });
      const data = await res.json();

      const formatted = data.map((item: any) => {
        const totalHours = item.totalAllocation || 0;
        const billableHours = item.billableAllocation || 0;
        const nonBillableHours = totalHours - billableHours;

        const totalFTE = Number((totalHours / MONTHLY_CAPACITY).toFixed(2));
        const billableFTE = Number((billableHours / MONTHLY_CAPACITY).toFixed(2));
        const nonBillableFTE = Number((nonBillableHours / MONTHLY_CAPACITY).toFixed(2));
        const utilization = Number(((billableHours / MONTHLY_CAPACITY) * 100).toFixed(1));

        const benchHours = Math.max(0, MONTHLY_CAPACITY - billableHours);
        const benchFTE = Number((benchHours / MONTHLY_CAPACITY).toFixed(2));
        const status = getEmployeeStatus(billableHours);

        const monthlyForecast = (item.monthlyBench || []).map((m: any) => {
          const mTotalHours = m.totalAllocation || 0;
          const mBillableHours = m.billableHours || 0;
          const mBenchHours = Math.max(0, MONTHLY_CAPACITY - mBillableHours);

          return {
            ...m,
            totalHours: mTotalHours,
            billableHours: mBillableHours,
            nonBillableHours: mTotalHours - mBillableHours,
            totalFTE: Number((mTotalHours / MONTHLY_CAPACITY).toFixed(2)),
            billableFTE: Number((mBillableHours / MONTHLY_CAPACITY).toFixed(2)),
            benchHours: mBenchHours,
            benchFTE: Number((mBenchHours / MONTHLY_CAPACITY).toFixed(2)),
            utilization: Number(((mBillableHours / MONTHLY_CAPACITY) * 100).toFixed(1)),
            status: getEmployeeStatus(mBillableHours),
          };
        });

        return {
          ...item,
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
    } catch (err) {
      console.error("Error loading workforce engine data:", err);
    } finally {
      setLoading(false);
    }
  };

  /* =========================================================
     COMPUTED STATS
  ========================================================= */
  const stats = useMemo(() => {
    const total = benchData.length;
    const billable = benchData.filter((e) => e.status === "Fully Utilized" || e.status === "Overallocated").length;
    const partial = benchData.filter((e) => e.status === "Partial Bench").length;
    const bench = benchData.filter((e) => e.status === "Fully Bench").length;

    return {
      total,
      billable,
      partial,
      bench,
      overallFTE: benchData.reduce((a, c) => a + (c.totalFTE || 0), 0),
      benchFTE: benchData.reduce((a, c) => a + (c.benchFTE || 0), 0),
      billableFTE: benchData.reduce((a, c) => a + (c.billableFTE || 0), 0),
    };
  }, [benchData]);

  /* =========================================================
     FILTERED & SORTED DATA
  ========================================================= */
const filteredData = useMemo(() => {
  let data = benchData.filter((item) => {
    const employee = item.employee;

    const text =
      `${employee.name} ${employee.email} ${employee.employeeId} ${
        employee.roleId?.name || ""
      }`.toLowerCase();

    const matchesSearch = text.includes(search.toLowerCase());

    const matchesStatus =
      statusFilter === "All" || item.status === statusFilter;

    const matchesRole =
      roleFilter === "All" ||
      (employee.roleId?.name || "Unassigned") === roleFilter;

    return matchesSearch && matchesStatus && matchesRole;
  });

  const priority: Record<EmployeeStatus, number> = {
    "Fully Bench": 1,
    "Partial Bench": 2,
    "Fully Utilized": 3,
    "Overallocated": 4,
  };

  data.sort((a, b) => {
    if (sortBy === "name") {
      return a.employee.name.localeCompare(b.employee.name);
    }

    if (sortBy === "fte") {
      return b.totalFTE - a.totalFTE;
    }

    const aStatus = a.status as EmployeeStatus;
    const bStatus = b.status as EmployeeStatus;

    // BENCH FIRST
    const statusSort = priority[aStatus] - priority[bStatus];

    // SAME STATUS → SORT BY BENCH HOURS
    if (statusSort === 0) {
      return b.benchHours - a.benchHours;
    }

    return statusSort;
  });

  return data;
}, [benchData, search, statusFilter, roleFilter, sortBy]);

const exportReport = () => {

  /* =====================================================
      PDF EXPORT
  ===================================================== */

  const doc = new jsPDF("landscape");

  const utilizationPercent = Math.round(
    (stats.billableFTE / (stats.overallFTE || 1)) * 100
  );

  /* ---------------- HEADER ---------------- */

  doc.setFillColor(15, 23, 42);
  doc.rect(0, 0, 300, 34, "F");

  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(22);

  doc.text(
    "WORKFORCE INTELLIGENCE REPORT",
    148,
    15,
    { align: "center" }
  );

  doc.setFontSize(10);
  doc.setTextColor(226, 232, 240);

  doc.text(
    `Generated on ${new Date().toLocaleString()}`,
    148,
    24,
    { align: "center" }
  );

  /* ---------------- EXECUTIVE SUMMARY ---------------- */

  doc.setFillColor(248, 250, 252);
  doc.roundedRect(14, 42, 268, 28, 4, 4, "F");

  doc.setFont("helvetica", "bold");
  doc.setTextColor(15, 23, 42);
  doc.setFontSize(11);

  doc.text(`TOTAL RESOURCES`, 28, 53);
  doc.text(`BILLABLE FTE`, 92, 53);
  doc.text(`BENCH FTE`, 155, 53);
  doc.text(`UTILIZATION`, 220, 53);

  doc.setFontSize(18);

  doc.text(`${stats.total}`, 28, 64);
  doc.text(`${stats.billableFTE.toFixed(2)}`, 92, 64);
  doc.text(`${stats.benchFTE.toFixed(2)}`, 155, 64);
  doc.text(`${utilizationPercent}%`, 220, 64);

  /* ---------------- TABLE ---------------- */

  autoTable(doc, {
    startY: 82,

    head: [[
      "EMPLOYEE",
      "ROLE",
      "BILLABLE HOURS",
      "BENCH HOURS",
      "BILLABLE FTE",
      "BENCH FTE",
      "UTILIZATION",
      "STATUS"
    ]],

    body: filteredData.map((item) => [
      item.employee.name,
      item.employee.roleId?.name || "N/A",
      `${item.billableHours}h`,
      `${item.benchHours}h`,
      item.billableFTE,
      item.benchFTE,
      `${item.utilization}%`,
      item.status,
    ]),

    styles: {
      fontSize: 10,
      halign: "center",
      valign: "middle",
      cellPadding: 4,
      lineColor: [0, 0, 0],
      lineWidth: 0.8,
      textColor: [30, 41, 59],
      fontStyle: "bold",
    },

    headStyles: {
      fillColor: [219, 234, 254], // LIGHT BLUE
      textColor: [15, 23, 42],
      fontStyle: "bold",
      halign: "center",
      valign: "middle",
      fontSize: 10,
      lineColor: [0, 0, 0],
      lineWidth: 0.8,
    },

    alternateRowStyles: {
      fillColor: [248, 250, 252],
    },

    didParseCell: (data) => {

      if (data.section === "body") {

        const row = filteredData[data.row.index];
        const status = row.status;
        const utilization = row.utilization;

        /* =========================================
            FULL ROW COLORING
        ========================================= */

        // FULLY UTILIZED
        if (status === "Fully Utilized") {
          data.cell.styles.fillColor = [220, 252, 231];
          data.cell.styles.textColor = [22, 101, 52];
        }

        // PARTIAL BENCH
        else if (status === "Partial Bench") {
          data.cell.styles.fillColor = [254, 243, 199];
          data.cell.styles.textColor = [180, 83, 9];
        }

        // FULLY BENCH
        else if (status === "Fully Bench") {
          data.cell.styles.fillColor = [255, 228, 230];
          data.cell.styles.textColor = [190, 24, 93];
        }

        // OVERALLOCATED
        else {
          data.cell.styles.fillColor = [237, 233, 254];
          data.cell.styles.textColor = [91, 33, 182];
        }

        // UTILIZATION COLUMN
        if (data.column.index === 6) {

          if (utilization >= 100) {
            data.cell.styles.fillColor = [220, 252, 231];
            data.cell.styles.textColor = [22, 101, 52];
          }

          else if (utilization >= 50) {
            data.cell.styles.fillColor = [254, 243, 199];
            data.cell.styles.textColor = [180, 83, 9];
          }

          else {
            data.cell.styles.fillColor = [255, 228, 230];
            data.cell.styles.textColor = [190, 24, 93];
          }
        }
        data.cell.styles.fontStyle = "bold";
      }
    },
  });

  /* ---------------- FOOTER ---------------- */

  const pageCount = (doc as any).internal.getNumberOfPages();

  for (let i = 1; i <= pageCount; i++) {

    doc.setPage(i);

    doc.setFontSize(9);
    doc.setTextColor(100);

    doc.text(
      `Page ${i} of ${pageCount}`,
      285,
      200,
      { align: "right" }
    );
  }

  doc.save("WORKFORCE_INTELLIGENCE_REPORT.pdf");

  /* =====================================================
      EXCEL EXPORT
  ===================================================== */

  const excelData = filteredData.map((item) => ({
    Employee: item.employee.name,
    Role: item.employee.roleId?.name || "N/A",
    "Billable Hours": item.billableHours,
    "Bench Hours": item.benchHours,
    "Billable FTE": item.billableFTE,
    "Bench FTE": item.benchFTE,
    Utilization: `${item.utilization}%`,
    Status: item.status,
  }));

  // TOTAL ROW
  excelData.push({
    Employee: "TOTAL",
    Role: "-",
    "Billable Hours": filteredData.reduce((a, c) => a + c.billableHours, 0),
    "Bench Hours": filteredData.reduce((a, c) => a + c.benchHours, 0),
    "Billable FTE": Number(stats.billableFTE.toFixed(2)),
    "Bench FTE": Number(stats.benchFTE.toFixed(2)),
    Utilization: `${utilizationPercent}%`,
    Status: "-",
  });

  const worksheet = XLSX.utils.json_to_sheet(excelData);

  // COLUMN WIDTHS
  worksheet["!cols"] = [
    { wch: 28 },
    { wch: 24 },
    { wch: 18 },
    { wch: 18 },
    { wch: 16 },
    { wch: 14 },
    { wch: 14 },
    { wch: 22 },
  ];

  /* =========================================
      HEADER STYLE
  ========================================= */

const range = XLSX.utils.decode_range(worksheet["!ref"] || "");

for (let C = range.s.c; C <= range.e.c; ++C) {

  const address = XLSX.utils.encode_cell({ r: 0, c: C });

  if (!worksheet[address]) continue;

  worksheet[address].s = {

    font: {
      bold: true,
      sz: 11,
      color: { rgb: "0F172A" },
      name: "Calibri",
    },

    fill: {
      fgColor: { rgb: "DBEAFE" },
    },

    alignment: {
      horizontal: "center",
      vertical: "center",
      wrapText: true,
    },

    border: {
      top: {
        style: "medium",
        color: { rgb: "000000" },
      },

      bottom: {
        style: "medium",
        color: { rgb: "000000" },
      },

      left: {
        style: "medium",
        color: { rgb: "000000" },
      },

      right: {
        style: "medium",
        color: { rgb: "000000" },
      },
    },
  };
}

  /* =========================================
      ROW COLORS
  ========================================= */

/* =========================================
    PREMIUM ROW COLORS + PDF STYLE MATCH
========================================= */

for (let R = 1; R <= range.e.r; ++R) {

  const statusCell = worksheet[`H${R + 1}`];

  if (!statusCell) continue;

  const status = statusCell.v as string;

  const utilizationCell = worksheet[`G${R + 1}`];

  const utilizationValue = Number(
    String(utilizationCell?.v || "0").replace("%", "")
  );

  let bgColor = "FFFFFF";
  let textColor = "0F172A";

  /* =====================================
      STATUS COLORS
  ===================================== */

  if (status === "Fully Utilized") {

    bgColor = "DCFCE7";
    textColor = "166534";
  }

  else if (status === "Partial Bench") {

    bgColor = "FEF3C7";
    textColor = "B45309";
  }

  else if (status === "Fully Bench") {

    bgColor = "FFE4E6";
    textColor = "BE185D";
  }

  else if (status === "Overallocated") {

    bgColor = "EDE9FE";
    textColor = "5B21B6";
  }

  /* =====================================
      UTILIZATION PRIORITY COLORS
  ===================================== */

  if (utilizationValue >= 100) {

    bgColor = "DCFCE7";
    textColor = "166534";
  }

  else if (utilizationValue >= 50) {

    bgColor = "FEF3C7";
    textColor = "B45309";
  }

  else {

    bgColor = "FFE4E6";
    textColor = "BE185D";
  }

  /* =====================================
      APPLY STYLES TO ENTIRE ROW
  ===================================== */

  for (let C = 0; C <= range.e.c; ++C) {

    const address = XLSX.utils.encode_cell({
      r: R,
      c: C,
    });

    if (!worksheet[address]) continue;

    worksheet[address].s = {

      font: {
        bold: true,
        sz: 11,
        color: { rgb: textColor },
        name: "Calibri",
      },

      fill: {
        fgColor: { rgb: bgColor },
      },

      alignment: {
        horizontal: "center",
        vertical: "center",
        wrapText: true,
      },

      border: {

        top: {
          style: "medium",
          color: { rgb: "000000" },
        },

        bottom: {
          style: "medium",
          color: { rgb: "000000" },
        },

        left: {
          style: "medium",
          color: { rgb: "000000" },
        },

        right: {
          style: "medium",
          color: { rgb: "000000" },
        },
      },
    };
  }
}

  const workbook = XLSX.utils.book_new();

  XLSX.utils.book_append_sheet(
    workbook,
    worksheet,
    "Workforce Report"
  );

  XLSX.writeFile(
    workbook,
    "WORKFORCE_INTELLIGENCE_REPORT.xlsx"
  );
};

  if (loading) return <LoadingScreen />;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 antialiased font-sans">
      
      {/* =====================================================
          HEADER / NAVBAR
      ===================================================== */}
      <header className="top-0 z-40 bg-white/80 backdrop-blur-md border-b border-slate-200/80 px-6 lg:px-12 py-4">
        <div className="max-w-[1700px] mx-auto flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center gap-5">
            <div className="bg-sky-600 p-3 rounded-xl text-white shadow-lg shadow-blue-200">
              <TrendingUpDown size={28} />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Workforce Intelligence<span className="text-sky-600"> Desk</span></h1>
              <p className="text-slate-600 font-medium">Real-time resource capacity & future allocation insights</p>
            </div>
          </div>

          <button
            onClick={exportReport}
            className="flex items-center justify-center gap-2 bg-sky-600 hover:bg-sky-800 text-white px-6 py-3 rounded-xl transition-all active:scale-95 shadow-md text-[16px] font-semibold"
          >
            <Download size={20} className="text-white group-hover:text-white transition-colors" />
            Export Intelligence Ledger
          </button>
        </div>
      </header>

      {/* =====================================================
          MAIN DASHBOARD BODY
      ===================================================== */}
      <div className="max-w-[1700px] mx-auto p-6 lg:p-12 space-y-6">
        
        {/* TOP LEVEL EXECUTIVE STATS CARDS */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-gradient-to-br from-sky-900 to-sky-800 text-white rounded-2xl p-6 shadow-md relative overflow-hidden flex flex-col justify-between h-[140px]">
            <div className="absolute top-0 right-0 p-4 opacity-10 pointer-events-none">
              <Users size={90} />
            </div>
            <p className="text-[10px] uppercase font-bold tracking-widest text-slate-200">Consolidated Billable Load</p>
            <div className="flex items-baseline gap-2 mt-1">
              <h2 className="text-4xl font-black tracking-tight">{stats.billableFTE.toFixed(2)}</h2>
              <span className="text-xs font-semibold text-slate-200">Total FTE</span>
            </div>
            <div className="text-[11px] text-slate-200 font-medium border-t border-slate-700/50 pt-2 flex justify-between">
              <span>Active Talent Payload:</span>
              <span className="text-white font-bold">{stats.total} Heads</span>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 border border-slate-200/60 shadow-sm flex flex-col justify-between h-[140px]">
            <p className="text-[10px] uppercase font-bold tracking-widest text-slate-600">Strategic Bench Capacity</p>
            <div className="flex items-baseline gap-2 mt-1">
              <h2 className="text-4xl font-black tracking-tight text-amber-500">{stats.benchFTE.toFixed(2)}</h2>
              <span className="text-xs font-semibold text-slate-600">FTE Overhead</span>
            </div>
            <div className="text-[11px] text-slate-500 font-medium border-t border-slate-100 pt-2 flex justify-between">
              <span>Partial / Full Bench Ratio:</span>
              <span className="text-slate-900 font-bold">{stats.partial}P / {stats.bench}F</span>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-5 border border-slate-200/60 shadow-sm flex items-center justify-between h-[140px]">
            <div className="space-y-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-600">Saturation</h3>
              <div className="text-2xl font-black text-slate-900">
                {Math.round((stats.billableFTE / (stats.overallFTE || 1)) * 100 || 0)}%
              </div>
              <p className="text-[10px] font-medium text-slate-600 leading-none">Optimal Target Window: 100%</p>
            </div>
            <div className="h-full w-[140px] relative flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={[
                      { name: "Utilized", value: stats.billable || 1 },
                      { name: "Partial", value: stats.partial },
                      { name: "Bench", value: stats.bench },
                    ]}
                    dataKey="value"
                    innerRadius={28}
                    outerRadius={44}
                    paddingAngle={2}
                  >
                    <Cell fill="#10b981" stroke="#fff" strokeWidth={1.5} />
                    <Cell fill="#f59e0b" stroke="#fff" strokeWidth={1.5} />
                    <Cell fill="#ef4444" stroke="#fff" strokeWidth={1.5} />
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* =====================================================
            RE-ENGINEERED HORIZONTAL CONTROLS COMPONENT
        ===================================================== */}
        <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm p-4 flex flex-col lg:flex-row items-center justify-between gap-4">
          
          {/* SEARCH FIELD */}
          <div className="w-full lg:max-w-xs relative">
            <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search ID, Name..."
              className="w-full bg-slate-50 border border-slate-200/80 rounded-xl py-2 pl-9 pr-4 text-xs font-medium placeholder:text-slate-400 outline-none focus:bg-white focus:border-slate-400 transition-all"
            />
          </div>

          {/* STATUS SELECTOR TABS */}
          <div className="w-full lg:w-auto overflow-x-auto no-scrollbar flex items-center gap-1.5 bg-slate-100/80 p-1 rounded-xl border border-slate-200/20">
            {["All", "Fully Utilized", "Partial Bench", "Fully Bench", "Overallocated"].map((status) => (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all duration-150 ${
                  statusFilter === status
                    ? "bg-white text-slate-900 shadow-sm font-bold"
                    : "text-slate-500 hover:text-slate-900"
                }`}
              >
                {status === "All" ? "All Operational Statuses" : status}
              </button>
            ))}
          </div>

          {/* RIGHT ALIGNED DROPDOWNS */}
          <div className="w-full lg:w-auto flex flex-col sm:flex-row items-center gap-3 ml-auto">
            {/* ROLE DROPDOWN */}
            <div className="w-full sm:w-48 relative">
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="w-full appearance-none bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 pr-8 text-xs font-semibold text-slate-700 outline-none focus:bg-white focus:border-slate-400 transition-all"
              >
                <option value="All">All Corporate Roles</option>
                {[...new Set(benchData.map((e) => e.employee.roleId?.name || "Unassigned"))].map((role: any) => (
                  <option key={role} value={role}>{role}</option>
                ))}
              </select>
              <ChevronDown size={12} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            </div>

            {/* SORT REGISTER BUTTON CLUSTER */}
            <div className="w-full sm:w-auto flex items-center bg-slate-100 p-1 rounded-xl">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-2 hidden sm:inline">Sort:</span>
              {[
                { id: "bench", label: "Bench" },
                { id: "fte", label: "FTE" },
                { id: "name", label: "Name" }
              ].map((opt) => (
                <button
                  key={opt.id}
                  onClick={() => setSortBy(opt.id)}
                  className={`px-3 py-1.5 rounded-lg text-[10px] font-bold tracking-tight transition-all text-center ${
                    sortBy === opt.id ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-800"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* FULLY VISIBLE DATA LEDGER TABLE */}
        <main>
          <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <div>
                <h2 className="text-md font-bold text-sky-900">Resource Ledger Registry</h2>
                <p className="text-xs text-slate-400 font-medium">Select any employee record profile block to view forecast analytics dashboards</p>
              </div>
              <span className="px-2.5 py-1 rounded-full bg-slate-100 text-slate-800 text-[12px] font-bold tracking-wider uppercase">
                {filteredData.length} records matched
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-100 text-[12px] text-center font-bold uppercase tracking-wider text-sky-900 bg-sky-50">
                    <th className="px-6 py-4 font-bold text-center">Employee Particulars</th>
                    <th className="px-6 py-4 font-bold text-center">Billable Allocation</th>
                    <th className="px-6 py-4 font-bold text-center">Available Bench Capacity</th>
                    <th className="px-6 py-4 font-bold text-center">Status Tier</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100/70 text-xs">
                  {filteredData.length > 0 ? (
                    filteredData.map((item) => {
                      const theme = STATUS_THEMES[item.status as EmployeeStatus] || STATUS_THEMES["Fully Bench"];
                      return (
                        <tr
                          key={item.employee._id}
                          onClick={() => setSelectedEmployee(item)}
                          className="hover:bg-sky-50/60 cursor-pointer transition-colors duration-150 group"
                        >
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-full bg-gradient-to-tr from-sky-200 to-sky-100 flex items-center justify-center text-slate-800 border border-slate-200">
                              <User size={20} />
                            </div>
                              <div>
                                <p className="font-bold text-slate-900 leading-snug">{item.employee.name}</p>
                                <p className="text-[12px] text-cyan-600 font-medium tracking-tight">{item.employee.employeeId} • {item.employee.roleId?.name || "Unassigned"}</p>
                              </div>
                            </div>
                          </td>

                          <td className="px-6 py-4 text-center">
                          <span
                            className={`font-bold block text-sm leading-tight ${
                              item.status === "Fully Utilized"
                                ? "text-green-600"
                                : item.status === "Partial Bench"
                                ? "text-amber-500"
                                : item.status === "Fully Bench"
                                ? "text-rose-500"
                                : "text-violet-600"
                            }`}
                          >
                            {item.billableHours}h
                          </span>                            
                          <span className="text-[12px] text-indigo-800 font-medium">{item.billableFTE} FTE </span>
                          </td>
                          
                          <td className="px-6 py-4 text-center">
                          <span
                            className={`font-bold block text-sm leading-tight ${
                              item.status === "Fully Utilized"
                                ? "text-green-600"
                                : item.status === "Partial Bench"
                                ? "text-amber-500"
                                : item.status === "Fully Bench"
                                ? "text-rose-500"
                                : "text-violet-600"
                            }`}
                          >
                            {item.benchHours}h
                          </span>
                            <span className="text-[12px] text-indigo-800 font-medium">{item.benchFTE} FTE </span>
                          </td>
                          <td className="px-6 py-4 text-center">
                          <span
                            className={`inline-flex items-center whitespace-nowrap gap-1.5 px-3 py-1 rounded-xl text-[10px] font-bold tracking-wide uppercase border ${theme.bg} ${theme.text} ${theme.border}`}
                          >
                            <span className={`h-1.5 w-1.5 rounded-full shrink-0 ${theme.dot}`} />
                            {item.status}
                          </span>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={4} className="px-6 py-16 text-center text-slate-400 font-medium">
                        No resource indexes match your parameters. Change filters to update the viewport grid.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </main>
      </div>

      {/* =====================================================
          PREMIUM EXPANDED SIDE DRAWER
      ===================================================== */}
      <AnimatePresence>
        {selectedEmployee && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedEmployee(null)}
              className="fixed inset-0 bg-sky-900/40 backdrop-blur-sm z-50"
            />

            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 26, stiffness: 220 }}
              className="fixed right-0 top-0 h-full w-full max-w-[540px] bg-white z-[60] shadow-2xl border-l border-slate-200 overflow-y-auto flex flex-col"
            >
              <div className="p-6 border-b border-slate-100 bg-sky-50 flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-sky-200 text-sky-900">
                    <User size={22} />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-900">Resource Profile Ledger</h3>
                    <p className="text-xs text-slate-400 font-medium">Detailed allocation & timeline forecasts</p>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedEmployee(null)}
                  className="px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-xs font-bold text-slate-600 transition-all shadow-sm"
                >
                  Dismiss
                </button>
              </div>

              <div className="p-6 space-y-8 flex-1">
                <div className="bg-sky-50 rounded-2xl p-5 border border-sky-200/50 flex flex-col gap-3">
                  <div>
                    <h2 className="text-xl text-center font-black tracking-tight text-slate-900">{selectedEmployee.employee.name}</h2>
                  </div>

                  <div className="space-y-1 text-xs font-bold text-indigo-700 pt-2 border-t border-slate-200/60">
                    <div className="flex items-center gap-2">
                      <IdCard size={13} className="text-indigo-400" />
                      <span>Registry ID: <strong className="text-slate-700">{selectedEmployee.employee.employeeId}</strong></span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle2 size={13} className="text-indigo-400" />
                      <span>Domain: <strong className="text-slate-700">{selectedEmployee.employee.roleId?.name || "Corporate Domain Unassigned"}</strong></span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Mail size={13} className="text-indigo-400" />
                      <span>Contact: <strong className="text-slate-700">{selectedEmployee.employee.email}</strong></span>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800">Current Window Capacity Metrics</h4>
                  <div className="grid grid-cols-2 gap-3">
                    <MetricCard
                      title="Billable Allocation"
                      value={`${selectedEmployee.billableHours} Hours`}
                      sub={`${selectedEmployee.billableFTE} FTE Value`}
                      status={selectedEmployee.status}
                    />

                    <MetricCard
                      title="Bench Overhead"
                      value={`${selectedEmployee.benchHours} Hours`}
                      sub={`${selectedEmployee.benchFTE} FTE Value`}
                      status={selectedEmployee.status}
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
                    <Clock3 size={15} className="text-slate-800" />
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800">Strategic Monthly Horizon Forecast</h4>
                  </div>

                  <div className="space-y-3">
                    {selectedEmployee.monthlyForecast && selectedEmployee.monthlyForecast.length > 0 ? (
                      selectedEmployee.monthlyForecast
                        .sort((a: any, b: any) => new Date(a.year, a.month).getTime() - new Date(b.year, b.month).getTime())
                        .map((month: any) => {
                          const mTheme = STATUS_THEMES[month.status as EmployeeStatus] || STATUS_THEMES["Fully Bench"];
                          return (
                            <div key={`${month.month}-${month.year}`} className={`rounded-xl border p-4 transition-all bg-white shadow-sm hover:shadow-md/50 ${mTheme.border}`}>
                              <div className="flex justify-between items-start border-b border-slate-100 pb-2.5 mb-3">
                                <div>
                                  <h5 className="font-bold text-slate-900 text-sm leading-none">{formatMonth(month.month)} {month.year}</h5>
                                  <span className="text-[10px] text-slate-400 font-medium">Predictive Cycle State</span>
                                </div>
                                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[9px] font-bold tracking-wide uppercase border ${mTheme.bg} ${mTheme.text}`}>
                                  {month.status}
                                </span>
                              </div>

                              <div className="grid grid-cols-2 gap-y-2 gap-x-4 text-xs">
                                <div className="flex justify-between py-0.5 border-b border-slate-50">
                                  <span className="text-slate-900 font-medium">Billable Allocation:</span>
                                  <span
                                    className={`font-bold ${
                                      month.status === "Fully Utilized"
                                        ? "text-green-600"
                                        : month.status === "Partial Bench"
                                        ? "text-amber-500"
                                        : month.status === "Fully Bench"
                                        ? "text-rose-500"
                                        : "text-violet-600"
                                    }`}
                                  >
                                    {month.billableHours}h ({month.billableFTE} FTE)
                                  </span>                       
                              </div>
                                <div className="flex justify-between py-0.5 border-b border-slate-50">
                                  <span className="text-slate-900 font-medium">Bench Capacity:</span>
                                  <span
                                    className={`font-bold ${
                                      month.status === "Fully Utilized"
                                        ? "text-green-600"
                                        : month.status === "Partial Bench"
                                        ? "text-amber-500"
                                        : month.status === "Fully Bench"
                                        ? "text-rose-500"
                                        : "text-violet-600"
                                    }`}
                                  >
                                    {month.benchHours}h ({month.benchFTE} FTE)
                                  </span>
                                </div>
                              </div>

                              <div className="mt-3.5 pt-2.5 border-t border-slate-100">
                                <p className="text-[10px] uppercase font-bold tracking-wider text-slate-800 mb-2 flex items-center gap-1">
                                  <FolderKanban size={11} /> Project Task Loadout
                                </p>
                                <div className="flex flex-wrap gap-1.5">
                                  {month.projects && month.projects.length > 0 ? (
                                    month.projects.map((p: any) => (
                                      <span
                                        key={p._id}
                                        className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded-md border ${
                                          p.billable 
                                            ? "bg-cyan-50 text-cyan-800 border-cyan-100" 
                                            : "bg-indigo-50 text-indigo-800 border-indigo-100"
                                        }`}
                                      >
                                        {p.name} • {p.allocatedHours}h
                                      </span>
                                    ))
                                  ) : (
                                    <span className="text-[10px] text-slate-400 italic font-medium">No System Allocations Committed to this Execution Window.</span>
                                  )}
                                </div>
                              </div>
                            </div>
                          );
                        })
                    ) : (
                      <p className="text-xs text-slate-400 italic text-center font-medium">No Forward Forecast Logs Found for this Candidate.</p>
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
   SUB-COMPONENTS (PREMIUM LOOK)
========================================================= */
function LoadingScreen() {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center gap-3">
      <Loader2 size={32} className="animate-spin text-slate-900" />
      <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest animate-pulse">Syncing Engine Records...</p>
    </div>
  );
}

interface MetricCardProps {
  title: string;
  value: string;
  sub: string;
  status: EmployeeStatus;
}

function MetricCard({ title, value, sub, status }: MetricCardProps) {

  const styles =
    status === "Fully Utilized"
      ? {
          bg: "bg-emerald-50/50",
          border: "border-emerald-200/80",
          text: "text-emerald-700",
        }
      : status === "Partial Bench"
      ? {
          bg: "bg-amber-50/50",
          border: "border-amber-200/80",
          text: "text-amber-700",
        }
      : status === "Fully Bench"
      ? {
          bg: "bg-rose-50/50",
          border: "border-rose-200/80",
          text: "text-rose-700",
        }
      : {
          bg: "bg-violet-50/50",
          border: "border-violet-200/80",
          text: "text-violet-700",
        };

  return (
    <div className={`p-4 rounded-xl border transition-all shadow-sm ${styles.bg} ${styles.border}`}>
      <p className="text-[10px] font-bold uppercase text-center tracking-wider text-slate-400">
        {title}
      </p>

      <p className={`text-lg font-extrabold text-center tracking-tight mt-1 ${styles.text}`}>
        {value}
      </p>

      <p className="text-[10px] text-cyan-800 text-center font-medium mt-0.5">
        {sub}
      </p>
    </div>
  );
}