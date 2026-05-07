// import React, { useEffect, useMemo, useState } from "react";
// import {
//   ResponsiveContainer,
//   PieChart,
//   Pie,
//   Cell,
//   BarChart,
//   Bar,
//   XAxis,
//   YAxis,
//   Tooltip,
//   AreaChart,
//   Area,
//   CartesianGrid,
//   Legend,
// } from "recharts";

// /* ================= TYPES ================= */

// type KPI = {
//   totalEmployees: number;
//   billableEmployees: number;
//   nonBillableEmployees: number;
//   utilizationPct: number;
//   revenue: number;
// };

// type ChartItem = {
//   name?: string;
//   value?: number;
//   project?: string;
//   hours?: number;
// };

// type RevenueTrend = {
//   period: string;
//   billableHours: number;
// };

// type BenchForecast = {
//   current: number;
//   riskLevel: "LOW" | "MEDIUM" | "HIGH";
// };

// type DashboardResponse = {
//   kpis: KPI;
//   charts: {
//     billableVsNonBillable: ChartItem[];
//     projectAllocation: ChartItem[];
//     revenueTrend: RevenueTrend[];
//   };
//   forecasts: {
//     benchForecast: BenchForecast;
//   };
//   revenueByProject: {
//     project: string;
//     revenue: number;
//     cost: number;
//     margin: number;
//   }[];
// };

// /* ================= CONFIG ================= */

// const COLORS = ["#6366f1", "#22c55e", "#f59e0b", "#ef4444"];

// /* ================= COMPONENT ================= */

// export default function Dashboard() {
//   const [data, setData] = useState<DashboardResponse | null>(null);
//   const [loading, setLoading] = useState(true);
//   const [month, setMonth] = useState(new Date().getMonth() + 1);
//   const [year, setYear] = useState(new Date().getFullYear());

//   useEffect(() => {
//     fetch(`http://localhost:5000/api/analytics/dashboard?month=${month}&year=${year}`)
//       .then((res) => res.json())
//       .then((res) => {
//         setData(res.data);
//         setLoading(false);
//       })
//       .catch(() => setLoading(false));
//   }, [month, year]);

//   /* ================= SAFE DERIVED DATA ================= */

//   const kpis = data?.kpis;
//   const charts = data?.charts;
//   const revenueByProject = data?.revenueByProject || [];

//   const allocationData = useMemo(
//     () =>
//       charts?.projectAllocation?.map((p) => ({
//         project: p.project ?? "Unknown",
//         hours: p.hours ?? 0,
//       })) || [],
//     [charts]
//   );

//   const billableVsNon = useMemo(
//     () => charts?.billableVsNonBillable || [],
//     [charts]
//   );

//   const revenueTrend = useMemo(
//     () => charts?.revenueTrend || [],
//     [charts]
//   );

//   /* ================= LOADING ================= */

//   if (loading) {
//     return (
//       <div className="p-10 text-gray-500 text-lg">Loading Enterprise BI...</div>
//     );
//   }

//   if (!data) {
//     return (
//       <div className="p-10 text-red-500 text-lg">Failed to load dashboard</div>
//     );
//   }

//   return (
//     <div className="p-6 bg-gray-50 min-h-screen space-y-6">

// <div className="flex gap-4 items-center mb-4">

//   <select
//     value={month}
//     onChange={(e) => setMonth(Number(e.target.value))}
//     className="border p-2 rounded"
//   >
//     {[1,2,3,4,5,6,7,8,9,10,11,12].map((m) => (
//       <option key={m} value={m}>
//         Month {m}
//       </option>
//     ))}
//   </select>

//   <select
//     value={year}
//     onChange={(e) => setYear(Number(e.target.value))}
//     className="border p-2 rounded"
//   >
//     {[2024, 2025, 2026].map((y) => (
//       <option key={y} value={y}>
//         {y}
//       </option>
//     ))}
//   </select>

// </div>
//       {/* ================= KPI CARDS ================= */}
//       <div className="grid grid-cols-1 md:grid-cols-4 gap-4">

//         <Card title="Total Employees" value={kpis?.totalEmployees} />
//         <Card title="Billable" value={kpis?.billableEmployees} />
//         <Card title="Non-Billable" value={kpis?.nonBillableEmployees} />
//         <Card title="Utilization %" value={`${kpis?.utilizationPct}%`} />
//       </div>

//       {/* ================= GRAPHS ================= */}
//       <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

