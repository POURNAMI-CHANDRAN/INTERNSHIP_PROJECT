import {
  X,
  ArrowRightLeft,
  Edit3,
  Save,
  XCircle,
  Calendar,
  MapPin,
  Clock,
  DollarSign,
  Briefcase,
} from "lucide-react";
import { useState, memo } from "react";
import axios from "axios";

const API = import.meta.env.VITE_API_BASE_URL;
const MONTHLY_CAPACITY = 160;

function EmployeeDetails({
  employee,
  onClose,
  onUpdated,
  canEdit,
}: {
  employee: any;
  onClose: () => void;
  onUpdated?: () => void;
  canEdit: boolean;
}) {
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  const [editForm, setEditForm] = useState({
    joiningDate: employee.joiningDate ? employee.joiningDate.slice(0, 10) : "",
    location: employee.location || "",
    hourlyCost: employee.hourlyCost ?? 0,
  });

  const allocations = Array.isArray(employee.allocations) ? employee.allocations : [];
  const bookedHours = allocations.reduce((sum: number, a: any) => sum + (a.allocatedHours || 0), 0);
  const utilization = MONTHLY_CAPACITY > 0 ? Math.round((bookedHours / MONTHLY_CAPACITY) * 100) : 0;
  
  const joiningDateObj = employee.joiningDate ? new Date(employee.joiningDate) : null;
  const experienceYears = joiningDateObj
    ? Math.floor((Date.now() - joiningDateObj.getTime()) / (1000 * 60 * 60 * 24 * 365.25))
    : null;

  const saveChanges = async () => {
    try {
      setSaving(true);
      await axios.put(
        `${API}/api/employees/${employee._id}`,
        { ...editForm, hourlyCost: Number(editForm.hourlyCost) },
        { headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } }
      );
      setEditing(false);
      onUpdated?.();
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-slate-900/20 backdrop-blur-sm transition-all">
      <div className="flex h-full w-full max-w-md flex-col bg-white shadow-2xl ring-1 ring-black/5 animate-in slide-in-from-right duration-300">
        
        {/* HEADER: Profile Style */}
        <div className="relative border-b border-gray-100 bg-white p-6">
          <div className="flex items-start justify-between">
            <div className="flex gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-sky-50 text-sky-700 font-bold text-lg ring-4 ring-sky-50/50">
                {employee.name.charAt(0)}
              </div>
              <div>
                <h2 className="text-xl font-bold tracking-tight text-gray-900">{employee.name}</h2>
                <div className="mt-1 flex items-center gap-2">
                  <span className="inline-flex items-center rounded-md bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600">
                    {employee.employeeId}
                  </span>
                  <span className="text-xs text-gray-400">•</span>
                  <span className="text-sm text-gray-500 font-medium">
                    {employee.primaryWorkCategoryId?.name || "General Staff"}
                  </span>
                </div>
              </div>
            </div>
            <button 
              onClick={onClose} 
              className="rounded-full p-2 text-gray-400 hover:bg-gray-50 hover:text-gray-600 transition-colors"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* CONTENT */}
        <div className="flex-1 overflow-y-auto px-6 py-8 space-y-8">
          
          {/* UTILIZATION SECTION */}
          <section>
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400">Monthly Utilization</h3>
              <span className={`text-sm font-bold ${utilization > 100 ? 'text-amber-600' : 'text-sky-600'}`}>
                {utilization}%
              </span>
            </div>
            <div className="relative h-3 w-full overflow-hidden rounded-full bg-gray-100">
              <div
                className={`h-full rounded-full transition-all duration-500 ${utilization > 100 ? 'bg-amber-500' : 'bg-sky-500'}`}
                style={{ width: `${Math.min(utilization, 100)}%` }}
              />
            </div>
            <p className="mt-2 text-xs text-gray-500 flex items-center gap-1">
              <Clock size={12} /> {bookedHours}h of {MONTHLY_CAPACITY}h available capacity
            </p>
          </section>

          {/* INFORMATION GRID */}
          <section>
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400">Employee Details</h3>
              {canEdit && !editing && (
                <button
                  onClick={() => setEditing(true)}
                  className="flex items-center gap-1.5 text-xs font-semibold text-sky-600 hover:text-sky-700 transition-colors"
                >
                  <Edit3 size={14} /> Edit Info
                </button>
              )}
            </div>

            {!editing ? (
              <div className="grid grid-cols-2 gap-4">
                <InfoCard icon={<Calendar size={14}/>} label="Joined" value={joiningDateObj?.toLocaleDateString('en-US', { month: 'short', year: 'numeric', day: 'numeric' }) || "—"} />
                <InfoCard icon={<Briefcase size={14}/>} label="Experience" value={`${experienceYears ?? "0"} Years`} />
                <InfoCard icon={<MapPin size={14}/>} label="Location" value={employee.location || "Remote"} />
                <InfoCard icon={<DollarSign size={14}/>} label="Hourly Rate" value={`$${employee.hourlyCost || "0"}`} />
              </div>
            ) : (
              <div className="space-y-4 rounded-xl border border-sky-100 bg-sky-50/30 p-4 animate-in fade-in zoom-in-95 duration-200">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase text-sky-700 ml-1">Joining Date</label>
                  <input
                    type="date"
                    value={editForm.joiningDate}
                    onChange={(e) => setEditForm(p => ({ ...p, joiningDate: e.target.value }))}
                    className="w-full rounded-lg border-gray-200 bg-white px-3 py-2 text-sm shadow-sm focus:border-sky-500 focus:ring-sky-500 outline-none transition-all"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase text-sky-700 ml-1">Work Location</label>
                  <input
                    placeholder="e.g. New York, Remote"
                    value={editForm.location}
                    onChange={(e) => setEditForm(p => ({ ...p, location: e.target.value }))}
                    className="w-full rounded-lg border-gray-200 bg-white px-3 py-2 text-sm shadow-sm focus:border-sky-500 focus:ring-sky-500 outline-none transition-all"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase text-sky-700 ml-1">Hourly Cost ($)</label>
                  <input
                    type="number"
                    value={editForm.hourlyCost}
                    onChange={(e) => setEditForm(p => ({ ...p, hourlyCost: Number(e.target.value) }))}
                    className="w-full rounded-lg border-gray-200 bg-white px-3 py-2 text-sm shadow-sm focus:border-sky-500 focus:ring-sky-500 outline-none transition-all"
                  />
                </div>
                <div className="flex gap-2 pt-2">
                  <button
                    onClick={() => setEditing(false)}
                    className="flex-1 rounded-lg border border-gray-200 bg-white py-2 text-xs font-bold text-gray-600 hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={saveChanges}
                    disabled={saving}
                    className="flex-[2] flex items-center justify-center gap-2 rounded-lg bg-sky-600 py-2 text-xs font-bold text-white hover:bg-sky-700 shadow-md shadow-sky-200 disabled:opacity-50 transition-all"
                  >
                    {saving ? "Updating..." : <><Save size={14} /> Update Record</>}
                  </button>
                </div>
              </div>
            )}
          </section>
        </div>

        {/* FOOTER */}
        {canEdit && (
          <div className="border-t border-gray-100 p-6 bg-white">
            <button className="flex w-full items-center justify-center gap-2 rounded-xl bg-slate-900 py-3 text-sm font-bold text-white transition-all hover:bg-slate-800 active:scale-[0.98] shadow-lg shadow-slate-200">
              <ArrowRightLeft size={16} />
              Move Allocation
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// Sub-component for clean organization
function InfoCard({ icon, label, value }: { icon: React.ReactNode, label: string, value: string }) {
  return (
    <div className="rounded-xl border border-gray-100 bg-white p-3 shadow-sm transition-hover hover:border-sky-100 hover:shadow-md">
      <div className="flex items-center gap-2 text-gray-400 mb-1">
        {icon}
        <span className="text-[10px] font-bold uppercase tracking-tight">{label}</span>
      </div>
      <p className="text-sm font-semibold text-gray-800 truncate">{value}</p>
    </div>
  );
}

export default memo(EmployeeDetails);