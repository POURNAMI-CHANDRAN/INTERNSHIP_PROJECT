import { useState, useEffect } from "react";

export default function GenerateBillingModal({
  onClose,
  onGenerate
}: {
  onClose: () => void;
  onGenerate: (form: any) => void;
}) {
  const API_BASE = import.meta.env.VITE_API_BASE_URL;
  const token = localStorage.getItem("token");

  const [employees, setEmployees] = useState<any[]>([]);
  const [projects, setProjects] = useState<any[]>([]);

  const [form, setForm] = useState({
    employee_id: "",
    project_id: "",
    month: "",
    rate: 120
  });

  // Load dropdown data
  useEffect(() => {
    const headers = { Authorization: `Bearer ${token}` };

    const loadDropdowns = async () => {
      const empRes = await fetch(`${API_BASE}/api/employees`, { headers });
      const projRes = await fetch(`${API_BASE}/api/projects`, { headers });

      const empJson = await empRes.json();
      const projJson = await projRes.json();

      setEmployees(empJson.data || empJson);
      setProjects(projJson.data || projJson);
    };

    loadDropdowns();
  }, []);

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center">
      <div className="bg-white w-[420px] rounded-2xl p-6 shadow-xl border border-sky-200 animate-scale-in">

        <h2 className="text-xl font-bold text-sky-800 mb-4">Generate Billing</h2>

        {/* EMPLOYEE DROPDOWN */}
        <label className="text-sm text-sky-700">Select Employee</label>
        <select
          className="w-full px-3 py-2 border border-sky-300 rounded-lg mb-3 focus:ring-2 focus:ring-sky-400 outline-none"
          onChange={(e) => setForm({ ...form, employee_id: e.target.value })}
        >
          <option value="">Select Employee</option>
          {employees.map((emp) => (
            <option key={emp._id} value={emp._id}>
              {emp.name}
            </option>
          ))}
        </select>

        {/* PROJECT DROPDOWN */}
        <label className="text-sm text-sky-700">Select Project</label>
        <select
          className="w-full px-3 py-2 border border-sky-300 rounded-lg mb-3 focus:ring-2 focus:ring-sky-400 outline-none"
          onChange={(e) => setForm({ ...form, project_id: e.target.value })}
        >
          <option value="">Select Project</option>
          {projects.map((p) => (
            <option key={p._id} value={p._id}>
              {p.name}
            </option>
          ))}
        </select>

        {/* MONTH */}
        <label className="text-sm text-sky-700">Billing Month</label>
        <input
          type="month"
          className="w-full px-3 py-2 border border-sky-300 rounded-lg mb-3 focus:ring-2 focus:ring-sky-400 outline-none"
          onChange={(e) => setForm({ ...form, month: e.target.value })}
        />

        {/* RATE */}
        <label className="text-sm text-sky-700">Rate per Story Point</label>
        <input
          type="number"
          value={form.rate}
          className="w-full px-3 py-2 border border-sky-300 rounded-lg mb-4 focus:ring-2 focus:ring-sky-400 outline-none"
          onChange={(e) => setForm({ ...form, rate: Number(e.target.value) })}
        />

        {/* BUTTONS */}
        <div className="flex justify-end gap-4">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300 transition"
          >
            Cancel
          </button>

          <button
            onClick={() => onGenerate(form)}
            className="px-4 py-2 bg-sky-600 text-white rounded-lg hover:bg-sky-700 transition"
          >
            Generate
          </button>
        </div>

      </div>
    </div>
  );
}