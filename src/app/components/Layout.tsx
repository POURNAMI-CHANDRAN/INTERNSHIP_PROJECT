import React, { useState, useEffect } from "react";
import { Link, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../../auth/authContext";
import { cn } from "./ui/utils";
import axios from "axios";
import { socket } from "../../Socket";

import {
  LayoutDashboard,
  Users,
  Building2,
  Mail,
  Briefcase,
  FolderKanban,
  FileText,
  Clock,
  ChevronDown,
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

  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    const closeMenus = () => {
      setShowNotifications(false);
      setShowProfileMenu(false);
    };
    window.addEventListener("click", closeMenus);
    return () => window.removeEventListener("click", closeMenus);
  }, []);

  useEffect(() => {
  loadNotifications();

  socket.on("new_notification", (data) => {
    console.log("LIVE NOTIFICATION : ", data);

    setNotifications((prev) => [
      data,
      ...prev,
    ]);

    setUnreadCount((prev) => prev + 1);
  });

  return () => {
    socket.off("new_notification");
  };
}, []);

  const loadNotifications = async () => {
    try {
      const res = await axios.get("http://localhost:5000/api/notify");

      setNotifications(res.data.data);

      const unread = res.data.data.filter((n: any) => !n.read).length;

      setUnreadCount(unread);
    } catch (err) {
      console.log(err);
    }
  };

  const markAsRead = async (id: string) => {
    try {
      await axios.put(`http://localhost:5000/api/notify/${id}/read`);

      setNotifications((prev) =>
        prev.map((n) =>
          n._id === id
            ? { ...n, read: true }
            : n
        )
      );

      setUnreadCount((prev) =>
        prev > 0 ? prev - 1 : 0
      );
    } catch (err) {
      console.log(err);
    }
  };

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
        { path: "/bench", label: "Bench", icon: BookOpen, roles: ["Admin", "Finance", "Employee"] },
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
      className="absolute -right-3 top-4 w-6 h-6 rounded-full bg-white shadow-md flex items-center justify-center border border-slate-200 hover:bg-slate-50 transition-all z-50"
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
            <h1 className="text-sky-900 font-medium text-[16px] hidden md:block capitalize">
              {location.pathname
              .split("/")
              .pop()
              ?.replace(/-/g, " ")
              .toUpperCase() || "DASHBOARD"}
            </h1>
          </div>

