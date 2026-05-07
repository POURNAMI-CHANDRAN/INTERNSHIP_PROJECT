// // src/components/Layout.tsx
// import React, { ReactNode, useState } from "react";
// import { Link, useLocation } from "react-router-dom";
// import { useAuth } from "../../auth/authContext";
// import Chatbot from "./Chatbot";

// import {
//   LayoutDashboard,
//   Users,
//   Building2,
//   Sparkles,
//   Briefcase,
//   FolderKanban,
//   FileText,
//   Calendar,
//   Clock,
//   DollarSign,
//   BarChart3,
//   Brain,
//   UserCog,
//   Bell,
//   User,
//   LogOut,
//   ChevronRight,
//   ChevronLeft,
// } from "lucide-react";

// interface LayoutProps {
//   children?: ReactNode;
// }

// export default function Layout({ children }: LayoutProps) {
//   const { user, logout } = useAuth();
//   const location = useLocation();

//   // ✅ ICON‑ONLY DEFAULT
//   const [expanded, setExpanded] = useState(false);

//   if (!user) return <div className="h-screen bg-neutral-50" />;

//   const navItems = [
//     { path: "/my-profile", label: "My Profile", icon: User, roles: ["Employee"] },
//     { path: "/dashboard", label: "Dashboard", icon: LayoutDashboard, roles: ["Admin", "Finance"] },
//     { path: "/segmentations", label: "Segmentations", icon: Building2, roles: ["Admin"] },
//     { path: "/resources", label: "Resources", icon: Users, roles: ["Admin", "Finance"] },
//     { path: "/skills", label: "Skills", icon: Sparkles, roles: ["Admin", "Finance"] },
//     { path: "/clients", label: "Clients", icon: Briefcase, roles: ["Admin"] },
//     { path: "/projects", label: "Projects", icon: FolderKanban, roles: ["Admin", "Finance"] },
//     { path: "/Equivalent", label: "Equivalent", icon: FileText, roles: ["Admin", "Finance", "Employee"] },
//     { path: "/resource-allocation", label: "Resource Allocation", icon: Calendar, roles: ["Admin", "Finance"] },
//     { path: "/timesheets", label: "Timesheets", icon: Clock, roles: ["Admin", "Finance", "Employee"] },
//     { path: "/billing", label: "Billing", icon: DollarSign, roles: ["Admin"] },
//     { path: "/reports", label: "Reports", icon: BarChart3, roles: ["Admin"] },
//     { path: "/ai-insights", label: "AI Insights", icon: Brain, roles: ["Admin"] },
//     { path: "/user-management", label: "User Management", icon: UserCog, roles: ["Admin"] },
//   ];

//   const allowedNavItems = navItems.filter(n => n.roles.includes(user.role));

//   return (
//     <>
//       <div className="flex h-screen bg-neutral-50 overflow-hidden">

//       {/* SIDEBAR (ICON RAIL) */}
//       <aside
//         className={`
//           ${expanded ? "w-60" : "w-16"}
//           bg-sky-200 text-sky-900
//           flex flex-col
//           transition-all duration-300
//           shadow-xl
//         `}
//       >
//         {/* TOGGLE */}
//         <button
//           onClick={() => setExpanded(!expanded)}
//           className="mx-auto mt-4 mb-4
//             w-8 h-8 bg-white rounded-full
//             flex items-center justify-center
//             shadow hover:scale-105 transition"
//         >
//           {expanded ? <ChevronLeft size={18} /> : <ChevronRight size={18} />}
//         </button>

//         {/* NAV (FIXED: scroll enabled) */}
//         <nav className="flex-1 overflow-y-auto flex flex-col gap-2 px-1">
//           {allowedNavItems.map(item => {
//             const Icon = item.icon;
//             const active = location.pathname.startsWith(item.path);

//             return (
//               <Link
//                 key={item.path}
//                 to={item.path}
//                 className={`
//                   w-full flex items-center
//                   h-12 rounded-lg
//                   ${expanded ? "px-4" : "justify-center"}
//                   transition-colors
//                   ${active ? "bg-white shadow-md" : "hover:bg-white/70"}
//                 `}
//               >
//                 <Icon
//                   size={22}
//                   className={`${active ? "text-sky-900" : "text-sky-700"}`}
//                 />