//         {/* BILLABLE VS NON BILLABLE */}
//         <div className="bg-white p-4 rounded-xl shadow">
//           <h2 className="font-semibold mb-3">Billable vs Non-Billable</h2>
//           <ResponsiveContainer width="100%" height={250}>
//             <PieChart>
//               <Pie
//                 data={billableVsNon}
//                 dataKey="value"
//                 nameKey="name"
//                 outerRadius={90}
//               >
//                 {billableVsNon.map((_, i) => (
//                   <Cell key={i} fill={COLORS[i % COLORS.length]} />
//                 ))}
//               </Pie>
//               <Tooltip />
//               <Legend />
//             </PieChart>
//           </ResponsiveContainer>
//         </div>

//         {/* PROJECT ALLOCATION */}
//         <div className="bg-white p-4 rounded-xl shadow">
//           <h2 className="font-semibold mb-3">Project Allocation</h2>
//           <ResponsiveContainer width="100%" height={250}>
//             <BarChart data={allocationData}>
//               <XAxis dataKey="project" hide />
//               <YAxis />
//               <Tooltip />
//               <Bar dataKey="hours" fill="#6366f1" />
//             </BarChart>
//           </ResponsiveContainer>
//         </div>

//         {/* REVENUE TREND */}
//         <div className="bg-white p-4 rounded-xl shadow col-span-2">
//           <h2 className="font-semibold mb-3">Revenue Trend</h2>
//           <ResponsiveContainer width="100%" height={300}>
//             <AreaChart data={revenueTrend}>
//               <CartesianGrid strokeDasharray="3 3" />
//               <XAxis dataKey="period" />
//               <YAxis />
//               <Tooltip />
//               <Area type="monotone" dataKey="billableHours" fill="#6366f1" />
//             </AreaChart>
//           </ResponsiveContainer>
//         </div>
//       </div>

//       {/* ================= REVENUE BY PROJECT ================= */}
//       <div className="bg-white p-4 rounded-xl shadow">
//         <h2 className="font-semibold mb-3">Revenue by Project</h2>

//         <table className="w-full text-sm">
//           <thead>
//             <tr className="text-left text-gray-500">
//               <th>Project</th>
//               <th>Revenue</th>
//               <th>Cost</th>
//               <th>Margin</th>
//             </tr>
//           </thead>
//           <tbody>
//             {revenueByProject.map((p, i: number) => (
//               <tr key={i} className="border-t">
//                 <td>{p.project}</td>
//                 <td>₹{p.revenue}</td>
//                 <td>₹{p.cost}</td>
//                 <td className={p.margin < 0 ? "text-red-500" : "text-green-600"}>
//                   ₹{p.margin}
//                 </td>
//               </tr>
//             ))}
//           </tbody>
//         </table>
//       </div>

//       {/* ================= BENCH ALERT ================= */}
//       <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-xl">
//         <h2 className="font-semibold">Bench Forecast</h2>
//         <p>
//           Current Bench: <b>{data.forecasts.benchForecast.current}</b> employees
//         </p>
//         <p>Risk Level: <b>{data.forecasts.benchForecast.riskLevel}</b></p>
//       </div>

//     </div>
//   );
// }

// /* ================= CARD COMPONENT ================= */

// function Card({
//   title,
//   value,
// }: {
//   title: string;
//   value: React.ReactNode;
// }) {
//   return (
//     <div className="bg-white p-4 rounded-xl shadow">
//       <p className="text-gray-500 text-sm">{title}</p>
//       <h3 className="text-2xl font-bold">{value}</h3>
//     </div>
//   );
// }


//         {/* SEARCH & FILTERS
//         <div className="bg-white p-6 rounded-xl shadow">
//           <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">

//             {/* 🔍 SEARCH */}
//             <div className="relative">
//               <Search className="absolute left-3 top-3 text-gray-400" size={18} />
//               <input
//                 placeholder="Search Employee..."
//                 value={search}
//                 onChange={(e) => setSearch(e.target.value)}
//                 className="w-full pl-10 pr-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-200"
//               />
//             </div>

//             {/* 📊 PROFIT FILTER */}
//             <select
//               onChange={(e) => setProfitFilter(e.target.value)}
//               className="p-2 border rounded-lg"
//             >
//               <option value="All">Profit Status</option>
//               <option value="Profit">Profit</option>
//               <option value="Loss">Loss</option>
//             </select>

