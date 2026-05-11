import React, { useEffect, useState, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus,
  Trash2,
  Building2,
  Layers,
  X,
  RotateCcw,
  Settings2,
  MoreHorizontal,
  Search,
} from "lucide-react";

// --- Types ---
interface Department {
  _id: string;
  name: string;
  createdAt: string;
  status: "Active" | "Archived";
}

interface WorkCategory {
  _id: string;
  name: string;
  allowedBillingTypes: ("Billable" | "Non-Billable")[];
  status: "Active" | "Inactive";
}

export default function EnterpriseTaxonomy() {
  const API_BASE = import.meta.env.VITE_API_BASE_URL;
  const token = localStorage.getItem("token");

  const [departments, setDepartments] = useState<Department[]>([]);
  const [workCategories, setWorkCategories] = useState<WorkCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [showInactive, setShowInactive] = useState(false);
  const [modalType, setModalType] = useState<"DEPT" | "WC" | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    billingTypes: [] as string[],
  });

  /* ---------------- Fetch ---------------- */
const loadData = useCallback(async () => {
  setLoading(true);
  try {
    const headers = { Authorization: `Bearer ${token}` };

    const wcUrl = showInactive
      ? `${API_BASE}/api/workcategories`
      : `${API_BASE}/api/workcategories?status=Active`;

    const [deptRes, wcRes] = await Promise.all([
      fetch(`${API_BASE}/api/departments`, { headers }),
      fetch(wcUrl, { headers }),
    ]);

    const deptJson = await deptRes.json();
    const wcJson = await wcRes.json();

    setDepartments(Array.isArray(deptJson) ? deptJson : deptJson.data ?? []);
    setWorkCategories(Array.isArray(wcJson) ? wcJson : wcJson.data ?? []);
  } catch (err) {
    console.error("API Failure:", err);
  } finally {
    setLoading(false);
  }
}, [API_BASE, token, showInactive]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  /* ---------------- Filters ---------------- */

  const filteredDepts = useMemo(
    () =>
      departments.filter((d) =>
        d.name.toLowerCase().includes(searchQuery.toLowerCase())
      ),
    [departments, searchQuery]
  );

  const filteredWC = useMemo(() => {
    return workCategories.filter((wc) => {
      const matchesSearch = wc.name
        .toLowerCase()
        .includes(searchQuery.toLowerCase());

      if (showInactive) return matchesSearch;

      return matchesSearch && wc.status === "Active";
    });
  }, [workCategories, searchQuery, showInactive]);

  /* ---------------- Save ---------------- */

  const handleSave = async () => {
    if (!formData.name.trim()) return;

    const isWC = modalType === "WC";
    const body = isWC
      ? {
          name: formData.name,
          allowedBillingTypes: formData.billingTypes,
          status: "Active",
        }
      : { name: formData.name };

    await fetch(`${API_BASE}/api/${isWC ? "workcategories" : "departments"}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(body),
    });

    setModalType(null);
    setFormData({ name: "", billingTypes: [] });
    loadData();
  };

 return (
    <div className="min-h-screen bg-[#FAFAFA] text-[#171717] font-sans selection:bg-blue-100">
      
      <main className="max-w-[1200px] mx-auto px-6 py-8">
          
      {/* PAGE HEADER */}
      <header className="mb-10">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          
          {/* LEFT: Title */}
          <div className="flex items-center gap-4">
            {/* ICON BOX */}
            <div className="bg-sky-600 p-2.5 rounded-xl shadow-lg shadow-sky-200">
              <Settings2 className="text-white" size={28} />
            </div>

            {/* TEXT BLOCK */}
            <div>
              <h1 className="text-2xl font-bold tracking-tight">
                Organization<span className="text-sky-600"> Architecture</span>
              </h1>

              <p className="text-slate-600 font-medium"> Manage global classification systems and billing logic.</p>
            </div>
          </div>
          
          {/* RIGHT: Controls */}
          <div className="w-full lg:w-auto flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            
            {/* Search */}
            <div className="relative group w-full sm:w-[280px]">
              <Search
                size={16}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-black-400 group-focus-within:text-sky-500 transition-colors"
              />
              <input
                type="text"
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full h-10 pl-10 pr-3 bg-slate-50 border border-slate-200 rounded-lg text-sm 
                placeholder:text-black-400 focus:bg-white focus:ring-2 focus:ring-sky-500/10 
                focus:border-sky-500 outline-none transition-all"
              />
            </div>

            {/* Toggle */}
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <div className="relative">
                <input
                  type="checkbox"
                  checked={showInactive}
                  onChange={(e) => setShowInactive(e.target.checked)}
                  className="peer sr-only"
                />
                <div className="w-10 h-5 bg-slate-200 rounded-full peer-checked:bg-sky-500 transition-colors" />
                <div className="absolute left-1 top-1 w-3 h-3 bg-white rounded-full transition-transform peer-checked:translate-x-5" />
              </div>
              <span className="text-xs font-semibold text-black-600">
                Inactive
              </span>
            </label>

            {/* Refresh */}
            <button
              onClick={loadData}
              className="p-2 text-slate-400 hover:text-sky-600 hover:bg-sky-50 rounded-lg transition"
              title="Refresh Data"
            >
              <RotateCcw size={16} />
            </button>
          </div>
        </div>
      </header>

        {/* GRID */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Work Categories */}
          <SectionContainer
            title="Work Categories"
            icon={<Layers size={14} />}
            count={filteredWC.length}
            onAdd={() => setModalType("WC")}
          >
            {loading ? (
              <TableSkeleton />
            ) : filteredWC.length === 0 ? (
              <EmptyState />
            ) : (
             <table className="w-full text-left">
              <tbody className="divide-y divide-sky-100">
                {filteredWC.map((item) => (
                  <tr
                    key={item._id}
                    className={`transition-colors ${
                      item.status === "Inactive"
                        ? "opacity-55 bg-slate-50"
                        : "hover:bg-[#F5FAFF]"
                    }`}
                  >
                    
                    {/* Name + Icon */}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-lg bg-[#E8F4FF] flex items-center justify-center text-sky-600">
                          <Layers size={14} />
                        </div>
                        <span className="text-sm font-medium text-[#171717]">
                          {item.name}
                        </span>
                      </div>
                    </td>

                    {/* Billing Types */}
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        {item.allowedBillingTypes.map((t) => (
                          <StatusBadge key={t} label={t} />
                        ))}
                      </div>
                    </td>

                    {/* Actions */}
                    <td className="px-4 py-3 text-right">
                    <RowActions
                      status={item.status}
                      onDelete={() => handleDelete("workcategories", item._id)}
                      onRestore={() => handleRestore("workcategories", item._id)}
                    />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            )}
          </SectionContainer>

          {/* Departments */}
          <SectionContainer
            title="Departments"
            icon={<Building2 size={14} />}
            count={filteredDepts.length}
            onAdd={() => setModalType("DEPT")}
          >
            {loading ? (
              <TableSkeleton />
            ) : filteredDepts.length === 0 ? (
              <EmptyState />
            ) : (
              filteredDepts.map((item) => (
                <div
                  key={item._id}
                  className="flex justify-between items-center px-4 py-3 hover:bg-[#F5FAFF]"
                >
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-lg bg-[#E8F4FF] flex items-center justify-center text-sky-600">
                      <Building2 size={14} />
                    </div>
                    <span className="text-sm font-medium">{item.name}</span>
                  </div>
                  <RowActions
                    status={item.status === "Archived" ? "Inactive" : "Active"}
                    onDelete={() => handleDelete("departments", item._id)}
                    onRestore={() => {}} 
                  />
                </div>
              ))
            )}
          </SectionContainer>
        </div>
      </main>

      {/* COMMAND MODAL */}
      <AnimatePresence>
        {modalType && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            
            {/* Overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setModalType(null)}
              className="absolute inset-0 bg-[rgba(15,23,42,0.32)] backdrop-blur-sm"
            />

            {/* Modal */}
            <motion.div
              initial={{ opacity: 0, scale: 0.97, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.97, y: 12 }}
              className="relative w-full max-w-[440px] rounded-2xl
                        bg-white/95 backdrop-blur-xl
                        border border-slate-200
                        shadow-[0_25px_70px_rgba(15,23,42,0.18)]
                        overflow-hidden"
            >
              {/* Header + Content */}
              <div className="p-6 space-y-6">

                {/* Header */}
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-slate-800 tracking-tight">
                    Create {modalType === "WC" ? "Category" : "Department"}
                  </h3>
                  <button
                    onClick={() => setModalType(null)}
                    className="p-1 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
                  >
                    <X size={16} />
                  </button>
                </div>

                {/* Form */}
                <div className="space-y-5">

                  {/* Name Field */}
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-semibold uppercase tracking-wide text-amber-800">
                      Display Name
                    </label>
                    <input
                      autoFocus
                      value={formData.name}
                      onChange={(e) =>
                        setFormData({ ...formData, name: e.target.value })
                      }
                      placeholder="Enter a descriptive name …"
                      className="w-full h-11 px-3 rounded-lg
                                bg-slate-50 border border-slate-200
                                text-sm text-slate-800
                                placeholder:text-slate-400
                                focus:outline-none
                                focus:ring-2 focus:ring-sky-400/30
                                focus:border-sky-400
                                transition"
                    />
                  </div>

                  {/* Billing Types */}
                  {modalType === "WC" && (
                    <div className="space-y-2">
                      <label className="text-[11px] font-semibold uppercase tracking-wide text-amber-800">
                        Billing Methods
                      </label>

                      <div className="grid grid-cols-2 gap-2">
                        {["Billable", "Non-Billable"].map((type) => {
                          const active = formData.billingTypes.includes(type);
                          return (
                            <button
                              key={type}
                              onClick={() =>
                                setFormData({
                                  ...formData,
                                  billingTypes: active
                                    ? formData.billingTypes.filter((t) => t !== type)
                                    : [...formData.billingTypes, type],
                                })
                              }
                              className={`h-10 rounded-lg text-xs font-bold
                                border transition-all
                                ${
                                  active
                                    ? "bg-sky-300/90 border-sky-500 text-black shadow-sm shadow-sky-200"
                                    : "bg-white border-slate-200 text-black-600 hover:bg-black-50"
                                }`}
                            >
                              {type}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Footer */}
              <div className="px-6 py-4 bg-slate-50/70 border-t border-slate-200 flex justify-center gap-2">
                <button
                  onClick={handleSave}
                  className="px-5 py-2 rounded-lg
                            bg-sky-500/90 hover:bg-sky-600
                            text-white text-xs font-bold
                            transition-all active:scale-95
                            shadow-sm shadow-sky-200"
                >
                  Create Resource
                </button>

                <button
                  onClick={() => setModalType(null)}
                  className="px-4 py-2 text-xs font-semibold text-slate-500 hover:text-slate-700"
                >
                Cancel
                </button>
              </div>
            
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );


async function handleDelete(path: string, id: string) {
  if (!window.confirm("Confirm Deletion?")) return;

  try {
    const res = await fetch(`${API_BASE}/api/${path}/${id}`, {
      method: "DELETE", 
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!res.ok) {
      const errorText = await res.text();
      console.error("Delete Failed:", errorText);
      alert("Delete Failed. Check Console for Details.");
      return;
    }

    loadData(); 
  } catch (err) {
    console.error("Delete Request Error:", err);
    alert("Something went wrong while Deleting.");
  }
}

async function handleRestore(path: string, id: string) {
  try {
    const res = await fetch(`${API_BASE}/api/${path}/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ status: "Active" }),
    });

    if (!res.ok) {
      console.error("Restore Failed");
      return;
    }

    loadData();
  } catch (err) {
    console.error("Restore Error:", err);
  }
}

