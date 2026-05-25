import React, { useEffect, useMemo, useState } from "react";
import {
  Plus,
  Search,
  Edit3,
  Trash2,
  Layers,
  Calendar,
  Activity,
  CheckCircle2,
  Clock,
  Ban,
  DollarSign,
  X,
  TrendingUp,
  Target,
  Users,
  Briefcase,
} from "lucide-react";

/* =========================================================
   TYPES
========================================================= */

interface Project {
  _id: string;
  name: string;
  type: "Billable" | "Non-Billable";
  billingModel: "Hourly" | "Fixed";
  billingRate?: number;
  billingCurrency: "INR",
  fixedMonthlyRevenue?: number;
  startMonth: string;
  startYear: number;
  status:
    | "Planned"
    | "Active"
    | "On_Hold"
    | "Completed"
    | "Cancelled";
  allowAllocations: boolean;
  allowMoves: boolean;
  targetFTE?: number;
  createdAt: string;
  updatedAt: string;
}

/* =========================================================
   CONSTANTS
========================================================= */

const STATUS_CONFIG = {
  Active: {
    color:
      "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
    icon: Activity,
  },

  Planned: {
    color: "bg-blue-500/10 text-blue-600 border-blue-500/20",
    icon: Calendar,
  },

  On_Hold: {
    color:
      "bg-amber-500/10 text-amber-600 border-amber-500/20",
    icon: Clock,
  },

  Completed: {
    color:
      "bg-indigo-500/10 text-indigo-600 border-indigo-500/20",
    icon: CheckCircle2,
  },

  Cancelled: {
    color: "bg-rose-500/10 text-rose-600 border-rose-500/20",
    icon: Ban,
  },
};

const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

/* =========================================================
   MAIN COMPONENT
========================================================= */

