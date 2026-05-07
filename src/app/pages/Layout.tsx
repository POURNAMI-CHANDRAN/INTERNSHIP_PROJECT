import { useEffect, useRef, useState } from "react";
import { Outlet, useNavigate, Link } from "react-router-dom";

export default function Layout() {
  const navigate = useNavigate();

  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  const notifRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);

  // Example logged-in user (replace with auth context/API)
  const user = {
    name: "Admin User",
    email: "admin@test.com",
    avatarUrl:
      "https://ui-avatars.com/api/?name=Admin+User&background=0D8ABC&color=fff",
  };

  const notifications = [
    { id: 1, message: "New Employee Onboarding Pending." },
    { id: 2, message: "Department Report Submitted." },
    { id: 3, message: "Payroll Generated Successfully." },
  ];

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;

      if (
        notifRef.current &&
        !notifRef.current.contains(target) &&
        profileRef.current &&
        !profileRef.current.contains(target)
      ) {
        setIsNotifOpen(false);
        setIsProfileOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);

    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Logout function
  const handleLogout = () => {
    localStorage.removeItem("token"); // remove auth token
    navigate("/login");
  };

  return (
    <div className="flex min-h-screen bg-neutral-100">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-neutral-200 p-4 flex flex-col">
        <div className="mb-6 flex justify-center">
          <img
            src="/LOGO_COPY.png"
            className="h-16 object-contain"
            alt="Logo"
          />
        </div>

        <nav className="space-y-2">
          <Link
            to="/dashboard"
            className="block p-2 hover:bg-neutral-100 rounded"
          >
            Dashboard
          </Link>

          <Link
            to="/employees"
            className="block p-2 hover:bg-neutral-100 rounded"
          >
            Employees
          </Link>

          <Link
            to="/departments"
            className="block p-2 hover:bg-neutral-100 rounded"
          >
            Departments
          </Link>
        </nav>

        <div className="mt-auto">
          <button
            onClick={handleLogout}
            className="w-full py-2 px-4 bg-neutral-900 text-white rounded hover:bg-neutral-800"
          >
            Logout
          </button>
        </div>
      </aside>

      {/* Main Section */}
      <main className="flex-1 flex flex-col">
        {/* Header */}
        <header className="bg-white border-b border-neutral-200 p-4 flex justify-between items-center">
          {/* Search */}
          <input
            type="text"
            placeholder="Search..."
            className="px-4 py-2 border border-neutral-200 rounded-md w-64 focus:outline-none focus:ring-2 focus:ring-neutral-300"
          />

          <div className="flex items-center gap-4">
            {/* Notifications */}
            <div className="relative" ref={notifRef}>
              <button
                onClick={() => {
                  setIsNotifOpen(!isNotifOpen);
                  setIsProfileOpen(false);
                }}
                className="p-2 hover:bg-neutral-100 rounded-full relative"
              >
                🔔

                {notifications.length > 0 && (
                  <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
                )}
              </button>

              {isNotifOpen && (
                <div className="absolute right-0 mt-2 w-80 bg-white border rounded-lg shadow-lg z-50 p-4">
                  <h3 className="font-bold border-b pb-2 mb-2">
                    Notifications
                  </h3>

                  <div className="space-y-2 text-sm">
                    {notifications.map((item) => (
                      <div
                        key={item.id}
                        className="p-2 rounded hover:bg-neutral-100 cursor-pointer"
                      >
                        {item.message}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Profile */}
            <div className="relative" ref={profileRef}>
              <button
                onClick={() => {
                  setIsProfileOpen(!isProfileOpen);
                  setIsNotifOpen(false);
                }}
                className="flex items-center gap-2 hover:bg-neutral-100 p-1 rounded-full"
              >
                <img
                  src={user.avatarUrl}
                  alt={user.name}
                  className="h-8 w-8 rounded-full"
                />

                <span className="hidden md:block text-sm font-medium">
                  {user.name}
                </span>
              </button>

              {isProfileOpen && (
                <div className="absolute right-0 mt-2 w-52 bg-white border rounded-lg shadow-lg z-50 overflow-hidden">
                  <div className="p-3 border-b bg-neutral-50">
                    <p className="font-semibold text-sm">{user.name}</p>
                    <p className="text-xs text-neutral-500 truncate">
                      {user.email}
                    </p>
                  </div>

                  <Link
                    to="/profile"
                    className="block px-4 py-2 text-sm hover:bg-neutral-100"
                  >
                    Profile
                  </Link>

                  <Link
                    to="/settings"
                    className="block px-4 py-2 text-sm hover:bg-neutral-100"
                  >
                    Settings
                  </Link>

                  <button
                    onClick={handleLogout}
                    className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                  >
                    Sign Out
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Page Content */}
        <section className="p-6 flex-1 overflow-auto bg-neutral-50">
          <Outlet />
        </section>
      </main>
    </div>
  );
}