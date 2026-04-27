// import { useState } from "react";
// import axios from "axios";

// const API = import.meta.env.VITE_API_BASE_URL;

// export function AllocateModal({
//   employees,
//   projects,
//   onClose,
//   onSuccess,
// }: {
//   employees: any[];
//   projects: any[];
//   onClose: () => void;
//   onSuccess: () => void;
// }) {
//   const [form, setForm] = useState({
//     employee: "",
//     project: "",
//     fte: 0,
//     month: new Date().getMonth() + 1,
//     year: new Date().getFullYear(),
//   });

//   const [loading, setLoading] = useState(false);
//   const [error, setError] = useState("");

//   const handleChange = (key: string, value: any) => {
//     setForm((p) => ({ ...p, [key]: value }));
//   };

// const submitAllocation = async () => {
//   if (!form.employee || !form.project || form.fte < 1) {
//     setError("Please select employee, project and valid FTE");
//     return;
//   }

//   if (form.fte > 160) {
//     setError("FTE cannot exceed 160 hours");
//     return;
//   }

//   try {
//     setLoading(true);
//     setError("");

//     await axios.post(
//       `${API}/api/allocations`,
//       {
//         ...form,
//         isBillable: true,
//       },
//       {
//         headers: {
//           Authorization: `Bearer ${localStorage.getItem("token")}`,
//         },
//       }
//     );

//     onSuccess();
//     onClose();
//   } catch (err: any) {
//     setError(err.response?.data?.message || "Allocation Failed");
//   } finally {
//     setLoading(false);
//   }
// };

//   return (
//     <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
//       <div className="bg-white rounded-xl shadow-xl p-6 w-[440px] space-y-4">
//         <h2 className="text-lg font-semibold">Allocate Resource</h2>

//         {/* Employee */}
//         <select
//           className="w-full border rounded px-3 py-2 text-sm"
//           value={form.employee}
//           onChange={(e) => handleChange("employee", e.target.value)}
//         >
//           <option value="">Select Employee</option>
//           {employees.map((e) => (
//             <option key={e._id} value={e._id}>
//               {e.name}
//             </option>
//           ))}
//         </select>

//         {/* Project */}
//         <select
//           className="w-full border rounded px-3 py-2 text-sm"
//           value={form.project}
//           onChange={(e) => handleChange("project", e.target.value)}
//         >
//           <option value="">Select Project</option>
//           {projects.map((p) => (
//             <option key={p._id} value={p._id}>
//               {p.name}
//             </option>
//           ))}
//         </select>

//         {/* FTE */}
//         <input
//           type="number"
//           min={1}
//           max={160}
//           placeholder="FTE (hours)"
//           className="w-full border rounded px-3 py-2 text-sm"
//           value={form.fte}
//           onChange={(e) => handleChange("fte", Number(e.target.value))}
//         />

//         {/* Month / Year */}
//         <div className="flex gap-2">
//           <input
//             type="number"
//             min={1}
//             max={12}
//             className="w-full border rounded px-3 py-2 text-sm"
//             value={form.month}
//             onChange={(e) => handleChange("month", Number(e.target.value))}
//           />
//           <input
//             type="number"
//             min={2024}
//             className="w-full border rounded px-3 py-2 text-sm"
//             value={form.year}
//             onChange={(e) => handleChange("year", Number(e.target.value))}
//           />
//         </div>

//         {error && <p className="text-sm text-red-500">{error}</p>}

//         {/* Actions */}
//         <div className="flex justify-end gap-2 pt-2">
//           <button
//             onClick={onClose}
//             className="px-4 py-2 border rounded text-sm"
//           >
//             Cancel
//           </button>
//           <button
//             onClick={submitAllocation}
//             disabled={loading}
//             className="px-4 py-2 bg-sky-600 text-white rounded text-sm"
//           >
//             {loading ? "Allocating…" : "Allocate"}
//           </button>
//         </div>
//       </div>
//     </div>
//   );
// }

// import { useState } from "react";
// import axios from "axios";

// const API = import.meta.env.VITE_API_BASE_URL;
// const MONTHLY_CAPACITY = 160;