//             {/* 📈 UTILIZATION */}
//             <select
//               onChange={(e) => setUtilFilter(e.target.value)}
//               className="p-2 border rounded-lg"
//             >
//               <option value="All">Utilization</option>
//               <option value="Overallocated">Overallocated</option>
//               <option value="Underutilized">Underutilized</option>
//               <option value="Idle">Idle</option>
//             </select>

//             {/* 🧠 SKILLS */}
//             <select
//               onChange={(e) => setSkillFilter(e.target.value)}
//               className="p-2 border rounded-lg"
//             >
//               <option value="">All Skills</option>

//               {[...new Set(data.flatMap(e => e.skills))].map((s) => (
//                 <option key={s}>{s}</option>
//               ))}
//             </select>

//             {/* 📁 PROJECT */}
//             <select
//               onChange={(e) => setProjectFilter(e.target.value)}
//               className="p-2 border rounded-lg"
//             >
//               <option value="">All Projects</option>

//               {[...new Set(
//                 data.flatMap(e => e.allocations.map(a => a.project_name))
//               )].map((p) => (
//                 <option key={p}>{p}</option>
//               ))}
//             </select>

//             {/* 📅 MONTH */}
//             <select
//               onChange={(e) => setMonth(e.target.value)}
//               className="p-2 border rounded-lg"
//             >
//               <option value="">Month</option>
//               {[...Array(12)].map((_, i) => (
//                 <option key={i + 1} value={i + 1}>
//                   {i + 1}
//                 </option>
//               ))}
//             </select>

//             <button
//               onClick={() => {
//                 setSearch("");
//                 setProfitFilter("All");
//                 setUtilFilter("All");
//                 setSkillFilter("");
//                 setProjectFilter("");
//                 setMonth("");
//               }}
//               className="bg-gray-200 px-4 py-2 rounded"
//             >
//               Reset
//             </button>
//           </div>
//         </div> */}


// import { useEffect, useState } from "react";
// import axios from "axios";
// import { FileText, Download } from "lucide-react";
// import * as XLSX from "xlsx";

// /* ================= TYPES ================= */

// type Utilization = {
//   name: string;
//   billable_percent: number;
//   non_billable_percent: number;
// };

// type Revenue = {
//   projectName: string;
//   revenue: number;
// };

// type Bench = {
//   name: string;
// };

// /* ================= REPORT CARDS ================= */

// const reports = [
//   {
//     title: "Resource Utilization Report",
//     description: "Track employee billable vs non-billable allocation",
//     icon: "📊",
//   },
//   {
//     title: "Project Revenue Report",
//     description: "Revenue breakdown by project",
//     icon: "💰",
//   },
//   {
//     title: "Resource Allocation Report",
//     description: "View current allocations",
//     icon: "📅",
//   },
//   {
//     title: "Bench Forecast Report",
//     description: "Identify unused capacity",
//     icon: "📈",
//   },
// ];

// /* ================= COMPONENT ================= */

// export default function Reports() {
//   const [utilization, setUtilization] = useState<Utilization[]>([]);
//   const [revenue, setRevenue] = useState<Revenue[]>([]);
//   const [bench, setBench] = useState<Bench[]>([]);
//   const [loading, setLoading] = useState(false);

//   const [month, setMonth] = useState<number>(4);
//   const [year, setYear] = useState<number>(2026);

//   const API = "http://localhost:5000/api/reports";

//   /* ================= FETCH ================= */

//   const fetchData = async () => {
//     try {
//       setLoading(true);

//       const [utilRes, revRes, benchRes] = await Promise.all([
//         axios.get<Utilization[]>(
//           `${API}/utilization?month=${month}&year=${year}`
//         ),
//         axios.get<Revenue[]>(`${API}/revenue-project`),
//         axios.get<{ employees: Bench[] }>(`${API}/bench`),
//       ]);

//       setUtilization(utilRes.data);
//       setRevenue(revRes.data);
//       setBench(benchRes.data.employees || []);
//     } catch (err) {
//       console.error(err);
//     } finally {
//       setLoading(false);
//     }
//   };

//   useEffect(() => {
//     fetchData();
//   }, [month, year]);

//   /* ================= EXPORT ================= */

//   const exportExcel = () => {
//     const wb = XLSX.utils.book_new();

//     XLSX.utils.book_append_sheet(
//       wb,
//       XLSX.utils.json_to_sheet(utilization),
//       "Utilization"
//     );
//     XLSX.utils.book_append_sheet(
//       wb,
//       XLSX.utils.json_to_sheet(revenue),
//       "Revenue"
//     );
//     XLSX.utils.book_append_sheet(
//       wb,
//       XLSX.utils.json_to_sheet(bench),
//       "Bench"
//     );