//                 {expanded && (
//                   <span className="ml-3 text-sm font-medium text-sky-900">
//                     {item.label}
//                   </span>
//                 )}
//               </Link>
//             );
//           })}
//         </nav>
//       </aside>

//         {/* MAIN */}
//         <div className="flex-1 flex flex-col overflow-hidden">

//           {/* HEADER */}
//           <header className="h-16 bg-white border-b border-neutral-200 flex items-center justify-between px-6">
//             <img src="/LOGO_COPY.png" className="h-10 object-contain" />

//             <div className="flex items-center gap-4">
//               <button className="p-2 bg-neutral-100 rounded-full hover:bg-neutral-200 transition">
//                 <Bell className="w-5 h-5" />
//               </button>

//               <button className="p-2 bg-neutral-100 rounded-full hover:bg-neutral-200 transition">
//                 <User className="w-5 h-5" />
//               </button>

//               <button
//                 onClick={logout}
//                 className="flex items-center gap-2 px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-lg text-sm"
//               >
//                 <LogOut size={16} />
//                 Logout
//               </button>
//             </div>
//           </header>

//           {/* CONTENT */}
//           <main className="flex-1 overflow-auto p-6">{children}</main>
//         </div>
//       </div>

//       <Chatbot />
//     </>
//   );
// }
import React, { useState, useEffect } from "react";
import { Link, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../../auth/authContext";
import Chatbot from "./Chatbot";
import { cn } from "./ui/utils";

import {
  LayoutDashboard,
  Users,
  Building2,
  Mail,
  Briefcase,
  FolderKanban,
  FileText,
  Clock,
  BookOpen,
  DollarSign,
  Brain,
  UserCog,
  Bell,
  User,
  LogOut,
  ChevronRight,
  Settings,
  Sparkles,
} from "lucide-react";

export default function Layout() {
  const { user, loading, logout } = useAuth();
  const location = useLocation();

  const [expanded, setExpanded] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  useEffect(() => {
    const closeMenus = () => {
      setShowNotifications(false);
      setShowProfileMenu(false);
    };
    window.addEventListener("click", closeMenus);
    return () => window.removeEventListener("click", closeMenus);
  }, []);

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-slate-500 font-medium animate-pulse">Initializing Workspace...</p>
        </div>
      </div>
    );
  }

  if (!user) {
  return (
    <div className="h-screen flex items-center justify-center">
      Loading User...
    </div>
  );
}

  const navGroups = [
    {
      group: "Overview",
      items: [
        { path: "/dashboard", label: "Dashboard", icon: LayoutDashboard, roles: ["Admin", "Finance"] },
        { path: "/ai-insights", label: "AI Insights", icon: Brain, roles: ["Admin"] },
      ],
    },
    {
      group: "Management",
      items: [
        { path: "/projects", label: "Projects", icon: FolderKanban, roles: ["Admin", "Finance"] },
        { path: "/resources/portfolio", label: "Resources", icon: Users, roles: ["Admin", "Finance"] },
        { path: "/clients", label: "Clients", icon: Briefcase, roles: ["Admin"] },
      ],
    },
    {
      group: "Operations",
      items: [
        // { path: "/timesheets", label: "Timesheets", icon: Clock, roles: ["Admin", "Finance", "Employee"] },
        { path: "/reports", label: "Reports", icon: FileText, roles: ["Admin", "Finance", "Employee"] },
        { path: "/billing", label: "Billing", icon: DollarSign, roles: ["Admin"] },
        { path: "/Equivalent", label: "Equivalents", icon: BookOpen, roles: ["Admin", "Finance", "Employee"] },
      ],
    },
    {
      group: "Settings",
      items: [
        { path: "/user-management", label: "Users", icon: UserCog, roles: ["Admin"] },
        { path: "/segmentations", label: "Org Config", icon: Building2, roles: ["Admin"] },
        { path: "/skills", label: "Competencies", icon: Sparkles, roles: ["Admin"] },
      ],
    },
  ];

  const isActive = (path: string) => location.pathname === path || location.pathname.startsWith(path + "/");

  return (
<div className="flex h-screen bg-[#F8FAFC] overflow-hidden text-slate-900 font-sans">
  {/* ================= SIDEBAR ================= */}
  <aside
    className={cn(
      "relative flex flex-col bg-white border-r border-slate-200 transition-all duration-300 ease-in-out shrink-0 z-40",
      expanded ? "w-64" : "w-20"
    )}
  >
    {/* TOGGLE BUTTON */}
    <button
      onClick={() => setExpanded(!expanded)}
      className="absolute -right-3 top-10 w-6 h-6 rounded-full bg-white shadow-md flex items-center justify-center border border-slate-200 hover:bg-slate-50 transition-all z-50"
    >
      <ChevronRight 
        size={14} 
        className={cn("text-slate-600 transition-transform duration-300", expanded && "rotate-180")} 
      />
    </button>

    {/* NAVIGATION CONTAINER */}
    <nav className="flex-1 flex flex-col min-h-0">
      <div 
        className="flex-1 overflow-y-auto py-6 px-3 space-y-6 select-none"
        style={{ 
          msOverflowStyle: 'none',  
          scrollbarWidth: 'none',   
        }}
      >
        {/* CSS to hide webkit scrollbars */}
        <style dangerouslySetInnerHTML={{__html: `
          div::-webkit-scrollbar { display: none; }
        `}} />

        {navGroups.map((group, idx) => (
          <div key={idx} className="space-y-2">
            {expanded ? (
              <p className="px-3 text-[10px] uppercase tracking-widest text-sky-600 font-bold">
                {group.group}
              </p>
            ) : (
              <div className="mx-auto w-6 h-px bg-slate-100" />
            )}

            <div className="space-y-1">
              {group.items
                .filter((item) => item.roles.includes(user?.role || ""))
                .map((item) => {
                  const Icon = item.icon;
                  const active = isActive(item.path);

                  return (
                    <Link
                      key={item.path}
                      to={item.path}
                      title={!expanded ? item.label : ""}
                      className={cn(
                        "h-10 rounded-lg flex items-center transition-all duration-200 group relative",
                        expanded ? "px-3" : "justify-center",
                        active 
                          ? "bg-sky-50 text-sky-900 font-semibold" 
                          : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                      )}
                    >
                      <Icon 
                        size={20} 
                        className={cn(
                          "shrink-0 transition-colors", 
                          active ? "text-sky-800" : "text-sky-800 group-hover:text-sky-600"
                        )} 
                      />
                      
                      {expanded && (
                        <span className="ml-3 text-sm truncate">
                          {item.label}
                        </span>
                      )}

                      {/* ACTIVE INDICATOR */}
                      {active && (
                        <div className="absolute left-0 top-2 bottom-2 w-1 rounded-r-full bg-sky-600" />
                      )}
                    </Link>
                  );
                })}
            </div>
          </div>
        ))}
      </div>

      {/* FOOTER - LOGOUT (STAYS AT BOTTOM) */}
      <div className="p-3 border-t border-slate-100">
        <button
          onClick={logout}
          className={cn(
            "w-full h-10 rounded-lg flex items-center text-sky-500 hover:bg-sky-50 transition-colors group",
            expanded ? "px-3 gap-3" : "justify-center"
          )}
        >
          <LogOut size={20} className="shrink-0 group-hover:scale-110 transition-transform" />
          {expanded && <span className="text-sm font-medium">Logout</span>}
        </button>
      </div>
    </nav>
  </aside>

      {/* ================= MAIN CONTENT ================= */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        
        {/* HEADER */}
        <header className="h-20 bg-white border-b border-slate-200 px-8 flex items-center justify-between shrink-0 z-30">
          <div className="flex items-center gap-4">
            <img src="/LOGO_COPY.png" alt="Logo" className="h-20 w-auto object-contain" />
            <div className="h-6 w-px bg-slate-200 mx-2 hidden md:block" />
            <h1 className="text-sky-900 font-medium text-sm hidden md:block capitalize">
              {location.pathname
              .split("/")
              .pop()
              ?.replace(/-/g, " ")
              .toUpperCase() || "DASHBOARD"}
            </h1>
          </div>

          <div className="flex items-center gap-3">
            {/* NOTIFICATIONS */}
            <div className="relative" onClick={(e) => e.stopPropagation()}>
              <button
                onClick={() => {
                  setShowNotifications(!showNotifications);
                  setShowProfileMenu(false);
                }}
                className={cn(
                  "w-10 h-10 rounded-full border border-slate-200 flex items-center justify-center relative transition-all hover:bg-slate-50",
                  showNotifications && "bg-slate-50 ring-2 ring-sky-100"
                )}
              >
                <Bell size={18} className="text-slate-600" />
                <span className="absolute top-2.5 right-2.5 h-2 w-2 bg-sky-500 border-2 border-white rounded-full" />
              </button>

              {showNotifications && (
                <div className="absolute right-0 mt-3 w-80 bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden z-50 animate-in fade-in slide-in-from-top-2">
                  <div className="px-5 py-4 border-b border-slate-100 flex justify-between items-center">
                    <span className="font-bold text-slate-800">Notifications</span>
                    <span className="text-[10px] bg-sky-100 text-sky-700 px-2 py-0.5 rounded-full font-bold">NEW</span>
                  </div>
                  <div className="p-8 text-center">
                    <div className="bg-slate-50 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3">
                        <Bell size={20} className="text-slate-300" />
                    </div>
                    <p className="text-sm text-slate-500">No new alerts today.</p>
                  </div>
                </div>
              )}
            </div>

            {/* PROFILE MENU */}
            <div className="relative" onClick={(e) => e.stopPropagation()}>
              <button
                onClick={() => {
                  setShowProfileMenu(!showProfileMenu);
                  setShowNotifications(false);
                }}
                className="flex items-center gap-3 p-1 pr-3 rounded-full bg-slate-50 border border-slate-200 hover:border-sky-200 transition-all"
              >
                <div className="h-8 w-8 rounded-full bg-sky-600 flex items-center justify-center text-white text-xs font-bold shadow-sm">
                  {user?.email?.charAt(0)?.toUpperCase() || "U"}
                </div>
                <div className="hidden lg:block text-left">
                  <p className="text-xs font-bold text-slate-800 leading-tight">
                    {user?.email?.split("@")[0] || "User"}
                  </p>
                  <p className="text-[10px] text-sky-600 font-bold uppercase tracking-tighter">
                    {user.role}
                  </p>
                </div>
              </button>

              {showProfileMenu && (
                <div className="absolute right-0 mt-3 w-64 bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden z-50 animate-in fade-in slide-in-from-top-2">
                  <div className="p-5 bg-gradient-to-br from-sky-200 to-sky-200 text-fuchsia-950">
                    <div className="flex items-center gap-3 mb-3">
                        <div className="h-10 w-10 rounded-lg bg-white/20 backdrop-blur-md flex items-center justify-center">
                             <Mail size={18} />
                        </div>
                        <div className="overflow-hidden">
                            <p className="text-xs font-bold opacity-80 text-emerald-900 uppercase tracking-wider">Account</p>
                            <p className="text-sm font-bold truncate text-emerald-900">{user?.email || "No Email"}</p>
                        </div>
                    </div>
                    <div className="inline-flex items-center px-2 py-0.5 rounded-md bg-white/20 text-[10px] font-bold uppercase">
                        {user.role}
                    </div>
                  </div>

                  <div className="p-2">
                    <Link
                      to="/my-profile"
                      className="flex items-center gap-3 h-10 px-3 rounded-lg hover:bg-slate-50 text-slate-700 text-sm font-medium transition-colors"
                    >
                      <User size={16} className="text-slate-700" />
                      My Profile
                    </Link>
                    <button className="w-full flex items-center gap-3 h-10 px-3 rounded-lg hover:bg-slate-50 text-slate-700 text-sm font-medium transition-colors">
                        <Settings size={16} className="text-slate-700" />
                        Account Settings
                    </button>
                    <div className="my-1 border-t border-slate-100" />
                    <button
                      onClick={logout}
                      className="w-full flex items-center gap-3 h-10 px-3 rounded-lg hover:bg-indigo-50 text-indigo-900 text-sm font-medium transition-colors"
                    >
                      <LogOut size={16} />
                      Logout
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* PAGE CONTENT */}
        <main className="flex-1 overflow-y-auto bg-[#F8FAFC]">
          <div className="max-w-7xl mx-auto p-8">
            <Outlet />
          </div>
        </main>
      </div>

      <Chatbot />
    </div>
  );
}