<div className="flex items-center gap-4">
  {/* NOTIFICATIONS */}
  <div className="relative" onClick={(e) => e.stopPropagation()}>
    <button
      onClick={() => {
        setShowNotifications(!showNotifications);
        setShowProfileMenu(false);
      }}
      className={cn(
        "group w-10 h-10 rounded-xl border border-slate-200 flex items-center justify-center relative transition-all duration-300",
        showNotifications 
          ? "bg-sky-900 border-sky-900 shadow-lg shadow-sky-200 scale-95" 
          : "bg-white hover:bg-slate-50 hover:border-sky-300"
      )}
    >
      <Bell 
        size={18} 
        className={cn(
          "transition-colors", 
          showNotifications ? "text-white" : "text-slate-800 group-hover:text-slate-900"
        )} 
      />
      <span className={cn(
        "absolute top-2 right-2 h-2 w-2 rounded-full border-2 border-white",
        "bg-sky-500 ring-4 ring-sky-500/10 animate-pulse"
      )} />
    </button>

    {showNotifications && (
      <div className="absolute right-0 mt-4 w-80 bg-white/95 backdrop-blur-xl rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.1)] border border-slate-200 overflow-hidden z-50 animate-in fade-in zoom-in-95 duration-200 origin-top-right">
        <div className="px-5 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
          <span className="font-bold text-slate-800 text-sm tracking-tight">Notifications</span>
          <span className="text-[10px] bg-sky-200 text-slate-800 px-2 py-0.5 rounded-md font-bold uppercase tracking-wider">
            {unreadCount} New
          </span>
        </div>
        
        {/* Empty State with Premium Styling */}
        <div className="max-h-96 overflow-y-auto">
          {notifications.length === 0 ? (
            <div className="py-12 flex flex-col items-center justify-center">
              <div className="bg-slate-100 w-14 h-14 rounded-2xl flex items-center justify-center mb-4">
                <Bell size={24} className="text-slate-300" />
              </div>

              <p className="text-sm font-semibold text-slate-800">
                All Caught Up!
              </p>

              <p className="text-xs text-slate-400 mt-1">
                No NEW ALERTS to Show.
              </p>
            </div>
          ) : (
            notifications.map((n) => (
              <div
                key={n._id}
                onClick={() => markAsRead(n._id)}
                className={`px-5 py-4 border-b border-slate-100 hover:bg-slate-50 transition-colors cursor-pointer ${
                  n.read
                    ? "opacity-60"
                    : "bg-sky-100/40"
                }`}              
                >
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 rounded-full bg-sky-500 mt-2" />

                  <div className="flex-1">
                    <p className="text-md font-semibold text-sky-800">
                      {n.title}
                    </p>

                    <p className="text-sm text-slate-700 mt-1">
                      {n.message}
                    </p>

                    <p className="text-[10px] text-slate-500 mt-2">
                      {new Date(n.createdAt).toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
        
        <button className="w-full py-3 text-xs font-bold text-slate-500 hover:text-slate-900 border-t border-slate-100 transition-colors">
          View All Activity
        </button>
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
      className={cn(
        "flex items-center gap-3 p-1.5 pr-4 rounded-xl border transition-all duration-300",
        showProfileMenu 
          ? "bg-white border-slate-300 shadow-sm" 
          : "bg-slate-50/50 border-slate-200 hover:border-slate-300"
      )}
    >
      <div className="h-8 w-8 rounded-lg bg-sky-200 from-slate-800 to-slate-950 flex items-center justify-center text-slate-900 text-md font-bold shadow-md">
        {user?.email?.charAt(0)?.toUpperCase() || "U"}
      </div>
      <div className="hidden lg:block text-left">
        <p className="text-xs font-bold text-slate-900 leading-tight">
          {user?.email?.split("@")[0] || "User"}
        </p>
        <div className="flex items-center gap-1.5">
          <div className="h-1 w-1 rounded-full bg-emerald-500" />
          <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">
            {user.role}
          </p>
        </div>
      </div>
      <ChevronDown size={14} className={cn("text-slate-400 transition-transform", showProfileMenu && "rotate-180")} />
    </button>

    {showProfileMenu && (
      <div className="absolute right-0 mt-4 w-72 bg-white rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.15)] border border-slate-200 overflow-hidden z-50 animate-in fade-in zoom-in-95 duration-200 origin-top-right">
        {/* Header Section */}
        <div className="p-6 bg-sky-200 text-slate-900 relative overflow-hidden">
          {/* Subtle background pattern/glow */}
          <div className="absolute -top-10 -right-10 w-32 h-32 bg-sky-500/20 rounded-full blur-3xl" />
          
          <div className="flex items-center gap-4 relative z-10">
            <div className="h-12 w-12 rounded-xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center">
              <User size={24} className="text-indigo-400" />
            </div>
            <div className="overflow-hidden">
              <p className="text-[10px] font-black text-green-800 uppercase tracking-widest mb-0.5">Verified Account</p>
              <p className="text-sm font-bold truncate text-blue-900">{user?.email || "No Email"}</p>
            </div>
          </div>
        </div>

        {/* Links Section */}
        <div className="p-2">
          <div className="px-3 py-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
            Settings
          </div>
          <Link
            to="/my-profile"
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-sky-50 text-slate-600 hover:text-slate-900 text-sm font-semibold transition-all group"
          >
            <User size={18} className="text-slate-400 group-hover:text-slate-900 transition-colors" />
            Personal Profile
          </Link>
          <button className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-sky-50 text-slate-600 hover:text-slate-900 text-sm font-semibold transition-all group text-left">
            <Settings size={18} className="text-slate-400 group-hover:text-slate-900 transition-colors" />
            Preferences
          </button>
          
          <div className="my-2 border-t border-slate-100" />
          
          <button
            onClick={logout}
            className="w-full flex items-center gap-3 px-3 py-3 rounded-lg bg-red-50 hover:bg-red-100 text-red-600 text-sm font-bold transition-all"
          >
            <LogOut size={18} />
            Sign Out
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
    </div>
  );
}