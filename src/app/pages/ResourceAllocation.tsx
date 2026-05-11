import React, { useEffect, useMemo, useState } from "react";
import {
  Plus,
  Users,
  Briefcase,
  Layers,
  Edit,
  Trash2,
  BookOpen,
} from "lucide-react";

import {
  BarChart,
  Bar,
  Tooltip,
  CartesianGrid,
  XAxis,
  YAxis,
  ResponsiveContainer,
} from "recharts";

/* ============================================================
   TYPES — Backend → Frontend Normalization
============================================================ */

type Employee = {
  _id: string;
  name: string;
};

type Project = {
  _id: string;
  name: string;
  billingType?: "Billable" | "Non-Billable" | "Shadow";
  billingModel?: "Billable" | "Non-Billable" | "Shadow";
};

type BackendAllocation = {
  _id: string;
  employee: Employee | string;
  project: Project | string;
  allocation: number;
  startDate: string;
  endDate: string;
};

type Allocation = {
  _id: string;
  employeeId: string;
  employeeName: string;
  projectId: string;
  projectName: string;
  billingType: "Billable" | "Non-Billable" | "Shadow";
  allocation: number;
  startDate: string;
  endDate: string;
};

/* ============================================================
   BILLING NORMALIZATION
============================================================ */

function extractBilling(p: any): "Billable" | "Non-Billable" | "Shadow" {
  return p.billingType || p.billingModel || "Non-Billable";
}

/* ============================================================
   NORMALIZE BACKEND ALLOCATION → FRONTEND ALLOCATION
============================================================ */
function normalizeAllocation(
  a: BackendAllocation,
  projectsList: Project[]
): Allocation {
  // 1) Extract projectId safely
  const projectId =
    typeof a.project === "string"
      ? a.project
      : typeof a.project === "object"
      ? a.project._id
      : "";

  // 2) Find full project details from projectsList
  const fullProject = projectsList.find((p) => p._id === projectId);

  // 3) Extract billing safely from full project
  const billingType = fullProject
    ? extractBilling(fullProject)
    : "Non-Billable";

  return {
    _id: a._id,
    employeeId: typeof a.employee === "object" ? a.employee._id : "",
    employeeName: typeof a.employee === "object" ? a.employee.name : "",
    projectId: projectId,
    projectName:
      typeof a.project === "object" ? a.project.name : fullProject?.name || "",
    billingType: billingType,
    allocation: a.allocation,
    startDate: a.startDate?.slice(0, 10),
    endDate: a.endDate?.slice(0, 10),
  };
}