//     XLSX.writeFile(wb, "Reports.xlsx");
//   };

//   const exportPDF = () => window.print();

//   /* ================= UI ================= */

//   return (
//     <div className="bg-sky-50 min-h-screen p-6 space-y-6">
//       {/* HEADER */}
//       <h1 className="text-2xl font-bold text-sky-900">
//         Reports Dashboard
//       </h1>

//       {/* FILTERS */}
//       <div className="flex gap-4 items-center">
//         <select
//           value={month}
//           onChange={(e) => setMonth(Number(e.target.value))}
//           className="p-2 border rounded"
//         >
//           {[...Array(12)].map((_, i) => (
//             <option key={i} value={i + 1}>
//               Month {i + 1}
//             </option>
//           ))}
//         </select>

//         <input
//           type="number"
//           value={year}
//           onChange={(e) => setYear(Number(e.target.value))}
//           className="p-2 border rounded w-24"
//         />

//         <button
//           onClick={exportExcel}
//           className="bg-green-600 text-white px-4 py-2 rounded"
//         >
//           Export Excel
//         </button>

//         <button
//           onClick={exportPDF}
//           className="bg-red-600 text-white px-4 py-2 rounded"
//         >
//           Export PDF
//         </button>
//       </div>

//       {/* REPORT CARDS */}
//       <div className="grid grid-cols-2 gap-4">
//         {reports.map((report) => (
//           <div
//             key={report.title}
//             className="bg-white border border-sky-200 p-6 rounded-xl shadow-sm hover:shadow-md"
//           >
//             <div className="flex justify-between mb-3">
//               <div className="text-3xl">{report.icon}</div>
//               <FileText className="text-sky-400" />
//             </div>

//             <h3 className="text-sky-900 font-medium mb-2">
//               {report.title}
//             </h3>

//             <p className="text-sm text-sky-700 mb-4">
//               {report.description}
//             </p>

//             <button className="flex items-center gap-2 px-4 py-2 bg-sky-600 text-white rounded hover:bg-sky-700">
//               <Download className="w-4 h-4" />
//               Generate
//             </button>
//           </div>
//         ))}
//       </div>

//       {loading ? (
//         <p>Loading...</p>
//       ) : (
//         <>
//           {/* UTILIZATION */}
//           <div className="bg-white p-6 rounded-xl shadow">
//             <h2 className="font-semibold mb-4 text-sky-900">
//               Utilization
//             </h2>

//             {utilization.map((emp) => (
//               <div key={emp.name} className="mb-3">
//                 <div className="flex justify-between text-sm">
//                   <span>{emp.name}</span>
//                   <span>{emp.billable_percent}%</span>
//                 </div>

//                 <div className="bg-sky-100 h-3 rounded">
//                   <div
//                     className="bg-sky-500 h-3 rounded"
//                     style={{ width: `${emp.billable_percent}%` }}
//                   />
//                 </div>
//               </div>
//             ))}
//           </div>

//           {/* REVENUE */}
//           <div className="bg-white p-6 rounded-xl shadow">
//             <h2 className="font-semibold mb-4 text-sky-900">
//               Revenue by Project
//             </h2>

//             <table className="w-full">
//               <thead>
//                 <tr className="bg-sky-100">
//                   <th className="p-2 text-left">Project</th>
//                   <th className="p-2 text-left">Revenue</th>
//                 </tr>
//               </thead>
//               <tbody>
//                 {revenue.map((r) => (
//                   <tr key={r.projectName} className="border-b">
//                     <td className="p-2">{r.projectName}</td>
//                     <td className="p-2">₹{r.revenue}</td>
//                   </tr>
//                 ))}
//               </tbody>
//             </table>
//           </div>

//           {/* BENCH */}
//           <div className="bg-white p-6 rounded-xl shadow">
//             <h2 className="font-semibold mb-4 text-sky-900">
//               Bench Employees
//             </h2>

//             {bench.length === 0 ? (
//               <p className="text-green-600">
//                 🎉 No Bench Employees — Fully Utilized!
//               </p>
//             ) : (
//               <ul>
//                 {bench.map((b) => (
//                   <li key={b.name} className="p-2 border-b">
//                     {b.name}
//                   </li>
//                 ))}
//               </ul>
//             )}
//           </div>
//         </>
//       )}
//     </div>
//   );
// }\
