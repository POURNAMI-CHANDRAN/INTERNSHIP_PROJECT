// import { useState, useMemo } from "react";
// import useResourceHeatmapData from "../../hooks/useHeatMapData";
// import { EmployeeSidebar } from "../components/EmpSidebar";
// import { buildDepartments } from "../../utils/buildDepts";

// export function WorkloadManager() {
//   const year = 2026;
//   const CAPACITY = 160;
//   const [selectedEmployee, setSelectedEmployee] = useState<any | null>(null);
//   const [filterStatus, setFilterStatus] = useState<string | null>(null);

//   const { employees = [], allocations = [], departments = [], loading } = useResourceHeatmapData(year);

//   // 1. Logic: Pre-calculate metrics for the Dashboard Header
//   const stats = useMemo(() => {
//     const calculated = employees.map(emp => {
//       const hours = allocations
//         .filter(a => a.employeeId === emp._id)
//         .reduce((sum, a) => sum + Number(a.allocatedHours || 0), 0);
//       const pct = Math.round((hours / CAPACITY) * 100);
//       return pct > 100 ? 'Over' : pct < 60 ? 'Under' : 'Optimal';
//     });
//     return {
//       over: calculated.filter(s => s === 'Over').length,
//       under: calculated.filter(s => s === 'Under').length,
//       optimal: calculated.filter(s => s === 'Optimal').length
//     };
//   }, [employees, allocations]);

//   const sidebarDepartments = buildDepartments(departments, employees);

//   if (loading) return (
//     <div className="flex h-screen items-center justify-center bg-gray-50">
//       <div className="animate-pulse text-blue-600 font-medium tracking-wide uppercase text-sm">Synchronizing Data...</div>
//     </div>
//   );

//   return (
//     <div className="flex h-screen bg-[#F8F9FB] text-slate-900 font-sans">
//       <EmployeeSidebar
//         departments={sidebarDepartments}
//         selectedEmployeeId={selectedEmployee?._id}
//         onEmployeeSelect={(id) => setSelectedEmployee(employees.find(e => e._id === id))}
//       />

//       <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
//         {/* HEADER SECTION */}
//         <header className="p-8 pb-4">
//           <div className="flex justify-between items-end mb-6">
//             <div>
//               <h1 className="text-2xl font-bold tracking-tight text-slate-800">Workload Manager</h1>
//               <p className="text-slate-500 text-sm">Manage resource distribution and burnout risks.</p>
//             </div>
//             <div className="flex gap-2">
//               <button className="bg-white border border-slate-200 text-slate-700 px-4 py-2 rounded-lg text-sm font-semibold hover:bg-slate-50 transition shadow-sm">
//                 Export Report
//               </button>
//             </div>
//           </div>

//           {/* KPI CARDS */}
//           <div className="grid grid-cols-3 gap-4 mb-2">
//             {[
//               { label: 'High Risk (Over)', count: stats.over, color: 'text-red-600', bg: 'bg-red-50', border: 'border-red-100' },
//               { label: 'Optimal', count: stats.optimal, color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-100' },
//               { label: 'Under-utilized', count: stats.under, color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-100' },
//             ].map((stat, i) => (
//               <div key={i} className={`${stat.bg} ${stat.border} border p-4 rounded-xl shadow-sm`}>
//                 <p className="text-xs font-bold uppercase tracking-wider opacity-70 mb-1">{stat.label}</p>
//                 <p className={`text-2xl font-black ${stat.color}`}>{stat.count}</p>
//               </div>
//             ))}
//           </div>
//         </header>

//         {/* MAIN LIST CONTAINER */}
//         <div className="flex-1 overflow-auto px-8 pb-8">
//           <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
//             <table className="w-full text-left border-collapse">
//               <thead className="bg-slate-50/50 border-b border-slate-200">
//                 <tr>
//                   <th className="px-6 py-4 text-[11px] font-bold uppercase tracking-widest text-slate-400">Employee</th>
//                   <th className="px-6 py-4 text-[11px] font-bold uppercase tracking-widest text-slate-400">Current Workload</th>
//                   <th className="px-6 py-4 text-[11px] font-bold uppercase tracking-widest text-slate-400">Status</th>
//                   <th className="px-6 py-4 text-right"></th>
//                 </tr>
//               </thead>
//               <tbody className="divide-y divide-slate-100">
//                 {employees.map((emp) => {
//                   const hours = allocations
//                     .filter(a => a.employeeId === emp._id)
//                     .reduce((sum, a) => sum + Number(a.allocatedHours || 0), 0);
//                   const pct = Math.round((hours / CAPACITY) * 100);
                  
//                   const isOver = pct > 100;
//                   const isUnder = pct < 60;

