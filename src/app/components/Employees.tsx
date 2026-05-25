import { useEffect, useState } from "react";
import axios from "axios";
import { X, User, Mail, Briefcase, MapPin, DollarSign, Calendar, IdCard } from "lucide-react";
import {cn} from "../components/ui/utils";

const API = import.meta.env.VITE_API_BASE_URL;

interface role { _id: string; name: string; }
interface WorkCategory { _id: string; name: string; }
interface Skill { _id: string; name: string; category: string; }

export function CreateEmployeeModal({
  roles,
  onClose,
  onSuccess,
}: {
  roles: role[];
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [workCategories, setWorkCategories] = useState<WorkCategory[]>([]);
  const [skills, setSkills] = useState<Skill[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    employeeId: "",
    name: "",
    email: "",
    roleId: "",
    primaryWorkCategoryId: "",
    skills: [] as string[],
    hourlyCost: "",
    joiningDate: "",
    location: "",
    status: "Active" as "Active" | "Inactive",
  });

  useEffect(() => {
    const fetchMasters = async () => {
      const headers = { Authorization: `Bearer ${localStorage.getItem("token")}` };
      try {
        const [wcRes, skillRes] = await Promise.all([
          axios.get(`${API}/api/workcategories`, { headers }),
          axios.get(`${API}/api/skills`, { headers }),
        ]);
        setWorkCategories(Array.isArray(wcRes.data) ? wcRes.data : wcRes.data.data ?? []);
        setSkills(Array.isArray(skillRes.data) ? skillRes.data : skillRes.data.data ?? []);
      } catch (err) {
        console.error("Master Data Failed", err);
      }
    };
    fetchMasters();
  }, []);

  const updateField = (key: keyof typeof form, value: any) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const toggleSkill = (skillId: string) => {
    setForm((prev) => ({
      ...prev,
      skills: prev.skills.includes(skillId)
        ? prev.skills.filter((id) => id !== skillId)
        : [...prev.skills, skillId],
    }));
  };

  const submit = async () => {
    if (!form.name || !form.employeeId || !form.roleId) {
      setError("Essential Fields are Missing.");
      return;
    }

    try {
      setLoading(true);
      await axios.post(`${API}/api/employees`, 
        { ...form, hourlyCost: Number(form.hourlyCost) },
        { headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }}
      );
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.message || "Creation Failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
      <div className="bg-white rounded-2xl w-full max-w-[560px] max-h-[90vh] overflow-hidden flex flex-col shadow-2xl ring-1 ring-slate-200">
        
        {/* HEADER */}
        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold tracking-tight text-sky-900">Onboard New Member</h2>
            <p className="text-xs font-medium text-slate-500 uppercase tracking-widest mt-1">Resource Directory</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-lg transition-colors text-sky-800">
            <X size={20} />
          </button>
        </div>

        {/* SCROLLABLE FORM AREA */}
        <div className="p-8 overflow-y-auto space-y-8">
          
          {/* SECTION: Identity */}
          <div className="space-y-4">
            <h3 className="text-[10px] font-bold text-sky-800 uppercase tracking-widest px-1">Identity</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
               <div className="relative group">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-sky-800 group-focus-within:text-sky-600 transition-colors" />
                  <input
                    placeholder="Legal Name"
                    className="w-full bg-slate-50 border-none ring-1 ring-slate-200 rounded-xl pl-10 pr-4 py-2.5 text-sm focus:ring-2 focus:ring-sky-600 transition-all outline-none"
                    value={form.name}
                    onChange={(e) => updateField("name", e.target.value)}
                  />
               </div>
                <div className="relative group">
                  <IdCard className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-sky-800 group-focus-within:text-sky-600 transition-colors" />
                  <input
                    type="text"
                    inputMode="numeric"
                    placeholder="Employee ID"
                    className="w-full bg-slate-50 border-none ring-1 ring-slate-200 rounded-xl pl-10 pr-4 py-2.5 text-sm focus:ring-2 focus:ring-sky-600 transition-all outline-none"
                    value={form.employeeId}
                    onChange={(e) => updateField("employeeId",e.target.value.replace(/\D/g, ""))}
                  />
                </div>
            </div>
          </div>

          <div className="relative group">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-sky-800 group-focus-within:text-sky-600 transition-colors" />
            <input
              type="email"
              placeholder="Work Email"
              className="w-full bg-slate-50 border-none ring-1 ring-slate-200 rounded-xl pl-10 pr-4 py-2.5 text-sm focus:ring-2 focus:ring-sky-600 transition-all outline-none"
              value={form.email}
              onChange={(e) => updateField("email", e.target.value)}
            />
          </div>
          {/* SECTION: Role & Allocation */}
          <div className="space-y-4">
            <h3 className="text-[10px] font-bold text-sky-800 uppercase tracking-widest px-1">Organization</h3>
            <div className="grid grid-cols-2 gap-4">
              <select
                className="w-full bg-slate-50 border-none ring-1 ring-slate-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-sky-600 transition-all outline-none appearance-none"
                value={form.roleId}
                onChange={(e) => updateField("roleId", e.target.value)}
              >
                <option value="">Role</option>
                {roles.map((d) => <option key={d._id} value={d._id}>{d.name}</option>)}
              </select>
              <select
                className="w-full bg-slate-50 border-none ring-1 ring-slate-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-sky-600 transition-all outline-none appearance-none"
                value={form.primaryWorkCategoryId}
                onChange={(e) => updateField("primaryWorkCategoryId", e.target.value)}
              >
                <option value="">Work Category</option>
                {workCategories.map((wc) => <option key={wc._id} value={wc._id}>{wc.name}</option>)}
              </select>
            </div>
          </div>

          {/* SECTION: Skills */}
          <div className="space-y-4">
            <h3 className="text-[10px] font-bold text-sky-800 uppercase tracking-widest px-1">Skills & Capabilities</h3>
            <div className="flex flex-wrap gap-2">
              {skills.map((s) => {
                const selected = form.skills.includes(s._id);
                return (
                  <button
                    key={s._id}
                    type="button"
                    onClick={() => toggleSkill(s._id)}
                    className={cn(
                      "px-3 py-1.5 rounded-lg text-xs font-bold transition-all border",
                      selected
                        ? "bg-slate-900 border-slate-900 text-white shadow-md shadow-slate-200"
                        : "bg-white border-slate-200 text-slate-500 hover:border-slate-300 hover:text-slate-700"
                    )}
                  >
                    {s.name}
                  </button>
                );
              })}
            </div>
          </div>

          {/* SECTION: Logistics */}
          <div className="space-y-4 pt-4 border-t border-slate-100">
            <div className="grid grid-cols-2 gap-4">
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-sky-800" />
                <input
                  type="date"
                  className="w-full bg-slate-50 border-none ring-1 ring-slate-200 rounded-xl pl-10 pr-4 py-2.5 text-sm focus:ring-2 focus:ring-sky-600 outline-none"
                  value={form.joiningDate}
                  onChange={(e) => updateField("joiningDate", e.target.value)}
                />
              </div>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-sky-800" />
                <input
                  placeholder="Location"
                  className="w-full bg-slate-50 border-none ring-1 ring-slate-200 rounded-xl pl-10 pr-4 py-2.5 text-sm focus:ring-2 focus:ring-sky-600 outline-none"
                  value={form.location}
                  onChange={(e) => updateField("location", e.target.value)}
                />
              </div>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-sky-800" />
                <input
                  type="number"
                  placeholder="Hourly Rate"
                  className="w-full bg-slate-50 border-none ring-1 ring-slate-200 rounded-xl pl-10 pr-4 py-2.5 text-sm focus:ring-2 focus:ring-sky-600 outline-none"
                  value={form.hourlyCost}
                  onChange={(e) => updateField("hourlyCost", e.target.value)}
                />
              </div>
              <select
                className="bg-slate-50 border-none ring-1 ring-slate-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-sky-600 outline-none"
                value={form.status}
                onChange={(e) => updateField("status", e.target.value)}
              >
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
              </select>
            </div>
          </div>
        </div>

        {/* FOOTER ACTIONS */}
        <div className="px-8 py-5 bg-slate-50 border-t border-slate-100 flex flex-col items-center justify-center gap-3">
          
          <p className="text-xs font-semibold text-red-500 text-center max-w-[300px] truncate">
            {error}
          </p>

          <div className="flex flex-col items-center gap-2">
            
            <button
              onClick={submit}
              disabled={loading}
              className="px-6 py-2 bg-sky-600 text-white text-sm font-bold rounded-xl shadow-lg shadow-slate-200 hover:bg-sky-700 active:scale-95 disabled:opacity-50 transition-all"
            >
              {loading ? "Onboarding..." : "Onboard Member"}
            </button>

            <button
              onClick={onClose}
              className="text-sm font-bold text-slate-500 hover:text-slate-700 transition-colors"
            >
              Cancel
            </button>

          </div>
        </div>
      </div>
    </div>
  );
}