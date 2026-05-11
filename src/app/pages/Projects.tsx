import React, { useEffect, useMemo, useState } from "react";
import {
  Plus, Search, Edit3, Trash2, Layers, Calendar, 
  Building2, Activity, Archive, CheckCircle2, Clock, 
  Ban, DollarSign, X, ChevronRight, Filter, Briefcase,
} from "lucide-react";


/* ================= TYPES ================= */

export interface Project {
  _id: string;
  name: string;

  client_id:
    | string
    | {
        _id: string;
        client_name: string;
      };

  type: "Billable" | "Non-Billable";

  billingModel: "Hourly" | "Fixed";
  billingRate?: number;
  fixedMonthlyRevenue?: number;

  startDate: string;
  endDate?: string;

  status: "PLANNED" | "ACTIVE" | "ON_HOLD" | "COMPLETED" | "CANCELLED";

  allowAllocations: boolean;
  allowMoves: boolean;

  targetFTE?: number;
  createdAt: string;
  updatedAt: string;
}

/* ================= CONSTANTS ================= */

const STATUS_CONFIG = {
  ACTIVE: { color: "bg-emerald-50 text-emerald-700 border-emerald-200", icon: Activity },
  PLANNED: { color: "bg-sky-50 text-sky-700 border-sky-200", icon: Calendar },
  ON_HOLD: { color: "bg-amber-50 text-amber-700 border-amber-200", icon: Clock },
  COMPLETED: { color: "bg-indigo-50 text-indigo-700 border-indigo-200", icon: CheckCircle2 },
  CANCELLED: { color: "bg-rose-50 text-rose-700 border-rose-200", icon: Ban },
};

const BILLING_COLORS = {
  "Billable": "text-blue-600 bg-blue-50 border-blue-100",
  "Non-Billable": "text-slate-500 bg-slate-50 border-slate-100",
};

/* ================= MAIN COMPONENT ================= */

