import { useEffect, useMemo, useState } from "react";
import {
  Users,
  Briefcase,
  Search,
  Building2,
  Sparkles,
  Filter,
  MapPin,
  BarChart3,
  Layers,
  TrendingUpDown,
  Target,
  ArrowUpRight,
  Download,
  BrainCircuit,
  Clock3,
} from "lucide-react";

import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  BarChart,
  Bar,
  XAxis,
  YAxis,
} from "recharts";

import { motion, AnimatePresence } from "framer-motion";

import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

/* =========================================================
   CONSTANTS
========================================================= */

const MONTHLY_CAPACITY = 160;

/* =========================================================
   STATUS THEMES
========================================================= */

const STATUS_THEMES: any = {
  Billable: {
    color: "#10b981",
    text: "text-emerald-700",
    dot: "bg-emerald-500",
    bg: "bg-emerald-50",
    border: "border-emerald-200",
  },

  "Partial Bench": {
    color: "#f59e0b",
    text: "text-amber-700",
    dot: "bg-amber-500",
    bg: "bg-amber-50",
    border: "border-amber-200",
  },

  "Fully Bench": {
    color: "#ef4444",
    text: "text-rose-700",
    dot: "bg-rose-500",
    bg: "bg-rose-50",
    border: "border-rose-200",
  },

  Overallocated: {
    color: "#7c3aed",
    text: "text-violet-700",
    dot: "bg-violet-500",
    bg: "bg-violet-50",
    border: "border-violet-200",
  },
};

/* =========================================================
   HELPERS
========================================================= */

function getEmployeeStatus(billableHours: number) {
  if (billableHours <= 0) {
    return "Fully Bench";
  }

  if (billableHours < 112) {
    return "Partial Bench";
  }

  if (billableHours <= 160) {
    return "Billable";
  }

  return "Overallocated";
}

function formatMonth(month: number) {
  const months = [
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
  ];

  return months[month - 1];
}

/* =========================================================
   MAIN COMPONENT
========================================================= */

