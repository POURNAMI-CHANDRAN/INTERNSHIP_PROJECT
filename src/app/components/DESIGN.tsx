// {/* ================= DATA GRID ================= */}
// <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
//   <table className="w-full border-separate border-spacing-0">
//     <thead>
//       <tr className="bg-slate-50/50">
//         <th className="sticky left-0 z-20 border-b border-slate-200 bg-slate-50/50 px-6 py-4 text-left text-[10px] font-bold uppercase tracking-widest text-slate-500">
//           Team Member
//         </th>
//         <th className="border-b border-slate-200 px-4 py-4 text-left text-[10px] font-bold uppercase tracking-widest text-slate-500">
//           Role
//         </th>
//         <th className="border-b border-slate-200 px-4 py-4 text-left text-[10px] font-bold uppercase tracking-widest text-slate-500">
//           Skill Inventory
//         </th>
//         <th className="border-b border-slate-200 px-4 py-4 text-left text-[10px] font-bold uppercase tracking-widest text-slate-500">
//           Current Engagements
//         </th>
//         <th className="border-b border-slate-200 px-4 py-4 text-center text-[10px] font-bold uppercase tracking-widest text-slate-500">
//           Utilization
//         </th>
//         <th className="border-b border-slate-200 px-6 py-4 text-right text-[10px] font-bold uppercase tracking-widest text-slate-500">
//           Financials
//         </th>
//       </tr>
//     </thead>

//     <tbody className="divide-y divide-slate-100">
//       {employees.map((emp) => {
//         const HOURS_PER_MONTH = 160;
//         const totalHours = emp.allocations.reduce((sum, a) => sum + (a.allocatedHours || 0), 0);
//         const utilizationPct = Math.round((totalHours / HOURS_PER_MONTH) * 100);
//         const fte = totalHours / HOURS_PER_MONTH;

//         const projects = emp.allocations?.map((a) => a.projectId?.name).filter(Boolean) || [];

//         return (
//           <tr
//             key={emp._id}
//             onClick={() => onSelectEmployee?.(emp)}
//             className="group cursor-pointer transition-colors hover:bg-indigo-50/30"
//           >
//             {/* MEMBER - High contrast sticky column */}
//             <td className="sticky left-0 z-10 border-r border-slate-100 bg-white px-6 py-5 group-hover:bg-[#fcfdff] transition-colors">
//               <div className="flex items-center gap-4">
//                 <div className="relative shrink-0">
//                   <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-900 text-[13px] font-bold text-white shadow-md">
//                     {emp.name.split(" ").map((n) => n[0]).join("").slice(0, 2)}
//                   </div>
//                   <div className={`absolute -bottom-1 -right-1 h-3.5 w-3.5 rounded-full border-2 border-white shadow-sm ${utilizationPct >= 100 ? 'bg-amber-500' : 'bg-emerald-500'}`} />
//                 </div>
//                 <div className="flex flex-col min-w-0">
//                   <span className="truncate text-sm font-bold text-slate-900">
//                     {emp.name}
//                   </span>
//                   <span className="text-[10px] font-medium font-mono text-slate-400">
//                     #{emp.employeeCode}
//                   </span>
//                 </div>
//               </div>
//             </td>

//             {/* ROLE - Semantic coloring */}
//             <td className="px-4 py-5">
//               <div className="inline-flex items-center gap-1.5 rounded-lg bg-blue-50 px-2.5 py-1 text-blue-700">
//                 <Briefcase size={12} className="opacity-70" />
//                 <span className="text-[11px] font-bold uppercase tracking-tight">
//                   {emp.primaryWorkCategoryId?.name || "Staff"}
//                 </span>
//               </div>
//             </td>

//             {/* SKILLS - Flex containment */}
//             <td className="px-4 py-5">
//               <div className="flex flex-wrap gap-1.5 max-w-[260px]">
//                 {emp.skills?.slice(0, 3).map((s: any, i: number) => (
//                   <span key={i} className="rounded-md border border-slate-200 bg-white px-2 py-0.5 text-[10px] font-semibold text-slate-600 shadow-sm">
//                     {s.name}
//                   </span>
//                 ))}
//                 {emp.skills?.length > 3 && (
//                   <span className="text-[10px] font-bold text-slate-400 ml-1">+{emp.skills.length - 3}</span>
//                 )}
//               </div>
//             </td>

//             {/* PROJECTS - Bulleted list style */}
//             <td className="px-4 py-5">
//               <div className="space-y-1.5">
//                 {projects.length ? (
//                   projects.map((p: string, i: number) => (
//                     <div key={i} className="flex items-center gap-2 text-[11px] font-semibold text-slate-700">
//                       <div className="h-1.5 w-1.5 rounded-full bg-indigo-400" />
//                       <span className="truncate max-w-[140px]">{p}</span>
//                     </div>
//                   ))
//                 ) : (
//                   <span className="text-[11px] font-medium text-slate-300 italic">No Active Engagements</span>
//                 )}
//               </div>
//             </td>

//             {/* CAPACITY - Visual progress bar */}
//             <td className="px-4 py-5">
//               <div className="flex flex-col items-center gap-2">
//                 <span className={`text-xs font-black tabular-nums ${utilizationPct > 100 ? 'text-rose-600' : 'text-slate-800'}`}>
//                   {utilizationPct}%
//                 </span>
//                 <div className="h-1.5 w-16 overflow-hidden rounded-full bg-slate-100">
//                   <div 
//                     className={`h-full rounded-full transition-all duration-500 ${utilizationPct > 100 ? 'bg-rose-500' : 'bg-indigo-500'}`}
//                     style={{ width: `${Math.min(utilizationPct, 100)}%` }}
//                   />
//                 </div>
//               </div>
//             </td>

//             {/* FINANCIALS - Tabular numbers (monospaced digits) */}
//             <td className="px-6 py-5 text-right">
//               <div className="flex flex-col items-end gap-0.5">
//                 <div className="flex items-center gap-1 text-[15px] font-black tracking-tight text-slate-900 tabular-nums">
//                   <span className="text-slate-400 font-medium">₹</span>
//                   {calculateRatePerHour(emp.hourlyCost ?? 0).toLocaleString('en-IN')}
//                 </div>
//                 <span className="text-[9px] font-bold uppercase tracking-widest text-slate-400">
//                   Per Hour
//                 </span>
//               </div>
//             </td>
//           </tr>
//         );
//       })}
//     </tbody>
//   </table>
// </div>