//                   return (
//                     <tr key={emp._id} className="group hover:bg-slate-50/80 transition-colors">
//                       <td className="px-6 py-4">
//                         <div className="font-semibold text-slate-800">{emp.name}</div>
//                         <div className="text-xs text-slate-400">{emp.departmentId?.name || "Unassigned"}</div>
//                       </td>
//                       <td className="px-6 py-4">
//                         <div className="flex items-center gap-4">
//                           <div className="flex-1 max-w-[120px] h-1.5 bg-slate-100 rounded-full overflow-hidden">
//                             <div 
//                               className={`h-full transition-all duration-500 rounded-full ${isOver ? 'bg-red-500' : isUnder ? 'bg-amber-400' : 'bg-emerald-500'}`}
//                               style={{ width: `${Math.min(pct, 100)}%` }}
//                             />
//                           </div>
//                           <span className="text-sm font-bold text-slate-600">{pct}%</span>
//                         </div>
//                       </td>
//                       <td className="px-6 py-4">
//                         <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-tight
//                           ${isOver ? 'bg-red-100 text-red-700' : isUnder ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'}`}>
//                           {isOver ? 'Over Capacity' : isUnder ? 'Under-utilized' : 'Optimal'}
//                         </span>
//                       </td>
//                       <td className="px-6 py-4 text-right">
//                         {(isOver || isUnder) && (
//                           <button 
//                             onClick={() => setSelectedEmployee(emp)}
//                             className="opacity-0 group-hover:opacity-100 bg-slate-800 text-white px-3 py-1.5 rounded-lg text-xs font-bold transition-all hover:bg-black"
//                           >
//                             Rebalance
//                           </button>
//                         )}
//                       </td>
//                     </tr>
//                   );
//                 })}
//               </tbody>
//             </table>
//           </div>
//         </div>

//         {/* MODAL - ENHANCED */}
//         {selectedEmployee && (
//           <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
//             <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setSelectedEmployee(null)} />
//             <div className="relative bg-white rounded-3xl p-8 w-full max-w-md shadow-2xl animate-in fade-in zoom-in duration-200">
//               <div className="h-12 w-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mb-6">
//                 <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" /></svg>
//               </div>
//               <h2 className="text-xl font-bold text-slate-800 mb-2">Smart Reassignment</h2>
//               <p className="text-slate-500 text-sm leading-relaxed mb-8">
//                 Adjusting workload for <span className="font-bold text-slate-800">{selectedEmployee.name}</span>. 
//                 Our system will suggest teammates with available capacity in the {selectedEmployee.departmentId?.name} department.
//               </p>

//               <div className="space-y-3">
//                 <button className="w-full bg-slate-900 text-white py-3 rounded-xl font-bold hover:bg-black transition shadow-lg shadow-slate-200">
//                   Find Available Teammates
//                 </button>
//                 <button 
//                   onClick={() => setSelectedEmployee(null)}
//                   className="w-full bg-white border border-slate-200 text-slate-500 py-3 rounded-xl font-bold hover:bg-slate-50 transition"
//                 >
//                   Close
//                 </button>
//               </div>
//             </div>
//           </div>
//         )}
//       </main>
//     </div>
//   );
// }


import { useState, useMemo } from "react";
import useResourceHeatmapData from "../../hooks/useHeatMapData";
import { EmployeeSidebar } from "../components/EmpSidebar";
import { buildDepartments } from "../../utils/buildDepts";

/* ================= CONSTANTS ================= */

const MONTHLY_CAPACITY = 160;
const CURRENT_MONTH = new Date().getMonth() + 1;

/* ================= TYPES ================= */

type Employee = any;
type Allocation = any;

/* ================= COMPONENT ================= */

