

import React, { useMemo, useState } from "react";
import {
  Plus, Clock, DollarSign, Users, Building2, Briefcase,
  TrendingUp, UserX, MapPin, ChevronRight, UserCheck,
  Zap, Search, Filter, ArrowUpRight, Target, Globe, 
  Award, Activity, LayoutGrid, ChevronDown, MoreHorizontal,
  ArrowDownRight
} from "lucide-react";

import { useResourceData } from "../../hooks/useResourceData";
import { useAnalytics } from "../../hooks/useAnalytics";
import { CreateEmployeeModal } from "../components/Employees";
import { KpiCard } from "../components/KPICard";
import { cn } from "../components/ui/utils";

/* ================= TYPES & UTILS ================= */
type BaseEntity = {
  _id: string;
  name: string;
};

type Employee = {
  _id: string;
  roleId?: string | BaseEntity;
  primaryWorkCategoryId?: string | BaseEntity;
  name: string;
  allocations?: { allocatedHours?: number }[];
  skills?: { name?: string }[];
  status?: string;
  location?: string;
  joiningDate?: string;
};

function resolveName<T extends BaseEntity>(
  value: string | T | undefined,
  list: T[]
): string {
  if (value && typeof value === "object") {
    return value.name;
  }

  const match = list.find(
    (item) => String(item._id) === String(value)
  );

  return match?.name ?? "Unassigned";
}

type FeatureMap = Record<string, Employee[]>;

const groupBy = <T,>(list: T[], keyFn: (e: T) => string): Record<string, T[]> => {
  return list.reduce((acc: Record<string, T[]>, item) => {
    const key = keyFn(item);
    if (!acc[key]) acc[key] = [];
    acc[key].push(item);
    return acc;
  }, {});
};

/* ================= MAIN COMPONENT ================= */

