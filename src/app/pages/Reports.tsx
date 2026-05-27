import React, { useEffect, useState, useMemo} from "react";
import * as XLSX from "xlsx-js-style";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { 
  ClipboardList, 
  Download, 
  Search, 
  ChevronDown, 
  ChevronUp, 
  Mail, 
  Layers, 
  TrendingUp, 
  TrendingDown,
  User,
  RotateCcw,
  Filter,
} from "lucide-react";

/* ========================= TYPES ========================= */

interface Allocation {
  project_name: string;
  month: number;
  year: number;
  hours: number;
  fte: number;
  billable: boolean;
  rate: number;
  revenue: number;
  cost: number;
}

interface EmployeeReport {
  name: string;
  email: string;
  skills: string[];
  allocations: Allocation[];
  summary: {
    total_hours: number;
    total_revenue: number;
    total_cost: number;
    profit: number;
  };
}

/* ========================= COMPONENT ========================= */

export default function EmployeeReports() {
  const API_BASE = (import.meta as any).env.VITE_API_BASE_URL || "http://localhost:5000";
  const token = localStorage.getItem("token");

  const [data, setData] = useState<EmployeeReport[]>([]);
  const [search, setSearch] = useState("");
  const [expanded, setExpanded] = useState<string | null>(null);
  const [profitFilter, setProfitFilter] = useState("All");
  const [utilFilter, setUtilFilter] = useState("All");
  const [billableFilter, setBillableFilter] = useState("All");
  const [projectFilter, setProjectFilter] = useState("");
  const [month, setMonth] = useState("");
  const [year, setYear] = useState("");
  const [skillFilter, setSkillFilter] = useState("");
  const [filtersOpen, setFiltersOpen] = useState(false);

  const loadReports = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/employees/reports`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json();
      setData(json);
    } catch (err) {
      console.error("Failed to Fetch Reports", err);
    }
  };

  useEffect(() => { loadReports(); }, []);

  const filteredData = useMemo(() => {
    return data.filter((emp) => {
      const matchesSearch = emp.name.toLowerCase().includes(search.toLowerCase()) || 
                            emp.email.toLowerCase().includes(search.toLowerCase());
      
      const matchesProfit = profitFilter === "All" ? true :
                            profitFilter === "Profit" ? emp.summary.profit > 0 : emp.summary.profit < 0;

      const utilization = (emp.summary.total_hours / 160) * 100;

      const matchesUtil = utilFilter === "All" ? true :
                          utilFilter === "Overallocated" ? utilization > 100 :
                          utilFilter === "Underutilized" ? utilization < 70 && utilization > 0 :
                          utilFilter === "Idle" ? utilization === 0 : true;

      const matchesSkill = skillFilter === "" ? true : emp.skills.includes(skillFilter);

      const matchesProject = projectFilter === "" ? true : 
                             emp.allocations.some(a => a.project_name === projectFilter);

      const matchesMonth = month === "" ? true :
                           emp.allocations.some(a => a.month === parseInt(month));

      const matchesBillable =
        billableFilter === "All"
          ? true
          : emp.allocations.some((a) =>
              billableFilter === "Billable" ? a.billable : !a.billable
            );

      const matchesYear =
        year === ""
          ? true
          : emp.allocations.some((a) => a.year === Number(year));

      return (
        matchesSearch &&
        matchesProfit &&
        matchesUtil &&
        matchesSkill &&
        matchesProject &&
        matchesMonth &&
        matchesBillable &&
        matchesYear
      );    });
  }, [data, search, profitFilter, utilFilter, skillFilter, projectFilter, month, billableFilter, year]);

  // --- Helpers for unique dropdown values ---
  const uniqueSkills = [...new Set(data.flatMap(e => e.skills))].sort();
  const uniqueProjects = [...new Set(data.flatMap(e => e.allocations.map(a => a.project_name)))].sort();
  const uniqueYears = useMemo(() => {
    return [...new Set(
      data.flatMap(e => e.allocations.map(a => a.year))
    )].sort();
  }, [data]);

  const resetFilters = () => {
    setSearch("");
    setProfitFilter("All");
    setUtilFilter("All");
    setSkillFilter("");
    setProjectFilter("");
    setMonth("");
    setBillableFilter("All");
    setYear("");
  };

  /* ========================= EXPORT EXCEL ========================= */
const exportExcel = () => {
  const wb = XLSX.utils.book_new();

  /* =========================================================
      MASTER DATA
  ========================================================= */

  const rows: any[] = [];

  data.forEach((emp) => {
    let totalHours = 0;
    let totalFTE = 0;

    emp.allocations.forEach((a: any) => {
      totalHours += Number(a.hours || 0);
      totalFTE += Number(a.fte || 0);

      rows.push({
        "Employee Name": emp.name,
        Email: emp.email,
        Skills: emp.skills.join(", "),
        "Project Name": a.project_name,
        "Work Category": a.billable ? "Billable" : "Non-Billable",
        Month: a.month,
        Year: a.year,
        Hours: a.hours,
        FTE: a.fte,
        Rate: a.rate,
        Revenue: a.revenue,
        Cost: a.cost,
        Profit: a.revenue - a.cost,
      });
    });

    /* ===== EMPLOYEE TOTAL ROW ===== */
    rows.push({
      "Employee Name": `TOTAL - ${emp.name}`,
      Email: "",
      Skills: "",
      "Project Name": "",
      "Work Category": "",
      Month: "",
      Year: "",
      Hours: totalHours,
      FTE: totalFTE.toFixed(2),
      Rate: "",
      Revenue: "",
      Cost: "",
      Profit: "",
    });

    /* EMPTY SPACER ROW */
    rows.push({});
  });

  /* =========================================================
      CREATE SHEET
  ========================================================= */

  const ws = XLSX.utils.json_to_sheet(rows);

  /* =========================================================
      COLUMN WIDTHS
  ========================================================= */

  ws["!cols"] = [
    { wch: 28 }, // Employee
    { wch: 32 }, // Email
    { wch: 35 }, // Skills
    { wch: 28 }, // Project
    { wch: 22 }, // Work Category
    { wch: 10 }, // Month
    { wch: 10 }, // Year
    { wch: 14 }, // Hours
    { wch: 12 }, // FTE
    { wch: 14 }, // Rate
    { wch: 18 }, // Revenue
    { wch: 18 }, // Cost
    { wch: 18 }, // Profit
  ];

  /* =========================================================
      STYLING
  ========================================================= */

  const range = XLSX.utils.decode_range(ws["!ref"] || "");

  const getUtilColor = (hours: number, fte: number) => {
  if (hours === 0 || fte === 0) {
    return "F87171"; // light red
  }

  if (hours === 160 || fte === 1) {
    return "22C55E"; // green
  }

  if (hours >= 160 || fte >= 1) {
    return "60A5FA"; // light blue
  }

  if (fte > 0 && fte < 1) {
    return "F5D0A9"; // light brown
  }

  return "E5E7EB"; // default gray
};

for (let R = 0; R <= range.e.r; ++R) {
  for (let C = 0; C <= range.e.c; ++C) {
    const cellAddress = XLSX.utils.encode_cell({ r: R, c: C });

    if (!ws[cellAddress]) continue;

    const header = R === 0;

    const isTotalRow =
      ws[XLSX.utils.encode_cell({ r: R, c: 0 })]?.v &&
      String(ws[XLSX.utils.encode_cell({ r: R, c: 0 })]?.v).includes("TOTAL");

    const colIndex = C;
    const isHoursCol = colIndex === 7;
    const isFteCol = colIndex === 8;

    let fillColor = "FFFFFF";

    if (!header && (isHoursCol || isFteCol)) {
      const row = rows[R - 1];
      const hours = Number(row?.Hours || 0);
      const fte = Number(row?.FTE || 0);
      fillColor = getUtilColor(hours, fte);
    }

    if (header) {
      ws[cellAddress].s = {
        font: { bold: true, color: { rgb: "FFFFFF" } },
        fill: { fgColor: { rgb: "0EA5E9" } },
        alignment: { horizontal: "center", vertical: "center" },
      };
    } 
    
    else if (isTotalRow) {
      ws[cellAddress].s = {
        font: { bold: true, color: { rgb: "111827" } },
        fill: { fgColor: { rgb: "DBEAFE" } },
        alignment: { horizontal: "center", vertical: "center" },
      };
    } 
    
    else {
      ws[cellAddress].s = {
        fill: { fgColor: { rgb: fillColor } },
        alignment: {
          horizontal: "center",
          vertical: "center",
          wrapText: true,
        },
        border: {
          top: { style: "thin", color: { rgb: "E5E7EB" } },
          bottom: { style: "thin", color: { rgb: "E5E7EB" } },
          left: { style: "thin", color: { rgb: "E5E7EB" } },
          right: { style: "thin", color: { rgb: "E5E7EB" } },
        },
      };
    }
  }
}

  /* =========================================================
      FREEZE HEADER
  ========================================================= */

  ws["!freeze"] = {
    xSplit: 0,
    ySplit: 1,
  };

  /* =========================================================
      APPEND SHEET
  ========================================================= */

  XLSX.utils.book_append_sheet(
    wb,
    ws,
    "EMPLOYEE REPORT"
  );

  // ==================== NEW SHEET=====================================
const pivotMap: Record<string, any> = {};
const monthSet = new Set<string>();

const monthKey = (m: number, y: number) => {
  const date = new Date(y, m - 1);
  return `${date.toLocaleString("en-US", { month: "short" })}-${String(y).slice(-2)}`;
};

// 1️⃣ BUILD PIVOT DATA DYNAMICALLY
data.forEach((emp) => {
  if (!pivotMap[emp.name]) {
    pivotMap[emp.name] = {
      "Row Labels": emp.name,
      "Sum of HOURS": 0,
      "Sum of FTE": 0,
    };
  }

  emp.allocations.forEach((a) => {
    const key = monthKey(a.month, a.year);

    monthSet.add(key);

    if (!pivotMap[emp.name][key]) {
      pivotMap[emp.name][key] = 0;
    }

    pivotMap[emp.name][key] += Number(a.hours || 0);

    pivotMap[emp.name]["Sum of HOURS"] += Number(a.hours || 0);
    pivotMap[emp.name]["Sum of FTE"] += Number(a.fte || 0);
  });
});

// 2️⃣ BUILD FINAL COLUMN ORDER
const monthColumns = Array.from(monthSet).sort();

const columns = [
  "Row Labels",
  "Sum of HOURS",
  "Sum of FTE",
  ...monthColumns,
];

// 3️⃣ CONVERT TO SHEET FORMAT
const pivotRows = Object.values(pivotMap).map((row: any) => {
  const obj: any = {};

  columns.forEach((col) => {
    obj[col] = row[col] ?? 0;
  });

  return obj;
});

const pivotSheet = XLSX.utils.json_to_sheet(pivotRows);

// 4️⃣ AUTO COLUMN WIDTH
pivotSheet["!cols"] = columns.map(() => ({ wch: 18 }));

// 5️⃣ STYLING (HEADER + ZEBRA ROW COLORS)
const rangepivot = XLSX.utils.decode_range(pivotSheet["!ref"] || "");

for (let R = 0; R <= rangepivot.e.r; R++) {
  for (let C = 0; C <= rangepivot.e.c; C++) {
    const cell = XLSX.utils.encode_cell({ r: R, c: C });

    if (!pivotSheet[cell]) continue;

    const isHeader = R === 0;

    const rowColor = isHeader
      ? "0EA5E9" // blue header
      : R % 2 === 0
      ? "F1F5F9" // light gray
      : "FFFFFF";

    pivotSheet[cell].s = {
      fill: {
        fgColor: { rgb: rowColor },
      },
      alignment: {
        horizontal: "center",
        vertical: "center",
        wrapText: true,
      },
      font: isHeader
        ? { bold: true, color: { rgb: "FFFFFF" }, sz: 12 }
        : { bold: false, color: { rgb: "111827" } },
      border: {
        top: { style: "thin", color: { rgb: "E5E7EB" } },
        bottom: { style: "thin", color: { rgb: "E5E7EB" } },
        left: { style: "thin", color: { rgb: "E5E7EB" } },
        right: { style: "thin", color: { rgb: "E5E7EB" } },
      },
    };
  }
}

// 6️⃣ ADD SHEET TO WORKBOOK
XLSX.utils.book_append_sheet(
  wb,
  pivotSheet,
  "PIVOT SUMMARY"
);

  /* =========================================================
      EXPORT
  ========================================================= */

  XLSX.writeFile(
    wb,
    "RESOURCELYTICS_REPORT.xlsx"
  );
};

// ========================= EXPORT PDF ========================= */
const exportPDF = async () => {
  // 1. FETCH REAL DATA
  try {
      const response = await fetch(
        "http://localhost:5000/api/employees/reports",
        {
          headers: {
            Authorization: `Bearer ${token}`
          },
        }
      );

    const res = await response.json();
    const data = res.data || res;

    const doc = new jsPDF("p", "mm", "a4");
    
    // --- BRAND COLORS & CONFIG ---
    const colors = {
      primary: [6, 96, 145] as [number, number, number], // Sky Blue Dark
      secondary: [240, 249, 255] as [number, number, number], // Light Sky Background
      textMain: [30, 41, 59] as [number, number, number],
      success: [22, 163, 74] as [number, number, number],
      danger: [220, 38, 38] as [number, number, number],
      accent: [14, 165, 233] as [number, number, number],
      heading: [2, 18, 99] as [number, number, number],
      body: [2, 27, 156] as [number, number, number],
      text: [5, 33, 176] as [number, number, number],
      border: [226, 232, 240] as [number, number, number],  // Slate 200
    };

    const getBase64Image = async (url: string) => {
    const res = await fetch(url);
    const blob = await res.blob();

    return new Promise<string>((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.readAsDataURL(blob);
    });
  };

    const logoBase64 = await getBase64Image("/LOGO_COPY.png"); 

    /* =====================================================
        PAGE 1: BRANDED COVER
    ===================================================== */
    // Background Accent
    doc.setFillColor(...colors.secondary);
    doc.rect(0, 0, 210, 297, "F");
    
    // White Box Design
    doc.setFillColor(...colors.secondary);
    doc.rect(0, 0, 210, 297, "F");

    // ✅ LOGO (CENTERED, BALANCED SIZE)
    const logoWidth = 180;
    const logoHeight = 70;
    const logoX = (210 - logoWidth) / 2;

    doc.addImage(logoBase64, "PNG", logoX, 40, logoWidth, logoHeight);

    // ✅ MAIN TITLE
    doc.setFont("times", "bold");
    doc.setFontSize(24);
    doc.setTextColor(...colors.text);

    doc.text(
      "Resource Utilization & Financial",
      105,
      120,
      { align: "center" }
    );

    doc.text(
      "Performance Report",
      105,
      130,
      { align: "center" }
    );

    // ✅ REPORT PERIOD
    doc.setFont("normal");
    doc.setFontSize(12);
    doc.setTextColor(...colors.heading);

    doc.text(
      `Reporting Period: ${new Date().toLocaleDateString('en-GB', {
        month: 'long',
        year: 'numeric'
      })}`,
      105,
      150,
      { align: "center" }
    );

    // ✅ OPTIONAL: PREPARED FOR (CLIENT TOUCH 🔥)
    doc.setFontSize(12);
    doc.setTextColor(...colors.body);

    doc.text("Prepared by Resourcelytics", 105, 165, {
      align: "center"
    });
    
    /* =====================================================
        PAGE 2: EXECUTIVE SUMMARY
    ===================================================== */
    doc.addPage();
    
    // Calculations
    const totalRev = data.reduce((s: number, e: EmployeeReport) => s + Number(e.summary?.total_revenue || 0), 0);
    const totalCost = data.reduce((s: number, e: EmployeeReport) => s + Number(e.summary?.total_cost || 0), 0);
    const netProfit = totalRev - totalCost;

    doc.setFontSize(24);
    doc.setFont("times", "bold");
    doc.setTextColor(...colors.primary);
    doc.text("EXECUTIVE SUMMARY", 105, 25,  { align: "center" });

    // KPI Cards (Simulated with Rects)
    const drawKPI = (
      x: number,
      y: number,
      label: string,
      value: string,
      color: [number, number, number]
    ) => {
      const cardWidth = 58;

      // Background card
      doc.setFillColor(...colors.secondary);
      doc.roundedRect(x, y, cardWidth, 30, 2, 2, "F");

      // LABEL (centered)
      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(...colors.heading);
      doc.text(label, x + cardWidth / 2, y + 10, {
        align: "center"
      });

      // VALUE (centered + colored)
      doc.setFontSize(14);
      doc.setTextColor(...color);
      doc.text(value, x + cardWidth / 2, y + 22, {
        align: "center"
      });
    };

    drawKPI(14, 35, "TOTAL REVENUE", `INR ${totalRev.toLocaleString()}`, colors.textMain);
    drawKPI(76, 35, "OPERATIONAL COST", `INR ${totalCost.toLocaleString()}`, colors.textMain);
    drawKPI(138, 35, "NET MARGIN", `INR ${netProfit.toLocaleString()}`, netProfit >= 0 ? colors.success : colors.danger);

    /* =====================================================
        INDIVIDUAL RESOURCE PAGES
    ===================================================== */
    data.forEach((emp: EmployeeReport) => {
      doc.addPage();
      
      // ✅ HEADER BACKGROUND
      doc.setFillColor(...colors.secondary);
      doc.rect(0, 0, 210, 35, "F");

      // ✅ LOGO (LEFT SIDE)
      doc.addImage(logoBase64, "PNG", 12, 8, 28, 12);
      
      // ✅ EMPLOYEE NAME (CENTER BIG TITLE)
      doc.setFont("times", "bold");
      doc.setFontSize(24);
      doc.setTextColor(...colors.primary);

      doc.text(emp.name.toUpperCase(), 105, 20, {
        align: "center"
      });

      // ✅ EMAIL (CENTER SUBTEXT)
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.setTextColor(...colors.heading);

      doc.text(emp.email, 105, 26, {
        align: "center"
      });

      // ✅ SKILLS (CENTER, LIGHTER)
      doc.setFont("helvetica", "bold");
      doc.setFontSize(9);
      doc.setTextColor(...colors.body);

      doc.text(emp.skills.join(" • "), 105, 31, {
        align: "center",
        maxWidth: 160
      });


      // Table
      autoTable(doc, {
        startY: 45,
        head: [["PROJECT", "PERIOD", "HOURS", "FTE", "REVENUE", "COST", "PROFIT"]],
        body: emp.allocations.map((a: any) => {
          const rev = Number(a.revenue || 0);
          const cst = Number(a.cost || 0);
          const prof = rev - cst;
          return [
            { content: a.project_name, styles: { fontStyle: 'bold' } },
            `${a.month}/${a.year}`,
            `${a.hours}h`,
            (a.fte || a.hours / 160).toFixed(2),
            `INR ${rev.toLocaleString()}`,
            `INR ${cst.toLocaleString()}`,
            {
              content: `INR ${prof.toLocaleString()}`,
              styles: { textColor: prof >= 0 ? colors.success : colors.danger, fontStyle: 'bold' }
            }
          ];
        }),
        theme: "plain",
        headStyles: {
          fillColor: [255, 255, 255],
          textColor: colors.primary,
          fontStyle: "bold",
          fontSize: 8,
          halign: "center",
          lineColor: colors.border,
          lineWidth: 0.1
        },
        styles: {
          fontSize: 8,
          cellPadding: 4,
          halign: "center",
          textColor: colors.textMain
        },
        alternateRowStyles: {
          fillColor: [252, 253, 254]
        }
      });

      // Subtle Summary Ribbon
      const finalY = (doc as any).lastAutoTable.finalY + 10;
      doc.setDrawColor(...colors.border);
      doc.setLineWidth(0.5);
      doc.line(20, finalY, 190, finalY);
      
      doc.setFontSize(9);
      doc.setTextColor(...colors.textMain);
      doc.text(`Total Effort: ${emp.summary.total_hours}h`, 20, finalY + 8);
      doc.text(`Total Revenue: INR ${emp.summary.total_revenue.toLocaleString()}`, 80, finalY + 8);
      
      doc.setFont("helvetica", "bold");
      doc.text(`Net Contribution: INR ${emp.summary.profit.toLocaleString()}`, 145, finalY + 8);
    });

    // Global Footer with simple line
    const pageCount = doc.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setDrawColor(...colors.border);
      doc.line(20, 282, 190, 282);
      doc.setFontSize(7);
      doc.setTextColor(150);
      doc.text("Resourcelytics Proprietary Data", 20, 288);
      doc.text(`Page ${i} of ${pageCount}`, 190, 288, { align: "right" });
    }

    doc.save(`RESOURCELYTICS_REPORT.pdf`);

  } catch (error) {
    console.error("Failed to generate premium report:", error);
    alert("Error fetching real-time data. Please check the API connection.");
  }
};

  /* ========================= UI ========================= */

return (
    <div className="min-h-screen bg-slate-50 p-8 font-sans text-slate-900">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* PREMIUM HEADER */}
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-8 rounded-2xl shadow-sm border border-slate-100">
          <div className="flex items-center gap-5">
            <div className="bg-sky-600 p-3 rounded-xl text-white shadow-lg shadow-blue-200">
              <ClipboardList size={28} />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Operational & Financial <span className="text-sky-600">Analytics</span></h1>
              <p className="text-slate-600 font-medium">Analyze operations, utilization, and financial trends</p>
            </div>
          </div>

        <div className="flex gap-4">
          <button
            onClick={exportExcel}
            className="flex items-center justify-center gap-2 bg-sky-600 hover:bg-sky-800 text-white px-6 py-3 rounded-xl transition-all active:scale-95 shadow-md text-[16px] font-semibold"
          >
            <Download size={20} />
            Export Data
          </button>

          <button
          onClick={exportPDF}
          className="flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-xl transition-all active:scale-95 shadow-md text-[16px] font-semibold"
          >
          <Download size={20} />
          Download PDF
        </button>
        </div>
        </header>
     
{/* ========================= PREMIUM FILTER BAR ========================= */}

<div className="bg-white/80 backdrop-blur-lg border border-slate-200 rounded-2xl shadow-sm overflow-hidden">

  {/* TOP BAR */}
<div className="flex items-center justify-between px-6 py-4 border-b bg-gradient-to-r from-slate-50 to-white">
  
  <div className="flex items-center gap-3">
    <div className="p-2 bg-blue-100 text-blue-600 rounded-xl shadow-sm">
      <Filter size={16} />
    </div>

    <div>
      <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider">
        Filters & Insights
      </h2>

      <p className="text-xs text-slate-500">
        Refine Employee Analytics
      </p>
    </div>
  </div>

  <div className="flex items-center gap-3">

    <button
      onClick={resetFilters}
      className="flex items-center gap-1.5 text-xs font-semibold text-indigo-400 hover:text-green-500 transition group"
    >
      <RotateCcw
        size={20}
        className="group-hover:-rotate-45 transition"
      />
    </button>

    {/* EXPAND / COLLAPSE BUTTON */}
    <button
      onClick={() => setFiltersOpen((prev) => !prev)}
      className={`h-9 w-9 flex items-center justify-center rounded-xl border transition-all duration-300 ${
        filtersOpen
          ? "bg-indigo-100 border-indigo-200"
          : "bg-white hover:bg-indigo-50"
      }`}
    >
      {filtersOpen ? (
        <ChevronUp size={20} className="text-indigo-400 group-hover:-rotate-45 transition" />
      ) : (
        <ChevronDown size={20} className="text-indigo-400 group-hover:-rotate-45 transition" />
      )}
    </button>
  </div>
</div>

      <div
        className={`overflow-hidden transition-all duration-500 ease-in-out ${
          filtersOpen
            ? "max-h-[1200px] opacity-100 py-2"
            : "max-h-0 opacity-0"
        }`}
      >
      <div className="p-6 space-y-6">

    {/* ================= PRIMARY FILTERS ================= */}
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

      {/* SEARCH */}
      <div className="md:col-span-2">
        <label className="text-md font-semibold text-sky-800 mb-1 block">
          Search Employee
        </label>

        <div className="relative group">
          <Search
            size={18}
            className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500"
          />

          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Name, email, keyword..."
            className="w-full pl-11 pr-4 py-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-4 focus:ring-blue-100 focus:border-blue-400 outline-none transition text-sm"
          />
        </div>
      </div>

      {/* PROFIT */}
      <PremiumSelect
        label="Profitability"
        value={profitFilter}
        onChange={setProfitFilter}
        options={["All", "Profit", "Loss"]}
      />

    </div>

    {/* ================= SECOND ROW ================= */}
    <div className="grid grid-cols-[repeat(auto-fit,minmax(180px,1fr))] gap-4">

      <PremiumSelect
        label="Utilization"
        value={utilFilter}
        onChange={setUtilFilter}
        options={[
          "All",
          "Overallocated",
          "Underutilized",
          "Idle",
        ]}
      />

      <PremiumSelect
        label="Billing"
        value={billableFilter}
        onChange={setBillableFilter}
        options={["All", "Billable", "Non-Billable"]}
      />

      <PremiumSelect
        label="Month"
        value={month}
        onChange={setMonth}
        options={[
          "",
          "1",
          "2",
          "3",
          "4",
          "5",
          "6",
          "7",
          "8",
          "9",
          "10",
          "11",
          "12",
        ]}
        displayNames={[
          "All",
          "Jan",
          "Feb",
          "Mar",
          "Apr",
          "May",
          "Jun",
          "Jul",
          "Aug",
          "Sep",
          "Oct",
          "Nov",
          "Dec",
        ]}
      />

      <PremiumSelect  label="Year"
        value={year}
        onChange={setYear}
        options={["", ...uniqueYears.map(String)]}
        displayNames={["All Years", ...uniqueYears.map(String)]}
      />

    </div>

    {/* ================= THIRD ROW ================= */}
    <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-2 gap-4">

      <PremiumSelect
        label="Project"
        value={projectFilter}
        onChange={setProjectFilter}
        options={["", ...uniqueProjects]}
        displayNames={["All Projects", ...uniqueProjects]}
      />

      <PremiumSelect
        label="Skill"
        value={skillFilter}
        onChange={setSkillFilter}
        options={["", ...uniqueSkills]}
        displayNames={["All Skills", ...uniqueSkills]}
      />

      </div>
    </div>
  </div>
</div>
</div>

{/* DATA TABLE CONTAINER */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-sky-100/50 border-b border-slate-100">
                  <th className="p-5 text-md font-bold uppercase tracking-wider text-sky-800 text-center">Employee</th>
                  <th className="p-5 text-md font-bold uppercase tracking-wider text-sky-800 text-center hidden lg:table-cell">Skills</th>
                  <th className="p-5 text-md font-bold uppercase tracking-wider text-sky-800 text-center">Utilization</th>
                  <th className="p-5 text-md font-bold uppercase tracking-wider text-sky-800 text-center">Metrics (Rev/Cost)</th>
                  <th className="p-5 text-md font-bold uppercase tracking-wider text-sky-800 text-center">Net Profit</th>
                  <th className="p-5 w-10"></th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">
                {filteredData.map((e, i) => {
                  const isExpanded = expanded === e.name;
                  const utilization = Math.min((e.summary.total_hours / 160) * 100, 100);
                  
                  return (
                    <React.Fragment key={e.email}>
                      <tr 
                        onClick={() => setExpanded(isExpanded ? null : e.name)}
                        className={`hover:bg-blue-100/30 cursor-pointer transition-colors ${isExpanded ? 'bg-blue-50/50' : ''}`}
                      >
                        <td className="p-5">
                          <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-full bg-gradient-to-tr from-sky-200 to-sky-100 flex items-center justify-center text-slate-800 border border-slate-200">
                              <User size={20} />
                            </div>
                            <div>
                              <div className="font-bold text-slate-800">{e.name}</div>
                              <div className="text-xs text-sky-800 flex items-center gap-1">
                                <Mail size={12} /> {e.email}
                              </div>
                            </div>
                          </div>
                        </td>

                        <td className="p-5 hidden lg:table-cell text-center">
                          <div className="flex flex-wrap justify-center items-center gap-1 max-w-[220px] mx-auto">
                            
                            {e.skills.map((skill) => (
                              <span
                                key={skill}
                                className="px-2 py-0.5 bg-sky-50 text-slate-600 rounded text-[10px] font-bold uppercase tracking-tight"
                              >
                                {skill}
                              </span>
                            ))}

                          </div>
                        </td>

                        <td className="p-5 text-center">
                          <div className="w-full max-w-[100px]">
                            <div className="flex justify-center mb-1 text-[10px] font-bold text-slate-500 uppercase">
                              <span>{utilization.toFixed(0)}%</span>
                            </div>
                            <div className="w-full bg-sky-100 rounded-full h-1.5">
                              <div 
                                className={`h-1.5 rounded-full transition-all duration-500 ${utilization > 80 ? 'bg-emerald-500' : 'bg-blue-500'}`} 
                                style={{ width: `${utilization}%` }}
                              />
                            </div>
                          </div>
                        </td>

                        <td className="p-5 text-sm text-center">
                          <div className="flex flex-col items-center space-y-1">
                            
                        <div className="text-emerald-600 font-bold flex items-center justify-center gap-1">
                          <TrendingUp size={14} />

                          INR {(e.summary?.total_revenue || 0).toLocaleString("en-IN")}
                        </div>

                        <div className="text-rose-600 font-medium flex items-center justify-center gap-1">
                          <TrendingDown size={14} />

                          INR {(e.summary?.total_cost || 0).toLocaleString("en-IN")}
                        </div>

                          </div>
                        </td>

                        <td className="p-5 text-center">
                          <span className={`inline-flex items-center px-3 py-1 rounded-lg font-bold text-sm ${
                            e.summary.profit >= 0 ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'
                          }`}>
                            INR {(e.summary?.profit || 0).toLocaleString("en-IN")}
                          </span>
                        </td>

                        <td className="p-5 text-slate-400">
                          {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                        </td>
                      </tr>

                      {/* EXPANDED DETAIL VIEW */}
                      {isExpanded && (
                        <tr>
                          <td colSpan={6} className="p-0 bg-slate-50/80">
                            <div className="p-8 border-t border-slate-200">
                              
                              <div className="flex items-center gap-2 mb-6">
                                <Layers size={18} className="text-blue-500" />
                                <h3 className="font-bold text-slate-700">
                                  Project Allocation Breakdown
                                </h3>
                              </div>

                              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">

                                {e.allocations.length > 0 ? (
                                  e.allocations.map((a, idx) => (
                                    <div
                                      key={idx}
                                      className="bg-white p-5 rounded-xl border shadow-sm"
                                    >
                                      <div className="flex justify-between mb-4">
                                        <h4 className="font-bold text-blue-600">
                                          {a.project_name}
                                        </h4>

                                        <span
                                          className={`text-[10px] font-bold px-2 py-[2px] inline-flex items-center rounded ${
                                            a.billable
                                              ? "bg-green-100 text-green-700"
                                              : "bg-yellow-100 text-yellow-700"
                                          }`}
                                        >
                                          {a.billable ? "BILLABLE" : "INTERNAL"}
                                        </span>
                                      </div>

                                      <div className="grid grid-cols-2 gap-y-2 text-sm">

                                        <div>Period</div>
                                        <div className="text-right font-bold">
                                          {a.month}/{a.year}
                                        </div>

                                        <div>Hours / FTE</div>
                                        <div className="text-right font-bold">
                                          {a.hours}h ({a.fte})
                                        </div>

                                        <div>Rate</div>
                                        <div className="text-right font-bold">INR {a.rate}</div>

                                        <div>Revenue</div>
                                        <div className="text-right font-bold text-green-600">
                                          INR {a.revenue}
                                        </div>

                                        <div>Cost</div>
                                        <div className="text-right font-bold text-red-500">
                                          INR {a.cost}
                                        </div>

                                        <div>Profit</div>
                                        <div
                                          className={`text-right font-bold ${
                                            a.revenue - a.cost >= 0
                                              ? "text-green-600 font-bold"
                                              : "text-red-600 font-bold"
                                          }`}
                                        >
                                          INR {a.revenue - a.cost}
                                        </div>

                                      </div>
                                    </div> 
                                  ))
                                ) : (
                                  <div className="col-span-full text-center py-10 text-gray-400">
                                    No Allocations
                                  </div>
                                )}

                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
  );
}

const PremiumSelect = ({
  label,
  value,
  onChange,
  options,
  displayNames,
}: any) => (
  <div className="flex flex-col gap-1">
    <label className="text-md font-semibold text-sky-800">
      {label}
    </label>

    <div className="relative group">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm font-medium text-slate-700 appearance-none cursor-pointer
        transition-all
        hover:bg-white hover:border-blue-300
        focus:bg-white focus:ring-4 focus:ring-blue-100 focus:border-blue-400 outline-none"
      >
        {options.map((opt: any, i: number) => (
          <option key={opt} value={opt}>
            {displayNames ? displayNames[i] : opt}
          </option>
        ))}
      </select>

      <ChevronDown
        size={14}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
      />
    </div>
  </div>
);