/* ---------------- Reusable ---------------- */

function SectionContainer({
  title,
  icon,
  count,
  onAdd,
  children,
}: any) {
  return (
    <div className="bg-white border border-sky-100 rounded-xl shadow-sm">
      <div className="px-4 py-3 flex justify-between items-center border-b border-sky-100">
        <div className="flex items-center gap-2 text-sky-700 font-bold text-sm">
          {icon}
          {title}
          <span className="ml-2 text-xs bg-[#E8F4FF] px-2 py-0.5 rounded">
            {count}
          </span>
        </div>
        <button
          onClick={onAdd}
          className="p-1 rounded hover:bg-[#E8F4FF]"
        >
          <Plus size={16} />
        </button>
      </div>
      {children}
    </div>
  );
}

function StatusBadge({ label }: { label: string }) {
  const billable = label === "Billable";
  return (
  <span
    className={`text-xs px-2 py-0.5 rounded-full font-semibold border ${
      billable
        ? "bg-green-50 text-green-700 border-green-200"
        : "bg-yellow-50 text-yellow-700 border-yellow-200"
    }`}
  >
    {label}
  </span>
  );
}

function RowActions({
  status,
  onDelete,
  onRestore,
}: {
  status: "Active" | "Inactive";
  onDelete: () => void;
  onRestore: () => void;
}) {
  return (
    <div className="flex gap-2">
      {status === "Active" ? (
        <button
          onClick={onDelete}
          className="text-slate-400 hover:text-red-600"
          title="Deactivate"
        >
          <Trash2 size={14} />
        </button>
      ) : (
        <button
          onClick={onRestore}
          className="text-slate-400 hover:text-green-600"
          title="Restore"
        >
          <RotateCcw size={14} /> 
        </button>
      )}
    </div>
  );
}

function EmptyState() {
  return (
    <div className="py-16 text-center">
      <Search size={18} className="mx-auto mb-2 text-sky-400" />
      <p className="text-sm font-bold">No Results Found</p>
      <p className="text-xs mt-1">Try adjusting your search or add a new one.</p>
    </div>
  );
}

function TableSkeleton() {
  return (
    <div className="p-4 space-y-3">
      {[1, 2, 3].map((i) => (
        <div
          key={i}
          className="h-4 bg-sky-50 rounded animate-pulse"
        />
      ))}
    </div>
  );
}
}