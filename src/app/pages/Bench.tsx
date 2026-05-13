import { useEffect, useMemo, useState } from "react";
import {
  Users, Briefcase, Search, Building2, 
  Sparkles, Filter, MapPin, BarChart3,
  Layers, TrendingUpDown, Target, ArrowUpRight, Download, BrainCircuit
} from "lucide-react";
import {
  ResponsiveContainer, PieChart, Pie, Cell, Tooltip,
} from "recharts";
import { motion, AnimatePresence } from "framer-motion";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

/* ======================================================
   THEMES & UTILS
====================================================== */
const MONTHLY_CAPACITY = 160;

const STATUS_THEMES: any = {
  Billable: { color: "#068a9e", text: "text-cyan-600", dot: "bg-cyan-500", bg: "bg-cyan-50" },
  "Partial Bench": { color: "#a69e07", text: "text-amber-600", dot: "bg-amber-500", bg: "bg-amber-50" },
  "Fully Bench": { color: "#07a2ad", text: "text-rose-600", dot: "bg-rose-500", bg: "bg-rose-50" },
  Overallocated: { color: "#480694", text: "text-violet-600", dot: "bg-violet-500", bg: "bg-violet-50" },
};

const getEmployeeStatus = (utilization: number) => {
  if (utilization === 0) return "Fully Bench";
  if (utilization < 70) return "Partial Bench";
  if (utilization <= 100) return "Billable";
  return "Overallocated";
};

/* ======================================================
   MAIN COMPONENT
====================================================== */