/* ============================================================
   MAIN COMPONENT
============================================================ */
export default function ResourceAllocation() {
  const API_BASE = import.meta.env.VITE_API_BASE_URL;
  const token = localStorage.getItem("token") || "";

  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const role = user.role;

  const isAdmin = role === "Admin";
  const isHR = role === "Finance";
  const isEmployee = role === "Employee";

  /* ------------------ STATE ------------------ */
  const [allocations, setAllocations] = useState<Allocation[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  const [filterEmployee, setFilterEmployee] = useState("All");
  const [filterProject, setFilterProject] = useState("All");
  const [filterBilling, setFilterBilling] = useState("All");

  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Allocation | null>(null);

  const emptyForm = {
    employeeId: "",
    projectId: "",
    allocation: "",
    startDate: "",
    endDate: "",
  };

  const [form, setForm] = useState(emptyForm);

  /* ------------------ SAFE JSON PARSER ------------------ */
  const safeJSON = async (res: Response) => {
    const text = await res.text();
    try {
      return JSON.parse(text);
    } catch {
      console.error("Non-JSON response:", text);
      throw new Error("Invalid JSON");
    }
  };

  /* ============================================================
     LOAD DATA
  ============================================================ */
  const loadEmployees = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/employees`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await safeJSON(res);
      setEmployees(json.data || json || []);
    } catch (err) {
      console.error(err);
    }
  };

  const loadProjects = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/projects`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await safeJSON(res);
      const normalized = (json.data || json || []).map((p: any) => ({
        ...p,
        billingType: extractBilling(p),
      }));
      setProjects(normalized);
    } catch (err) {
      console.error(err);
    }
  };

  const loadAllocations = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/allocations`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await safeJSON(res);
      const normalized = (json.data || json || []).map((a: BackendAllocation) =>
        normalizeAllocation(a, projects)
      );
      setAllocations(normalized);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  /* ============================================================
     SAVE ALLOCATION
  ============================================================ */
  const saveAllocation = async () => {
    if (!form.employeeId) return alert("Employee is required");
    if (!form.projectId) return alert("Project is required");
    if (!form.allocation) return alert("Allocation % required");
    if (!form.startDate) return alert("Start Date required");
    if (!form.endDate) return alert("End Date required");

    const payload = {
      employee: form.employeeId,
      project: form.projectId,
      allocation: Number(form.allocation),
      startDate: form.startDate,
      endDate: form.endDate,
    };

    try {
      const endpoint = editing
        ? `${API_BASE}/api/allocations/${editing._id}`
        : `${API_BASE}/api/allocations`;

      const method = editing ? "PATCH" : "POST";

      const res = await fetch(endpoint, {
        method,
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const json = await safeJSON(res);

      if (!res.ok) {
        alert(json.error || "Failed to save allocation");
        return;
      }

      setShowModal(false);
      loadAllocations();
    } catch (err) {
      console.error("Save failed:", err);
    }
  };

  
  /* ============================================================
     DELETE ALLOCATION
  ============================================================ */
  const deleteAllocation = async (id: string) => {
    if (!confirm("Are you sure you want to delete this allocation?")) return;
    try {
      await fetch(`${API_BASE}/api/allocations/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      loadAllocations();
    } catch (err) {
      console.error(err);
    }
  };

  /* ============================================================
     INITIAL LOAD
  ============================================================ */
  // 1. Load employees + projects first
  useEffect(() => {
    (async () => {
      await loadEmployees();
      await loadProjects();
    })();
  }, []);

  // 2. Load allocations only after projects are loaded
  useEffect(() => {
    if (projects.length > 0) {
      loadAllocations();
    }
  }, [projects]);

  /* ============================================================
     FILTERED ALLOCATIONS
  ============================================================ */
  const filteredAllocations = useMemo(() => {
    return allocations.filter((a) => {
      if (isEmployee && a.employeeId !== user._id) return false;
      if (filterEmployee !== "All" && a.employeeId !== filterEmployee) return false;
      if (filterProject !== "All" && a.projectId !== filterProject) return false;
      if (filterBilling !== "All" && a.billingType !== filterBilling) return false;
      return true;
    });
  }, [allocations, filterEmployee, filterProject, filterBilling, isEmployee, user._id]);

  /* ============================================================
     UTILIZATION METRICS
  ============================================================ */
  const utilizationMetrics = useMemo(() => {
    const map: Record<string, { employee: string; bill: number; total: number }> = {};

    allocations.forEach((a) => {
      if (!map[a.employeeId])
        map[a.employeeId] = { employee: a.employeeName, bill: 0, total: 0 };
      map[a.employeeId].total += a.allocation;
      if (a.billingType === "Billable") map[a.employeeId].bill += a.allocation;
    });

    return Object.values(map).map((item) => ({
      employee: item.employee,
      storyPoints: item.bill,
      utilization: item.total === 0 ? 0 : Number(((item.bill / item.total) * 100).toFixed(2)),
      isBenchRisk: item.bill === 0,
    }));
  }, [allocations]);

  /* ============================================================
     UI START — HEADER + KPI + CHARTS
============================================================ */