export default function Projects() {
  const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";
  const token = localStorage.getItem("token");
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const userRole = user?.role;

  const [projects, setProjects] = useState<Project[]>([]);
  const [clients, setClients] = useState<any[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [filters, setFilters] = useState({ status: "All", billing: "All", client: "All", search: "" });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [allocations, setAllocations] = useState<any[]>([]);
  const [localFTE, setLocalFTE] = useState<Record<string, string>>({});

  const loadData = async () => {
    setLoading(true);
    try {
      const headers = { Authorization: `Bearer ${token}` };
      const [p, c, e, a] = await Promise.all([
        fetch(`${API_BASE}/api/projects`, { headers }),
        fetch(`${API_BASE}/api/clients`, { headers }),
        fetch(`${API_BASE}/api/employees`, { headers }),
        fetch(`${API_BASE}/api/allocations`, { headers }),
      ]);
      const pd = await p.json();
      const cd = await c.json();
      const ed = await e.json();
      const ad = await a.json();

      setProjects(pd.data || pd || []);
      setClients(cd.data || cd || []);
      setEmployees(ed.data || ed || []);
      setAllocations(ad.data || ad || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to archive this project?")) return;
    await fetch(`${API_BASE}/api/projects/${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });
    loadData();
  };

  const filteredProjects = useMemo(() => {
    return projects.filter((p) => {
      const matchStatus = filters.status === "All" || p.status === filters.status;
      const matchBilling = filters.billing === "All" || p.type === filters.billing;
      const clientId = typeof p.client_id === "string" ? p.client_id : p.client_id?._id;
      const matchClient = filters.client === "All" || filters.client === clientId;
      const matchSearch = p.name.toLowerCase().includes(filters.search.toLowerCase());
      return matchStatus && matchBilling && matchClient && matchSearch;
    });
  }, [projects, filters]);

  const updateTargetFTE = async (projectId: string, value: number) => {
  try {
    await fetch(`${API_BASE}/api/projects/${projectId}/target_fte`, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ targetFTE: value }),
    });

    loadData(); // refresh
  } catch (err) {
    console.error(err);
  }
};

const projectUsage = useMemo(() => {
  const map: Record<string, number> = {};

  allocations.forEach((a) => {
    const pid = a.projectId || a.project_id; 
    map[pid] = (map[pid] || 0) + (a.allocatedHours || 0);
  });

  return map;
}, [allocations]);

  return (
    <div className="min-h-screen bg-[#F8FAFC] p-8 text-slate-900">
      {/* HEADER */}
      <div className="max-w-7xl mx-auto mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          {/* ICON BOX */}
          <div className="bg-sky-600 p-2.5 rounded-xl shadow-lg shadow-sky-200">
            <Layers className="text-white" size={28} />
          </div>

          {/* TEXT BLOCK */}
          <div>
            <h1 className="text-2xl font-bold tracking-tight">
            Project<span className="text-sky-600"> Portfolio</span>
            </h1>

            <p className="text-slate-600 font-medium">Manage allocations and economics</p>
          </div>
        </div>      

        {(userRole === "Admin" || userRole === "Finance") && (
          <button
            onClick={() => { setEditingProject(null); setIsModalOpen(true); }}
            className="h-11 px-5 bg-sky-600 hover:bg-sky-700 text-white rounded-xl font-semibold text-sm transition-all flex items-center gap-2 shadow-md active:scale-95"
          >
            <Plus size={18} /> Create Project
          </button>
        )}
      </div>

      {/* FILTER BAR */}
      <div className="max-w-7xl mx-auto mb-6 grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="relative group">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
          <input
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-500/20 transition"
            placeholder="Search projects..."
            value={filters.search}
            onChange={(e) => setFilters({ ...filters, search: e.target.value })}
          />
        </div>

        <FilterDropdown
          icon={<Activity size={14}/>}
          label="Status"
          value={filters.status}
          options={["All", "ACTIVE", "PLANNED", "ON_HOLD", "COMPLETED", "CANCELLED"]}
          onChange={(v: string) => setFilters({ ...filters, status: v })}
        />

        <FilterDropdown
          icon={<DollarSign size={14}/>}
          label="Billing"
          value={filters.billing}
          options={["All", "Billable", "Non-Billable"]}
          onChange={(v: string) => setFilters({ ...filters, billing: v })}
        />

        <FilterDropdown
          icon={<Building2 size={14}/>}
          label="Client"
          value={filters.client}
          options={[{ label: "All Clients", value: "All" }, ...clients.map(c => ({ label: c.client_name, value: c._id }))]}
          onChange={(v: string) => setFilters({ ...filters, client: v })}
        />
      </div>

      <div className="max-w-7xl mx-auto grid grid-cols-3 gap-4 mb-6">

        {/* TOTAL CAPACITY */}
        <SummaryCard
          title="Planned Capacity"
          value={`${projects.reduce((s, p) => s + (p.targetFTE || 0), 0)} FTE`}
        />

        {/* ALLOCATED */}
        <SummaryCard
          title="Allocated Hours"
          value={`${Object.values(projectUsage).reduce((s: any, v: any) => s + v, 0)}h`}
        />

        {/* UTILIZATION */}
        <SummaryCard
          title="Avg Utilization"
          value={`${Math.round(
            (Object.values(projectUsage).reduce((s: any, v: any) => s + v, 0) /
              (projects.reduce((s, p) => s + (p.targetFTE || 0) * 160, 0) || 1)) * 100
          )}%`}
        />

      </div>

      {/* ================= TABLE ================= */}
      <div className="max-w-7xl mx-auto bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-center">
            <thead>
              <tr className="bg-sky-50/50 border-b border-slate-200">
                <th className="px-6 py-4 text-[14px] font-bold uppercase tracking-wider text-indigo-500 text-center">
                  Project Details
                </th>
                <th className="px-6 py-4 text-[14px] font-bold uppercase tracking-wider text-indigo-500 text-center">
                  Economics
                </th>
                <th className="px-6 py-4 text-[14px] font-bold uppercase tracking-wider text-indigo-500 text-center">
                  Timeline
                </th>
                <th className="px-6 py-4 text-[14px] font-bold uppercase tracking-wider text-indigo-500 text-center">
                  Capacity
                </th>
                <th className="px-6 py-4 text-[14px] font-bold uppercase tracking-wider text-indigo-500 text-center">
                  Status
                </th>
                <th className="px-6 py-4 text-[14px] font-bold uppercase tracking-wider text-indigo-500 text-center">
                  Actions
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td
                    colSpan={6}
                    className="py-20 text-center text-slate-400 animate-pulse"
                  >
                    Syncing Environment...
                  </td>
                </tr>
              ) : (
                filteredProjects.map((p) => {
                  const config = STATUS_CONFIG[p.status] || STATUS_CONFIG.PLANNED;
                  const StatusIcon = config.icon;

                  return (
                    <tr
                      key={p._id}
                      className="group hover:bg-sky-50/30 transition-colors"
                    >

      <td className="px-6 py-5 text-left align-middle">
        <div className="flex items-center gap-4 group/item">
          {/* Avatar with dynamic gradient */}
          <div className="relative flex-shrink-0">
          <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-sky-500 to-indigo-600 flex items-center justify-center shadow-md shadow-sky-200 transition-all duration-300 group-hover/item:scale-105 group-hover/item:rotate-3">
            <Layers className="text-white" size={19} strokeWidth={2.4} />
          </div>

          <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 border-2 border-white rounded-full">
          </div>
        </div>

          <div className="flex flex-col min-w-0">
            <div className="flex items-center gap-2 mb-0.5">
              <span className="font-bold text-[16px] text-slate-900 truncate tracking-tight">
                {p.name}
              </span>
            </div>
            
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5 text-slate-700 transition-colors group-hover/item:text-sky-600">
                <Building2 size={13} strokeWidth={2.5} />
                <span className="text-[14px] font-medium leading-none">
                  {typeof p.client_id === "string"
                    ? "Internal Workspace"
                    : p.client_id?.client_name}
                </span>
              </div>
              
              {/* Subtle Separator */}
              <span className="w-1 h-1 rounded-full bg-slate-300"></span>
              
              <div className="flex items-center gap-1 text-slate-400">
                <Clock size={11} />
                <span className="text-[10px] font-medium">
                  {new Date(p.createdAt).getFullYear()}
                </span>
              </div>
            </div>
          </div>
        </div>
      </td>

                {/* Economics */}
                <td className="px-6 py-4 text-center align-middle">
                  {(() => {
                    const rawBillingModel = p.billingModel as string;

                    const safeType: "Billable" | "Non-Billable" =
                      p.type ??
                      (rawBillingModel === "Billable" ||
                      rawBillingModel === "Non-Billable"
                        ? (rawBillingModel as
                            | "Billable"
                            | "Non-Billable")
                        : "Billable");

                    const safeModel: "Hourly" | "Fixed" =
                      rawBillingModel === "Hourly" ||
                      rawBillingModel === "Fixed"
                        ? (rawBillingModel as
                            | "Hourly"
                            | "Fixed")
                        : (p.fixedMonthlyRevenue ?? 0) > 0
                        ? "Fixed"
                        : "Hourly";

                    return (
                      <div className="flex flex-col items-center justify-center gap-1.5">
                        <span
                          className={`w-fit px-2 py-0.5 rounded text-[10px] font-bold border ${
                            safeType === "Billable"
                              ? "text-emerald-700 bg-emerald-50 border-emerald-100"
                              : "text-yellow-600 bg-yellow-50 border-yellow-200"
                          }`}
                        >
                          {safeType}
                        </span>

                        <span
                          className={`w-fit px-2 py-0.5 rounded text-[10px] font-bold border ${
                            safeModel === "Hourly"
                              ? "text-violet-700 bg-violet-50 border-violet-100"
                              : "text-blue-700 bg-blue-50 border-blue-100"
                          }`}
                        >
                          {safeModel}
                        </span>

                        <div className="text-xs font-semibold text-slate-700">
                          {safeType === "Non-Billable"
                            ? "Internal Cost Center"
                            : safeModel === "Hourly"
                            ? `₹${(
                                p.billingRate ?? 0
                              ).toLocaleString()}/hr`
                            : `₹${(
                                p.fixedMonthlyRevenue ?? 0
                              ).toLocaleString()}/mo`}
                        </div>
                      </div>
                    );
                  })()}
                </td>

                {/* Timeline */}
                <td className="px-6 py-4 text-center align-middle">
                  <div className="flex flex-col items-center justify-center">
                    <span className="text-xs font-semibold text-slate-600">
                      {new Date(p.startDate).toLocaleDateString()}
                    </span>

                    {p.endDate && (
                      <span className="text-[10px] text-slate-400">
                        Ends: {new Date(p.endDate).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                </td>

                <td className="px-6 py-4 text-center align-middle">
                  <div className="flex flex-col items-center gap-2">

                    {/* FTE INPUT */}
                    {(userRole === "Finance" || userRole === "Admin") ? (
                    <input
                      type="number"
                      step="0.25"
                      value={localFTE[p._id] ?? (p.targetFTE || "")}
                      onChange={(e) =>
                        setLocalFTE({
                          ...localFTE,
                          [p._id]: e.target.value,
                        })
                      }
                      onBlur={(e) => {
                        const val = Math.max(0, Number(e.target.value));
                        updateTargetFTE(p._id, val);
                      }}
                      className="w-20 text-center border rounded-md text-sm font-semibold py-1"
                    />
                    ) : (
                      <span className="text-sm font-bold text-slate-700">
                        {p.targetFTE || 0} FTE
                      </span>
                    )}

                    {/* CAPACITY vs USED */}
                    {(() => {
                      const capacity = (p.targetFTE || 0) * 160;
                      const used = projectUsage[p._id] || 0;

                      const percent =
                        capacity > 0 ? Math.min((used / capacity) * 100, 100) : 0;

                      const isOver = used > capacity;

                      return (
                        <>
                          {/* TEXT */}
                          <span className="text-xs text-slate-800">
                            {used.toLocaleString()}h / {capacity.toLocaleString()}h
                          </span>

                          <span className="text-[10px] text-slate-800">
                            ({(p.targetFTE || 0)} FTE × 160)
                          </span>

                          {/* BAR */}
                          <div className="w-28 h-2 bg-slate-200 rounded-full">
                            <div
                              className={`h-2 rounded-full ${
                                isOver
                                  ? "bg-red-500"
                                  : percent > 80
                                  ? "bg-amber-500"
                                  : "bg-indigo-500"
                              }`}
                              style={{ width: `${percent}%` }}
                            />
                          </div>

                          {/* STATUS */}
                          {isOver ? (
                            <span className="text-[10px] text-red-600 font-bold">
                              OVER CAPACITY
                            </span>
                          ) : percent < 50 ? (
                            <span className="text-[10px] text-slate-400">
                              UNDER UTILIZED
                            </span>
                          ) : (
                            <span className="text-[10px] text-emerald-600">
                              BALANCED
                            </span>
                          )}
                        </>
                      );
                    })()}

                  </div>
                </td>

                {/* Status */}
                <td className="px-6 py-4 text-center align-middle">
                  <div className="flex flex-col items-center justify-center gap-1">
                    <div
                      className={`flex items-center gap-1.5 w-fit px-2.5 py-1 rounded-full border text-[10px] font-bold ${config.color}`}
                    >
                      <StatusIcon size={12} />
                      {p.status}
                    </div>

                    {!p.allowAllocations && (
                      <div className="text-[9px] text-slate-400 font-bold flex items-center gap-1">
                        <Archive size={10} />
                        ALLOCATIONS LOCKED
                      </div>
                    )}
                  </div>
                </td>

                {/* Actions */}
                <td className="px-6 py-4 text-center align-middle">
                  {(userRole === "Admin" ||
                    userRole === "Finance") && (
                    <div className="flex justify-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <ActionButton
                        icon={<Edit3 size={15} />}
                        onClick={() => {
                          setEditingProject(p);
                          setIsModalOpen(true);
                        }}
                        disabled={!p.allowMoves}
                        variant="blue"
                      />

                      <ActionButton
                        icon={<Trash2 size={15} />}
                        onClick={() => handleDelete(p._id)}
                        disabled={!p.allowMoves}
                        variant="rose"
                      />
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

      {isModalOpen && (
        <ProjectModal
          project={editingProject}
          clients={clients}
          employees={employees}
          API_BASE={API_BASE}
          token={token}
          onClose={() => setIsModalOpen(false)}
          onSaved={() => { setIsModalOpen(false); loadData(); }}
        />
      )}
    </div>
  );
}

/* ================= HELPER COMPONENTS ================= */

function FilterDropdown({ icon, label, value, options, onChange }: any) {
  return (
    <div className="flex items-center gap-2 px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus-within:ring-2 focus-within:ring-indigo-500/20 transition">
      <span className="text-green-800">{icon}</span>
      <select 
        className="bg-transparent text-sm font-medium text-slate-700 outline-none w-full cursor-pointer"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      >
        {options.map((opt: any) => (
          <option key={typeof opt === 'string' ? opt : opt.value} value={typeof opt === 'string' ? opt : opt.value}>
            {typeof opt === 'string' ? opt : opt.label}
          </option>
        ))}
      </select>
    </div>
  );
}


function ActionButton({ icon, onClick, disabled, variant }: any) {
  const styles = {
    blue: "hover:bg-sky-50 hover:text-sky-600 text-slate-400",
    rose: "hover:bg-rose-50 hover:text-rose-600 text-slate-400",
  };
  return (
    <button
      disabled={disabled}
      onClick={onClick}
      className={`p-2 rounded-lg transition-all ${disabled ? "opacity-10 cursor-not-allowed" : styles[variant as keyof typeof styles]}`}
    >
      {icon}
    </button>
  );
}

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
      <p className="text-xs text-slate-500">{title}</p>
      <p className={`text-lg font-bold ${color}`}>{value}</p>
    </div>
  );
}
/* ================= MODAL COMPONENT ================= */

function ProjectModal({ project, clients, employees, API_BASE, token, onClose, onSaved }: any) {
  const isEdit = !!project;
  const [loading, setLoading] = useState(false);

  /* ✅ FIXED FORM STATE */
  const [form, setForm] = useState({
    name: "",
    client_id: "",
    type: "Billable",
    billingModel: "Fixed",
    billingRate: "",
    startDate: "",
    endDate: "",
    status: "PLANNED",
    assignedTo: "",
  });

  /* ✅ LOAD EDIT DATA WHEN PROJECT CHANGES */
  useEffect(() => {
    setForm({
      name: project?.name || "",
      client_id:
        typeof project?.client_id === "string"
          ? project?.client_id
          : project?.client_id?._id || "",
      type: project?.type || "Billable",
      billingModel: project?.billingModel || "Fixed",
      billingRate: project?.billingRate || "",
      startDate: project?.startDate
        ? project.startDate.split("T")[0]
        : "",
      endDate: project?.endDate
        ? project.endDate.split("T")[0]
        : "",
      status: project?.status || "PLANNED",
      assignedTo:
        typeof project?.assignedTo === "string"
          ? project?.assignedTo
          : project?.assignedTo?._id || "",
    });
  }, [project]);

const handleSubmit = async () => {
  setLoading(true);

  try {
    const payload = {
      name: form.name,
      client_id: form.client_id || null,
      type: form.type,
      billingModel: form.billingModel,
      billingRate: Number(form.billingRate) || 0,
      startDate: form.startDate,
      endDate: form.endDate || null,
      status: form.status,
      assignedTo: form.assignedTo || null,
    };

    const url = isEdit
      ? `${API_BASE}/api/projects/${project._id}`
      : `${API_BASE}/api/projects`;

    const res = await fetch(url, {
      method: isEdit ? "PATCH" : "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    });

    const data = await res.json();

    if (res.ok) {
      onSaved();
    } else {
      alert(data.message || "Failed to Save Project");
    }
  } catch (error) {
    console.error(error);
    alert("Something Went Wrong");
  } finally {
    setLoading(false);
  }
};

  const inputClass = "w-full border border-slate-200 rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-sky-500/20 outline-none bg-slate-50/50 transition-all font-medium";
  const labelClass = "block text-[10px] font-bold text-sky-800 uppercase tracking-wider mb-1.5 ml-1";

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-xl rounded-3xl shadow-2xl border border-slate-200 overflow-hidden">
        <div className="p-6 border-b flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-sky-600 rounded-lg text-white"><Briefcase size={20}/></div>
            <h2 className="text-lg font-bold text-slate-800">{isEdit ? "Project Settings" : "New Project"}</h2>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full"><X size={20}/></button>
        </div>

        <div className="p-6 space-y-5 max-h-[80vh] overflow-y-auto">
          <div>
            <label className={labelClass}>Project Identity</label>
            <input className={inputClass} placeholder="Project Name" value={form.name} onChange={e => setForm({...form, name: e.target.value})}/>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Partner Client</label>
              <select className={inputClass} value={form.client_id} onChange={e => setForm({...form, client_id: e.target.value})}>
                <option value="">Select Client</option>
                {clients.map((c: any) => <option key={c._id} value={c._id}>{c.client_name}</option>)}
              </select>
            </div>
            <div>
              <label className={labelClass}>Revenue Type</label>
              <select className={inputClass} value={form.type} onChange={e => setForm({...form, type: e.target.value})}>
                <option value="Billable">Billable</option>
                <option value="Non-Billable">Non-Billable</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
             <div>
              <label className={labelClass}>Billing Model</label>
              <select className={inputClass} value={form.billingModel} onChange={e => setForm({...form, billingModel: e.target.value})}>
                <option value="Fixed">Fixed</option>
                <option value="Hourly">Hourly</option>
              </select>
            </div>
            <div>
              <label className={labelClass}>Base Rate (INR)</label>
              <input type="number" className={inputClass} value={form.billingRate} onChange={e => setForm({...form, billingRate: e.target.value})}/>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Start Date</label>
              <input type="date" className={inputClass} value={form.startDate} onChange={e => setForm({...form, startDate: e.target.value})}/>
            </div>
            <div>
              <label className={labelClass}>Status</label>
              <select className={inputClass} value={form.status} onChange={e => setForm({...form, status: e.target.value})}>
                {Object.keys(STATUS_CONFIG).map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>
        </div>

        <div className="p-6 border-t bg-slate-50/50 flex justify-center gap-3">
          <button 
            onClick={handleSubmit} 
            disabled={loading}
            className="px-6 py-2 bg-sky-600 text-white rounded-xl text-sm font-bold shadow-lg shadow-sky-100 disabled:opacity-50"
          >
            {loading ? "Saving..." : isEdit ? "Update Project" : "Create Project"}
          </button>

          <button onClick={onClose} className="px-5 py-2 text-sm font-bold text-slate-500">Cancel</button>

        </div>
      </div>
    </div>
  );
}