export default function PremiumBenchManagement() {
  const API_BASE =
    import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

  const [loading, setLoading] = useState(true);

  const [benchData, setBenchData] = useState<any[]>([]);

  const [search, setSearch] = useState("");

  const [statusFilter, setStatusFilter] = useState("All");

  const [roleFilter, setRoleFilter] = useState("All");

  const [sortBy, setSortBy] = useState("bench");

  const [selectedEmployee, setSelectedEmployee] = useState<any | null>(null);

  /* =========================================================
     FETCH REAL TIME DATA
  ========================================================= */

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

        const nonBillableHours =
          totalHours - billableHours;

        const totalFTE =
          Number((totalHours / MONTHLY_CAPACITY).toFixed(2));

        const billableFTE =
          Number((billableHours / MONTHLY_CAPACITY).toFixed(2));

        const nonBillableFTE =
          Number((nonBillableHours / MONTHLY_CAPACITY).toFixed(2));

        const utilization =
          Number(
            (
              (billableHours / MONTHLY_CAPACITY) *
              100
            ).toFixed(1)
          );

        const benchHours =
          Math.max(0, MONTHLY_CAPACITY - billableHours);

        const benchFTE =
          Number((benchHours / MONTHLY_CAPACITY).toFixed(2));

        const status =
          getEmployeeStatus(billableHours);

        /* ==========================================
           MONTH FORECAST
        ========================================== */

        const monthlyForecast =
          (item.monthlyBench || []).map((m: any) => {
            const monthTotalHours =
              m.totalAllocation || 0;

            const monthBillableHours =
              m.billableHours || 0;

            const monthNonBillableHours =
              monthTotalHours - monthBillableHours;

            const monthTotalFTE =
              Number(
                (
                  monthTotalHours / MONTHLY_CAPACITY
                ).toFixed(2)
              );

            const monthBillableFTE =
              Number(
                (
                  monthBillableHours /
                  MONTHLY_CAPACITY
                ).toFixed(2)
              );

            const monthBenchHours =
              Math.max(
                0,
                MONTHLY_CAPACITY -
                  monthBillableHours
              );

            const monthBenchFTE =
              Number(
                (
                  monthBenchHours /
                  MONTHLY_CAPACITY
                ).toFixed(2)
              );

            const monthUtilization =
              Number(
                (
                  (monthBillableHours /
                    MONTHLY_CAPACITY) *
                  100
                ).toFixed(1)
              );

            return {
              ...m,

              totalHours: monthTotalHours,

              billableHours: monthBillableHours,

              nonBillableHours:
                monthNonBillableHours,

              totalFTE: monthTotalFTE,

              billableFTE: monthBillableFTE,

              benchHours: monthBenchHours,

              benchFTE: monthBenchFTE,

              utilization: monthUtilization,

              status:
                getEmployeeStatus(
                  monthBillableHours
                ),
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
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  /* =========================================================
     STATS
  ========================================================= */

  const stats = useMemo(() => {
    return {
      total: benchData.length,

      billable: benchData.filter(
        (e) => e.status === "Billable"
      ).length,

      partial: benchData.filter(
        (e) => e.status === "Partial Bench"
      ).length,

      bench: benchData.filter(
        (e) => e.status === "Fully Bench"
      ).length,

      overallFTE:
        benchData.reduce(
          (acc, curr) => acc + curr.totalFTE,
          0
        ),

      benchFTE:
        benchData.reduce(
          (acc, curr) => acc + curr.benchFTE,
          0
        ),

      billableFTE:
        benchData.reduce(
          (acc, curr) => acc + curr.billableFTE,
          0
        ),
    };
  }, [benchData]);

  /* =========================================================
     FILTERED DATA
  ========================================================= */

  const filteredData = useMemo(() => {
    let data = benchData.filter((item) => {
      const employee = item.employee;

      const text = `
        ${employee.name}
        ${employee.email}
        ${employee.employeeCode}
        ${employee.roleId?.name}
      `.toLowerCase();

      const matchesSearch =
        text.includes(search.toLowerCase());

      const matchesStatus =
        statusFilter === "All" ||
        item.status === statusFilter;

      const matchesRole =
        roleFilter === "All" ||
        (employee.roleId?.name || "Unassigned") ===
          roleFilter;

      return (
        matchesSearch &&
        matchesStatus &&
        matchesRole
      );
    });

    data.sort((a, b) => {
      if (sortBy === "name") {
        return a.employee.name.localeCompare(
          b.employee.name
        );
      }

      if (sortBy === "fte") {
        return b.totalFTE - a.totalFTE;
      }

      return b.benchHours - a.benchHours;
    });

    return data;
  }, [
    benchData,
    search,
    statusFilter,
    roleFilter,
    sortBy,
  ]);

  /* =========================================================
     EXPORT PDF
  ========================================================= */

  const exportReport = () => {
    const doc = new jsPDF();

    doc.setFontSize(18);

    doc.text("Bench Forecast Report", 14, 20);

    autoTable(doc, {
      startY: 30,

      head: [
        [
          "Employee",
          "Role",
          "Billable Hours",
          "Bench Hours",
          "Billable FTE",
          "Status",
        ],
      ],

      body: filteredData.map((item) => [
        item.employee.name,

        item.employee.roleId?.name || "N/A",

        item.billableHours,

        item.benchHours,

        item.billableFTE,

        item.status,
      ]),
    });

    doc.save("BENCH_FORECAST_REPORT.pdf");
  };

  /* =========================================================
     LOADING
  ========================================================= */

  if (loading) {
    return <LoadingScreen />;
  }

  /* =========================================================
     UI
  ========================================================= */

  return (
    <div className="min-h-screen bg-slate-100">

      {/* =====================================================
         NAVBAR
      ===================================================== */}

      <nav className="bg-white border-b border-slate-200 px-8 py-5">
        <div className="max-w-[1800px] mx-auto flex justify-between items-center">

          <div className="flex items-center gap-4">
            <div className="p-3 rounded-2xl bg-indigo-600 text-white">
              <TrendingUpDown size={28} />
            </div>

            <div>
              <h1 className="text-3xl font-black">
                Workforce Forecast
              </h1>

              <p className="text-slate-500 font-medium">
                Real-time Bench Prediction Engine
              </p>
            </div>
          </div>

          <button
            onClick={exportReport}
            className="px-5 py-3 rounded-xl bg-emerald-600 text-white font-black flex items-center gap-2"
          >
            <Download size={16} />
            Export Report
          </button>
        </div>
      </nav>

      {/* =====================================================
         BODY
      ===================================================== */}

      <div className="max-w-[1800px] mx-auto p-8 grid grid-cols-12 gap-8">

        {/* =====================================================
           FILTERS
        ===================================================== */}

        <aside className="col-span-12 lg:col-span-2 space-y-5">

          <div>
            <p className="text-xs font-black uppercase text-slate-400 mb-2">
              Search
            </p>

            <div className="relative">
              <Search
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              />

              <input
                value={search}
                onChange={(e) =>
                  setSearch(e.target.value)
                }
                placeholder="Search Employee"
                className="w-full bg-white border border-slate-200 rounded-xl py-3 pl-10 pr-4 outline-none"
              />
            </div>
          </div>

          <div>
            <p className="text-xs font-black uppercase text-slate-400 mb-2">
              Status
            </p>

            <div className="space-y-2">
              {[
                "All",
                "Billable",
                "Partial Bench",
                "Fully Bench",
                "Overallocated",
              ].map((status) => (
                <button
                  key={status}
                  onClick={() =>
                    setStatusFilter(status)
                  }
                  className={`w-full text-left px-4 py-3 rounded-xl font-bold transition-all ${
                    statusFilter === status
                      ? "bg-indigo-600 text-white"
                      : "bg-white border border-slate-200"
                  }`}
                >
                  {status}
                </button>
              ))}
            </div>
          </div>

          <div>
            <p className="text-xs font-black uppercase text-slate-400 mb-2">
              Role
            </p>

            <select
              value={roleFilter}
              onChange={(e) =>
                setRoleFilter(e.target.value)
              }
              className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3"
            >
              <option value="All">
                All Roles
              </option>

              {[
                ...new Set(
                  benchData.map(
                    (e) =>
                      e.employee.roleId?.name ||
                      "Unassigned"
                  )
                ),
              ].map((role: any) => (
                <option
                  key={role}
                  value={role}
                >
                  {role}
                </option>
              ))}
            </select>
          </div>
        </aside>

        {/* =====================================================
           MAIN TABLE
        ===================================================== */}

        <main className="col-span-12 lg:col-span-7">

          <div className="bg-white rounded-[2rem] overflow-hidden border border-slate-200">

            <div className="p-6 border-b border-slate-100 flex justify-between items-center">
              <h2 className="text-xl font-black">
                Workforce Registry
              </h2>

              <span className="px-3 py-1 rounded-full bg-slate-100 text-xs font-black">
                {filteredData.length} RESOURCES
              </span>
            </div>

            <div className="overflow-x-auto">

              <table className="w-full">

                <thead>
                  <tr className="bg-slate-50 text-left">
                    <th className="px-6 py-4 text-xs font-black uppercase">
                      Employee
                    </th>

                    <th className="px-6 py-4 text-xs font-black uppercase">
                      Billable
                    </th>

                    <th className="px-6 py-4 text-xs font-black uppercase">
                      Bench
                    </th>

                    <th className="px-6 py-4 text-xs font-black uppercase">
                      Status
                    </th>
                  </tr>
                </thead>

                <tbody>

                  {filteredData.map((item) => {

                    const theme =
                      STATUS_THEMES[item.status];

                    return (
                      <tr
                        key={item.employee._id}
                        onClick={() =>
                          setSelectedEmployee(item)
                        }
                        className="border-b border-slate-100 hover:bg-slate-50 cursor-pointer"
                      >
                        <td className="px-6 py-5">
                          <div className="flex items-center gap-3">

                            <div className="h-10 w-10 rounded-xl bg-indigo-100 flex items-center justify-center font-black text-indigo-700">
                              {item.employee.name.charAt(
                                0
                              )}
                            </div>

                            <div>
                              <p className="font-black text-slate-800">
                                {item.employee.name}
                              </p>

                              <p className="text-xs text-slate-500 font-bold">
                                {
                                  item.employee
                                    .employeeCode
                                }
                              </p>
                            </div>
                          </div>
                        </td>

                        {/* <td className="px-6 py-5 font-bold text-sm">
                          {item.employee.roleId?.name ||
                            "N/A"}
                        </td> */}

                        <td className="px-6 py-5">

                          <div className="space-y-1">
                            <p className="font-black text-slate-800">
                              {item.billableHours}h
                            </p>

                            <p className="text-xs text-slate-500 font-bold">
                              {item.billableFTE} FTE
                            </p>
                          </div>
                        </td>

                        <td className="px-6 py-5">

                          <div className="space-y-1">
                            <p className="font-black text-slate-800">
                              {item.benchHours}h
                            </p>

                            <p className="text-xs text-slate-500 font-bold">
                              {item.benchFTE} FTE
                            </p>
                          </div>
                        </td>

                        <td className="px-6 py-5">

                          <div
                            className={`inline-flex items-center gap-2 px-3 py-1 rounded-xl border ${theme.bg} ${theme.text} ${theme.border}`}
                          >
                            <div
                              className={`h-2 w-2 rounded-full ${theme.dot}`}
                            />

                            <span className="text-xs font-black uppercase">
                              {item.status}
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
        </main>

        {/* =====================================================
           RIGHT SIDEBAR
        ===================================================== */}

        <aside className="col-span-12 lg:col-span-3 space-y-6">

          {/* KPI */}

          <div className="bg-indigo-600 text-white rounded-[2rem] p-6">

            <p className="text-xs uppercase font-black tracking-widest text-indigo-200">
              Total Billable FTE
            </p>

            <h2 className="text-5xl font-black mt-2">
              {stats.billableFTE.toFixed(2)}
            </h2>

            <div className="grid grid-cols-2 gap-4 mt-6">

              <div>
                <p className="text-xs font-black uppercase text-indigo-200">
                  Bench FTE
                </p>

                <p className="text-2xl font-black">
                  {stats.benchFTE.toFixed(2)}
                </p>
              </div>

              <div>
                <p className="text-xs font-black uppercase text-indigo-200">
                  Workforce
                </p>

                <p className="text-2xl font-black">
                  {stats.total}
                </p>
              </div>
            </div>
          </div>

          {/* PIE */}

          <div className="bg-white rounded-[2rem] p-6 border border-slate-200">

            <h3 className="font-black mb-5">
              Workforce Distribution
            </h3>

            <div className="h-[240px]">

              <ResponsiveContainer width="100%" height="100%">
                <PieChart>

                  <Pie
                    data={[
                      {
                        name: "Billable",
                        value: stats.billable,
                      },

                      {
                        name: "Partial",
                        value: stats.partial,
                      },

                      {
                        name: "Bench",
                        value: stats.bench,
                      },
                    ]}
                    dataKey="value"
                    innerRadius={55}
                    outerRadius={80}
                  >
                    <Cell fill="#10b981" />
                    <Cell fill="#f59e0b" />
                    <Cell fill="#ef4444" />
                  </Pie>

                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </aside>
      </div>

      {/* =====================================================
         EMPLOYEE DETAILS
      ===================================================== */}

      <AnimatePresence>

        {selectedEmployee && (

          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() =>
                setSelectedEmployee(null)
              }
              className="fixed inset-0 bg-black/50 z-50"
            />

            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              className="fixed right-0 top-0 h-full w-full max-w-[520px] bg-white z-[60] overflow-y-auto p-8"
            >

              <div className="flex justify-between items-start">

                <div>
                  <h2 className="text-3xl font-black">
                    {
                      selectedEmployee.employee
                        .name
                    }
                  </h2>

                  <p className="text-indigo-600 font-bold uppercase">
                    {
                      selectedEmployee.employee
                        .employeeCode
                    }
                  </p>
                </div>

                <button
                  onClick={() =>
                    setSelectedEmployee(null)
                  }
                  className="px-4 py-2 rounded-xl bg-slate-100 font-bold"
                >
                  Close
                </button>
              </div>

              {/* SUMMARY */}

              <div className="grid grid-cols-2 gap-4 mt-8">

                <MetricCard
                  title="Billable Hours"
                  value={`${selectedEmployee.billableHours}h`}
                />

                <MetricCard
                  title="Bench Hours"
                  value={`${selectedEmployee.benchHours}h`}
                />

                <MetricCard
                  title="Billable FTE"
                  value={`${selectedEmployee.billableFTE}`}
                />

                <MetricCard
                  title="Bench FTE"
                  value={`${selectedEmployee.benchFTE}`}
                />
              </div>

              {/* MONTHLY FORECAST */}

              <div className="mt-10">

                <div className="flex items-center gap-2 mb-5">
                  <Clock3
                    size={18}
                    className="text-indigo-600"
                  />

                  <h3 className="text-xl font-black">
                    Monthly Forecast
                  </h3>
                </div>

                <div className="space-y-4">

                  {selectedEmployee.monthlyForecast
                    ?.sort((a: any, b: any) => {
                      return (
                        new Date(
                          a.year,
                          a.month
                        ).getTime() -
                        new Date(
                          b.year,
                          b.month
                        ).getTime()
                      );
                    })
                    .map((month: any) => {

                      const theme =
                        STATUS_THEMES[
                          month.status
                        ];

                      return (
                        <div
                          key={`${month.month}-${month.year}`}
                          className={`rounded-2xl border p-5 ${theme.bg} ${theme.border}`}
                        >

                          <div className="flex justify-between items-center">

                            <div>
                              <h4 className="font-black text-lg">
                                {formatMonth(
                                  month.month
                                )}{" "}
                                {month.year}
                              </h4>

                              <p className="text-sm font-medium text-slate-600">
                                Forecast Window
                              </p>
                            </div>

                            <div
                              className={`px-3 py-1 rounded-xl text-xs font-black uppercase ${theme.bg} ${theme.text}`}
                            >
                              {month.status}
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-4 mt-5">

                            <ForecastMetric
                              label="Billable Hours"
                              value={`${month.billableHours}h`}
                            />

                            <ForecastMetric
                              label="Bench Hours"
                              value={`${month.benchHours}h`}
                            />

                            <ForecastMetric
                              label="Billable FTE"
                              value={`${month.billableFTE}`}
                            />

                            <ForecastMetric
                              label="Bench FTE"
                              value={`${month.benchFTE}`}
                            />
                          </div>

                          {/* PROJECTS */}

                          <div className="mt-5">

                            <p className="text-xs uppercase font-black text-slate-500 mb-3">
                              Projects
                            </p>

                            <div className="flex flex-wrap gap-2">

                              {month.projects?.map(
                                (p: any) => (
                                  <div
                                    key={p._id}
                                    className={`px-3 py-2 rounded-xl text-xs font-bold ${
                                      p.billable
                                        ? "bg-emerald-100 text-emerald-700"
                                        : "bg-amber-100 text-amber-700"
                                    }`}
                                  >
                                    {p.name} •{" "}
                                    {
                                      p.allocatedHours
                                    }
                                    h
                                  </div>
                                )
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
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
   HELPER COMPONENTS
========================================================= */

function MetricCard({
  title,
  value,
}: any) {
  return (
    <div className="bg-slate-50 rounded-2xl p-5 border border-slate-200">

      <p className="text-xs uppercase font-black text-slate-400">
        {title}
      </p>

      <h4 className="text-2xl font-black mt-2">
        {value}
      </h4>
    </div>
  );
}

function ForecastMetric({
  label,
  value,
}: any) {
  return (
    <div className="bg-white rounded-xl p-3 border border-white/50">

      <p className="text-xs uppercase font-black text-slate-400">
        {label}
      </p>

      <h4 className="text-lg font-black mt-1">
        {value}
      </h4>
    </div>
  );
}

function LoadingScreen() {
  return (
    <div className="h-screen flex flex-col items-center justify-center bg-slate-50">

      <motion.div
        animate={{
          rotate: 360,
        }}
        transition={{
          repeat: Infinity,
          duration: 1.2,
          ease: "linear",
        }}
        className="h-16 w-16 border-4 border-indigo-600 border-t-transparent rounded-full"
      />

      <p className="mt-5 text-xs uppercase tracking-[0.3em] font-black text-slate-400">
        Loading Forecast Engine
      </p>
    </div>
  );
}