export function WorkloadManager() {
  const year = 2026;

  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);

  const {
    employees = [],
    allocations = [],
    departments = [],
    loading,
  } = useResourceHeatmapData(year);

  /* =====================================================
     ✅ NORMALIZED MONTH-SCOPED ALLOCATIONS
     This is the CORE FIX: workload = current month only
  ===================================================== */

  const monthAllocations = useMemo(() => {
    return allocations.filter(
      (a: Allocation) =>
        a.month === CURRENT_MONTH && a.year === year
    );
  }, [allocations, year]);

  /* =====================================================
     ✅ KPI METRICS (MONTHLY & CORRECT)
  ===================================================== */

  const stats = useMemo(() => {
    let over = 0;
    let under = 0;
    let optimal = 0;

    employees.forEach((emp: Employee) => {
      const hours = monthAllocations
        .filter(a => String(a.employeeId) === String(emp._id))
        .reduce((sum, a) => sum + Number(a.allocatedHours || 0), 0);

      const pct = Math.round((hours / MONTHLY_CAPACITY) * 100);

      if (pct > 100) over++;
      else if (pct < 60) under++;
      else optimal++;
    });

    return { over, under, optimal };
  }, [employees, monthAllocations]);

  /* =====================================================
     ✅ SIDEBAR DEPARTMENTS (SAFE)
  ===================================================== */

  const sidebarDepartments = useMemo(
    () => buildDepartments(departments, employees),
    [departments, employees]
  );

  /* ================= LOADING ================= */

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50">
        <div className="animate-pulse text-blue-600 font-medium uppercase tracking-wide">
          Synchronizing Data...
        </div>
      </div>
    );
  }

  /* ================= UI ================= */

  return (
    <div className="flex h-screen bg-[#F8F9FB] text-slate-900 font-sans">
      {/* ================= SIDEBAR ================= */}
      {/* <EmployeeSidebar
        departments={sidebarDepartments}
        selectedEmployeeId={selectedEmployee?._id}
        onEmployeeSelect={(id) =>
          setSelectedEmployee(employees.find(e => e._id === id))
        }
      /> */}

      {/* ================= MAIN ================= */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">

        {/* ================= HEADER ================= */}
        <header className="p-8 pb-4">
          <div className="flex justify-between items-end mb-6">
            <div>
              <h1 className="text-2xl font-bold text-slate-800">
                Workload Manager
              </h1>
              <p className="text-sm text-slate-500">
                Monthly utilization view ({year})
              </p>
            </div>
          </div>

          {/* ================= KPI CARDS ================= */}
          <div className="grid grid-cols-3 gap-4">
            {[
              { label: "High Risk (Over)", count: stats.over, color: "text-red-600", bg: "bg-red-50" },
              { label: "Optimal", count: stats.optimal, color: "text-emerald-600", bg: "bg-emerald-50" },
              { label: "Under-utilized", count: stats.under, color: "text-amber-600", bg: "bg-amber-50" },
            ].map((s, i) => (
              <div key={i} className={`${s.bg} border border-slate-200 p-4 rounded-xl shadow-sm`}>
                <p className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
                  {s.label}
                </p>
                <p className={`text-3xl font-black ${s.color}`}>
                  {s.count}
                </p>
              </div>
            ))}
          </div>
        </header>

        {/* ================= TABLE ================= */}
        <div className="flex-1 overflow-auto px-8 pb-8">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <table className="w-full text-left">
              <thead className="bg-slate-50 border-b">
                <tr>
                  <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase">
                    Employee
                  </th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase">
                    Workload
                  </th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase">
                    Status
                  </th>
                  <th className="px-6 py-4" />
                </tr>
              </thead>

              <tbody className="divide-y">
                {employees.map((emp: Employee) => {
                  const hours = monthAllocations
                    .filter(a => String(a.employeeId) === String(emp._id))
                    .reduce((sum, a) => sum + Number(a.allocatedHours || 0), 0);

                  const pct = Math.round((hours / MONTHLY_CAPACITY) * 100);

                  const isOver = pct > 100;
                  const isUnder = pct < 60;

                  return (
                    <tr key={emp._id} className="hover:bg-slate-50 transition">
                      <td className="px-6 py-4">
                        <div className="font-semibold">{emp.name}</div>
                        <div className="text-xs text-slate-400">
                          {emp.departmentId?.name || "Unassigned"}
                        </div>
                      </td>

                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-28 h-1.5 bg-slate-200 rounded-full overflow-hidden">
                            <div
                              className={`h-full ${
                                isOver
                                  ? "bg-red-500"
                                  : isUnder
                                  ? "bg-amber-400"
                                  : "bg-emerald-500"
                              }`}
                              style={{ width: `${Math.min(pct, 100)}%` }}
                            />
                          </div>
                          <span className="font-bold text-sm text-slate-600">
                            {pct}%
                          </span>
                        </div>
                      </td>

                      <td className="px-6 py-4">
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-bold ${
                            isOver
                              ? "bg-red-100 text-red-700"
                              : isUnder
                              ? "bg-amber-100 text-amber-700"
                              : "bg-emerald-100 text-emerald-700"
                          }`}
                        >
                          {isOver
                            ? "Over Capacity"
                            : isUnder
                            ? "Under-utilized"
                            : "Optimal"}
                        </span>
                      </td>

                      <td className="px-6 py-4 text-right">
                        {(isOver || isUnder) && (
                          <button
                            onClick={() => setSelectedEmployee(emp)}
                            className="bg-slate-900 text-white px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-black"
                          >
                            Rebalance
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* ================= MODAL PLACEHOLDER ================= */}
        {selectedEmployee && (
          <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div
              className="absolute inset-0 bg-black/40"
              onClick={() => setSelectedEmployee(null)}
            />
            <div className="relative bg-white rounded-2xl p-8 shadow-xl">
              <h2 className="text-lg font-bold mb-2">
                Rebalance {selectedEmployee.name}
              </h2>
              <p className="text-sm text-slate-500">
                Smart redistribution logic goes here.
              </p>
              <button
                onClick={() => setSelectedEmployee(null)}
                className="mt-6 bg-slate-800 text-white px-4 py-2 rounded-lg"
              >
                Close
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
