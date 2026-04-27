import { Outlet, Link, useLocation } from "react-router-dom";
import { 
  LayoutGrid, 
  Calendar, 
  Users, 
  Briefcase, 
  ChevronRight,
  TrendingUp,
  Settings2,
  Info
} from "lucide-react";
import { cn } from "./ui/utils";

export default function ResourcesLayout() {
  const location = useLocation();

  const navItems = [
    { path: "/resources/employees", label: "Manage Team", icon: Users },
    { path: "/resources/portfolio", label: "Portfolio", icon: LayoutGrid },
    { path: "/resources/heatmap", label: "Utilization", icon: Calendar },
    { path: "/resources/workload", label: "Workload", icon: Briefcase },
  ];

  const isActive = (path: string) =>
    location.pathname === path ||
    location.pathname.startsWith(path + "/");

  return (
    // Standard sans-serif stack, white background
    <div className="h-full flex flex-col bg-white font-sans antialiased text-slate-900">
      
      {/* ===== SKY BLUE & WHITE HEADER ===== */}
      <header className="relative z-10 bg-white border-b border-sky-100 px-8 shadow-sm">
        <div className="flex items-center justify-between h-20 max-w-[1600px] mx-auto">
          
          {/* Brand Section */}
          <div className="flex items-center gap-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-sky-500 text-white shadow-md shadow-sky-200">
              <Briefcase size={22} />
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold tracking-tight text-slate-800">Resource Hub</h1>
              </div>
              <p className="text-xs text-slate-500 font-medium">Enterprise Resource Planning</p>
            </div>
          </div>

          {/* ✅ UPDATED SKY BLUE NAV TABS */}
          <nav className="hidden lg:flex items-center bg-sky-50/50 p-1.5 rounded-xl border border-sky-100">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.path);

              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={cn(
                    "flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-semibold transition-all duration-200",
                    active 
                      ? "bg-white text-sky-600 shadow-sm ring-1 ring-sky-100" 
                      : "text-slate-500 hover:text-sky-600 hover:bg-white/50"
                  )}
                >
                  <Icon size={16} className={active ? "text-sky-500" : "text-slate-400"} />
                  {item.label}
                </Link>
              );
            })}
          </nav>

          {/* Action Buttons */}
          <div className="flex items-center gap-3">
            <button className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-sky-600 hover:bg-sky-50 rounded-lg transition-colors">
              <Info size={16} />
              Help
            </button>
            <div className="h-6 w-[1px] bg-slate-200 mx-1" />
            <button className="p-2 rounded-full text-slate-400 hover:text-sky-600 hover:bg-sky-50 transition-all">
              <Settings2 size={20} />
            </button>
            <div className="h-9 w-9 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-xs font-bold text-slate-600 cursor-pointer hover:ring-2 hover:ring-sky-100 transition-all">
              RH
            </div>
          </div>
        </div>
      </header>

      {/* ===== MAIN CONTENT AREA ===== */}
      <main className="flex-1 overflow-auto bg-slate-50/30">
        <div className="max-w-[1600px] mx-auto p-8">
          
          {/* Breadcrumb path indicator */}
          <div className="flex items-center gap-2 mb-6 text-xs font-semibold text-slate-400 uppercase tracking-widest">
            <span>Resources</span>
            <ChevronRight size={12} />
            <span className="text-sky-600">
              {navItems.find(n => isActive(n.path))?.label || "Overview"}
            </span>
          </div>

          {/* Outlet for Sub-pages */}
          <div className="min-h-[calc(100vh-200px)]">
            <Outlet />
          </div>
        </div>
      </main>
    </div>
  );
}