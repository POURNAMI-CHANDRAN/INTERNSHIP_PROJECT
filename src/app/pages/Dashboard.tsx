import React, { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Clock, Sparkles, Calendar, Download, Zap, TrendingUp,
  DollarSign, Users, ArrowUpRight, ArrowDownRight, Filter,
  MoreVertical, Info, LayoutDashboard, Target
} from "lucide-react";

import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip,
  PieChart, Pie, Cell, BarChart, Bar, Legend, CartesianGrid,
} from "recharts";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { Badge } from "../components/ui/badge";
import { useAnalytics } from "../../hooks/useAnalytics";

/* ================= THEME & CONSTANTS ================= */

const BRAND_COLORS = ["#0ea5e9", "#6366f1", "#8b5cf6", "#ec4899", "#f43f5e"];
const THEME = {
  primary: "hsl(var(--primary))",
  grid: "rgba(148, 163, 184, 0.1)",
  tooltip: {
    bg: "rgba(255, 255, 255, 0.95)",
    border: "#e2e8f0"
  }
};

const formatLakh = (n: number) => `₹${(n / 100000).toFixed(2)}L`;
const formatINR = (n: number) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumSignificantDigits: 3 }).format(n);

/* ================= MAIN DASHBOARD ================= */

export default function PremiumDashboard() {
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const year = new Date().getFullYear();
  const { loading, error, utilization = [], bench = [], revenue = [], suggestions = [] } = useAnalytics(month, year);

  // Advanced Data Processing
  const stats = useMemo(() => {
    const total = utilization.length || 0;
    const billable = utilization.filter(u => (u.allocatedHours || 0) > 0).length;
    const avgUtil = total ? Math.round(utilization.reduce((acc, u) => acc + (u.utilizationPct || 0), 0) / total) : 0;
    const totalRevenue = revenue.reduce((acc, r) => acc + (r.revenue || 0), 0);
    
    // Mock growth logic (In production, compare with prev month data)
    return {
      total,
      billable,
      bench: bench.length,
      avgUtil,
      totalRevenue,
      revenueGrowth: "+12.5%", 
      utilTrend: avgUtil > 70 ? "up" : "down"
    };
  }, [utilization, bench, revenue]);

  if (loading) return <LoadingScreen />;
  if (error) return <ErrorState message={error} />;

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-900 font-sans selection:bg-sky-100">
      {/* SIDEBAR/TOP NAV BLEND */}
      <div className="max-w-[1600px] mx-auto p-4 md:p-8 space-y-8">
        
        <DashboardHeader month={month} setMonth={setMonth} />

        {/* TOP LEVEL KPI STRIP */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <KPICard 
            title="Total Workforce" 
            value={stats.total} 
            icon={<Users className="w-5 h-5" />} 
            trend="+2 this month"
          />
          <KPICard 
            title="Resource Utilization" 
            value={`${stats.avgUtil}%`} 
            icon={<Target className="w-5 h-5" />} 
            status={stats.avgUtil > 75 ? "success" : "warning"}
            trend={stats.utilTrend === "up" ? "Above Target" : "Below Target"}
          />
          <KPICard 
            title="Bench Strength" 
            value={stats.bench} 
            icon={<Clock className="w-5 h-5" />} 
            status={stats.bench > 5 ? "danger" : "neutral"}
            trend={stats.bench > 5 ? "Action Required" : "Stable"}
          />
          <KPICard 
            title="Monthly Revenue" 
            value={formatLakh(stats.totalRevenue)} 
            icon={<DollarSign className="w-5 h-5" />} 
            trend={stats.revenueGrowth}
            trendUp
          />
        </div>

        {/* MAIN ANALYTICS GRID */}
        <div className="grid grid-cols-12 gap-6">
          
          {/* Revenue Area Chart - High Visibility */}
          <Card className="col-span-12 lg:col-span-8 border-none shadow-sm bg-white overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-lg font-bold">Revenue Performance</CardTitle>
                <CardDescription>Year-to-date monthly breakdown</CardDescription>
              </div>
              <Button variant="outline" size="sm"><Filter className="w-4 h-4 mr-2"/> Filter</Button>
            </CardHeader>
            <CardContent className="h-[350px] pl-0">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={revenue}>
                  <defs>
                    <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={THEME.primary} stopOpacity={0.3}/>
                      <stop offset="95%" stopColor={THEME.primary} stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={THEME.grid} />
                  <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} />
                  <YAxis axisLine={false} tickLine={false} tickFormatter={formatLakh} tick={{fill: '#94a3b8', fontSize: 12}} />
                  <Tooltip content={<CustomTooltip />} />
                  <Area type="monotone" dataKey="revenue" stroke={THEME.primary} strokeWidth={3} fillOpacity={1} fill="url(#colorRev)" />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Allocation Pie Chart */}
          <Card className="col-span-12 lg:col-span-4 border-none shadow-sm bg-white">
            <CardHeader>
              <CardTitle className="text-lg font-bold">Billing Mix</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col items-center">
              <div className="h-[250px] w-full">
                <ResponsiveContainer>
                  <PieChart>
                    <Pie 
                      data={[{name: 'Billable', value: stats.billable}, {name: 'Non-Billable', value: stats.total - stats.billable}]} 
                      innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value"
                    >
                      <Cell fill={BRAND_COLORS[0]} />
                      <Cell fill="#f1f5f9" />
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="w-full space-y-2 mt-4">
                <div className="flex justify-between text-sm">
                  <span className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-sky-500"/> Billable</span>
                  <span className="font-bold">{Math.round((stats.billable/stats.total)*100)}%</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-slate-200"/> Bench/Ops</span>
                  <span className="font-bold">{100 - Math.round((stats.billable/stats.total)*100)}%</span>
                </div>
              </div>
            </CardContent>
          </Card>

        </div>
      </div>
    </div>
  );
}