// export function AllocateModal({
//   employees,
//   projects,
//   workCategories,
//   onClose,
//   onSuccess,
// }: {
//   employees: any[];
//   projects: any[];
//   workCategories: any[];
//   onClose: () => void;
//   onSuccess: () => void;
// }) {
//   const [form, setForm] = useState({
//     employeeId: "",
//     projectId: "",
//     workCategoryId: "",
//     allocatedHours: "",
//     month: new Date().getMonth() + 1,
//     year: new Date().getFullYear(),
//     isBillable: true,
//   });

//   const [loading, setLoading] = useState(false);
//   const [error, setError] = useState("");

//   const update = (key: string, value: any) =>
//     setForm((p) => ({ ...p, [key]: value }));

//   /* ================= SUBMIT ================= */

//   const submitAllocation = async () => {
//     const hours = Number(form.allocatedHours);

//     if (
//       !form.employeeId ||
//       !form.projectId ||
//       !form.workCategoryId ||
//       hours <= 0
//     ) {
//       setError("Please fill all required fields");
//       return;
//     }

//     if (hours > MONTHLY_CAPACITY) {
//       setError("Allocated hours cannot exceed 160");
//       return;
//     }

//     try {
//       setLoading(true);
//       setError("");

//       await axios.post(
//         `${API}/api/allocations`,
//         {
//           employeeId: form.employeeId,
//           projectId: form.projectId,
//           workCategoryId: form.workCategoryId,
//           allocatedHours: hours,
//           month: form.month,
//           year: form.year,
//           isBillable: form.isBillable,
//         },
//         {
//           headers: {
//             Authorization: `Bearer ${localStorage.getItem("token")}`,
//           },
//         }
//       );

//       onSuccess();
//       onClose();
//     } catch (err: any) {
//       setError(err.response?.data?.message || "Allocation failed");
//     } finally {
//       setLoading(false);
//     }
//   };

//   return (
//     <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
//       <div className="bg-white rounded-xl shadow-xl p-6 w-[440px] space-y-4">

//         <h2 className="text-lg font-semibold">Allocate Resource</h2>

//         {/* Employee */}
//         <select
//           className="w-full border rounded px-3 py-2 text-sm"
//           value={form.employeeId}
//           onChange={(e) => update("employeeId", e.target.value)}
//         >
//           <option value="">Select Employee</option>
//           {employees.map((e) => (
//             <option key={e._id} value={e._id}>
//               {e.employeeCode} · {e.name}
//             </option>
//           ))}
//         </select>

//         {/* Project */}
//         <select
//           className="w-full border rounded px-3 py-2 text-sm"
//           value={form.projectId}
//           onChange={(e) => update("projectId", e.target.value)}
//         >
//           <option value="">Select Project</option>
//           {projects.map((p) => (
//             <option key={p._id} value={p._id}>
//               {p.name}
//             </option>
//           ))}
//         </select>

//         {/* Work Category */}
//         <select
//           className="w-full border rounded px-3 py-2 text-sm"
//           value={form.workCategoryId}
//           onChange={(e) => update("workCategoryId", e.target.value)}
//         >
//           <option value="">Select Work Category</option>
//           {workCategories.map((w) => (
//             <option key={w._id} value={w._id}>
//               {w.name}
//             </option>
//           ))}
//         </select>

//         {/* Allocated Hours */}
//         <input
//           type="number"
//           min={1}
//           max={160}
//           placeholder="Allocated Hours (1–160)"
//           className="w-full border rounded px-3 py-2 text-sm"
//           value={form.allocatedHours}
//           onChange={(e) => update("allocatedHours", e.target.value)}
//         />

//         {/* Month / Year */}
//         <div className="flex gap-2">
//           <input
//             type="number"
//             min={1}
//             max={12}
//             className="w-full border rounded px-3 py-2 text-sm"
//             value={form.month}
//             onChange={(e) => update("month", Number(e.target.value))}
//           />
//           <input
//             type="number"
//             min={2024}
//             className="w-full border rounded px-3 py-2 text-sm"
//             value={form.year}
//             onChange={(e) => update("year", Number(e.target.value))}
//           />
//         </div>