export default function PremiumBenchManagement() {
  const [loading, setLoading] = useState(true);
  const [benchData, setBenchData] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [departmentFilter, setDepartmentFilter] = useState("All");
  const [sortBy, setSortBy] = useState("utilization");
  const [selectedEmployee, setSelectedEmployee] = useState<any | null>(null);
  const [showStrategy, setShowStrategy] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [assignmentEmployee, setAssignmentEmployee] = useState<any | null>(null);

  const [projects, setProjects] = useState<any[]>([]);
  const [selectedProject, setSelectedProject] = useState("");
  const [allocation, setAllocation] = useState(50);
  const [assignLoading, setAssignLoading] = useState(false);

  const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

  useEffect(() => {
    const fetchBench = async () => {
      try {
        setLoading(true);

        const res = await fetch(`${API_BASE}/api/bench`, {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        });

        const data = await res.json();

        const formatted = data.map((item: any) => {
          const billableAllocation = item.billableAllocation || 0;

          // ✅ FIX: Dynamic total allocation
          const totalAllocation =
            (item.billableAllocation || 0) +
            (item.nonBillableAllocation || 0) ||
            MONTHLY_CAPACITY;

          // ✅ FIX: Correct utilization formula
          const utilization =
            totalAllocation > 0
              ? Number(
                  ((billableAllocation / totalAllocation) * 100).toFixed(1)
                )
              : 0;

          return {
            ...item,
            totalAllocation,
            utilization,
            bench: Math.max(0, 100 - utilization),
            status: getEmployeeStatus(utilization),
          };
        });

        setBenchData(formatted);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchBench();
  }, []);

useEffect(() => {
  const fetchProjects = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/projects`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });

      const data = await res.json();

      console.log("PROJECT API RESPONSE =>", data);

      if (Array.isArray(data)) {
        setProjects(data);
      } else if (Array.isArray(data.projects)) {
        setProjects(data.projects);
      } else if (Array.isArray(data.data)) {
        setProjects(data.data);
      } else {
        setProjects([]);
      }
    } catch (err) {
      console.error(err);
      setProjects([]);
    }
  };

  fetchProjects();
}, []);

  const stats = useMemo(() => ({
    total: benchData.length,
    billable: benchData.filter(e => e.status === "Billable").length,
    bench: benchData.filter(e => e.status === "Fully Bench").length,
    partial: benchData.filter(e => e.status === "Partial Bench").length,
    utilization:
      benchData.length > 0 ? Math.round(
        benchData.reduce((acc, curr) => acc + curr.utilization, 0) / benchData.length): 0,
    }), [benchData]);

  const filteredData = useMemo(() => {
    let data = benchData.filter((item) => {
      const employee = item.employee;
      const text = `
        ${employee.name}
        ${employee.email}
        ${employee.employeeCode}
        ${employee.departmentId?.name}
      `.toLowerCase();
      const matchesSearch = text.includes(search.toLowerCase());
      const matchesStatus = statusFilter === "All" || item.status === statusFilter;
      const matchesDept = departmentFilter === "All" || (employee.departmentId?.name || "Unassigned") === departmentFilter;
      return matchesSearch && matchesStatus && matchesDept;
    });

    data.sort((a, b) => {
      if (sortBy === "name") return a.employee.name.localeCompare(b.employee.name);
      if (sortBy === "bench") return b.bench - a.bench;
      return b.utilization - a.utilization;
    });
    return data;
  }, [benchData, search, statusFilter, departmentFilter, sortBy]);

  const exportReport = () => {
  const doc = new jsPDF();

  doc.setFontSize(18);
  doc.text("Workforce Bench Report", 14, 20);

  autoTable(doc, {
    startY: 30,
    head: [["Employee", "Department", "Utilization", "Status"]],
    body: filteredData.map((item) => [
      item.employee.name,
      item.employee.departmentId?.name || "N/A",
      `${item.utilization}%`,
      item.status,
    ]),
  });

  doc.save("BENCH REPORT.pdf");
};

const handleAssignProject = async () => {
  if (!assignmentEmployee || !selectedProject) return;

  try {
    setAssignLoading(true);

    const currentBillable = assignmentEmployee.billableAllocation || 0;

    const allocatedHours = (allocation / 100) * MONTHLY_CAPACITY;

    if (currentBillable + allocatedHours > MONTHLY_CAPACITY) {
      alert("Allocation exceeds monthly capacity");
      setAssignLoading(false);
      return;
    }

    const payload = {
      employeeId: assignmentEmployee.employee._id,
      projectId: selectedProject,
      allocatedHours,
      allocationFTE: allocatedHours / MONTHLY_CAPACITY,
      month: new Date().getMonth() + 1,
      year: new Date().getFullYear(),
    };

    const res = await fetch(`${API_BASE}/api/allocations`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      throw new Error("Assignment Failed");
    }

    // optimistic refresh
    setBenchData((prev) =>
      prev.map((emp) => {
        if (emp.employee._id === assignmentEmployee.employee._id) {
          const updatedBillable =
            (emp.billableAllocation || 0) + allocatedHours;

          // ✅ recompute total allocation
          const updatedTotal =
            updatedBillable +
            (emp.nonBillableAllocation || 0) ||
            MONTHLY_CAPACITY;

          // ✅ correct utilization formula
          const updatedUtil =
            updatedTotal > 0
              ? Math.round((updatedBillable / updatedTotal) * 100)
              : 0;

          return {
            ...emp,
            billableAllocation: updatedBillable,
            totalAllocation: updatedTotal,
            utilization: updatedUtil,
            bench: Math.max(0, 100 - updatedUtil),
            status: getEmployeeStatus(updatedUtil),
          };
        }

        return emp;
      })
    );

    setShowAssignModal(false);
    setSelectedProject("");
    setAllocation(50);
  } catch (err) {
    console.error(err);
    alert("Unable to Assign Project");
  } finally {
    setAssignLoading(false);
  }
};

  if (loading) return <LoadingScreen />;

  return (
    <div className="min-h-screen bg-[#F1F5F9] text-slate-900 font-sans">
      {/* Top Navigation Bar */}
      <nav className="top-0 z-40 w-full bg-white/80 backdrop-blur-md border-b border-slate-200 px-8 py-4">
        <div className="max-w-[1800px] mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-sky-600 p-2.5 rounded-xl shadow-lg shadow-sky-200">
              <TrendingUpDown size={28} className="text-white"/>
            </div>
            
            <div>
             <h1 className="text-2xl font-bold tracking-tight">Bench <span className="text-sky-700 font-sm">Forecast</span></h1>
             <p className="text-slate-600 font-medium">Real-time capacity tracking and resource allocation.</p>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
          <button
            onClick={exportReport}
            className="flex items-center gap-2 px-4 py-2 text-sm font-bold text-white bg-green-600 hover:hover:opacity-90 rounded-lg transition-all"
          >
            <Download size={16} /> Export
          </button>
          <button
            onClick={() => setShowStrategy(true)}
            className="flex items-center gap-2 px-4 py-2 text-sm font-bold bg-blue-500 text-white rounded-lg hover:opacity-90 transition-all"
 >              
            <Sparkles size={16} /> Smart Allocate
            </button>
          </div>
        </div>
      </nav>

      <div className="max-w-[1800px] mx-auto p-6 lg:p-10">
        <div className="grid grid-cols-12 gap-8">
          
          {/* LEFT SIDEBAR: FILTERS */}
          <aside className="col-span-12 lg:col-span-2 space-y-6">
            <div className="flex items-center gap-2 px-2 mb-2">
              <Filter size={16} className="text-indigo-600" />
              <span className="text-xs font-black uppercase tracking-widest text-slate-400">Filters</span>
            </div>
            
            <div className="space-y-1">
              <p className="text-[10px] font-bold text-slate-400 uppercase ml-2 mb-1">Search Resource</p>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                <input 
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="ID or Name..." 
                  className="w-full bg-white border border-slate-200 rounded-xl py-2 pl-9 pr-4 text-sm focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all"
                />
              </div>
            </div>

            <div className="space-y-1">
              <p className="text-[10px] font-bold text-slate-400 uppercase ml-2 mb-1">Current Status</p>
              <div className="flex flex-col gap-1">
                {["All", "Billable", "Partial Bench", "Fully Bench", "Overallocated"].map(status => (
                  <button
                    key={status}
                    onClick={() => setStatusFilter(status)}
                    className={`text-left px-3 py-2 rounded-lg text-sm font-bold transition-all ${statusFilter === status ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-500 hover:bg-white'}`}
                  >
                    {status}
                  </button>
                ))}
              </div>
            </div>

            <div className="pt-4 border-t border-slate-200">
              <p className="text-[10px] font-bold text-slate-400 uppercase ml-2 mb-3">Departments</p>
              <select 
                value={departmentFilter}
                onChange={(e) => setDepartmentFilter(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-xl py-2 px-3 text-sm font-bold outline-none cursor-pointer"
              >
                <option value="All">All Entities</option>
                {[...new Set(benchData.map(e => e.employee.departmentId?.name || "Unassigned"))].map(d => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </div>

            <div className="pt-4 border-t border-slate-200">
              <p className="text-[10px] font-bold text-slate-400 uppercase ml-2 mb-3">
                Sort By
              </p>

              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-xl py-2 px-3 text-sm font-bold outline-none"
              >
                <option value="utilization">Utilization</option>
                <option value="bench">Bench</option>
                <option value="name">Name</option>
              </select>
            </div>
          </aside>

          {/* CENTER: CONTENT & TABLE */}
          <main className="col-span-12 lg:col-span-7 space-y-8">
            {/* Main Title Area */}
            <div className="flex items-end justify-between">
              <div>
                <h2 className="text-3xl font-black text-slate-900">Workforce Dashboard</h2>
                <p className="text-slate-500 font-medium">Real-time capacity tracking and resource allocation.</p>
              </div>
            </div>

            {/* Registry Table */}
            <div className="bg-white rounded-[2rem] border border-slate-200 shadow-sm overflow-hidden">
              <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600">
                    <Layers size={20} />
                  </div>
                  <h3 className="font-bold text-lg">Resource Registry</h3>
                </div>
                <span className="text-xs font-bold text-slate-400 bg-slate-50 px-3 py-1 rounded-full border border-slate-100">
                  {filteredData.length} TOTAL
                </span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="text-left bg-slate-50/50">
                      <th className="px-6 py-4 text-[12px] text-center font-black text-sky-800 uppercase tracking-widest">Resource</th>
                      <th className="px-6 py-4 text-[12px] text-center font-black text-sky-800 uppercase tracking-widest">Entity</th>
                      <th className="px-6 py-4 text-[12px] text-center font-black text-sky-800 uppercase tracking-widest">Utilization</th>
                      <th className="px-6 py-4 text-right"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {filteredData.map((item) => (
                      <tr 
                        key={item.employee._id} 
                        className="group hover:bg-slate-50/80 cursor-pointer transition-colors"
                        onClick={() => setSelectedEmployee(item)}
                      >
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="h-9 w-9 rounded-lg bg-sky-100 flex items-center justify-center font-bold text-sky-800 group-hover:bg-sky-600 group-hover:text-white transition-all">
                              {item.employee.name.charAt(0)}
                            </div>
                            <div>
                              <div className="text-sm font-bold text-slate-800">{item.employee.name}</div>
                              <div className="text-[10px] text-amber-600 font-bold uppercase">{item.employee.employeeCode}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700 uppercase">
                            <Building2 size={14} className="text-slate-500" />
                            {item.employee.departmentId?.name || "Global"}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-4">
                            <div className="flex-1 h-1.5 w-24 bg-slate-100 rounded-full overflow-hidden">
                              <div 
                                className={`h-full rounded-full ${STATUS_THEMES[item.status].dot}`} 
                                style={{ width: `${Math.min(item.utilization, 100)}%` }} 
                              />
                            </div>
                            <span className="text-xs font-black text-slate-700">{item.utilization}%</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <ArrowUpRight size={16} className="text-slate-300 group-hover:text-indigo-600 inline transition-colors" />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </main>

<AnimatePresence>
  {showStrategy && (
    <>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/40 z-50"
        onClick={() => setShowStrategy(false)}
      />

      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="fixed inset-0 m-auto h-fit max-w-xl bg-white rounded-[2rem] p-8 z-[60] shadow-2xl"
      >
        <div className="flex items-center gap-3 mb-6">
          <BrainCircuit className="text-indigo-600" />
          <h2 className="text-2xl font-black">
            AI Allocation Strategy
          </h2>
        </div>

        <div className="space-y-4">
          {benchData
            .filter((e) => e.status === "Fully Bench")
            .slice(0, 5)
            .map((emp) => (
              <div
                key={emp.employee._id}
                className="p-4 rounded-xl border border-slate-200"
              >
                <p className="font-bold text-slate-800">
                  {emp.employee.name}
                </p>

                <p className="text-sm text-slate-500 mt-1">
                  Allocate Projects.
                </p>
              </div>
            ))}
        </div>

        <button
          onClick={() => setShowStrategy(false)}
          className="mt-6 w-full py-3 bg-indigo-600 text-white rounded-xl font-bold"
        >
          Close
        </button>
      </motion.div>
    </>
  )}
</AnimatePresence>

<AnimatePresence>
  {showAssignModal && assignmentEmployee && (
    <>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={() => setShowAssignModal(false)}
        className="fixed inset-0 bg-black/40 z-[80]"
      />

      <motion.div
        initial={{ y: 40, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 40, opacity: 0 }}
        className="fixed inset-0 m-auto h-fit w-full max-w-lg bg-white rounded-[2rem] p-8 z-[90] shadow-2xl"
      >
        <div className="flex items-center gap-3 mb-6">
          <Briefcase className="text-indigo-600" />
          <div>
            <h2 className="text-2xl font-black">
              Assign Project
            </h2>
            <p className="text-sm text-slate-500">
              {assignmentEmployee.employee.name}
            </p>
          </div>
        </div>

        <div className="space-y-5">
          <div>
            <label className="text-xs font-black uppercase text-slate-400 mb-2 block">
              Select Project
            </label>

            <select
              value={selectedProject}
              onChange={(e) => setSelectedProject(e.target.value)}
              className="w-full border border-slate-200 rounded-xl px-4 py-3 outline-none"
            >
              <option value="">Choose Project</option>

              {Array.isArray(projects) && projects.map((project) => (
              <option key={project._id} value={project._id}>
                {project.projectName || project.name || project.title || "Unnamed Project"}
              </option>
              ))}
            </select>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-black uppercase text-slate-400">
                Allocation
              </label>

              <span className="text-sm font-bold text-indigo-600">
                {allocation}%
              </span>
            </div>

            <input
              type="range"
              min={10}
              max={100}
              step={10}
              value={allocation}
              onChange={(e) => setAllocation(Number(e.target.value))}
              className="w-full"
            />
          </div>

          <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
            <div className="flex justify-between text-sm">
              <span className="text-slate-500 font-medium">
                Current Utilization
              </span>

              <span className="font-bold">
                {assignmentEmployee.utilization}%
              </span>
            </div>

            <div className="flex justify-between text-sm mt-2">
              <span className="text-slate-500 font-medium">
                After Allocation
              </span>

              <span className="font-black text-indigo-600">
                {Math.round((((assignmentEmployee.billableAllocation || 0) + 
                              (allocation / 100) * MONTHLY_CAPACITY) / MONTHLY_CAPACITY) * 100)}%
              </span>
            </div>
          </div>

          <button
            disabled={assignLoading}
            onClick={handleAssignProject}
            className="w-full py-4 bg-indigo-600 text-white rounded-xl font-black hover:opacity-90 transition-all disabled:opacity-50"
          >
            {assignLoading ? "Assigning..." : "Confirm Assignment"}
          </button>
        </div>
      </motion.div>
    </>
  )}
</AnimatePresence>

          {/* RIGHT SIDEBAR: MIX & INSIGHTS */}
          <aside className="col-span-12 lg:col-span-3 space-y-6">
            
            {/* KPI Overview */}
            <div className="bg-sky-600 rounded-[2rem] p-6 text-white shadow-xl shadow-indigo-200">
               <div className="flex items-center justify-between mb-4">
                 <Target size={24} />
               </div>
               <p className="text-xs font-bold text-indigo-100 uppercase tracking-widest mb-1">Global Utilization</p>
               <h4 className="text-4xl font-black">{stats.utilization}%</h4>
               <div className="mt-4 pt-4 border-t border-white/10 flex justify-between">
                 <div>
                   <p className="text-[10px] text-indigo-200 font-bold uppercase">Billable</p>
                   <p className="font-bold">{stats.billable}</p>
                 </div>
                 <div>
                   <p className="text-[10px] text-indigo-200 font-bold uppercase">Bench</p>
                   <p className="font-bold">{stats.bench}</p>
                 </div>
               </div>
            </div>

            {/* Utilization Mix Chart */}
            <div className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm">
              <h3 className="font-bold text-sm mb-6 flex items-center gap-2">
                <BarChart3 size={16} className="text-indigo-600" /> Utilization Mix
              </h3>
              <div className="h-[200px] w-full relative">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={[
                        { name: "Billable", value: stats.billable },
                        { name: "Bench", value: stats.bench },
                        { name: "Partial", value: stats.partial },
                      ]}
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      <Cell fill="#6366f1" />
                      <Cell fill="#1b95a8" />
                      <Cell fill="#f59e0b" />
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <span className="text-2xl font-black text-slate-800">{stats.total}</span>
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Resources</span>
                </div>
              </div>
              <div className="mt-6 space-y-2">
                 <LegendRow label="Billable" color="bg-indigo-500" val={stats.billable} />
                 <LegendRow label="Available" color="bg-green-600" val={stats.bench} />
                 <LegendRow label="Partial" color="bg-amber-600" val={stats.partial} />
              </div>
            </div>
          </aside>
        </div>
      </div>

      {/* Floating Detail Panel (AnimatePresence) */}
      <AnimatePresence>
        {selectedEmployee && (
          <>
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setSelectedEmployee(null)}
              className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50" 
            />
            <motion.div 
              initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed right-0 top-0 h-full w-full max-w-[450px] bg-white z-[60] shadow-2xl p-10 overflow-y-auto"
            >

              <div className="space-y-6">
                <div>
                  <h2 className="text-3xl font-black text-slate-900 mb-1">{selectedEmployee.employee.name}</h2>
                  <p className="text-md font-bold text-indigo-600 tracking-widest uppercase">{selectedEmployee.employee.employeeCode}</p>
                </div>

                <div className="grid grid-cols-2 gap-6">
                   <div className="bg-sky-50 p-4 rounded-2xl border border-slate-100">
                      <p className="text-[10px] font-black text-slate-500 uppercase mb-1">Status</p>
                      <StatusBadge status={selectedEmployee.status} />
                   </div>
                   <div className="bg-sky-50 p-4 rounded-2xl border border-slate-100">
                      <p className="text-[10px] font-black text-slate-500 uppercase mb-1">Utilization</p>
                      <p className="text-xl font-black text-slate-800">{selectedEmployee.utilization}%</p>
                      <p className="text-sm text-slate-500 mt-1">Billable: {selectedEmployee.utilization}% </p>
                   </div>
                </div>

                <div className="space-y-2">
                  <DetailRow icon={<Building2 size={16}/>} label="Department" value={selectedEmployee.employee.departmentId?.name} />
                  <DetailRow icon={<MapPin size={16}/>} label="Location" value={selectedEmployee.employee.location} />
                  <DetailRow icon={<Users size={16}/>} label="Email" value={selectedEmployee.employee.email} />
                </div>

                <div>
                  <p className="text-md font-bold text-amber-800 uppercase tracking-widest mb-4">Competency Stack</p>
                  <div className="flex flex-wrap gap-2">
                    {selectedEmployee?.employee?.skills?.map((s: any) => (
                      <span key={s._id} className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-600 shadow-sm">
                        {s.name}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="mt-6">
                  <p className="text-md font-bold uppercase tracking-widest text-amber-800 mb-4">
                    Monthly Bench
                  </p>

                  <div className="space-y-3">
                    {selectedEmployee.monthlyBench?.map((m: any, idx: number) => (
                      <div
                        key={idx}
                        className="p-4 rounded-2xl border border-slate-200 bg-slate-50"
                      >
                        <div className="flex justify-between items-center">
                          <h4 className="font-black text-slate-800">
                            Month {m.month} / {m.year}
                          </h4>

                          <StatusBadge status={m.status} />
                        </div>

                        <div className="mt-3 flex justify-between text-sm">
                          <span>Utilization</span>
                          <span className="font-bold">{m.utilization}%</span>
                        </div>

                        <div className="mt-1 flex justify-between text-sm">
                          <span>Bench</span>
                          <span className="font-bold">{m.bench}%</span>
                        </div>

                        <div className="mt-3">
                          <p className="text-xs font-bold uppercase text-amber-700 mb-2">
                            Projects
                          </p>

                          <div className="flex flex-wrap gap-2">
                            {m.projects?.map((p: any) => (
                              <span
                                key={p._id}
                                className="px-2 py-1 bg-indigo-100 text-indigo-700 rounded-lg text-xs font-bold"
                              >
                                {p.name}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

              <button
                onClick={() => {
                  setAssignmentEmployee(selectedEmployee);
                  setShowAssignModal(true);
                }}
                className="w-full py-4 bg-sky-500 text-white rounded-[1.5rem] font-black uppercase tracking-widest text-sm hover:scale-[1.02] active:scale-[0.98] transition-all shadow-xl shadow-slate-200"
              >
                Manage Assignments
              </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ======================================================
   HELPER SUB-COMPONENTS
====================================================== */

function LegendRow({ label, color, val }: any) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        <div className={`h-2 w-2 rounded-full ${color}`} />
        <span className="text-xs font-bold text-slate-500">{label}</span>
      </div>
      <span className="text-xs font-black text-slate-800">{val}</span>
    </div>
  );
}

function DetailRow({ icon, label, value }: any) {
  return (
    <div className="flex items-center justify-between py-3 border-b border-slate-100">
      <div className="flex items-center gap-3 text-slate-400">
        {icon}
        <span className="text-xs font-bold uppercase">{label}</span>
      </div>
      <span className="text-sm font-bold text-slate-700">{value || "N/A"}</span>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const theme = STATUS_THEMES[status] || STATUS_THEMES["Partial Bench"];
  return (
    <div className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-lg ${theme.bg} ${theme.text}`}>
      <div className={`h-1.5 w-1.5 rounded-full ${theme.dot}`} />
      <span className="text-[12px] font-black uppercase tracking-wider">{status}</span>
    </div>
  );
}

function LoadingScreen() {
  return (
    <div className="h-screen w-full flex flex-col items-center justify-center bg-slate-50">
      <motion.div 
        animate={{ scale: [1, 1.2, 1], rotate: [0, 360] }}
        transition={{ repeat: Infinity, duration: 2 }}
        className="h-16 w-16 border-4 border-indigo-600 border-t-transparent rounded-full mb-4"
      />
      <p className="text-xs font-black uppercase tracking-[0.3em] text-slate-400 animate-pulse">Initializing Hub</p>
    </div>
  );
}