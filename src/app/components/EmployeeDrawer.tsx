
import {
  X,
  Calendar,
  MapPin,
  Briefcase,
  ArrowRightLeft,
  Clock,
  TrendingUp,
  Edit3,
  Save,
  DollarSign,
  User,
  Mail,
  Wrench,
  Building2,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { AllocateModal } from "./AllocateModal";
import {
 Area,  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  AreaChart,
} from "recharts";

const API = import.meta.env.VITE_API_BASE_URL;
const CAPACITY = 160;

/* ===================== TYPES ===================== */

type role = {
  _id: string;
  name: string;
};

type EditFormState = {
  roleId: string;
  joiningDate: string;
  location: string;
  hourlyCost: string;
  skills: string[];
};

type EmployeeDrawerProps = {
  employee: any;
  onClose: () => void;
  canEdit: boolean;
  projects: any[];
  workCategories: any[];
  roles: role[];
  refetchEmployees: () => void;
};

/* ===================== COMPONENT ===================== */

export default function EmployeeDrawer({
  employee,
  onClose,
  canEdit,
  projects,
  workCategories,
  roles,
  refetchEmployees,
}: EmployeeDrawerProps) {
  const [editingInfo, setEditingInfo] = useState(false);
  const [savingInfo, setSavingInfo] = useState(false);
  const [allocationMode, setAllocationMode] = useState<
    "edit" | "move" | null
  >(null);
  const [activeAllocation, setActiveAllocation] = useState<any>(null);
  const [allSkills, setAllSkills] = useState<any[]>([]);

  const [showSkillDropdown, setShowSkillDropdown] = useState(false);
  const [skillSearch, setSkillSearch] = useState("");

  const filteredSkills = useMemo(() => {
    if (!Array.isArray(allSkills)) return [];

    if (!skillSearch) return allSkills;

    return allSkills.filter((s) =>
      s.name?.toLowerCase().includes(skillSearch.toLowerCase())
    );
  }, [allSkills, skillSearch]);

  const getFTE = (hours: number) => hours / CAPACITY;

  /* ===================== EFFECTS ===================== */

  useEffect(() => {
    const fetchSkills = async () => {
      try {
        const res = await axios.get(`${API}/api/skills`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        });
        setAllSkills(
          (res.data?.data || []).map((s: any) => ({
            id: s._id,
            name: s.name,
          }))
        );
      } catch (err) {
        console.error("Failed to Fetch Skills", err);
      }
    };

    fetchSkills();
  }, []);

  /* ===================== FORM STATE ===================== */

  const [editForm, setEditForm] = useState<EditFormState>({
    roleId: "",
    joiningDate: "",
    location: "",
    hourlyCost: "",
    skills: [],
  });

useEffect(() => {
  if (!employee) return;

  setEditForm({
    roleId:
      typeof employee?.roleId === "object"
        ? employee?.roleId?._id
        : employee?.roleId || "",

    joiningDate: employee?.joiningDate?.slice(0, 10) || "",

    location: employee?.location || "",

    hourlyCost: employee?.hourlyCost?.toString() || "",

    skills: Array.isArray(employee?.skills)
      ? employee.skills
          .map((s: any) => (typeof s === "object" ? s._id || s.id : s))
          .filter(Boolean)
          .map((id: any) => String(id))   // ✅ NORMALIZE TO STRING
      : [],
  });
}, [employee]);

  
  /* ===================== DERIVED VALUES ===================== */

  const allocations = employee?.allocations || [];

  const bookedHours = allocations.reduce(
    (sum: number, item: any) =>
      sum + Number(item?.allocatedHours || 0),
    0
  );
  
  const remainingHours = Math.max(0, CAPACITY - bookedHours);
  const utilizationPct = Math.round((bookedHours / CAPACITY) * 100);

  const totalFTE = getFTE(bookedHours);

  const getUtilColor = (pct: number) => {
    if (pct > 100) return "text-red-600";       // 🔴 Overloaded
    if (pct > 90) return "text-green-600";      // 🟡 Risk
    if (pct > 60) return "text-sky-600";       //      Healthy
    return "text-amber-500";                   
  };

  const experience = useMemo(() => {
    if (!employee?.joiningDate) return "—";

    const joined = new Date(employee.joiningDate);
    const now = new Date();

    let years = now.getFullYear() - joined.getFullYear();
    let months = now.getMonth() - joined.getMonth();

    if (months < 0) {
      years--;
      months += 12;
    }

    return years <= 0 ? `${months}m` : `${years}y ${months}m`;
  }, [employee]);

  const roleName = useMemo(() => {
    if (!Array.isArray(roles)) return "NA";

    return (
      roles.find(d => d._id === editForm.roleId)?.name ?? "NA"
    );
  }, [roles, editForm.roleId]);

  /* ===================== SAVE ===================== */

  const saveEmployeeInfo = async () => {
    try {
      setSavingInfo(true);

      await axios.put(
        `${API}/api/employees/${employee._id}`,
        {
          joiningDate: editForm.joiningDate,
          location: editForm.location,
          roleId: editForm.roleId,
          hourlyCost: Number(editForm.hourlyCost),
          skills: editForm.skills,
        },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );

      setEditingInfo(false);
      refetchEmployees();
    } finally {
      setSavingInfo(false);
    }
  };

const trendData = useMemo(() => {
  const map: Record<string, number> = {};

  allocations.forEach((a: any) => {
    if (!a.month || !a.year) return;

    const key = `${a.month}/${a.year}`;
    map[key] = (map[key] || 0) + (a.allocatedHours || 0);
  });

  return Object.entries(map).map(([period, hours]) => ({
    period,
    hours,
  }));
}, [allocations]); 

  return (
    <div className="fixed inset-0 z-50 bg-slate-100 flex flex-col overflow-hidden font-sans">
      {/* HEADER */}
      <header className="h-16 bg-white border-b border-slate-200 px-6 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-4 min-w-0">
          <div className="w-10 h-10 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold shrink-0">
            {employee?.name?.charAt(0) || "U"}
          </div>

          <div className="min-w-0">
            <h1 className="text-lg font-bold text-slate-900 truncate">
              {employee?.name}
            </h1>

            <div className="flex items-center gap-2 text-[11px]">
              <span className="text-sky-700 truncate">
                {employee?.employeeCode}
              </span>

              <span className="w-1 h-1 rounded-full bg-slate-300" />

              <span className="text-indigo-600 font-semibold truncate">
                {employee?.primaryWorkCategoryId?.name || "Staff"}
              </span>
            </div>
          </div>
        </div>

        <button
          onClick={onClose}
          className="p-2 rounded-lg hover:bg-red-50 hover:text-red-500 text-slate-400 transition"
        >
          <X size={18} />
        </button>
      </header>

      {/* BODY */}
      <main className="flex-1 grid grid-cols-12 overflow-hidden">
        {/* LEFT SIDE FIXED */}
        <aside className="col-span-12 lg:col-span-4 xl:col-span-3 bg-white border-r border-slate-200 h-full p-5 flex flex-col justify-between overflow-hidden">
          {/* TOP */}
          <div>
            {/* INSIGHTS */}
            {utilizationPct > 100 && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-xs font-semibold text-red-700">
                Overallocated — Consider Moving Hours
              </div>
            )}

            {utilizationPct < 50 && (
              <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs font-semibold text-amber-700">
                Underutilized — Can Take More Work
              </div>
            )}
            
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-[10px] font-black uppercase tracking-[0.18em] text-sky-900">
                Personnel Details
              </h3>

              {canEdit && !editingInfo && (
                <button
                  onClick={() => setEditingInfo(true)}
                  className="p-1.5 rounded-md text-indigo-500 hover:bg-indigo-50 transition"
                >
                  <Edit3 size={14} />
                </button>
              )}
            </div>

            {!editingInfo ? (
              <div className="space-y-4">
                <Row
                //  value={employee?.name?}
                />

                <Row
                  icon={<Building2 size={14} />}
                  label="Role"
                  value={roleName}
                />

                <Row
                  icon={<Calendar size={14} />}
                  label="Join Date"
                  value={
                    employee?.joiningDate
                      ? new Date(employee.joiningDate).toLocaleDateString()
                      : "—"
                  }
                />

                <Row
                  icon={<Briefcase size={14} />}
                  label="Experience"
                  value={experience}
                />

                <Row
                  icon={<MapPin size={14} />}
                  label="Work Hub"
                  value={employee?.location || "Remote"}
                />

                <Row
                  icon={<DollarSign size={14} />}
                  label="Rate/Hr"
                  value={`₹${employee?.hourlyCost?.toLocaleString("en-IN") || 0}`}
                />

                <Row
                  icon={<Mail size={14} />}
                  label="Email"
                  value={employee?.email || "—"}
                />

                <Row
                  icon={<Wrench size={14} />}
                  label="Skills"
                  value={
                    <div className="flex flex-wrap justify-end gap-1 max-w-[180px]">
                      {employee?.skills?.length ? (
                        employee.skills.map((s: any) => (
                          <span key={s._id} className="bg-sky-100 text-slate-800 px-2 py-0.5 rounded text-[10px] font-medium">
                            {s.name ?? s}
                          </span>
                        ))
                      ) : (
                        "—"
                      )}
                    </div>
                  }
                />
              </div>
            ) : (
              <div className="space-y-3">
              <div>
                <label className="text-[10px] font-bold uppercase text-slate-400 mb-1 block">
                  Role
                </label>

                <select
                  value={editForm.roleId}
                  onChange={(e) =>
                    setEditForm({
                      ...editForm,
                      roleId: e.target.value,
                    })
                  }
                  className="w-full h-9 px-3 rounded-lg border border-slate-200 text-sm outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                >
                  <option value="">Select Role</option>

                  {roles.map((role) => (
                    <option key={role._id} value={role._id}>
                      {role.name}
                    </option>
                  ))}
                </select>
              </div>

                <Input
                  label="Joining Date"
                  type="date"
                  value={editForm.joiningDate}
                  onChange={(e: any) =>
                    setEditForm({
                      ...editForm,
                      joiningDate: e.target.value,
                    })
                  }
                />

                <Input
                  label="Location"
                  value={editForm.location}
                  onChange={(e: any) =>
                    setEditForm({
                      ...editForm,
                      location: e.target.value,
                    })
                  }
                />

                <Input
                  label="Hourly Cost"
                  type="number"
                  value={editForm.hourlyCost}
                  onChange={(e: any) =>
                    setEditForm({
                      ...editForm,
                      hourlyCost: e.target.value,
                    })
                  }
                />

 <div className="relative">
  <label className="text-[10px] font-bold uppercase text-slate-400 mb-1 block">
    Skills
  </label>

  {/* Selected Skills Box */}
  <div
    onClick={() => setShowSkillDropdown((prev) => !prev)}
    className="min-h-[40px] p-1.5 flex flex-wrap gap-1.5 bg-white border border-slate-200 rounded-lg cursor-pointer"
  >
    {editForm.skills.length > 0 ? (
      editForm.skills.map((id) => {
        const skill = allSkills.find((s) =>
          String(s.id) === String(id) ||
          s.name?.toLowerCase() === String(id).toLowerCase()
      );


        return (
          <span
            key={id}
            className="inline-flex items-center gap-1 px-2 py-0.5 bg-indigo-50 text-indigo-700 text-[11px] font-bold rounded-md"
          >
            {skill?.name || id}

            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setEditForm((prev) => ({
                  ...prev,
                  skills: prev.skills.filter((s) => s !== id),
                }));
              }}
              className="hover:bg-indigo-200 rounded-full p-0.5"
            >
              <X size={10} />
            </button>
          </span>
        );
      })
    ) : (
      <span className="text-xs text-slate-400">Select skills...</span>
    )}
  </div>

  {/* Dropdown */}
  {showSkillDropdown && (
    <div className="absolute z-10 mt-2 w-full bg-white border border-slate-200 rounded-lg shadow max-h-56 flex flex-col">
      
      {/* Search */}
      <input
        placeholder="Search skills..."
        value={skillSearch}
        onChange={(e) => setSkillSearch(e.target.value)}
        className="px-3 py-2 text-xs border-b outline-none"
      />

      {/* List */}
      <div className="overflow-y-auto">
        {filteredSkills.length === 0 ? (
          <div className="p-3 text-xs text-slate-400 text-center">
            No skills found
          </div>
        ) : (
          filteredSkills.map((skill) => {
            const skillId = skill._id || skill.id;
            const isSelected = editForm.skills.some((id) =>
              String(id) === String(skillId) ||
              id.toLowerCase() === skill.name.toLowerCase());
            const idStr = String(skillId);
            const nameStr = skill.name.toLowerCase();

            return (
              <div
                key={skillId}
                onClick={() => {
                  setEditForm((prev) => ({
                    ...prev,
                    skills: isSelected
                  ? prev.skills.filter(
                      (id) =>
                        String(id) !== idStr &&
                        id.toLowerCase() !== nameStr
                    )
                  : [...prev.skills, idStr],}));
                }}
                className={`px-3 py-2 text-xs flex justify-between cursor-pointer hover:bg-slate-50 ${
                  isSelected
                    ? "bg-indigo-50 text-indigo-600"
                    : "text-slate-600"
                }`}
              >
                {skill.name}

                {isSelected && (
                  <div className="w-2 h-2 bg-indigo-600 rounded-full" />
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  )}
</div>
                
                <div className="flex gap-2 pt-2">
                  <IconButton
                    icon={<X size={14} />}
                    onClick={() => setEditingInfo(false)}
                    color="text-slate-600 hover:bg-slate-100"
                  />

                  <button
                    onClick={saveEmployeeInfo}
                    className="flex-1 h-9 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold flex items-center justify-center gap-2"
                  >
                    <Save size={14} />
                    {savingInfo ? "Saving..." : "Save"}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* BOTTOM */}
          <div>
            <h3 className="text-[10px] font-black uppercase tracking-[0.18em] text-sky-900 mb-4">
              Resource Load
            </h3>

            <div className="flex justify-between items-end mb-4">
              {/* <div>
                <span className="text-4xl font-black text-slate-900">
                  {bookedHours}h
                </span>

                <span className="text-slate-600 ml-1 text-2xl">/ {CAPACITY}h</span>
              </div> */}

              <div>
                <span className="text-4xl font-black text-slate-900">
                  {totalFTE.toFixed(2)} FTE
                </span>

                <div className="text-sm text-slate-500">
                  {bookedHours}h / {CAPACITY}h
                </div>

                <div className="text-[10px] text-slate-400">
                  (1 FTE = 160h capacity)
                </div>

              </div>
              <span
                className={`text-lg font-bold ${getUtilColor(
                  utilizationPct
                )}`}
              >
                {utilizationPct}%
              </span>
            </div>

            <div className="h-2 rounded-full bg-slate-200 overflow-hidden mb-4">
            <div
              className={`h-full ${
                utilizationPct > 100
                  ? "bg-red-800"
                  : utilizationPct > 90
                  ? "bg-green-800"
                  : utilizationPct > 60
                  ? "bg-sky-800"
                  : "bg-amber-600"
              }`}
              style={{
                width: `${Math.min(utilizationPct, 100)}%`,
              }}
            />
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <p className="text-sky-800 uppercase font-bold">
                  Status
                </p>

                <p
                  className={`font-bold ${
                    utilizationPct > 100
                      ? "text-red-600"
                      : utilizationPct > 80
                      ? "text-green-700"
                      : "text-orange-600"
                  }`}
                >
                  {utilizationPct > 100
                    ? "Overloaded"
                    : utilizationPct > 80
                    ? "Optimal"
                    : "Available"}
                </p>
              </div>

              <div className="text-right">
                <p className="text-sky-800 uppercase font-bold">
                  Free Space
                </p>

                <p className="font-bold text-orange-400">
                  {remainingHours}h
                </p>
              </div>
            </div>
          </div>
        </aside>

        {/* RIGHT SIDE */}
        <section className="col-span-12 lg:col-span-8 xl:col-span-9 p-6 overflow-y-auto">
        {/* ALLOCATIONS HEADER */}
        <div className="flex items-center justify-between mb-5">
          <h3 className="font-bold text-slate-800 flex items-center gap-2">
            <TrendingUp size={17} className="text-indigo-500" />
            Project Allocations
          </h3>

          <span className="text-xs font-semibold bg-white border border-slate-200 px-2 py-1 rounded-lg text-slate-500">
            {allocations.length} Active
          </span>
        </div>

          {allocations.length === 0 ? (
            <div className="h-52 bg-white rounded-2xl border border-dashed border-slate-300 flex flex-col items-center justify-center text-slate-400">
              <User size={32} className="mb-2 opacity-40" />
              Currently on Bench
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 2xl:grid-cols-3 gap-4">
              {allocations.map((a: any) => {
                const hours = a.allocatedHours || 0;
                const fte = hours / CAPACITY;
                const allocationPct = Math.round((hours / CAPACITY) * 100);

                return (
                  <div
                    key={a._id}
                    className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm hover:shadow-md transition group"
                  >
                    <div className="flex justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-[10px] font-bold uppercase text-indigo-500 mb-1">
                          Project
                        </p>

                        <h4 className="font-bold text-slate-900 truncate">
                          {a?.projectId?.name || "Unnamed"}
                        </h4>

                        <p className="text-[11px] text-slate-500 mt-1">
                          {a?.workCategoryId?.name || "General"}
                        </p>
                      </div>

                      <span
                        className={`text-[10px] font-bold px-2 py-1 rounded-md shrink-0 ${
                          a.isBillable
                            ? "bg-emerald-100 text-emerald-700"
                            : "bg-yellow-100 text-yellow-700"
                        }`}
                      >
                        {a.isBillable ? "Billable" : "Internal"}
                      </span>
                    </div>

                    <div className="flex items-center mt-4 pt-3 border-t border-slate-100">
                      <div className="flex items-center gap-1 text-xs font-semibold text-sky-700">
                        <Clock size={12} />
                        {hours}h

                        <div className="text-[10px] text-slate-500 ml-2">
                          {fte.toFixed(2)} FTE • {allocationPct}%
                        </div>
                      </div>

                      {canEdit && (
                        <div className="ml-auto flex gap-1 opacity-0 group-hover:opacity-100 transition">
                          <IconButton
                            icon={<Edit3 size={13} />}
                            onClick={() => {
                              setActiveAllocation(a);
                              setAllocationMode("edit");
                            }}
                            color="text-indigo-600 hover:bg-indigo-50"
                          />

                          <IconButton
                            icon={<ArrowRightLeft size={13} />}
                            onClick={() => {
                              setActiveAllocation(a);
                              setAllocationMode("move");
                            }}
                            color="text-sky-600 hover:bg-sky-50"
                          />
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </main>

      {/* MODAL */}
      {allocationMode && activeAllocation && (
        <AllocateModal
          mode={allocationMode}
          allocation={activeAllocation}
          projects={projects}
          workCategories={workCategories}
          onClose={() => {
            setAllocationMode(null);
            setActiveAllocation(null);
          }}
          onSuccess={() => {
            refetchEmployees();
            setAllocationMode(null);
            setActiveAllocation(null);
          }}
        />
      )}
    </div>
  );
}

/* COMPONENTS */

function Row({ icon, label, value }: any) {
  return (
    <div className="flex items-center justify-between gap-3">
      <div className="flex items-center gap-2 text-slate-500 text-xs">
        {icon}
        {label}
      </div>

      <span className="text-xs font-bold text-slate-800 text-right">
        {value}
      </span>
    </div>
  );
}

function Input({ label, ...props }: any) {
  return (
    <div>
      <label className="text-[10px] font-bold uppercase text-slate-400 mb-1 block">
        {label}
      </label>

      <input
        {...props}
        className="w-full h-9 px-3 rounded-lg border border-slate-200 text-sm outline-none focus:ring-2 focus:ring-indigo-500"
      />
    </div>
  );
}

function IconButton({
  icon,
  onClick,
  color,
}: any) {
  return (
    <button
      onClick={onClick}
      className={`w-8 h-8 rounded-md flex items-center justify-center transition ${color}`}
    >
      {icon}
    </button>
  );
}