//         {/* Billable */}
//         <label className="flex items-center gap-2 text-sm">
//           <input
//             type="checkbox"
//             checked={form.isBillable}
//             onChange={(e) => update("isBillable", e.target.checked)}
//           />
//           Billable
//         </label>

//         {error && <p className="text-sm text-red-500">{error}</p>}

//         {/* Actions */}
//         <div className="flex justify-end gap-2 pt-2">
//           <button
//             onClick={onClose}
//             className="px-4 py-2 border rounded text-sm"
//           >
//             Cancel
//           </button>
//           <button
//             onClick={submitAllocation}
//             disabled={loading}
//             className="px-4 py-2 bg-sky-600 text-white rounded text-sm"
//           >
//             {loading ? "Allocating…" : "Allocate"}
//           </button>
//         </div>
//       </div>
//     </div>
//   );
// }


import { useState } from "react";
import axios from "axios";
import { 
  X, User, Briefcase, Clock, Calendar, 
  CheckCircle2, AlertCircle, ArrowRightLeft 
} from "lucide-react";

const API = import.meta.env.VITE_API_BASE_URL;
const MONTHLY_CAPACITY = 160;

type Mode = "create" | "edit" | "move";

interface AllocateModalProps {
  mode: Mode;
  allocation?: any;
  employees?: any[];
  projects: any[];
  workCategories?: any[];
  onClose: () => void;
  onSuccess: () => void;
}

