
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

const API = import.meta.env.VITE_API_BASE_URL;
const CAPACITY = 160;

/* ===================== TYPES ===================== */

type Department = {
  _id: string;
  name: string;
};

type EditFormState = {
  departmentId: string;
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
  departments: Department[];
  refetchEmployees: () => void;
};

/* ===================== COMPONENT ===================== */

export default function EmployeeDrawer({
  employee,
  onClose,
  canEdit,
  projects,
  workCategories,
  departments,
  refetchEmployees,
}: EmployeeDrawerProps) {
  const [editingInfo, setEditingInfo] = useState(false);
  const [savingInfo, setSavingInfo] = useState(false);
  const [allocationMode, setAllocationMode] = useState<
    "edit" | "move" | null
  >(null);
  const [activeAllocation, setActiveAllocation] = useState<any>(null);
  const [allSkills, setAllSkills] = useState<any[]>([]);

  /* ===================== EFFECTS ===================== */

  useEffect(() => {
    const fetchSkills = async () => {
      try {
        const res = await axios.get(`${API}/api/skills`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        });
        setAllSkills(res.data || []);
      } catch (err) {
        console.error("Failed to Fetch Skills", err);
      }
    };

    fetchSkills();
  }, []);

  /* ===================== FORM STATE ===================== */

  const [editForm, setEditForm] = useState<EditFormState>({
    departmentId: "",
    joiningDate: "",
    location: "",
    hourlyCost: "",
    skills: [],
  });

  useEffect(() => {
    setEditForm({
      departmentId: employee?.departmentId || "",
      joiningDate: employee?.joiningDate?.slice(0, 10) || "",
      location: employee?.location || "",
      hourlyCost: employee?.hourlyCost?.toString() || "",
      skills: employee?.skills?.map((s: any) => s._id) || [],
    });
  }, [employee]);

  /* ===================== DERIVED VALUES ===================== */

  const allocations = employee?.allocations || [];

  const bookedHours = allocations.reduce(
    (sum: number, item: any) => sum + (item?.allocatedHours || 0),
    0
  );

  const remainingHours = Math.max(0, CAPACITY - bookedHours);
  const utilizationPct = Math.round((bookedHours / CAPACITY) * 100);

  const getUtilColor = (pct: number) => {
    if (pct > 100) return "text-red-600";
    if (pct > 80) return "text-green-800";
    return "text-emerald-600";
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

  const departmentName = useMemo(() => {
    if (!Array.isArray(departments)) return "Remote";

    return (
      departments.find(d => d._id === editForm.departmentId)?.name ?? "Remote"
    );
  }, [departments, editForm.departmentId]);

  /* ===================== SAVE ===================== */

  const saveEmployeeInfo = async () => {
    try {
      setSavingInfo(true);

      await axios.put(
        `${API}/api/employees/${employee._id}`,
        {
          joiningDate: editForm.joiningDate,
          location: editForm.location,
          departmentId: editForm.departmentId,
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
                  label="Department"
                  value={departmentName}
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

              {/* Selection Trigger Area */}
              <div 
                className="min-h-[40px] p-1.5 flex flex-wrap gap-1.5 bg-white border border-slate-200 rounded-lg text-sm transition-all focus-within:ring-2 focus-within:ring-indigo-500 focus-within:border-indigo-500 cursor-text"
                onClick={() => { /* Logic to open dropdown if you want it to toggle on click */ }}
              >
                {editForm.skills.length === 0 && (
                  <span className="text-slate-400 py-1 px-1">Select Skills...</span>
                )}
                
                {allSkills.filter(s => editForm.skills.includes(s._id)).map((skill) => (
                  <span 
                    key={skill._id}
                    className="inline-flex items-center gap-1 px-2 py-0.5 bg-indigo-50 text-indigo-700 text-[11px] font-bold rounded-md border border-indigo-100"
                  >
                    {skill.name}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        const newSkills = editForm.skills.filter(id => id !== skill._id);
                        setEditForm({ ...editForm, skills: newSkills });
                      }}
                      className="hover:bg-indigo-200 rounded-full p-0.5 transition-colors"
                    >
                      <X size={10} />
                    </button>
                  </span>
                ))}
              </div>

              {/* The Dropdown List */}
              <div className="mt-2 max-h-40 overflow-y-auto border border-slate-200 rounded-lg bg-white shadow-sm">
                {allSkills.map((skill: any) => {
                  const isSelected = editForm.skills.includes(skill._id);
                  return (
                    <div
                      key={skill._id}
                      onClick={() => {
                        const newSkills = isSelected
                          ? editForm.skills.filter((id: string) => id !== skill._id)
                          : [...editForm.skills, skill._id];
                        setEditForm({ ...editForm, skills: newSkills });
                      }}
                      className={`px-3 py-2 text-xs cursor-pointer flex items-center justify-between hover:bg-slate-50 transition-colors ${
                        isSelected ? "text-indigo-600 bg-indigo-50/30" : "text-slate-600"
                      }`}
                    >
                      {skill.name}
                      {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-indigo-600" />}
                    </div>
                  );
                })}
              </div>
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
              <div>
                <span className="text-4xl font-black text-slate-900">
                  {bookedHours}h
                </span>

                <span className="text-slate-600 ml-1 text-2xl">/ {CAPACITY}h</span>
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
                    ? "bg-green-500"
                    : utilizationPct > 80
                    ? "bg-green-500"
                    : "bg-indigo-600"
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
          <div className="flex items-center justify-between mb-5">
            <h3 className="font-bold text-slate-800 flex items-center gap-2">
              <TrendingUp
                size={17}
                className="text-indigo-500"
              />
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
              {allocations.map((a: any) => (
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
                    </div>

                    <span
                      className={`text-[10px] font-bold px-2 py-1 rounded-md shrink-0 ${
                        a.isBillable
                          ? "bg-emerald-100 text-emerald-700"
                          : "bg-yellow-100 text-yellow-700"
                      }`}
                    >
                      {a.isBillable
                        ? "Billable"
                        : "Internal"}
                    </span>
                  </div>

                  <div className="flex items-center mt-4 pt-3 border-t border-slate-100">
                    <div className="flex items-center gap-1 text-xs font-semibold text-sky-700">
                      <Clock size={12} />
                      {a.allocatedHours}h
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
              ))}
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