export default function EmployeesPage() {
  const { employees, roles, workCategories, projects, loading, refetchEmployees } = useResourceData(0, 0);
  const [showCreate, setShowCreate] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  /* ================= DATA INTELLIGENCE ================= */
  const enrichedData = useMemo(() => {
    const processed = employees.map((emp: Employee) => {
      const totalHours = (emp.allocations || []).reduce((sum: number, a: any) => sum + (a.allocatedHours || 0), 0);
      const util = Math.round((totalHours / 160) * 100);
      let utilizationBucket = "Optimal";

      if (util >= 100) utilizationBucket = "Overloaded";
      else if (util >= 80) utilizationBucket = "Fully Utilized";
      else if (util >= 60) utilizationBucket = "Balanced";
      else utilizationBucket = "Available";

      let healthBucket = "Healthy";

      if (util >= 120) healthBucket = "Burnout Risk";
      else if (util >= 100) healthBucket = "Stressed";
      else if (util < 40) healthBucket = "Underutilized";

      return {
        ...emp,
        utilization: util,
        utilizationBucket, healthBucket,
        experienceYears: emp.joiningDate ? Math.floor((Date.now() - new Date(emp.joiningDate).getTime()) / 31536000000) : 0,
      };
    });

    const filtered = processed.filter((e: Employee) => 
      e.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
    
    return {
      all: filtered,
      byRole: groupBy(filtered, (e) => resolveName(e.roleId, roles)),
      byWC: groupBy(filtered, (e) => resolveName(e.primaryWorkCategoryId, workCategories)),
      byLoc: groupBy(filtered, e => e.location || "Remote"),
      byUtil: groupBy(filtered, e => e.utilizationBucket),
      byHealth: groupBy(filtered, e => e.healthBucket),
      bySkill: filtered.reduce((acc: any, e: Employee) => {
        (e.skills || []).forEach((s: any) => {
          const key = s.name || s;
          if (!acc[key]) acc[key] = [];
          acc[key].push(e);
        });
        return acc;
      }, {})
    };
  }, [employees, roles, workCategories, searchQuery]);

  /* ================= CALCULATIONS ================= */
  const metrics = useMemo(() => ({
    total: employees.length,
    active: employees.filter((e) => e.status === "Active").length,
    inactive: employees.filter((e) => e.status === "Inactive").length,
    roles: roles.length,
    projects: projects.length,
  }), [employees, roles, projects]);


  if (loading) return <LoadingSkeleton />;

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 font-sans selection:bg-sky-100">
      {/* GLASSMORPHISM NAV */}
      <nav className="bg-white/80 backdrop-blur-md border-b border-slate-200 top-0 z-40 px-8 py-3">
        <div className="max-w-[1600px] mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="bg-sky-900 p-2.5 rounded-xl shadow-lg shadow-slate-200">
              <LayoutGrid className="text-white" size={18} />
            </div>
            <div>
              <h1 className="text-md font-bold tracking-tight text-slate-800">Workforce Intelligence</h1>
              <div className="flex items-center gap-2">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">v4.2.0 • Live</p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="relative group hidden md:block">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-sky-500 transition-colors" size={14} />
              <input 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search talent or skills..." 
                className="pl-9 pr-4 py-2 bg-slate-100 border-transparent border focus:bg-white focus:border-sky-200 rounded-xl text-sm w-72 transition-all outline-none"
              />
            </div>
            <button
              onClick={() => setShowCreate(true)}
              className="flex items-center gap-2 px-5 py-2.5 bg-sky-600 hover:bg-sky-700 text-white text-sm font-bold rounded-xl transition-all shadow-md shadow-sky-200 active:scale-95"
            >
              <Plus size={16} strokeWidth={3} />
              Add Talent
            </button>
          </div>
        </div>
      </nav>

      <main className="max-w-[1600px] mx-auto px-8 py-10 space-y-8">
        
        {/* ================= TOP METRICS (Ultra Compact) ================= */}
        <div className="grid grid-cols-5 gap-4">
          <MetricTile icon={<Users size={16} />} label="Total" value={metrics.total} color="violet" />
          <MetricTile icon={<UserCheck size={16} />} label="Active" value={metrics.active} color="emerald" />
          <MetricTile icon={<UserX size={16} />} label="Inactive" value={metrics.inactive} color="rose" />
          <MetricTile icon={<Building2 size={16} />} label="Depts" value={metrics.roles} color="blue" />
          <MetricTile icon={<Briefcase size={16} />} label="Projects" value={metrics.projects} color="amber" />
        </div>

        {/* DATA EXPLORER GRID */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <FeatureAccordion title="Roles" data={enrichedData.byRole} icon={<Building2 size={16}/>} />
          <FeatureAccordion title="Global Network" data={enrichedData.byLoc} icon={<Globe size={16}/>} />
          <FeatureAccordion title="Utilization Heatmap" data={enrichedData.byUtil} icon={<Activity size={16}/>} accent="rose" />
          <FeatureAccordion title="Skill Repository" data={enrichedData.bySkill} icon={<Award size={16}/>} />
          <FeatureAccordion title="Workforce Health" data={enrichedData.byHealth} icon={<Zap size={16}/>} accent="amber"/>          
          <FeatureAccordion title="Portfolio Mix" data={enrichedData.byWC} icon={<Briefcase size={16}/>} />
        </div>
      </main>

      {showCreate && (
        <CreateEmployeeModal
          roles={roles}
          onClose={() => setShowCreate(false)}
          onSuccess={async () => { await refetchEmployees(); setShowCreate(false); }}
        />
      )}
    </div>
  );
}

/* ================= UPGRADED COMPONENTS ================= */

function KpiBox({ label, value, sub, icon, color, trend, isNegative }: any) {
  const colors: any = {
    sky: "bg-sky-600 shadow-sky-100",
    rose: "bg-rose-500 shadow-rose-100",
    emerald: "bg-emerald-500 shadow-emerald-100",
    blue: "bg-blue-500 shadow-blue-100",
  };

  return (
    <div className="bg-white border border-slate-200 p-6 rounded-2xl hover:border-sky-300 hover:shadow-xl transition-all duration-300 group">
      <div className="flex justify-between items-start mb-4">
        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{label}</span>
        <div className={cn("p-2.5 rounded-xl text-white shadow-lg", colors[color])}>{icon}</div>
      </div>
      <div className="space-y-1">
        <h2 className="text-3xl font-black tracking-tight text-slate-800">{value}</h2>
        <div className="flex items-center gap-2">
          {trend && (
            <span className={cn(
              "flex items-center text-[10px] font-bold px-1.5 py-0.5 rounded",
              isNegative ? "bg-rose-50 text-rose-600" : "bg-emerald-50 text-emerald-600"
            )}>
              {isNegative ? <ArrowDownRight size={10} /> : <ArrowUpRight size={10} />} {trend}
            </span>
          )}
          <span className="text-xs text-slate-400 font-medium">{sub}</span>
        </div>
      </div>
    </div>
  );
}

function FeatureAccordion({ title, data, icon, accent = "sky" }: any) {
  const [isOpen, setIsOpen] = useState(true);
  const sortedEntries = Object.entries(data).sort((a: any, b: any) => b[1].length - a[1].length);
  const totalCount = Object.values(data).reduce((acc: number, list: any) => acc + list.length, 0);

  return (
    <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-6 py-5 hover:bg-slate-50/50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="text-sky-900 p-2 bg-sky-50 rounded-lg group-hover:text-sky-500 transition-colors">{icon}</div>
          <span className="text-sm font-bold text-slate-700">{title}</span>
          <span className="ml-2 px-2 py-0.5 bg-slate-100 text-[10px] font-black text-slate-500 rounded-full">{totalCount}</span>
        </div>
        <ChevronDown className={cn("text-slate-300 transition-transform duration-300", !isOpen && "-rotate-90")} size={18} />
      </button>

      {isOpen && (
        <div className="px-3 pb-4 space-y-1 animate-in fade-in slide-in-from-top-2 duration-300">
          {sortedEntries.length > 0 ? (
            sortedEntries.map(([key, list]: any) => (
              <AccordionItem key={key} label={key} list={list} accent={accent} />
            ))
          ) : (
            <div className="py-8 text-center text-slate-400 text-xs font-medium italic">No Matches Found</div>
          )}
        </div>
      )}
    </div>
  );
}

function AccordionItem({ label, list, accent }: any) {
  const [expanded, setExpanded] = useState(false);
  
  return (
    <div className="rounded-xl hover:bg-slate-50 transition-all border border-transparent hover:border-slate-100">
      <div 
        className="flex items-center justify-between p-3.5 cursor-pointer group"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center gap-3">
          <div className={cn(
            "h-2 w-2 rounded-full shadow-sm", 
            accent === "rose" ? "bg-rose-500 shadow-rose-200" : "bg-sky-500 shadow-sky-200"
          )} />
          <span className="text-[13px] font-semibold text-slate-600 group-hover:text-slate-900 transition-colors">{label}</span>
        </div>
        <div className="flex items-center gap-3">
            <span className="text-[11px] font-black text-slate-300 group-hover:text-slate-500 transition-colors">{list.length}</span>
            <ChevronRight size={14} className={cn("text-slate-300 transition-transform duration-300", expanded && "rotate-90")} />
        </div>
      </div>

      {expanded && (
        <div className="px-4 pb-4 pt-1 flex flex-wrap gap-2 animate-in fade-in zoom-in-95 duration-200">
          {list.map((emp: any) => (
            <div 
              key={emp._id}
              className="group/tag px-3 py-1.5 bg-white border border-slate-200 text-[11px] font-bold text-slate-500 rounded-lg hover:border-sky-300 hover:text-sky-600 hover:shadow-sm transition-all cursor-default flex items-center gap-2"
            >
              <div className="h-1.5 w-1.5 rounded-full bg-emerald-400 group-hover/tag:animate-pulse" />
              {emp.name}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div className="min-h-screen bg-slate-50 p-8 space-y-8">
      <div className="h-12 bg-white rounded-2xl w-full animate-pulse border border-slate-100" />
      <div className="grid grid-cols-4 gap-6">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="h-32 bg-white rounded-2xl animate-pulse border border-slate-100" />
        ))}
      </div>
      <div className="grid grid-cols-3 gap-6">
        {[1, 2, 3, 4, 5, 6].map(i => (
          <div key={i} className="h-64 bg-white rounded-2xl animate-pulse border border-slate-100" />
        ))}
      </div>
    </div>
  );
}



/* ================= COMPACT METRIC TILE ================= */
function MetricTile({ icon, label, value, color }: { icon: any, label: string, value: number, color: string }) {
  const colors: Record<string, string> = {
    violet: "bg-violet-100 text-violet-600",
    emerald: "bg-emerald-100 text-emerald-600",
    rose: "bg-rose-100 text-rose-600",
    blue: "bg-blue-100 text-blue-600",
    amber: "bg-amber-100 text-amber-600",
  };

  return (
    <div className="flex items-center gap-3 p-3 rounded-xl border border-zinc-100 bg-white shadow-sm">
      <div className={cn("p-2 rounded-lg", colors[color])}>{icon}</div>
      <div>
        <p className="text-[10px] font-bold uppercase text-zinc-400 leading-none mb-1">{label}</p>
        <p className="text-lg font-black text-zinc-900 leading-none">{value}</p>
      </div>
    </div>
  );
}