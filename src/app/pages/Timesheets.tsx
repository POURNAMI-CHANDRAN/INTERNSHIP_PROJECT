import React, { useEffect, useState } from "react";
import {
  Plus,
  ClipboardList,
  Search,
  Filter,
  ThumbsUp,
  ThumbsDown,
} from "lucide-react";

/* ============================================================
   TYPES
============================================================ */

type EmployeeRef = {
  _id: string;
  name: string;
};

interface Project {
  _id: string;
  name: string;
  assignedTo?: string;
}

interface EquivalentItem {
  _id: string;
  title: string;
  story_points: number;
  project_id: {
    _id: string;
    name: string;
  };
}

interface TimesheetEntry {
  _id: string;
  employee_id: string | EmployeeRef | null;
  project_id: Project;
  story_id: EquivalentItem;
  story_points_completed: number;
  work_date: string;
  status: "Pending" | "Approved" | "Rejected";
}

/* ============================================================
   COMPONENT
============================================================ */

export default function Timesheets() {
  const API_BASE =
    (import.meta as any).env.VITE_API_BASE_URL || "http://localhost:5000";

  const token = localStorage.getItem("token");
  const user = JSON.parse(localStorage.getItem("user") || "{}");

  const role = user.role;
  const userId = user.id || user._id;

  const [employees, setEmployees] = useState<EmployeeRef[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [equivalents, setEquivalents] = useState<EquivalentItem[]>([]);
  const [timesheets, setTimesheets] = useState<TimesheetEntry[]>([]);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");

  const [isSubmitting, setIsSubmitting] = useState(false);

  const [form, setForm] = useState({
    employee_id: userId,
    project_id: "",
    story_id: "",
    story_points_completed: "",
    work_date: "",
  });

  /* ============================================================
     HELPERS
  ============================================================ */

  const getEmployeeObj = (
    emp: string | EmployeeRef | null
  ): EmployeeRef => {
    if (!emp) return { _id: "N/A", name: "Unknown" };

    if (typeof emp === "string") {
      const found = employees.find((e) => e._id === emp);
      return found || { _id: emp, name: "Unknown" };
    }

    return emp;
  };

  /* ============================================================
     LOAD DATA
  ============================================================ */

  const loadData = async () => {
    try {
      /* EMPLOYEES */
      let empList: EmployeeRef[] = [];

      if (role === "Employee") {
        empList = [{ _id: userId, name: user.name }];
      } else {
        const res = await fetch(`${API_BASE}/api/employees`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        const json = await res.json();
        empList = json.data || [];
      }

      setEmployees(empList);

      /* TIMESHEETS */
      const tsRes = await fetch(
        role === "Employee"
          ? `${API_BASE}/api/timesheets/employee/${userId}`
          : `${API_BASE}/api/timesheets`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      const tsJson = await tsRes.json();

      const tsData = Array.isArray(tsJson)
        ? tsJson
        : tsJson.data || [];

      setTimesheets(tsData);

      /* PROJECTS */
      const projRes = await fetch(`${API_BASE}/api/projects`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const projJson = await projRes.json();
      setProjects(projJson.data || []);
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  /* ============================================================
     LOAD STORIES
  ============================================================ */

  useEffect(() => {
    if (!form.project_id) {
      setEquivalents([]);
      return;
    }

    fetch(
      `${API_BASE}/api/equivalents?project_id=${form.project_id}`,
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    )
      .then((r) => r.json())
      .then((json) => {
        setEquivalents(json.data || []);
      });
  }, [form.project_id]);

  /* ============================================================
     SUBMIT
  ============================================================ */

  const submitTimesheet = async () => {
    try {
      setIsSubmitting(true);

      const res = await fetch(
        `${API_BASE}/api/timesheets/submit`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(form),
        }
      );

      const data = await res.json();

      if (!res.ok) {
        alert(data.message || "Failed");
        return;
      }

      alert("Submitted!");

      setForm({
        employee_id: userId,
        project_id: "",
        story_id: "",
        story_points_completed: "",
        work_date: "",
      });

      loadData();
    } catch (error) {
      alert("Error");
    } finally {
      setIsSubmitting(false);
    }
  };

  /* ============================================================
     ADMIN ACTIONS
  ============================================================ */

  const approveTimesheet = async (id: string) => {
    await fetch(`${API_BASE}/api/timesheets/approve/${id}`, {
      method: "PUT",
      headers: { Authorization: `Bearer ${token}` },
    });

    loadData();
  };

  const rejectTimesheet = async (id: string) => {
    await fetch(`${API_BASE}/api/timesheets/reject/${id}`, {
      method: "PUT",
      headers: { Authorization: `Bearer ${token}` },
    });

    loadData();
  };

  /* ============================================================
     FILTER
  ============================================================ */

  const filtered = timesheets
    .filter((t) => {
      if (role !== "Employee") return true;
      return getEmployeeObj(t.employee_id)._id === userId;
    })
    .filter((t) => {
      const q = search.toLowerCase();

      return (
        getEmployeeObj(t.employee_id)
          .name.toLowerCase()
          .includes(q) ||
        t.project_id?.name?.toLowerCase().includes(q) ||
        t.story_id?.title?.toLowerCase().includes(q)
      );
    })
    .filter(
      (t) =>
        statusFilter === "All" ||
        t.status === statusFilter
    );

  /* ============================================================
     UI
  ============================================================ */

  return (
    <div className="p-6 space-y-8 bg-sky-50 min-h-screen">
      {/* HEADER */}
      <div className="bg-sky-200 p-6 rounded-xl flex gap-4">
        <ClipboardList className="text-sky-700" size={28} />

        <div>
          <h1 className="text-3xl font-bold text-sky-900">
            Timesheets
          </h1>
          <p className="text-sky-700">
            Track submissions
          </p>
        </div>
      </div>

      {/* FORM */}
      {role === "Employee" && (
        <div className="bg-white p-6 rounded-xl shadow">
          <div className="grid grid-cols-2 gap-4">
            <select
              value={form.project_id}
              onChange={(e) =>
                setForm({
                  ...form,
                  project_id: e.target.value,
                  story_id: "",
                })
              }
              className="border p-2 rounded"
            >
              <option value="">Project</option>

              {projects.map((p) => (
                <option key={p._id} value={p._id}>
                  {p.name}
                </option>
              ))}
            </select>

            <select
              value={form.story_id}
              onChange={(e) =>
                setForm({
                  ...form,
                  story_id: e.target.value,
                })
              }
              className="border p-2 rounded"
            >
              <option value="">Story</option>

              {equivalents.map((s) => (
                <option key={s._id} value={s._id}>
                  {s.title} ({s.story_points})
                </option>
              ))}
            </select>

            <input
              type="number"
              placeholder="Points"
              value={form.story_points_completed}
              onChange={(e) =>
                setForm({
                  ...form,
                  story_points_completed:
                    e.target.value,
                })
              }
              className="border p-2 rounded"
            />

            <input
              type="date"
              value={form.work_date}
              onChange={(e) =>
                setForm({
                  ...form,
                  work_date: e.target.value,
                })
              }
              className="border p-2 rounded"
            />
          </div>

          <button
            onClick={submitTimesheet}
            disabled={isSubmitting}
            className="mt-4 bg-sky-600 text-white px-5 py-2 rounded"
          >
            <Plus className="inline mr-2" size={16} />
            Submit
          </button>
        </div>
      )}

      {/* FILTERS */}
      <div className="bg-white p-4 rounded-xl flex gap-4">
        <div className="flex items-center gap-2 border px-3 rounded">
          <Search size={16} />
          <input
            placeholder="Search"
            className="outline-none"
            value={search}
            onChange={(e) =>
              setSearch(e.target.value)
            }
          />
        </div>

        <div className="flex items-center gap-2 border px-3 rounded">
          <Filter size={16} />
          <select
            value={statusFilter}
            onChange={(e) =>
              setStatusFilter(e.target.value)
            }
          >
            <option>All</option>
            <option>Pending</option>
            <option>Approved</option>
            <option>Rejected</option>
          </select>
        </div>
      </div>

      {/* TABLE */}
      <div className="bg-white rounded-xl overflow-hidden shadow">
        <table className="w-full text-sm">
          <thead className="bg-sky-100">
            <tr>
              <th className="p-3">Employee</th>
              <th>Project</th>
              <th>Story</th>
              <th>Points</th>
              <th>Date</th>
              <th>Status</th>
              {(role === "Admin" ||
                role === "Finance") && <th>Action</th>}
            </tr>
          </thead>

          <tbody>
            {filtered.map((t) => (
              <tr
                key={t._id}
                className="border-t text-center"
              >
                <td className="p-3">
                  {getEmployeeObj(t.employee_id).name}
                </td>
                <td>{t.project_id?.name}</td>
                <td>{t.story_id?.title}</td>
                <td>{t.story_points_completed}</td>
                <td>
                  {t.work_date?.split("T")[0]}
                </td>
                <td>{t.status}</td>

                {(role === "Admin" ||
                  role === "Finance") && (
                  <td className="flex justify-center gap-2 p-2">
                    <button
                      onClick={() =>
                        approveTimesheet(t._id)
                      }
                    >
                      <ThumbsUp
                        className="text-green-600"
                        size={18}
                      />
                    </button>

                    <button
                      onClick={() =>
                        rejectTimesheet(t._id)
                      }
                    >
                      <ThumbsDown
                        className="text-red-600"
                        size={18}
                      />
                    </button>
                  </td>
                )}
              </tr>
            ))}

            {filtered.length === 0 && (
              <tr>
                <td
                  colSpan={7}
                  className="p-8 text-center"
                >
                  No Timesheets Found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}