/* ================= SUB-COMPONENTS ================= */

function KPICard({ title, value, icon, trend, status, trendUp }: any) {
  const statusColors = {
    success: "text-emerald-600 bg-emerald-50",
    danger: "text-rose-600 bg-rose-50",
    warning: "text-amber-600 bg-amber-50",
    neutral: "text-slate-600 bg-slate-50"
  };

  return (
    <Card className="border-none shadow-sm hover:shadow-md transition-shadow duration-200 overflow-hidden group">
      <CardContent className="p-6">
        <div className="flex justify-between items-start mb-4">
          <div className={`p-3 rounded-2xl transition-colors ${status ? statusColors[status as keyof typeof statusColors] : "bg-sky-50 text-sky-600"}`}>
            {icon}
          </div>
          <button className="text-slate-300 hover:text-slate-600"><MoreVertical className="w-4 h-4"/></button>
        </div>
        <p className="text-sm font-medium text-slate-500 mb-1">{title}</p>
        <div className="flex items-baseline gap-2">
          <h2 className="text-3xl font-bold tracking-tight text-slate-900">{value}</h2>
          {trend && (
            <span className={`text-xs font-bold px-2 py-1 rounded-full ${trendUp ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'}`}>
              {trend}
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function DashboardHeader({ month, setMonth }: any) {
  const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  
  return (
    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
      <div>
        <div className="flex items-center gap-2 mb-1">
          <LayoutDashboard className="w-5 h-5 text-sky-600" />
          <span className="text-xs font-bold uppercase tracking-widest text-slate-400">Management Portal</span>
        </div>
        <h1 className="text-4xl font-extrabold tracking-tight text-slate-900">Executive <span className="text-sky-600">Overview</span></h1>
      </div>

      <div className="flex items-center gap-3 bg-white p-2 rounded-2xl shadow-sm border border-slate-100">
        <div className="flex items-center gap-2 px-3 border-r border-slate-100">
          <Calendar className="w-4 h-4 text-slate-400" />
          <Select value={String(month)} onValueChange={v => setMonth(Number(v))}>
            <SelectTrigger className="w-[110px] border-none shadow-none focus:ring-0 font-medium">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {months.map((m, i) => (
                <SelectItem key={m} value={String(i + 1)}>{m}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Button variant="ghost" size="icon" className="rounded-xl"><Download className="w-4 h-4" /></Button>
      </div>
    </div>
  );
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white p-4 shadow-xl border border-slate-100 rounded-xl">
        <p className="text-xs font-bold text-slate-400 mb-1 uppercase tracking-tighter">{label}</p>
        <p className="text-lg font-bold text-slate-900">{formatINR(payload[0].value)}</p>
        <div className="flex items-center gap-1 text-emerald-500 text-xs font-bold mt-1">
          <ArrowUpRight className="w-3 h-3" /> Growth: 4.2%
        </div>
      </div>
    );
  }
  return null;
};

function LoadingScreen() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen gap-4">
      <div className="relative w-16 h-16">
        <div className="absolute inset-0 border-4 border-sky-100 rounded-full" />
        <div className="absolute inset-0 border-4 border-sky-600 rounded-full border-t-transparent animate-spin" />
      </div>
      <p className="text-slate-500 font-medium animate-pulse">Syncing real-time intelligence...</p>
    </div>
  );
}

function ErrorState({ message }: { message: string }) {
  return (
    <div className="p-10 flex items-center justify-center">
      <div className="bg-rose-50 border border-rose-100 p-6 rounded-2xl text-center max-w-md">
        <div className="bg-rose-100 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4">
          <Info className="text-rose-600" />
        </div>
        <h3 className="text-rose-900 font-bold mb-2">Data Fetching Failed</h3>
        <p className="text-rose-700 text-sm">{message}</p>
        <Button className="mt-4 bg-rose-600 hover:bg-rose-700 text-white" onClick={() => window.location.reload()}>Retry Connection</Button>
      </div>
    </div>
  );
}