export default function Projects() {
  const API_BASE =
    import.meta.env.VITE_API_BASE_URL ||
    "http://localhost:5000";

  const token = localStorage.getItem("token");

  const user = JSON.parse(
    localStorage.getItem("user") || "{}"
  );

  const userRole = user?.role;

  /* ================= STATES ================= */

  const [projects, setProjects] = useState<Project[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [allocations, setAllocations] = useState<any[]>([]);

  const currentMonth = new Date().getMonth() + 1;
  const currentYear = new Date().getFullYear();

  const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());

  const [loading, setLoading] = useState(true);

  const [filters, setFilters] = useState({
    status: "All",
    billing: "All",
    search: "",
  });

  const [localFTE, setLocalFTE] = useState<
    Record<string, string>
  >({});

  const [isModalOpen, setIsModalOpen] =
    useState(false);

  const [editingProject, setEditingProject] =
    useState<Project | null>(null);

  /* =========================================================
     API HELPERS
  ========================================================= */

  const headers = {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  };

  /* =========================================================
     LOAD DATA
  ========================================================= */

  const loadData = async () => {
    setLoading(true);

    try {
      const [p, e, a] = await Promise.all([
        fetch(`${API_BASE}/api/projects`, {
          headers,
        }),

        fetch(`${API_BASE}/api/employees`, {
          headers,
        }),

        fetch(`${API_BASE}/api/allocations`, {
          headers,
        }),
      ]);

      const pd = await p.json();
      const ed = await e.json();
      const ad = await a.json();

      setProjects(pd.data || []);
      setEmployees(ed.data || []);
      setAllocations(ad.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  /* =========================================================
     DELETE PROJECT
  ========================================================= */

  const handleDelete = async (id: string) => {
    const confirmed = confirm(
      "Archive this project?"
    );

    if (!confirmed) return;

    try {
      await fetch(`${API_BASE}/api/projects/${id}`, {
        method: "DELETE",
        headers,
      });

      loadData();
    } catch (err) {
      console.error(err);
    }
  };

  /* =========================================================
     UPDATE FTE
  ========================================================= */

  const updateTargetFTE = async (
    projectId: string,
    value: number
  ) => {
    try {
      await fetch(
        `${API_BASE}/api/projects/${projectId}/target_fte`,
        {
          method: "PUT",
          headers,
          body: JSON.stringify({
            targetFTE: value,
          }),
        }
      );

      loadData();
    } catch (err) {
      console.error(err);
    }
  };

  /* =========================================================
     FILTERED PROJECTS
  ========================================================= */

  const filteredProjects = useMemo(() => {
    return projects.filter((p) => {
      const matchStatus =
        filters.status === "All" ||
        p.status === filters.status;

      const matchBilling =
        filters.billing === "All" ||
        p.type === filters.billing;

      const matchSearch = p.name
        .toLowerCase()
        .includes(filters.search.toLowerCase());

      return (
        matchStatus &&
        matchBilling &&
        matchSearch
      );
    });
  }, [projects, filters]);

  /* =========================================================
     ALLOCATION MAP
  ========================================================= */
const projectUsage = useMemo(() => {
  const map: Record<string, number> = {};

  allocations.forEach((a) => {
    const pid =
      a.projectId?._id ||
      a.projectId ||
      a.project_id?._id ||
      a.project_id;

    /* HANDLE MONTH FORMAT */
    let allocationMonth = a.month;

    // If month is stored as string like "May"
    if (typeof allocationMonth === "string") {
      allocationMonth =
        MONTHS.findIndex(
          (m) =>
            m.toLowerCase() ===
            allocationMonth.toLowerCase()
        ) + 1;
    }

    allocationMonth = Number(allocationMonth);

    const allocationYear = Number(a.year);

    /* FILTER */
    if (
      allocationMonth !== Number(selectedMonth) ||
      allocationYear !== Number(selectedYear)
    ) {
      return;
    }

    /* FTE */
    const fte = Number(a.allocationFTE || 0);

    map[pid] = (map[pid] || 0) + fte;
  });

  return map;
}, [allocations, selectedMonth, selectedYear]);

  /* =========================================================
     SUMMARY DATA
  ========================================================= */
const totalPlannedFTE = projects.reduce((s, p) => s + (p.targetFTE || 0), 0);

const totalAllocatedFTE = Object.values(projectUsage).reduce((s, v) => s + v, 0);

const totalPlannedHours = totalPlannedFTE * 160;

const totalAllocatedHours = totalAllocatedFTE * 160;

const utilization = Math.round((totalAllocatedFTE / (totalPlannedFTE || 1)) * 100);

  /* =========================================================
     UI
  ========================================================= */

  return (
     <div className="min-h-screen bg-[#F8FAFC] p-8 text-slate-900">
      {/* HEADER */}
      <div className="max-w-7xl mx-auto mb-8 flex flex-col lg:flex-row lg:items-center justify-between gap-4">

        {/* LEFT */}
        <div className="flex items-center gap-4">
          <div className="bg-sky-600 p-2.5 rounded-xl shadow-lg shadow-sky-200">
            <Layers className="text-white" size={28} />
          </div>

          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              Project<span className="text-sky-600"> Portfolio</span>
            </h1>

            <p className="text-slate-600 font-medium">
              Manage allocations and economics
            </p>
          </div>
        </div>

        {/* RIGHT CONTROLS */}
        <div className="flex flex-wrap items-center gap-3">

          {/* MONTH */}
          <select
            value={selectedMonth}
            onChange={(e) =>
              setSelectedMonth(Number(e.target.value))
            }
            className="h-11 px-4 bg-white border border-slate-200 rounded-xl text-sm font-semibold shadow-sm outline-none focus:ring-4 focus:ring-sky-500/10"
          >
            {MONTHS.map((month, index) => (
              <option key={month} value={index + 1}>
                {month}
              </option>
            ))}
          </select>

          {/* YEAR */}
          <select
            value={selectedYear}
            onChange={(e) =>
              setSelectedYear(Number(e.target.value))
            }
            className="h-11 px-4 bg-white border border-slate-200 rounded-xl text-sm font-semibold shadow-sm outline-none focus:ring-4 focus:ring-sky-500/10"
          >
            {[2024, 2025, 2026, 2027, 2028].map((year) => (
              <option key={year} value={year}>
                {year}
              </option>
            ))}
          </select>

          {/* CREATE BUTTON */}
          {(userRole === "Admin" ||
            userRole === "Finance") && (
            <button
              onClick={() => {
                setEditingProject(null);
                setIsModalOpen(true);
              }}
              className="h-11 px-5 bg-sky-600 hover:bg-sky-700 text-white rounded-xl font-semibold text-sm transition-all flex items-center gap-2 shadow-md active:scale-95"
            >
              <Plus size={18} />
              Create Project
            </button>
          )}
        </div>
      </div>

      {/* FILTER BAR */}
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row gap-4 mb-8">
        <div className="relative flex-1">
          <Search
            className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
            size={18}
          />

          <input
            placeholder="Search Projects..."
            value={filters.search}
            onChange={(e) =>
              setFilters({
                ...filters,
                search: e.target.value,
              })
            }
            className="w-full pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-2xl text-sm font-medium outline-none focus:ring-4 focus:ring-indigo-500/10 shadow-sm"
          />
        </div>

        <FilterDropdown
          value={filters.status}
          options={[
            "All",
            "Active",
            "Planned",
            "On_Hold",
            "Completed",
            "Cancelled",
          ]}
          onChange={(v: string) =>
            setFilters({
              ...filters,
              status: v,
            })
          }
        />

        <FilterDropdown
          value={filters.billing}
          options={[
            "All",
            "Billable",
            "Non-Billable",
          ]}
          onChange={(v: string) =>
            setFilters({
              ...filters,
              billing: v,
            })
          }
        />
      </div>

      {/* =========================================================
          SUMMARY CARDS
      ========================================================= */}

      <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">

        {/* TOTAL FTE */}
        <SummaryCard
          title="Planned Capacity"
          value={`${projects.reduce((s, p) => s + (p.targetFTE || 0), 0).toFixed(2)} FTE`}
        />

        {/* USED FTE */}
        <SummaryCard
          title="Consumed Capacity"
          value={`${totalAllocatedFTE.toFixed(2)} FTE`}
        />

        {/* TOTAL HOURS */}
        <SummaryCard
          title="Capacity Hours"
          value={`${totalPlannedHours.toFixed(0)}h`}
        />

        {/* ALLOCATED HOURS */}
        <SummaryCard
          title="Booked Hours"
          value={`${totalAllocatedHours.toFixed(0)}h`}  
        />
      </div>

      {/* =========================================================
          TABLE
      ========================================================= */}

      <div className="max-w-7xl mx-auto bg-white rounded-[2rem] border border-slate-100 shadow-2xl shadow-sky-200/40 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-indigo-50 transition-all align-middle">
                <th className="px-8 py-5 text-center text-[14px] font-bold uppercase tracking-widest text-indigo-800">
                  Project
                </th>

                <th className="px-6 py-5 text-center text-[14px] font-bold uppercase tracking-widest text-indigo-800">
                  Economics
                </th>

                <th className="px-6 py-5 text-center text-[14px]  font-bold uppercase tracking-widest text-indigo-800">
                  Timeline
                </th>

                <th className="px-6 py-5 text-center text-[14px]  font-bold uppercase tracking-widest text-indigo-800">
                  Capacity
                </th>

                <th className="px-6 py-5 text-center text-[14px]  font-bold uppercase tracking-widest text-indigo-800">
                  Status
                </th>

                <th className="px-8 py-5 text-center text-[14px]  font-bold uppercase tracking-widest text-indigo-800">
                  Actions
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td
                    colSpan={6}
                    className="py-32 text-center text-slate-400 animate-pulse"
                  >
                    Loading Projects...
                  </td>
                </tr>
              ) : (
                filteredProjects.map((p) => {
                  const config = STATUS_CONFIG[p.status as keyof typeof STATUS_CONFIG];

                  const StatusIcon = config.icon;


                  const capacity = p.targetFTE || 0;
                  const used = projectUsage[p._id] || 0;

                  const percent = capacity > 0 ? Math.min((used / capacity) * 100, 100) : 0;

                  const isOver = used > capacity;

                  const currencySymbolMap: Record<string, string> = {
                    INR: "₹",
                    USD: "$",
                    EUR: "€",
                    GBP: "£",
                  };

                  const currencySymbol = currencySymbolMap[p.billingCurrency] || "₹";

                  const getCapacityStatus = () => {
                  // No Plan + No Allocation
                  // 0.00 / 0.00
                  if (capacity === 0 && used === 0) {
                    return {
                      label: "UNPLANNED",
                      text: "text-cyan-600",
                      bar: "bg-cyan-400",
                    };
                  }

                  // 0.25 / 0.00
                  if (capacity === 0 && used > 0) {
                    return {
                      label: "UNALLOCATED",
                      text: "text-[#bf3cc7]",
                      bar: "bg-[#ee76f5]",
                    };
                  }

                  // 0.63 / 0.55
                  if (used > capacity) {
                    return {
                      label: "OVERLOADED",
                      text: "text-rose-500",
                      bar: "bg-rose-500",
                    };
                  }

                  // 0.55 / 0.55
                  if (used === capacity) {
                    return {
                      label: "OPTIMAL",
                      text: "text-emerald-600",
                      bar: "bg-emerald-500",
                    };
                  }

                  // 0.00 / 0.50
                  return {
                    label: "UNDERLOADED",
                    text: "text-amber-500",
                    bar: "bg-amber-500",
                  };
                };

                const statusConfig = getCapacityStatus();

                  return (
                    <tr
                      key={p._id}
                      className="hover:bg-sky-50 transition-all"
                    >
                      {/* PROJECT */}

                      <td className="px-6 py-6 align-middle">
                        <div className="flex items-center gap-4 max-w-[320px]">
                          <div>
                            <div className="font-bold text-slate-900">
                              {p.name}
                            </div>

                            <div className="text-[14px] text-slate-400 font-medium">
                              {p.billingModel}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* ECONOMICS */}

                      <td className="px-6 py-6 text-center align-middle">
                        <div className="flex flex-col items-center">
                          <span
                            className={`text-[10px] font-black px-2 py-1 rounded-lg border ${
                              p.type ===
                              "Billable"
                                ? "bg-emerald-50 text-emerald-600 border-emerald-100"
                                : "bg-yellow-50 text-yellow-600 border-yellow-100"
                            }`}
                          >
                            {p.type}
                          </span>

                          <div className="mt-2 text-sm font-bold text-slate-700">
                            {p.type === "Non-Billable"
                          ? "—"
                          : `${currencySymbol}${p.billingRate?.toFixed(2) || 0}`}
                          </div>
                        </div>
                      </td>

                      {/* TIMELINE */}

                      <td className="px-6 py-6 text-center align-middle">
                        <div className="text-sm font-bold text-slate-700">
                          {p.startMonth}
                        </div>

                        <div className="text-xs text-slate-400">
                          {p.startYear}
                        </div>
                      </td>

                    {/* CAPACITY */}

                    <td className="px-6 py-6 text-center align-middle">
                      <div className="flex flex-col items-center gap-2">

                        {/* INPUT */}
                        <div className="flex items-end gap-1">
                          <input
                            type="number"
                            value={
                              localFTE[p._id] ??
                              (p.targetFTE || 0)
                            }
                            disabled={
                              !(
                                userRole === "Admin" ||
                                userRole === "Finance"
                              )
                            }
                            onChange={(e) =>
                              setLocalFTE({
                                ...localFTE,
                                [p._id]: e.target.value,
                              })
                            }
                            onBlur={(e) =>
                              updateTargetFTE(
                                p._id,
                                Number(e.target.value)
                              )
                            }
                            className="w-14 text-center font-bold bg-transparent outline-none rounded-lg focus:ring-2 ring-indigo-500/20"
                          />

                          <span className="text-[10px] font-bold text-slate-800 mb-0.5">
                            FTE
                          </span>
                        </div>

                        {/* PROGRESS BAR */}
                        <div className="w-28 h-2 bg-sky-100 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-500 ${statusConfig.bar}`}
                            style={{
                              width: `${
                                capacity > 0
                                  ? Math.min((used / capacity) * 100, 100)
                                  : used > 0
                                  ? 100
                                  : 0
                              }%`,
                            }}
                          />
                        </div>

                        <span className={`text-[12px] font-black ${statusConfig.text}`}>
                          {used.toFixed(2)} / {capacity.toFixed(2)} FTE
                        </span>
                      </div>
                    </td>

                      {/* STATUS */}

                      <td className="px-6 py-6 text-center align-middle">
                        <div
                          className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-[10px] font-black ${config.color}`}
                        >
                          <StatusIcon
                            size={12}
                          />

                          {p.status}
                        </div>
                      </td>

                      {/* ACTIONS */}

                      <td className="px-6 py-6 text-center align-middle">
                        {(userRole === "Admin" ||
                          userRole ===
                            "Finance") && (
                          <div className="flex justify-end gap-2">
                            <button
                              onClick={() => {
                                setEditingProject(
                                  p
                                );

                                setIsModalOpen(
                                  true
                                );
                              }}
                              className="p-2.5 hover:bg-indigo-50 hover:text-indigo-600 rounded-xl text-slate-400 transition-all"
                            >
                              <Edit3
                                size={18}
                              />
                            </button>

                            <button
                              onClick={() =>
                                handleDelete(
                                  p._id
                                )
                              }
                              className="p-2.5 hover:bg-rose-50 hover:text-rose-600 rounded-xl text-slate-400 transition-all"
                            >
                              <Trash2
                                size={18}
                              />
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* =========================================================
          MODAL
      ========================================================= */}

      {isModalOpen && (
        <ProjectModal
          project={editingProject}
          API_BASE={API_BASE}
          token={token}
          onClose={() =>
            setIsModalOpen(false)
          }
          onSaved={() => {
            setIsModalOpen(false);
            loadData();
          }}
        />
      )}
    </div>
  );
}

/* =========================================================
   SUMMARY CARD
========================================================= */

function SummaryCard({
  title,
  value,
  color = "text-slate-800"
}: {
  title: string;
  value: string;
  color?: string;
}) {
  return (
    <div className="bg-white border rounded-xl p-4 text-center">
      <p className="text-md font-bold text-indigo-700">{title}</p>
      <p className={`text-lg font-bold ${color}`}>{value}</p>
    </div>
  );
}

/* =========================================================
   FILTER DROPDOWN
========================================================= */

function FilterDropdown({
  value,
  options,
  onChange,
}: any) {
  return (
    <select
      value={value}
      onChange={(e) =>
        onChange(e.target.value)
      }
      className="px-5 py-3 bg-white border border-slate-200 rounded-2xl text-sm font-bold text-slate-700 shadow-sm outline-none focus:ring-4 focus:ring-indigo-500/10"
    >
      {options.map((opt: string) => (
        <option key={opt} value={opt}>
          {opt}
        </option>
      ))}
    </select>
  );
}

/* =========================================================
   PROJECT MODAL
========================================================= */

function ProjectModal({
  project,
  API_BASE,
  token,
  onClose,
  onSaved,
}: any) {
  const isEdit = !!project;

  const [loading, setLoading] =
    useState(false);

  const [form, setForm] = useState({
    name: project?.name || "",

    type: project?.type || "Billable",

    billingModel: project?.billingModel || "Fixed",

    billingRate: project?.billingRate || "",

    billingCurrency: project?.billingCurrency || "INR",

    startMonth: project?.startMonth || MONTHS[new Date().getMonth()],

    startYear:
      project?.startYear ||
      new Date().getFullYear(),

    status:
      project?.status || "Planned",
  });

const handleSubmit = async () => {
  setLoading(true);

  try {
    let payload: any = {};

    /* ================= CREATE ================= */

    if (!isEdit) {
      payload = {
        name: form.name.trim(),
        type: form.type,
        billingModel: form.billingModel,

        billingRate:
          form.billingModel === "Hourly"
            ? Number(form.billingRate)
            : 0,

        billingCurrency: form.billingCurrency,

        fixedMonthlyRevenue:
          form.billingModel === "Fixed"
            ? Number(form.billingRate)
            : 0,

        startMonth: form.startMonth,
        startYear: Number(form.startYear),
        status: form.status,
      };
    }

    /* ================= UPDATE ================= */

    else {
      if (form.name !== project.name) {
        payload.name = form.name.trim();
      }

      if (form.type !== project.type) {
        payload.type = form.type;
      }

      if (form.billingModel !== project.billingModel) {
        payload.billingModel = form.billingModel;
      }

      if (
        Number(form.billingRate) !==
        Number(project.billingRate || 0)
      ) {
        payload.billingRate =
          form.billingModel === "Hourly"
            ? Number(form.billingRate)
            : 0;

        payload.fixedMonthlyRevenue =
          form.billingModel === "Fixed"
            ? Number(form.billingRate)
            : 0;
      }

      if (
        form.billingCurrency !== project.billingCurrency
      ) {
        payload.billingCurrency =
          form.billingCurrency;
      }

      if (form.startMonth !== project.startMonth) {
        payload.startMonth = form.startMonth;
      }

      if (
        Number(form.startYear) !==
        Number(project.startYear)
      ) {
        payload.startYear = Number(form.startYear);
      }

      if (form.status !== project.status) {
        payload.status = form.status;
      }
    }

    console.log("FINAL PAYLOAD:", payload);

    const res = await fetch(
      isEdit
        ? `${API_BASE}/api/projects/${project._id}`
        : `${API_BASE}/api/projects`,
      {
        method: isEdit ? "PATCH" : "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      }
    );

    const data = await res.json();

    if (!res.ok) {
      alert(data.message || "Failed to Save");
      return;
    }

    onSaved();

  } catch (err) {
    console.error(err);
    alert("Something went Wrong");
  } finally {
    setLoading(false);
  }
};

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-md z-50 flex items-center justify-center p-6">
      <div className="bg-white w-full max-w-xl rounded-[2.5rem] overflow-hidden shadow-2xl">
        {/* HEADER */}

        <div className="px-10 py-8 border-b border-slate-100 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-sky-600 rounded-2xl text-white">
              <Briefcase size={22} />
            </div>

            <h2 className="text-2xl font-black tracking-tight text-slate-900">
              {isEdit
                ? "Update Project"
                : "Create Project"}
            </h2>
          </div>

          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-200 rounded-full"
          >
            <X size={22} />
          </button>
        </div>

        {/* BODY */}
        <div className="p-10 space-y-6">
          <InputGroup label="Project Name">
            <input
              value={form.name}
              onChange={(e) =>
                setForm({
                  ...form,
                  name: e.target.value,
                })
              }
              className={inputClass}
              placeholder="Project Name"
            />
          </InputGroup>

          <div className="grid grid-cols-2 gap-5">
            <InputGroup label="Project Type">
              <select
                value={form.type}
                onChange={(e) =>
                  setForm({
                    ...form,
                    type: e.target.value as any,
                  })
                }
                className={inputClass}
              >
                <option value="Billable">Billable</option>
                <option value="Non-Billable">Non-Billable</option>
              </select>
            </InputGroup>

            <InputGroup label="Billing Model">
              <select
                value={form.billingModel}
                onChange={(e) =>
                  setForm({
                    ...form,
                    billingModel: e.target.value as any,
                  })
                }
                className={inputClass}
              >
                <option value="Hourly">Hourly</option>
                <option value="Fixed">Fixed</option>
              </select>
            </InputGroup>
          </div>

          <div className="grid grid-cols-2 gap-5">
            <InputGroup label="Billing Rate">
              <input
                type="number"
                value={form.billingRate}
                onChange={(e) =>
                  setForm({
                    ...form,
                    billingRate: e.target.value,
                  })
                }
                className={inputClass}
              />
            </InputGroup>

            <InputGroup label="Currency">
              <select
                value={form.billingCurrency}
                onChange={(e) =>
                  setForm({
                    ...form,
                    billingCurrency: e.target.value,
                  })
                }
                className={inputClass}
              >
                <option value="INR">INR (₹)</option>
                <option value="USD">USD ($)</option>
                <option value="EUR">EUR (€)</option>
                <option value="GBP">GBP (£)</option>
              </select>
            </InputGroup>
          </div>

          <InputGroup label="Status">
            <select
              value={form.status}
              onChange={(e) =>
                setForm({
                  ...form,
                  status: e.target.value as any,
                })
              }
              className={inputClass}
            >
              {Object.keys(STATUS_CONFIG).map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </InputGroup>

          <div className="grid grid-cols-2 gap-5">
            <InputGroup label="Start Month">
              <select
                value={form.startMonth}
                onChange={(e) =>
                  setForm({
                    ...form,
                    startMonth: e.target.value,
                  })
                }
                className={inputClass}
              >
                {MONTHS.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
            </InputGroup>

            <InputGroup label="Start Year">
              <input
                type="number"
                value={form.startYear}
                onChange={(e) =>
                  setForm({
                    ...form,
                    startYear: Number(e.target.value),
                  })
                }
                className={inputClass}
              />
            </InputGroup>
          </div>
        </div>
        {/* FOOTER */}

        <div className="p-6 border-t bg-slate-50/50 flex justify-center gap-3">
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="px-6 py-2 bg-sky-600 text-white rounded-xl text-sm font-bold shadow-lg shadow-sky-100 disabled:opacity-50"
          >
            {loading
              ? "Saving..."
              : isEdit
              ? "Update Project"
              : "Create Project"}
          </button>

          <button onClick={onClose} className="px-5 py-2 text-sm font-bold text-slate-500">Cancel</button>
        </div>
      </div>
    </div>
  );
}

/* =========================================================
   INPUT GROUP
========================================================= */

function InputGroup({
  label,
  children,
}: any) {
  return (
    <div className="space-y-2">
      <label className="block text-[14px] font-bold text-sky-800 uppercase tracking-wider mb-1.5 ml-1">
        {label}
      </label>

      {children}
    </div>
  );
}

/* =========================================================
   SHARED INPUT CLASS
========================================================= */

  const inputClass = "w-full border border-slate-200 rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-sky-500/20 outline-none bg-slate-50/50 transition-all font-medium";