export function AllocateModal({
  mode,
  allocation,
  employees = [],
  projects,
  workCategories = [],
  onClose,
  onSuccess,
}: AllocateModalProps) {
  /* ================= STATE ================= */
  const [employeeId, setEmployeeId] = useState(allocation?.employeeId || "");
  const [projectId, setProjectId] = useState(allocation?.projectId?._id ?? allocation?.projectId ?? "");
  const [workCategoryId, setWorkCategoryId] = useState(allocation?.workCategoryId || "");
  const [allocatedHours, setAllocatedHours] = useState(allocation?.allocatedHours?.toString() || "");
  const [month, setMonth] = useState(allocation?.month || new Date().getMonth() + 1);
  const [year, setYear] = useState(allocation?.year || new Date().getFullYear());
  const [isBillable, setIsBillable] = useState(allocation?.isBillable ?? true);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const submit = async () => {
    const hours = Number(allocatedHours);
    try {
      setLoading(true);
      setError("");
      const config = {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      };

      if (mode === "create") {
        if (!employeeId || !projectId || !workCategoryId || hours <= 0) throw new Error("Please fill all required fields");
        if (hours > MONTHLY_CAPACITY) throw new Error(`Capacity cannot exceed ${MONTHLY_CAPACITY}h`);
        
        await axios.post(`${API}/api/allocations`, {
          employeeId, projectId, workCategoryId, allocatedHours: hours, month, year, isBillable,
        }, config);
      } else if (mode === "edit") {
        if (hours <= 0 || hours > MONTHLY_CAPACITY) throw new Error("Hours must be between 1 and 160");
        await axios.put(`${API}/api/allocations/${allocation._id}`, { allocatedHours: hours, isBillable }, config);
      } else if (mode === "move") {
        if (!projectId) throw new Error("Please select a target project");
        await axios.put(`${API}/api/allocations/${allocation._id}/move`, { newProjectId: projectId }, config);
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || "Operation Failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity" onClick={onClose} />

      {/* Modal Container */}
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-[480px] overflow-hidden animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-sky-100 text-sky-600 rounded-lg">
              {mode === "move" ? <ArrowRightLeft size={20} /> : <Briefcase size={20} />}
            </div>
            <h2 className="text-xl font-bold text-slate-900">
              {mode === "create" ? "New Allocation" : mode === "edit" ? "Edit Details" : "Move Resource"}
            </h2>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 p-1 rounded-full hover:bg-slate-200 transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="p-6 space-y-5">
          {error && (
            <div className="flex items-center gap-2 p-3 bg-red-50 text-red-700 rounded-lg border border-red-100 text-sm animate-in slide-in-from-top-2">
              <AlertCircle size={16} />
              {error}
            </div>
          )}

          {/* Form Fields */}
          <div className="grid gap-4">
            {/* Employee Selection */}
            {mode === "create" && (
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-sky-800 flex items-center gap-1.5">
                  <User size={12} /> Resource
                </label>
                <select
                  className="w-full bg-slate-50 border border-slate-200 px-3 py-2.5 rounded-lg text-sm focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 outline-none transition-all"
                  value={employeeId}
                  onChange={(e) => setEmployeeId(e.target.value)}
                >
                  <option value="">Select Employee...</option>
                  {employees.map((e) => (
                    <option key={e._id} value={e._id}>{e.employeeCode} • {e.name}</option>
                  ))}
                </select>
              </div>
            )}

            {/* Project Selection */}
            {(mode === "create" || mode === "move") && (
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-sky-800 flex items-center gap-1.5">
                  <Briefcase size={12} /> Target Project
                </label>
                <select
                  className="w-full bg-slate-50 border border-slate-200 px-3 py-2.5 rounded-lg text-sm focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 outline-none transition-all"
                  value={projectId}
                  onChange={(e) => setProjectId(e.target.value)}
                >
                  <option value="">Select Project...</option>
                  {projects.map((p) => (
                    <option key={p._id} value={p._id}>{p.name}</option>
                  ))}
                </select>
              </div>
            )}

            {/* Work Category */}
            {mode === "create" && (
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-sky-800 flex items-center gap-1.5">
                   Category
                </label>
                <select
                  className="w-full bg-slate-50 border border-slate-200 px-3 py-2.5 rounded-lg text-sm focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 outline-none transition-all"
                  value={workCategoryId}
                  onChange={(e) => setWorkCategoryId(e.target.value)}
                >
                  <option value="">Select Category...</option>
                  {workCategories.map((w) => (
                    <option key={w._id} value={w._id}>{w.name}</option>
                  ))}
                </select>
              </div>
            )}

            {/* Hours & Billing */}
            {(mode === "create" || mode === "edit") && (
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-sky-800 flex items-center gap-1.5">
                    <Clock size={12} /> Hours/Mo
                  </label>
                  <input
                    type="number"
                    max={160}
                    className="w-full bg-slate-50 border border-slate-200 px-3 py-2.5 rounded-lg text-sm focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 outline-none transition-all"
                    placeholder="e.g. 160"
                    value={allocatedHours}
                    onChange={(e) => setAllocatedHours(e.target.value)}
                  />
                </div>
                <div className="flex flex-col justify-end pb-3">
                  <label className="flex items-center gap-2 cursor-pointer group">
                    <input
                      type="checkbox"
                      className="w-4 h-4 rounded text-sky-600 focus:ring-sky-500/20 border-slate-300"
                      checked={isBillable}
                      onChange={(e) => setIsBillable(e.target.checked)}
                    />
                    <span className="text-sm font-medium text-slate-700 group-hover:text-slate-900 transition-colors">Billable</span>
                  </label>
                </div>
              </div>
            )}

            {/* Period */}
            {mode === "create" && (
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-sky-800 flex items-center gap-1.5">
                  <Calendar size={12} /> Allocation Period
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="number"
                    className="w-full bg-slate-50 border border-slate-200 px-3 py-2.5 rounded-lg text-sm"
                    value={month}
                    onChange={(e) => setMonth(Number(e.target.value))}
                    placeholder="Month"
                  />
                  <input
                    type="number"
                    className="w-full bg-slate-50 border border-slate-200 px-3 py-2.5 rounded-lg text-sm"
                    value={year}
                    onChange={(e) => setYear(Number(e.target.value))}
                    placeholder="Year"
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex justify-center gap-3">
          <button
            onClick={submit}
            disabled={loading}
            className="flex items-center gap-2 bg-sky-600 hover:bg-sky-700 disabled:bg-slate-300 text-white px-6 py-2 rounded-lg text-sm font-bold shadow-md shadow-sky-200 transition-all active:scale-95"
          >
            {loading ? (
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <CheckCircle2 size={16} />
            )}
            {mode === "create" ? "Confirm Allocation" : "Update Records"}
          </button>

          <button 
            onClick={onClose} 
            className="px-4 py-2 text-sm font-semibold text-slate-600 hover:text-slate-800 transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}