return (
  <div className="w-full min-h-screen bg-sky-50 py-10">
    <div className="max-w-7xl mx-auto px-6 space-y-10">

    {/* ================= HEADER ================= */}
    <div className="bg-sky-200 p-8 rounded-xl shadow-lg flex justify-between items-center">
      <div className="flex items-start gap-4">

        {/* ICON GROUP */}
        <div className="flex items-center gap-3">
          {}
          <div className="bg-white w-12 h-12 rounded-lg flex items-center justify-center shadow-md border">
            <Layers size={28} className="text-sky-700" />
          </div>
        </div>

        {/* TEXT */}
        <div>
          <h1 className="text-3xl font-bold text-sky-900">Resource Allocation</h1>
          <p className="text-sky-700">
            Track project billing distribution and allocation records
          </p>
        </div>

      </div>

        {(isAdmin || isHR) && (
          <button
            onClick={() => {
              setEditing(null);
              setForm(emptyForm);
              setShowModal(true);
            }}
            className="px-5 py-2 bg-sky-600 text-white rounded-lg shadow flex items-center gap-2 hover:bg-sky-700"
          >
            <Plus size={18} />
            Add Allocation
          </button>
        )}
      </div>

        {/* ========= PROJECT BILLING DISTRIBUTION ========= */}
        <div className="
          bg-white/90 backdrop-blur-xl p-8 rounded-3xl 
          shadow-xl border border-sky-100
        ">
          <h2 className="text-xl font-bold text-sky-900 mb-6">Project Billing Distribution</h2>

          {projects.length === 0 ? (
            <p className="text-sky-700">No projects available.</p>
          ) : (
            <ul className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
              {projects.map((p) => (
                <li
                  key={p._id}
                  className="
                    flex justify-between bg-sky-50/80 px-5 py-3 rounded-xl 
                    border border-sky-100 hover:bg-sky-100 
                    transition shadow-sm hover:shadow
                  "
                >
                  <span>{p.name}</span>

                  <span
                    className={`
                      px-3 py-1 rounded-full text-xs font-semibold
                      ${
                        extractBilling(p) === "Billable"
                          ? "bg-green-100 text-green-700"
                          : extractBilling(p) === "Shadow"
                          ? "bg-yellow-100 text-yellow-700"
                          : "bg-red-100 text-red-700"
                      }
                    `}
                  >
                    {extractBilling(p)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>

      {/* ================= FILTER BAR ================= */}
      <div className="bg-white p-5 rounded-xl shadow-md border border-sky-200 grid md:grid-cols-4 gap-4">
        <FilterBox
          label="Employee"
          value={filterEmployee}
          setValue={setFilterEmployee}
          options={[
            "All",
            ...employees.map((e) => ({ label: e.name, value: e._id })),
          ]}
        />

        <FilterBox
          label="Project"
          value={filterProject}
          setValue={setFilterProject}
          options={[
            "All",
            ...projects.map((p) => ({ label: p.name, value: p._id })),
          ]}
        />

        <FilterBox
          label="Billing Type"
          value={filterBilling}
          setValue={setFilterBilling}
          options={["All", "Billable", "Non-Billable", "Shadow"]}
        />

        <button
          onClick={() => {
            setFilterEmployee("All");
            setFilterProject("All");
            setFilterBilling("All");
          }}
          className="bg-sky-600 text-white rounded-lg py-2 hover:bg-sky-700"
        >
          Reset Filters
        </button>
      </div>

      {/* ================= ALLOCATION RECORDS TABLE ================= */}
      <div className="bg-white p-6 rounded-xl shadow border border-sky-200">
        <h2 className="text-xl font-semibold text-sky-900 mb-4">
          Allocation Records
        </h2>

        {loading ? (
          <p className="text-center py-10 text-sky-700">Loading...</p>
        ) : filteredAllocations.length === 0 ? (
          <p className="text-center py-10 text-sky-700">
            No matching allocation records found.
          </p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-sky-100 text-sky-800">
                <th className="p-2 text-left">Employee</th>
                <th className="p-2 text-left">Project</th>
                <th className="p-2 text-center">Billing</th>
                <th className="p-2 text-center">Allocation %</th>
                <th className="p-2 text-center">Start</th>
                <th className="p-2 text-center">End</th>
                <th className="p-2 text-center">Actions</th>
              </tr>
            </thead>

            <tbody>
              {filteredAllocations.map((a, idx) => (
                <tr
                  key={a._id}
                  className="border-b hover:bg-sky-50 transition"
                  style={{ animation: `fadeIn .3s ease ${idx * 0.05}s both` }}
                >
                  <td className="p-2">{a.employeeName}</td>
                  <td className="p-2">{a.projectName}</td>

                  <td className="p-2 text-center">
                    <span
                      className={`px-3 py-1 text-xs rounded-full ${
                        a.billingType === "Billable"
                          ? "bg-green-100 text-green-700"
                          : a.billingType === "Shadow"
                          ? "bg-yellow-100 text-yellow-700"
                          : "bg-red-100 text-red-700"
                      }`}
                    >
                      {a.billingType}
                    </span>
                  </td>

                  <td className="p-2 text-center">
                    <span
                      className={`px-2 py-1 rounded-full text-xs ${
                        a.allocation < 80
                          ? "bg-green-100 text-green-700"
                          : a.allocation < 100
                          ? "bg-yellow-100 text-yellow-700"
                          : "bg-red-100 text-red-700"
                      }`}
                    >
                      {a.allocation}%
                    </span>
                  </td>

                  <td className="p-2 text-center">{a.startDate}</td>
                  <td className="p-2 text-center">{a.endDate}</td>

                  <td className="p-2 text-center">
                    {(isAdmin || isHR) && (
                      <div className="flex gap-3 justify-center">
                        <Edit
                          className="cursor-pointer text-sky-700"
                          onClick={() => {
                            setEditing(a);
                            setForm({
                              employeeId: a.employeeId,
                              projectId: a.projectId,
                              allocation: String(a.allocation),
                              startDate: a.startDate,
                              endDate: a.endDate,
                            });
                            setShowModal(true);
                          }}
                        />

                        {isAdmin && (
                          <Trash2
                            className="cursor-pointer text-red-600"
                            onClick={() => deleteAllocation(a._id)}
                          />
                        )}
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* ================= MODAL ================= */}
      {showModal && (
        <Modal
          employees={employees}
          projects={projects}
          form={form}
          setForm={setForm}
          onSave={saveAllocation}
          onClose={() => setShowModal(false)}
          editing={Boolean(editing)}
        />
      )}

    </div>
  </div>
);}

/* ============================================================
   MODAL COMPONENT
============================================================ */

function Modal({
  employees,
  projects,
  form,
  setForm,
  onSave,
  onClose,
  editing,
}: {
  employees: Employee[];
  projects: Project[];
  form: any;
  setForm: any;
  onSave: () => void;
  onClose: () => void;
  editing: boolean;
}) {
  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex justify-center items-center px-4 z-50">
      <div className="bg-white w-full max-w-md p-6 rounded-xl shadow-lg border border-sky-200 space-y-4 animate-scale-in">

        <h2 className="text-xl font-bold text-sky-900">
          {editing ? "Edit Allocation" : "Add Allocation"}
        </h2>

        {/* EMPLOYEE */}
        <div>
          <label className="text-sm font-semibold text-sky-700">Employee</label>
          <select
            value={form.employeeId}
            onChange={(e) => setForm({ ...form, employeeId: e.target.value })}
            className="border border-sky-300 p-2 w-full rounded"
          >
            <option value="">Select Employee</option>
            {employees.map((emp) => (
              <option key={emp._id} value={emp._id}>
                {emp.name}
              </option>
            ))}
          </select>
        </div>

        {/* PROJECT */}
        <div>
          <label className="text-sm font-semibold text-sky-700">Project</label>
          <select
            value={form.projectId}
            onChange={(e) => setForm({ ...form, projectId: e.target.value })}
            className="border border-sky-300 p-2 w-full rounded"
          >
            <option value="">Select Project</option>
            {projects.map((p) => (
              <option key={p._id} value={p._id}>
                {p.name} ({extractBilling(p)})
              </option>
            ))}
          </select>
        </div>

        {/* ALLOCATION */}
        <div>
          <label className="text-sm font-semibold text-sky-700">
            Allocation %
          </label>
          <input
            type="number"
            value={form.allocation}
            onChange={(e) => setForm({ ...form, allocation: e.target.value })}
            className="border border-sky-300 p-2 w-full rounded"
            placeholder="0–100"
          />
        </div>

        {/* START */}
        <div>
          <label className="text-sm font-semibold text-sky-700">Start Date</label>
          <input
            type="date"
            value={form.startDate}
            onChange={(e) => setForm({ ...form, startDate: e.target.value })}
            className="border border-sky-300 p-2 w-full rounded"
          />
        </div>

        {/* END */}
        <div>
          <label className="text-sm font-semibold text-sky-700">End Date</label>
          <input
            type="date"
            value={form.endDate}
            onChange={(e) => setForm({ ...form, endDate: e.target.value })}
            className="border border-sky-300 p-2 w-full rounded"
          />
        </div>

        {/* BUTTONS */}
        <div className="flex justify-end gap-3 pt-4">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
          >
            Cancel
          </button>

          <button
            onClick={onSave}
            className="px-4 py-2 bg-sky-600 text-white rounded hover:bg-sky-700"
          >
            {editing ? "Update" : "Save"}
          </button>
        </div>

      </div>
    </div>
  );
}

/* ============================================================
   KPI COMPONENT
============================================================ */

function KPI({ label, value }: { label: string; value: number }) {
  return (
    <div className="bg-white p-4 rounded-xl shadow border border-sky-200">
      <p className="text-sky-600 text-sm">{label}</p>
      <p className="text-2xl font-bold text-sky-900">{value}</p>
    </div>
  );
}

/* ============================================================
   FILTER BOX COMPONENT
============================================================ */

function FilterBox({
  label,
  value,
  setValue,
  options,
}: {
  label: string;
  value: string;
  setValue: (v: string) => void;
  options: (string | { label: string; value: string })[];
}) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-sky-800 text-sm font-semibold">{label}</label>

      <select
        value={value}
        onChange={(e) => setValue(e.target.value)}
        className="border border-sky-300 rounded-lg px-3 py-2 bg-white"
      >
        {options.map((o) =>
          typeof o === "string" ? (
            <option key={o}>{o}</option>
          ) : (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          )
        )}
      </select>
    </div>
  );
}