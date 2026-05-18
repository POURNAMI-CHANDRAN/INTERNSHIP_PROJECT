import React, { useEffect, useMemo, useState } from "react";
import {
  User,
  Mail,
  MapPin,
  Calendar,
  DollarSign,
  Briefcase,
  Award,
  FileText,
  ExternalLink,
  Clock3,
  Building2,
  Sparkles,
  ShieldCheck,
  TrendingUp,
} from "lucide-react";

import { motion, AnimatePresence } from "framer-motion";

type AnyObj = Record<string, any>;

export default function MyProfile() {
  const API_BASE =
    import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

  const savedUser = JSON.parse(localStorage.getItem("user") || "{}");
  const token = localStorage.getItem("token") || savedUser?.token || "";

  const [profile, setProfile] = useState<AnyObj | null>(null);

  const [data, setData] = useState({
    skills: [] as any[],
    allocations: [] as any[],
    timesheets: [] as any[],
    documents: [] as any[],
    payroll: null as any,
  });

  const [activeTab, setActiveTab] = useState("overview");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const authHeaders = useMemo(
    () => ({
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    }),
    [token]
  );

  const fetcher = async (url: string) => {
    const res = await fetch(url, {
      headers: authHeaders,
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || "Request Failed");
    }

    const json = await res.json();

    return json?.data ?? json;
  };

 useEffect(() => {
  const init = async () => {
    try {
      setLoading(true);

      const me = await fetcher(
        `${API_BASE}/api/employees/me`
      );

      setProfile(me);

      // OPTIONAL extra APIs
      if (me?._id) {
        const [
          allocations,
          timesheets,
          payroll,
          docs,
        ] = await Promise.allSettled([
          fetcher(
            `${API_BASE}/api/employees/me/allocations`
          ),

          fetcher(
            `${API_BASE}/api/timesheets/employee/${me._id}`
          ),

          fetcher(
            `${API_BASE}/api/payroll/${me._id}`
          ),

          fetcher(
            `${API_BASE}/api/documents/${me._id}`
          ),
        ]);

        setData({
          skills: me.skills || [],

          allocations:
            allocations.status === "fulfilled"
              ? allocations.value
              : [],

          timesheets:
            timesheets.status === "fulfilled"
              ? timesheets.value
              : [],

          payroll:
            payroll.status === "fulfilled"
              ? payroll.value
              : null,

          documents:
            docs.status === "fulfilled"
              ? docs.value
              : [],
        });
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  init();
}, [token]);

  const tabs = [
    {
      id: "overview",
      label: "Overview",
      icon: <User size={18} />,
    },

    {
      id: "skills",
      label: "Skills",
      icon: <Award size={18} />,
    },

    {
      id: "projects",
      label: "Projects",
      icon: <Briefcase size={18} />,
    },

    {
      id: "timesheets",
      label: "Timesheets",
      icon: <Clock3 size={18} />,
    },

    {
      id: "payroll",
      label: "Payroll",
      icon: <DollarSign size={18} />,
    },

    {
      id: "documents",
      label: "Documents",
      icon: <FileText size={18} />,
    },
  ];

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-4">
          <div className="h-14 w-14 rounded-full border-4 border-slate-200 border-t-blue-600 animate-spin" />
          <p className="text-slate-500 font-medium">
            Loading your Workspace...
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-10">
        <div className="bg-red-50 border border-red-100 text-red-600 p-4 rounded-2xl">
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F6F8FC] text-slate-900">
      {/* HERO */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-700 via-indigo-700 to-sky-600" />

        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-10 left-10 w-72 h-72 bg-white rounded-full blur-3xl" />
          <div className="absolute bottom-0 right-0 w-96 h-96 bg-cyan-300 rounded-full blur-3xl" />
        </div>

        <div className="relative max-w-7xl mx-auto px-6 py-14">
          <div className="flex flex-col lg:flex-row lg:items-end gap-8">
            {/* AVATAR */}
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="relative"
            >
              <div className="w-36 h-36 rounded-[2rem] bg-white/10 backdrop-blur-xl border border-white/20 p-2 shadow-2xl">
                {profile?.avatarPreview ? (
                  <img
                    src={profile.avatarPreview}
                    className="w-full h-full rounded-[1.5rem] object-cover"
                  />
                ) : (
                  <div className="w-full h-full rounded-[1.5rem] bg-white flex items-center justify-center">
                    <User size={60} className="text-blue-600" />
                  </div>
                )}
              </div>

              <div className="absolute -bottom-2 -right-2 bg-emerald-500 text-white rounded-full p-2 shadow-lg">
                <ShieldCheck size={16} />
              </div>
            </motion.div>

            {/* INFO */}
            <div className="flex-1">
              <div className="flex items-center gap-2 text-blue-100 mb-2">
                <Sparkles size={16} />
                <span className="text-sm font-semibold tracking-wide uppercase">
                  Employee Workspace
                </span>
              </div>

              <h1 className="text-5xl font-black tracking-tight text-white">
                {profile?.name}
              </h1>

              <div className="flex flex-wrap items-center gap-5 mt-4 text-blue-100">
                <div className="flex items-center gap-2">
                  <Briefcase size={16} />
                  {profile?.role || "Employee"}
                </div>

                <div className="flex items-center gap-2">
                  <Building2 size={16} />
                  {profile?.roleId?.name || "Organization"}
                </div>

                <div className="flex items-center gap-2">
                  <Mail size={16} />
                  {profile?.email}
                </div>
              </div>
            </div>

            {/* KPI */}
            <div className="grid grid-cols-2 gap-4 min-w-[280px]">
              <KPI
                label="Skills"
                value={data.skills.length}
                icon={<Award size={18} />}
              />

              <KPI
                label="Projects"
                value={data.allocations.length}
                icon={<Briefcase size={18} />}
              />

              <KPI
                label="Documents"
                value={data.documents.length}
                icon={<FileText size={18} />}
              />

              <KPI
                label="Timesheets"
                value={data.timesheets.length}
                icon={<Clock3 size={18} />}
              />
            </div>
          </div>
        </div>
      </div>

      {/* BODY */}
      <div className="max-w-7xl mx-auto px-6 py-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* SIDEBAR */}
          <div className="lg:col-span-3">
            <div className="top-6 bg-white border border-slate-200 rounded-3xl p-3 shadow-sm">
              <div className="space-y-2">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl transition-all duration-300 text-sm font-semibold
                    ${
                      activeTab === tab.id
                        ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg"
                        : "text-slate-500 hover:bg-slate-100"
                    }`}
                  >
                    {tab.icon}
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* CONTENT */}
          <div className="lg:col-span-9">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2 }}
              >
                {/* OVERVIEW */}
                {activeTab === "overview" && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Card title="Personal Information">
                      <DetailRow
                        icon={<Mail size={16} />}
                        label="Email"
                        value={profile?.email}
                      />

                      <DetailRow
                        icon={<MapPin size={16} />}
                        label="Location"
                        value={profile?.location}
                      />

                      <DetailRow
                        icon={<Calendar size={16} />}
                        label="Joining Date"
                        value={profile?.joiningDate}
                        isDate
                      />
                    </Card>

                    <Card title="Professional Details">
                      <DetailRow
                        label="Employee Code"
                        value={profile?.employeeCode}
                      />

                      <DetailRow
                        label="Status"
                        value={profile?.status || "Active"}
                        isStatus
                      />

                      <DetailRow
                        label="Hourly Cost"
                        value={`₹${profile?.hourlyCost || 0}`}
                      />
                    </Card>
                  </div>
                )}

                {/* SKILLS */}
                {activeTab === "skills" && (
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                    {data.skills.map((item, i) => (
                      <motion.div
                        key={i}
                        whileHover={{ y: -4 }}
                        className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm"
                      >
                        <div className="flex items-center justify-between mb-5">
                          <span className="text-xs uppercase tracking-widest font-bold text-slate-400">
                            Skill
                          </span>
                        </div>

                        <h3 className="text-xl font-black text-slate-800 mb-5">
                           {item.name}
                        </h3>

                      </motion.div>
                    ))}
                  </div>
                )}

                {/* PROJECTS */}
                {activeTab === "projects" && (
                  <div className="space-y-4">
                    {data.allocations.map((a, i) => (
                      <div
                        key={i}
                        className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm flex items-center justify-between"
                      >
                        <div>
                          <h3 className="text-lg font-bold text-slate-800">
                            {a.projectId?.name || "Unnamed Project"}
                          </h3>

                          <p className="text-sm text-slate-500 mt-1">
                            {a.role || "Contributor"}
                          </p>
                        </div>

                        <div className="text-right">
                          <div className="text-2xl font-black text-blue-600">
                            {a.allocatedHours || 0}h
                          </div>

                          <div className="text-xs uppercase tracking-widest text-slate-400 font-bold">
                            Allocated
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* TIMESHEETS */}
                {activeTab === "timesheets" && (
                  <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm">
                    <table className="w-full">
                      <thead className="bg-slate-50 border-b border-slate-100">
                        <tr>
                          <th className="text-left px-6 py-4 text-xs uppercase tracking-widest text-slate-400">
                            Project
                          </th>

                          <th className="text-left px-6 py-4 text-xs uppercase tracking-widest text-slate-400">
                            Date
                          </th>

                          <th className="text-left px-6 py-4 text-xs uppercase tracking-widest text-slate-400">
                            Status
                          </th>
                        </tr>
                      </thead>

                      <tbody>
                        {data.timesheets.map((ts, i) => (
                          <tr
                            key={i}
                            className="border-b border-slate-100 hover:bg-slate-50"
                          >
                            <td className="px-6 py-5 font-semibold">
                              {ts.project_id?.name || "General"}
                            </td>

                            <td className="px-6 py-5 text-slate-500">
                              {ts.work_date?.split("T")[0]}
                            </td>

                            <td className="px-6 py-5">
                              <span
                                className={`px-3 py-1 rounded-full text-xs font-black
                                ${
                                  ts.status === "Approved"
                                    ? "bg-emerald-100 text-emerald-700"
                                    : "bg-amber-100 text-amber-700"
                                }`}
                              >
                                {ts.status}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {/* PAYROLL */}
                {activeTab === "payroll" && (
                  <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-[2rem] p-10 text-white overflow-hidden relative">
                    <div className="absolute top-0 right-0 opacity-10">
                      <DollarSign size={260} />
                    </div>

                    <div className="relative">
                      <div className="flex items-center gap-2 text-slate-400 mb-3">
                        <TrendingUp size={18} />
                        Financial Overview
                      </div>

                      <h2 className="text-5xl font-black mb-3">
                        ₹
                        {Number(
                          data.payroll?.monthlySalary || 0
                        ).toLocaleString("en-IN")}
                      </h2>

                      <p className="text-slate-400">
                        Monthly Gross Salary
                      </p>
                    </div>
                  </div>
                )}

                {/* DOCUMENTS */}
                {activeTab === "documents" && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    {data.documents.map((doc, i) => (
                      <a
                        key={i}
                        href={doc.fileUrl}
                        target="_blank"
                        className="bg-white border border-slate-200 rounded-3xl p-5 flex items-center justify-between hover:border-blue-200 hover:shadow-md transition-all"
                      >
                        <div className="flex items-center gap-4">
                          <div className="h-12 w-12 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-600">
                            <FileText size={22} />
                          </div>

                          <div>
                            <h3 className="font-bold text-slate-800">
                              {doc.name || "Untitled"}
                            </h3>

                            <p className="text-xs text-slate-400 mt-1">
                              Click to open
                            </p>
                          </div>
                        </div>

                        <ExternalLink
                          size={18}
                          className="text-slate-400"
                        />
                      </a>
                    ))}
                  </div>
                )}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
}

/* =========================================================
   COMPONENTS
========================================================= */

function KPI({ label, value, icon }: any) {
  return (
    <div className="bg-white/10 backdrop-blur-xl border border-white/10 rounded-2xl p-4 text-white">
      <div className="flex items-center justify-between mb-2 opacity-80">
        <span>{icon}</span>

        <span className="text-[10px] uppercase tracking-widest font-bold">
          {label}
        </span>
      </div>

      <div className="text-3xl font-black">{value}</div>
    </div>
  );
}

function Card({ title, children }: any) {
  return (
    <div className="bg-white border border-slate-200 rounded-[2rem] p-7 shadow-sm">
      <h3 className="text-xl font-black mb-7 text-slate-800">
        {title}
      </h3>

      <div className="space-y-5">{children}</div>
    </div>
  );
}

function DetailRow({
  icon,
  label,
  value,
  isDate,
  isStatus,
}: any) {
  const displayValue =
    isDate && value
      ? new Date(value).toLocaleDateString("en-IN", {
          day: "2-digit",
          month: "short",
          year: "numeric",
        })
      : value || "-";

  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-3 text-slate-500">
        {icon}
        <span className="text-sm font-semibold">{label}</span>
      </div>

      {isStatus ? (
        <span className="bg-emerald-50 text-emerald-600 px-3 py-1 rounded-full text-xs font-black">
          {displayValue}
        </span>
      ) : (
        <span className="text-sm font-bold text-slate-800">
          {displayValue}
        </span>
      )}
    </div>
  );
}