import { useEffect, useRef, useState } from "react";
import { Outlet, useNavigate, Link, useLocation } from "react-router-dom";
import { 
  Bell, 
  LayoutDashboard, 
  Users, 
  Building2, 
  LogOut, 
  Search, 
  Settings, 
  User as UserIcon,
  ChevronDown
} from "lucide-react";

export default function PremiumLayout() {
  const navigate = useNavigate();
  const location = useLocation();

  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  const notifRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);

  const user = {
    name: "Admin User",
    email: "admin@test.com",
    avatarUrl: "https://ui-avatars.com/api/?name=Admin+User&background=0f172a&color=fff",
  };

  const notifications = [
    { id: 1, message: "New Employee Onboarding Pending.", time: "2m ago" },
    { id: 2, message: "role Report Submitted.", time: "1h ago" },
    { id: 3, message: "Payroll Generated Successfully.", time: "5h ago" },
  ];

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (notifRef.current && !notifRef.current.contains(target) && 
          profileRef.current && !profileRef.current.contains(target)) {
        setIsNotifOpen(false);
        setIsProfileOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/login");
  };

  const NavItem = ({ to, icon: Icon, label }: { to: string, icon: any, label: string }) => {
    const isActive = location.pathname === to;
    return (
      <Link
        to={to}
        className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group ${
          isActive 
            ? "bg-slate-900 text-white shadow-lg shadow-slate-200" 
            : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
        }`}
      >
        <Icon size={20} className={isActive ? "text-white" : "group-hover:text-slate-900"} />
        <span className="font-medium text-sm">{label}</span>
      </Link>
    );
  };

  return (
    <div className="flex min-h-screen bg-[#F8FAFC] font-sans antialiased text-slate-900">
      {/* Sidebar */}
      <aside className="w-72 bg-white border-r border-slate-200/60 p-6 flex flex-col sticky top-0 h-screen">
        <div className="mb-10 px-2">
          <img src="/LOGO_COPY.png" className="h-10 object-contain" alt="Logo" />
        </div>

        <nav className="flex-1 space-y-1">
          <p className="px-4 text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-4">Main Menu</p>
          <NavItem to="/dashboard" icon={LayoutDashboard} label="Dashboard" />
          <NavItem to="/employees" icon={Users} label="Employees" />
          <NavItem to="/roles" icon={Building2} label="roles" />
        </nav>

        <div className="pt-6 border-t border-slate-100">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 w-full px-4 py-3 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors"
          >
            <LogOut size={20} />
            <span className="font-medium text-sm">Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Section */}
      <main className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <header className="h-20 bg-white/80 backdrop-blur-md border-b border-slate-200/60 px-8 flex justify-between items-center sticky top-0 z-30">
          <div className="relative w-96 group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-slate-900 transition-colors" size={18} />
            <input
              type="text"
              placeholder="Search anything..."
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-transparent rounded-xl focus:bg-white focus:border-slate-200 focus:ring-4 focus:ring-slate-50 outline-none transition-all text-sm"
            />
          </div>

          <div className="flex items-center gap-3">
            {/* Notifications */}
            <div className="relative" ref={notifRef}>
              <button
                onClick={() => { setIsNotifOpen(!isNotifOpen); setIsProfileOpen(false); }}
                className="p-2.5 text-slate-500 hover:bg-slate-50 rounded-xl relative transition-colors"
              >
                <Bell size={22} />
                {notifications.length > 0 && (
                  <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-indigo-600 rounded-full border-2 border-white"></span>
                )}
              </button>

              {isNotifOpen && (
                <div className="absolute right-0 mt-3 w-80 bg-white border border-slate-200 rounded-2xl shadow-xl shadow-slate-200/50 z-50 overflow-hidden animate-in fade-in slide-in-from-top-2">
                  <div className="p-4 border-b border-slate-50 flex justify-between items-center">
                    <h3 className="font-bold text-sm">Notifications</h3>
                    <span className="text-[10px] bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded-full font-bold">New</span>
                  </div>
                  <div className="max-h-96 overflow-auto">
                    {notifications.map((item) => (
                      <div key={item.id} className="p-4 hover:bg-slate-50 cursor-pointer border-b border-slate-50 last:border-0">
                        <p className="text-sm text-slate-800 mb-1">{item.message}</p>
                        <p className="text-xs text-slate-400">{item.time}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="h-8 w-[1px] bg-slate-200 mx-2" />

            {/* Profile */}
            <div className="relative" ref={profileRef}>
              <button
                onClick={() => { setIsProfileOpen(!isProfileOpen); setIsNotifOpen(false); }}
                className="flex items-center gap-3 pl-1 pr-3 py-1 hover:bg-slate-50 rounded-full transition-colors border border-transparent hover:border-slate-100"
              >
                <img src={user.avatarUrl} alt="Avatar" className="h-9 w-9 rounded-full ring-2 ring-white shadow-sm" />
                <div className="hidden md:block text-left">
                  <p className="text-xs font-bold text-slate-900 leading-tight">{user.name}</p>
                  <p className="text-[10px] text-slate-500 font-medium">Administrator</p>
                </div>
                <ChevronDown size={14} className="text-slate-400" />
              </button>

              {isProfileOpen && (
                <div className="absolute right-0 mt-3 w-60 bg-white border border-slate-200 rounded-2xl shadow-xl shadow-slate-200/50 z-50 overflow-hidden animate-in fade-in slide-in-from-top-2">
                  <div className="p-4 bg-slate-50/50 border-b border-slate-100">
                    <p className="text-sm font-bold">{user.name}</p>
                    <p className="text-xs text-slate-500 truncate">{user.email}</p>
                  </div>
                  <div className="p-2">
                    <Link to="/profile" className="flex items-center gap-3 px-3 py-2 text-sm text-slate-600 hover:bg-slate-50 rounded-lg transition-colors">
                      <UserIcon size={16} /> Profile Settings
                    </Link>
                    <Link to="/settings" className="flex items-center gap-3 px-3 py-2 text-sm text-slate-600 hover:bg-slate-50 rounded-lg transition-colors">
                      <Settings size={16} /> Organization
                    </Link>
                    <button onClick={handleLogout} className="flex items-center gap-3 w-full px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors mt-1">
                      <LogOut size={16} /> Sign Out
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Page Content */}
        <section className="p-8 flex-1 overflow-auto">
          <div className="max-w-7xl mx-auto">
            <Outlet />
          </div>
        </section>
      </main>
    </div>
  );
}