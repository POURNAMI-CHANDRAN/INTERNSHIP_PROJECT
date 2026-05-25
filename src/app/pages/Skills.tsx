import React, { useEffect, useMemo, useState } from "react";
import { 
  Plus, Trash2, Search, Loader2, X, Activity,
  ChevronRight, Hash, AlertCircle, Command
} from "lucide-react";

/* ================= TYPES ================= */
interface Skill {
  _id: string;
  name: string;
  category: string;
  status?: "Active" | "Inactive";
}

/* ================= COMPONENT ================= */
export default function PremiumSkills() {
  const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";
  const token = localStorage.getItem("token");
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const canManage = ["Admin", "Finance"].includes(user?.role);

  const systemSans = `-apple-system, BlinkMacSystemFont, "Inter", "Segoe UI", Roboto, sans-serif`;

  const [skills, setSkills] = useState<Skill[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const [newSkill, setNewSkill] = useState({ name: "", category: "General" });
  const [saving, setSaving] = useState(false);
  const [categories, setCategories] = useState<string[]>([]);

  const loadCategories = async () => {
    try {
      const res = await fetch(
        `${API_BASE}/api/skills/categories/all`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await res.json();

      setCategories(data.data || []);

    } catch (err) {
      console.log(err);
    }
  };

  const loadSkills = async () => {
    try {
      setLoading(true);
      if (!token) { setError("Session expired."); return; }
      const res = await fetch(`${API_BASE}/api/skills`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setSkills(Array.isArray(data) ? data : data.data ?? []);
    } catch (err: any) {
      setError("Unable to sync data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
  loadSkills();
  loadCategories();
}, []);

  const filteredSkills = useMemo(() => {
    return skills.filter((s) =>
      `${s.name} ${s.category}`.toLowerCase().includes(search.toLowerCase())
    );
  }, [skills, search]);

  const stats = useMemo(() => ({
    total: skills.length,
    active: skills.filter(s => (s.status || "Active") === "Active").length,
    inactive: skills.filter(s => s.status === "Inactive").length
  }), [skills]);

  const handleAdd = async () => {
    if (!newSkill.name.trim()) return;
    try {
      setSaving(true);
      const res = await fetch(`${API_BASE}/api/skills`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify(newSkill),
      });
      if (res.ok) {
        setShowAdd(false);

        setNewSkill({
          name: "",
          category: "General",
        });

        await loadSkills();

        await loadCategories();
      }
    } catch (err) { alert("Save Failed"); } finally { setSaving(false); }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Deactivate Skill?")) return;

    await fetch(`${API_BASE}/api/skills/${id}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    loadSkills();
  };

const handleRestore = async (id: string) => {
  if (!window.confirm("Restore Skill?")) return;

  try {
    const res = await fetch(
      `${API_BASE}/api/skills/${id}/restore`,
      {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      }
    );

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.message || "Restore Failed");
    }

    loadSkills();

  } catch (err: any) {
    alert(err.message);
  }
};

return (
  <div
    className="min-h-screen bg-[#F8FAFC] text-slate-800 antialiased"
    style={{ fontFamily: systemSans }}
  >
    <div className="max-w-5xl mx-auto px-6 py-12">

      {/* HEADER + SEARCH */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6 mb-10">

        {/* LEFT: Title */}
        <div className="flex items-center gap-4">
          <div className="bg-sky-600 p-2.5 rounded-xl shadow-lg shadow-sky-200">
            <Command className="text-white" size={24} />
          </div>

          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              Talent <span className="text-sky-600">Matrix</span>
            </h1>
            <p className="text-slate-600 font-medium">
              Design, manage, and maintain your organization’s competency structure.
            </p>
          </div>
        </div>

        {/* RIGHT SECTION */}
        <div className="flex items-center gap-3 w-full sm:w-auto">

          {/* SEARCH */}
          <div className="relative group w-full sm:w-[300px]">
            <Search
              size={16}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-sky-500"
            />

            <input
              type="text"
              placeholder="Search competencies..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl outline-none focus:border-sky-500 focus:ring-4 focus:ring-sky-100 transition-all text-sm shadow-sm"
            />
          </div>
        </div>

          {/* ADD BUTTON */}
          {canManage && (
            <button
              onClick={() => setShowAdd(true)}
              className="bg-sky-600 hover:bg-sky-700 text-white px-3 py-2 rounded-lg flex items-center gap-2 transition font-medium"
            >
              <Plus size={16} />
              Add Skill
            </button>
          )}
        </div>

      {/* STATS */}
      <section className="mb-10 bg-white border border-slate-200/60 rounded-2xl shadow-sm overflow-hidden flex flex-col sm:flex-row divide-y sm:divide-y-0 sm:divide-x divide-slate-100">
        
        {[
          {
            label: "Total Skills",
            value: stats.total,
            color: "text-indigo-900",
            icon: <Command size={16} />,
          },
          {
            label: "Active",
            value: stats.active,
            color: "text-emerald-600",
            icon: <Activity size={16} />,
          },
          {
            label: "Inactive",
            value: stats.inactive,
            color: "text-rose-500",
            icon: <Hash size={16} />,
          },
        ].map((item, idx) => (
          <div
            key={idx}
            className="flex-1 px-6 py-5 hover:bg-sky-50 transition-colors"
          >
            <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-widest text-slate-800 mb-1">
              {item.icon}
              {item.label}
            </div>

            <div className={`text-2xl font-black ${item.color}`}>
              {item.value}
            </div>
          </div>
        ))}
      </section>

      {/* ✅ CONTENT INSIDE SAME CONTAINER */}
      <main>
        {error && (
          <div className="mb-6 p-3 bg-red-50 border border-red-100 text-red-600 rounded-lg flex items-center gap-2 text-sm">
            <AlertCircle size={16} /> {error}
          </div>
        )}

        {loading ? (
          <div className="py-24 flex flex-col items-center gap-3 opacity-40">
            <Loader2 className="animate-spin" size={24} />
            <span className="text-xs uppercase tracking-widest">Loading</span>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredSkills.map((skill) => {
              const isActive = (skill.status ?? "Active") === "Active";

              return (
                <div
                  key={skill._id}
                  className="bg-white p-5 rounded-xl border border-slate-200 hover:border-sky-200 transition-all flex flex-col justify-between group"
                >
                  <div className="flex justify-between items-start mb-3">
                    <span className="text-[10px] font-bold uppercase text-slate-600 bg-sky-50 px-2 py-0.5 rounded">
                      {skill.category}
                    </span>

                    {canManage && (
                      <button
                        onClick={() =>
                          isActive
                            ? handleDelete(skill._id)
                            : handleRestore(skill._id)
                        }
                        className={`opacity-0 group-hover:opacity-100 p-1 ${
                          isActive
                            ? "text-slate-600 hover:text-red-500"
                            : "text-slate-600 hover:text-emerald-500"
                        }`}
                      >
                        {isActive ? <Trash2 size={16} /> : <Plus size={16} />}
                      </button>
                    )}
                  </div>

                  <h3 className="text-sm font-semibold text-slate-900 mb-3">
                    {skill.name}
                  </h3>

                  <div className="flex items-center gap-1.5">
                    <div
                      className={`w-1.5 h-1.5 rounded-full ${
                        isActive ? "bg-emerald-500" : "bg-rose-500"
                      }`}
                    />
                    <span
                      className={`text-xs font-medium ${
                        isActive ? "text-emerald-600" : "text-rose-500"
                      }`}
                    >
                      {skill.status ?? "Active"}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>

      {/* MINIMAL MODAL */}
      {showAdd && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-slate-900/20 backdrop-blur-[2px]">
          <div className="bg-white w-full max-w-sm rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center">
              <h2 className="text-sm font-bold text-slate-900 uppercase tracking-tight">Create Entry</h2>
              <button onClick={() => setShowAdd(false)} className="text-slate-400 hover:text-slate-600"><X size={18} /></button>
            </div>
            
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-[12px] font-bold text-sky-800 uppercase mb-1.5">Skill Name</label>
                <input
                  autoFocus
                  value={newSkill.name}
                  onChange={(e) => setNewSkill({ ...newSkill, name: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-sky-500 text-sm"
                />
              </div>

              <div>
                <label className="block text-[12px] font-bold text-sky-800 uppercase mb-1.5">
                  Category
                </label>

                <input
                  list="skill-categories"
                  value={newSkill.category}
                  onChange={(e) =>
                    setNewSkill({
                      ...newSkill,
                      category: e.target.value,
                    })
                  }
                  placeholder="Select or type category..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-100 text-sm"
                />

                <datalist id="skill-categories">
                  {categories.map((cat) => (
                    <option key={cat} value={cat} />
                  ))}
                </datalist>
              </div>

              <button
                disabled={saving || !newSkill.name.trim()}
                onClick={handleAdd}
                className="w-full py-2.5 bg-sky-500 text-white text-md font-bold rounded-lg hover:bg-sky-600 disabled:opacity-50 shadow-md shadow-sky-100 transition-all"
              >
                {saving ? "Saving..." : "Create Skill"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}