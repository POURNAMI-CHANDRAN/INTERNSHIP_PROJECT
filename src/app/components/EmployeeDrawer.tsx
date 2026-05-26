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
  ShieldCheck,
  Tag,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { AllocateModal } from "./AllocateModal";

const API = import.meta.env.VITE_API_BASE_URL;
const CAPACITY = 160;
const USD_TO_INR = 83;

const MONTHS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
];

export const toUSD = (inr: number) => inr / USD_TO_INR;
export const toINR = (usd: number) => usd * USD_TO_INR;

/* ===================== TYPES ===================== */

type role = {
  _id: string;
  name: string;
};

type EditFormState = {
  roleId: string;
  joiningDate: string;
  location: string;
  monthlySalary: string;
  billingRate: string;
  billingCurrency: string;
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
  selectedMonth: number;
  selectedYear: number;
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
  selectedMonth,
  selectedYear,
}: EmployeeDrawerProps) {
  const [editingInfo, setEditingInfo] = useState(false);
  const [savingInfo, setSavingInfo] = useState(false);
  const [allocationMode, setAllocationMode] = useState<"edit" | "move" | null>(null);
  const [activeAllocation, setActiveAllocation] = useState<any>(null);
  const [allSkills, setAllSkills] = useState<any[]>([]);
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
    monthlySalary: "",
    billingRate: "",
    billingCurrency: "INR",
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
      monthlySalary: employee?.monthlySalary?.toString() || "",
      billingRate: employee?.billingRate?.toString() || "",
      billingCurrency: employee?.billingCurrency || "INR",
      skills: Array.isArray(employee?.skills)
        ? employee.skills
          .map((s: any) => (typeof s === "object" ? s._id || s.id : s))
          .filter(Boolean)
          .map((id: any) => String(id))
        : [],
    });
  }, [employee]);

  /* ===================== DERIVED VALUES ===================== */

  const allocations = employee?.allocations || [];

  const bookedHours = allocations.reduce(
    (sum: number, item: any) => sum + Number(item?.allocatedHours || 0),
    0
  );

  const remainingHours = Math.max(0, CAPACITY - bookedHours);
  const utilizationPct = Math.round((bookedHours / CAPACITY) * 100);
  const totalFTE = getFTE(bookedHours);

  const getUtilColor = (pct: number) => {
    if (pct > 100) return "text-red-600";
    if (pct > 90) return "text-green-600";
    if (pct > 60) return "text-sky-600";
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
    return roles.find((d) => d._id === editForm.roleId)?.name ?? "NA";
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
          monthlySalary: Number(editForm.monthlySalary),
          billingRate: Number(editForm.billingRate),
          billingCurrency: editForm.billingCurrency,
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
    <div className="fixed inset-0 z-50 bg-slate-100 flex flex-col h-screen w-screen overflow-hidden font-sans select-none">
    {/* HEADER */}
    <header className="h-14 bg-white border-b border-slate-200 px-6 flex items-center justify-center gap-6 shrink-0">

      {/* LEFT SECTION */}
      <div className="flex items-center justify-center gap-4 min-w-0">

        {/* AVATAR */}
        <div className="relative shrink-0">
          <div className="w-11 h-11 rounded-full bg-gradient-to-br from-sky-100 to-sky-200 
                          text-sky-700 flex items-center justify-center text-base font-semibold 
                          shadow-sm ring-1 ring-slate-200">
            {employee?.name?.charAt(0) || "U"}
          </div>

          <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full bg-emerald-400 ring-2 ring-white" />
        </div>

        {/* TEXT BLOCK */}
        <div className="flex flex-col items-center justify-center min-w-0">

          {/* NAME */}
          <h1 className="text-sm font-bold uppercase text-slate-900 leading-tight truncate">
            {employee?.name || "Unknown User"}
          </h1>

          {/* METADATA */}
          <div className="flex items-center justify-center gap-3 mt-1 text-xs text-slate-500 flex-wrap">

            {/* ID */}
            <div className="flex items-center justify-center gap-1 text-indigo-800 font-medium">
              <User size={13} />
              <span>{employee?.employeeId || "—"}</span>
            </div>

            {/* ROLE */}
            <div className="flex items-center justify-center gap-1 text-sky-600 font-medium">
              <Briefcase size={13} />
              <span>{roleName || "Staff"}</span>
            </div>

            {/* CATEGORY */}
            <div className="flex items-center justify-center gap-1 font-medium text-cyan-800">
              <Tag size={13} />
              <span>{employee?.primaryWorkCategoryId?.name || "General"}</span>
            </div>

            {/* EMAIL */}
            <div className="flex items-center justify-center gap-1 font-medium text-indigo-900">
              <Mail size={13} />
              <span>
                {employee?.email || "no-email@company.com"}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* CLOSE BUTTON */}
      <button
        onClick={onClose}
        className="w-9 h-9 flex items-center justify-center rounded-lg 
                  text-slate-400 hover:bg-red-50 hover:text-red-500 transition">
        <X size={18} />
      </button>
    </header>

      {/* BODY */}
      <main className="flex-1 grid grid-cols-12 overflow-hidden h-[calc(100vh-3.5rem)]">
        {/* LEFT SIDE FIXED PANEL */}
        <aside className="col-span-12 lg:col-span-4 xl:col-span-3 bg-white flex flex-col overflow-hidden h-full">
          
          {/* HEADER TITLE COMPONENT */}
          <div className="px-4 pt-4 pb-2 flex items-center justify-between shrink-0">
            <h3 className="text-[11px] font-black uppercase tracking-wider text-sky-900">
              Personnel Details
            </h3>
            {canEdit && !editingInfo && (
              <button
                onClick={() => setEditingInfo(true)}
                className="px-2 py-1 text-xs gap-1 rounded-md text-sky-600 hover:bg-sky-50 font-medium flex items-center transition"
              >
                <Edit3 size={18} />
              </button>
            )}
          </div>

          {/* SCROLLABLE INNER PANEL SECTION */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
            {!editingInfo ? (
              <div className="space-y-2">
                <Row icon={<Calendar size={13} />} label="Join Date" value={employee?.joiningDate ? new Date(employee.joiningDate).toLocaleDateString() : "—"} />
                <Row icon={<Briefcase size={13} />} label="Experience" value={experience} />
                <Row icon={<MapPin size={13} />} label="Work Hub" value={employee?.location || "Remote"} />
                <Row icon={<DollarSign size={13} />} label="Salary" value={`₹${employee?.monthlySalary?.toLocaleString("en-IN") || 0}`} />
                <Row 
                  icon={<TrendingUp size={13} />} 
                  label="Billing Rate" 
                  value={
                    <div className="text-right font-bold text-slate-800">
                      ${employee?.billingCurrency === "USD" ? employee?.billingRate : (employee?.billingRate / 83).toFixed(1)}/h
                      <span className="text-xs text-gray-400 mx-1">→</span>
                      ₹{employee?.billingCurrency === "USD" ? (employee?.billingRate * 83).toLocaleString("en-IN") : employee?.billingRate?.toLocaleString("en-IN")}/h

                    </div>
                  } 
                />
                <Row icon={<Clock size={13} />} label="Cost Rate" value={`₹${employee?.hourlyCost?.toLocaleString("en-IN") || 0}/hr`} />

                <div className="pt-2">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[10px] font-bold text-sky-800 uppercase tracking-wide">
                      Assigned Skills ({employee?.skills?.length || 0})
                    </span>
                  </div>
                  
                  {/* Flex Wrap ensures items flow naturally down without a forced scrollbar */}
                  <div className="flex flex-wrap gap-1 max-h-[120px] overflow-y-auto pr-1 custom-scrollbar">
                    {employee?.skills?.length ? (
                      employee.skills.map((s: any) => (
                        <span 
                          key={s._id || s} 
                          className="bg-sky-50/60 border border-sky-100 text-sky-950 px-2 py-0.5 rounded text-[10px] font-semibold tracking-tight shadow-sm"
                        >
                          {s.name ?? s}
                        </span>
                      ))
                    ) : (
                      <span className="text-xs text-slate-400 italic">No Skills Documented</span>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-4 animate-fadeIn">
                <div>
                  <label className="text-[10px] font-bold uppercase text-sky-800 block mb-1">Role Architecture</label>
                  <select value={editForm.roleId} onChange={(e) => setEditForm({...editForm, roleId: e.target.value})} className="w-full h-8 px-2 rounded border border-slate-200 text-xs outline-none bg-white focus:border-sky-500 focus:ring-1 focus:ring-sky-500">
                    <option value="">Select Role</option>
                    {roles.map((role) => <option key={role._id} value={role._id}>{role.name}</option>)}
                  </select>
                </div>

                <Input label="Joining Date" type="date" value={editForm.joiningDate} onChange={(e: any) => setEditForm({...editForm, joiningDate: e.target.value})} />
                <Input label="Work Location" value={editForm.location} onChange={(e: any) => setEditForm({...editForm, location: e.target.value})} />
                <Input label="Monthly Base Salary (INR)" type="number" value={editForm.monthlySalary} onChange={(e: any) => setEditForm({...editForm, monthlySalary: e.target.value})} />

                <div className="grid grid-cols-3 gap-2 items-end">
                  <div className="col-span-2">
                    <Input label="Client Billing Rate" type="number" value={editForm.billingRate} onChange={(e: any) => setEditForm({...editForm, billingRate: e.target.value})} />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold uppercase text-slate-400 block mb-1">Currency</label>
                    <select value={editForm.billingCurrency} onChange={(e) => setEditForm({...editForm, billingCurrency: e.target.value})} className="w-full h-8 px-2 rounded border border-slate-200 text-xs outline-none bg-white focus:border-sky-500 focus:ring-1 focus:ring-sky-500">
                      <option value="INR">INR ₹</option>
                      <option value="USD">USD $</option>
                      <option value="EUR">EUR €</option>
                    </select>
                  </div>
                </div>

                {/* RELIABLE INLINE SKILLS MANAGER */}
                <div className="pt-3">
                  <label className="text-[10px] font-bold uppercase text-slate-400 block mb-1">Manage Skills ({editForm.skills.length})</label>
                  <input placeholder="Filter skill list..." value={skillSearch} onChange={(e) => setSkillSearch(e.target.value)} className="px-2 py-1.5 text-xs border border-slate-200 rounded outline-none w-full mb-1.5 focus:border-sky-500" />
                  <div className="border border-slate-200 rounded bg-slate-50 max-h-40 overflow-y-auto divide-y divide-slate-100">
                    {filteredSkills.map((skill) => {
                      const skillId = skill._id || skill.id;
                      const isSelected = editForm.skills.includes(String(skillId));
                      return (
                        <div 
                          key={skillId} 
                          onClick={() => {
                            setEditForm(prev => ({
                              ...prev,
                              skills: isSelected ? prev.skills.filter(id => id !== String(skillId)) : [...prev.skills, String(skillId)]
                            }));
                          }} 
                          className={`px-2.5 py-1.5 text-xs flex justify-between items-center cursor-pointer select-none transition-colors ${isSelected ? "bg-sky-50 text-sky-700 font-semibold" : "text-slate-600 hover:bg-white"}`}
                        >
                          <span className="">{skill.name}</span>
                          <input type="checkbox" checked={isSelected} readOnly className="rounded border-slate-300 text-sky-600 accent-sky-600 pointer-events-none" />
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* EDIT FORM FIXED BOTTOM BUTTONS */}
          {editingInfo && (
            <div className="p-3 bg-slate-50 border-t border-slate-200 flex gap-2 shrink-0">
              <button 
                onClick={() => setEditingInfo(false)} 
                className="flex-1 h-8 rounded border border-slate-200 bg-white hover:bg-slate-100 text-slate-700 text-xs font-semibold transition"
              >
                Cancel
              </button>
              <button 
                onClick={saveEmployeeInfo} 
                disabled={savingInfo} 
                className="flex-1 h-8 rounded bg-sky-600 hover:bg-sky-700 disabled:bg-sky-400 text-white text-xs font-semibold flex items-center justify-center gap-1.5 shadow-sm transition"
              >
                <Save size={13} />
                <span>{savingInfo ? "Saving..." : "Save Changes"}</span>
              </button>
            </div>
          )}

          {/* BOTTOM RESOURCE LOAD BLOCK */}
          <div className="border-t border-slate-200 p-4 bg-slate-50 shrink-0">
            <div className="flex justify-between items-center mb-1.5">
              <h3 className="text-[10px] font-black uppercase tracking-wider text-sky-900">Resource Load</h3>
              <span className={`text-base font-black ${getUtilColor(utilizationPct)}`}>{utilizationPct}%</span>
            </div>

            <div className="flex justify-between items-baseline mb-2">
              <div>
                <span className="text-lg font-black text-indigo-900">{totalFTE.toFixed(2)} FTE</span>
                <span className="text-[12px] font-medium text-slate-700 ml-1.5">({bookedHours}h / {CAPACITY}h)</span>
              </div>
              <div className="text-medium text-slate-900">Free: <span className="font-bold text-amber-900">{remainingHours}h</span></div>
            </div>

            <div className="h-2 rounded-full bg-slate-200 overflow-hidden shadow-inner">
              <div className={`h-full transition-all duration-300 ${utilizationPct > 100 ? "bg-red-500" : utilizationPct > 90 ? "bg-emerald-500" : utilizationPct > 60 ? "bg-sky-500" : "bg-amber-500"}`} style={{ width: `${Math.min(utilizationPct, 100)}%` }} />
            </div>
          </div>
        </aside>

        {/* RIGHT SIDE DASHBOARD SECTION */}
        <section className="col-span-12 lg:col-span-8 xl:col-span-9 p-6 flex flex-col h-full overflow-hidden bg-slate-50">
          {/* ALLOCATIONS HEADER AREA */}
          <div className="flex items-center justify-between border-b border-slate-200 pb-3 mb-4 shrink-0">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-sky-50 text-sky-600 shrink-0">
                <TrendingUp size={18} />
              </div>
              <div>
                <span className="font-bold tracking-tight text-slate-900 text-medium block">Project Allocations</span>
                <span className="text-xs text-slate-400 font-medium block">Real-time schedule distribution setup</span>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <span className="text-xs font-bold bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-md text-emerald-800">
                {allocations.length} Active
              </span>

              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md border border-slate-200 bg-white text-xs font-bold text-slate-700 shadow-sm">
                <Calendar size={13} className="text-sky-500" />
                <span className="uppercase text-slate-800">{MONTHS[selectedMonth - 1] || "—"}</span>
                <span className="text-slate-300">/</span>
                <span className="text-sky-600">{selectedYear}</span>
              </div>
            </div>
          </div>

          {/* DYNAMIC CARDS PANEL */}
          <div className="flex-1 min-h-0 overflow-y-auto pr-1">
            {allocations.length === 0 ? (
              <div className="h-full bg-white rounded-xl border border-slate-200 flex flex-col items-center justify-center text-slate-400 shadow-inner p-8">
                <User size={32} className="mb-2 opacity-30 text-sky-500" />
                <span className="text-sm font-semibold">Currently on Bench</span>
                <p className="text-xs text-slate-400 mt-0.5">No client execution targets assigned for this timeline.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
                {allocations.map((a: any) => {
                  const hours = a.allocatedHours || 0;
                  const fte = hours / CAPACITY;
                  const allocationPct = Math.round((hours / CAPACITY) * 100);

                  return (
                    <div key={a._id} className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm flex flex-col justify-between h-[120px] transition min-w-0 group relative hover:border-slate-300 hover:shadow-md">
                      <div className="flex justify-between items-start gap-2 min-w-0">
                        <div className="min-w-0 flex-1">
                          <h4 className="font-bold text-slate-900 text-sm  leading-tight">
                            {a?.projectId?.name || "Unnamed Project"}
                          </h4>
                          <p className="text-[11px] font-semibold text-cyan-700 mt-1 ">
                            {workCategories.find((wc: any) => wc._id === (typeof a.workCategoryId === "object" ? a.workCategoryId?._id : a.workCategoryId))?.name || "General"}
                          </p>
                        </div>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md shrink-0 leading-none ${a.isBillable ? "bg-emerald-50 border border-emerald-100 text-emerald-700" : "bg-yellow-50 border border-yellow-100 text-yellow-700"}`}>
                          {a.isBillable ? "Billable" : "Internal"}
                        </span>
                      </div>

                      <div className="flex items-center justify-between pt-3 border-t border-slate-100 min-w-0">
                        <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800 min-w-0 ">
                          <div className="flex items-center gap-1 text-purple-700 shrink-0">
                            <Clock size={12} />
                            <span>{fte.toFixed(2)} FTE</span>
                          </div>
                          <span className="text-slate-300">•</span>
                          <div className="text-sky-700 shrink-0">{hours}h</div>
                          <div className="text-[10px] text-slate-900 font-medium shrink-0">({allocationPct}%)</div>
                        </div>

                        {canEdit && (
                          <div className="flex gap-1 opacity-100 xl:opacity-0 xl:group-hover:opacity-100 transition duration-150 shrink-0">
                            <IconButton icon={<Edit3 size={12} />} onClick={() => { setActiveAllocation(a); setAllocationMode("edit"); }} color="text-sky-600 bg-slate-50 hover:bg-sky-50 border border-slate-100" />
                            <IconButton icon={<ArrowRightLeft size={12} />} onClick={() => { setActiveAllocation(a); setAllocationMode("move"); }} color="text-sky-600 bg-slate-50 hover:bg-sky-50 border border-slate-100" />
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </section>
      </main>

      {/* MODAL WINDOW OVERLAYS */}
      {allocationMode && activeAllocation && (
        <AllocateModal
          mode={allocationMode}
          allocation={activeAllocation}
          projects={projects}
          workCategories={workCategories}
          onClose={() => { setAllocationMode(null); setActiveAllocation(null); }}
          onSuccess={() => { refetchEmployees(); setAllocationMode(null); setActiveAllocation(null); }}
        />
      )}
    </div>
  );
}

/* ===================== SUB-COMPONENTS ===================== */

function Row({ icon, label, value }: any) {
  return (
    <div className="flex items-start justify-between gap-3 py-1 min-w-0">
      <div className="flex items-center gap-1.5 text-slate-500 text-xs shrink-0 pt-0.5">
        <span className="text-sky-800">{icon}</span>
        <span className="font-medium text-sky-900">{label}</span>
      </div>
      <div className="text-xs font-bold text-slate-800 text-right min-w-0 flex-1 flex justify-end">
        {value}
      </div>
    </div>
  );
}

function Input({ label, ...props }: any) {
  return (
    <div>
      <label className="text-[10px] font-bold uppercase text-sky-800 block mb-1">{label}</label>
      <input {...props} className="w-full h-8 px-2 rounded border border-slate-200 text-xs outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 bg-white" />
    </div>
  );
}

function IconButton({ icon, onClick, color }: any) {
  return (
    <button onClick={onClick} className={`w-7 h-7 rounded-md flex items-center justify-center transition shrink-0 border ${color}`}>
      {icon}
    </button>
  );
}