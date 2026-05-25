import React, { useEffect, useMemo, useState } from "react";
import {
  User,
  Mail,
  MapPin,
  Calendar,
  Briefcase,
  Building2,
  Sparkles,
  ShieldCheck,
  IdCard,
  CircleDot,
  Coins
} from "lucide-react";
import { motion } from "framer-motion";

type AnyObj = Record<string, any>;

export default function MyProfileOverview() {
  const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

  const savedUser = JSON.parse(localStorage.getItem("user") || "{}");
  const token = localStorage.getItem("token") || savedUser?.token || "";

  const [profile, setProfile] = useState<AnyObj | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const authHeaders = useMemo(
    () => ({
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    }),
    [token]
  );

  useEffect(() => {
    const init = async () => {
      try {
        setLoading(true);
        const res = await fetch(`${API_BASE}/api/employees/me`, {
          headers: authHeaders,
        });

        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error(err.message || "Request Failed");
        }

        const json = await res.json();
        setProfile(json?.data ?? json);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    init();
  }, [token, authHeaders, API_BASE]);

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-sky-50">
        <div className="flex flex-col items-center gap-4">
          <div className="h-12 w-12 rounded-full border-4 border-slate-200 border-t-sky-600 animate-spin" />
          <p className="text-sky-500 text-sm font-medium tracking-wide">
            Loading Workspace...
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-10 bg-sky-50 min-h-screen flex items-center justify-center">
        <div className="bg-red-50 border border-red-100 text-red-600 p-6 rounded-2xl max-w-md w-full text-center">
          <p className="font-semibold text-sm">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-sky-900 font-sans antialiased">
      
      {/* PREMIUM LIGHT HERO BANNER */}
      <div className="relative overflow-hidden bg-white border-b border-sky-200/80">
        {/* Subtle Ambient Light Gradients */}
        <div className="absolute inset-0 opacity-40 pointers-events-none">
          <div className="absolute -top-40 -left-40 w-[600px] h-[600px] bg-sky-100 rounded-full blur-[120px]" />
          <div className="absolute top-10 right-10 w-[400px] h-[400px] bg-sky-100 rounded-full blur-[100px]" />
        </div>

        <div className="relative max-w-5xl mx-auto px-6 pt-16 pb-12">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-8">
            
            {/* AVATAR & IDENTITY */}
            <div className="flex flex-col sm:flex-row items-center sm:items-start md:items-center gap-6">
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.3 }}
                className="relative"
              >
                <div className="w-28 h-28 rounded-[2rem] bg-gradient-to-tr from-sky-100 via-sky-200 to-sky-100 p-1 shadow-sm">
                  <div className="w-full h-full rounded-[1.8rem] bg-white p-1 overflow-hidden">
                    {profile?.avatarPreview ? (
                      <img
                        src={profile.avatarPreview}
                        className="w-full h-full rounded-[1.5rem] object-cover"
                        alt="Profile"
                      />
                    ) : (
                      <div className="w-full h-full rounded-[1.5rem] bg-sky-50 flex items-center justify-center">
                        <User size={40} className="text-sky-400" />
                      </div>
                    )}
                  </div>
                </div>

                <div className="absolute -bottom-1 -right-1 bg-emerald-500 text-white rounded-full p-1.5 shadow-md border-2 border-white">
                  <ShieldCheck size={14} strokeWidth={2.5} />
                </div>
              </motion.div>

              <div className="text-center sm:text-left">
                <div className="flex items-center justify-center sm:justify-start gap-1.5 text-sky-600 mb-1.5">
                  <Sparkles size={13} />
                  <span className="text-[11px] font-bold tracking-[0.2em] uppercase">
                    Employee Overview
                  </span>
                </div>

                <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-sky-900">
                  {profile?.name}
                </h1>

                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-x-4 gap-y-1 mt-3 text-sm text-sky-500 font-medium">
                  <div className="flex items-center gap-1.5">
                    <Briefcase size={14} className="text-sky-400" />
                    {profile?.role || "Team Member"}
                  </div>

                  <span className="hidden sm:inline text-sky-300">•</span>

                  <div className="flex items-center gap-1.5">
                    <Building2 size={14} className="text-sky-400" />
                    {profile?.roleId?.name || "Department"}
                  </div>
                </div>
              </div>
            </div>

            {/* QUICK EMAIL BADGE */}
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-3.5 flex items-center gap-3 max-w-xs self-center md:self-auto"
            >
              <div className="h-9 w-9 rounded-lg bg-sky-50 flex items-center justify-center text-sky-600 border border-sky-100">
                <Mail size={16} />
              </div>
              <div className="truncate">
                <p className="text-[10px] uppercase tracking-wider text-sky-400 font-bold">Email Address</p>
                <p className="text-xs font-semibold text-slate-700 truncate">{profile?.email}</p>
              </div>
            </motion.div>

          </div>
        </div>
      </div>

      {/* CORE INFO GRID */}
      <div className="max-w-5xl mx-auto px-6 py-12">
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-1 md:grid-cols-2 gap-8"
        >
          {/* PERSONAL INFORMATION CARD */}
          <PremiumLightCard title="Personal Details">
            <PremiumLightRow
              icon={<Mail size={18} />}
              label="Primary Email"
              value={profile?.email}
            />
            <PremiumLightRow
              icon={<MapPin size={18} />}
              label="Work Location"
              value={profile?.location}
            />
            <PremiumLightRow
              icon={<Calendar size={18} />}
              label="Date of Joining"
              value={profile?.joiningDate}
              isDate
            />
          </PremiumLightCard>

          {/* PROFESSIONAL DETAILS CARD */}
          <PremiumLightCard title="Employment Profile">
            <PremiumLightRow
              icon={<IdCard size={18} />}
              label="Employee ID Code"
              value={profile?.employeeId}
            />
            <PremiumLightRow
              icon={<CircleDot size={18} />}
              label="Current Status"
              value={profile?.status || "Active"}
              isStatus
            />
            <PremiumLightRow
              icon={<Coins size={18} />}
              label="Internal Hourly Cost"
              value={`₹${(profile?.hourlyCost || 0).toLocaleString("en-IN")}`}
            />
          </PremiumLightCard>
        </motion.div>
      </div>
    </div>
  );
}

/* =========================================================
   PREMIUM LIGHT SUB-COMPONENTS
========================================================= */

function PremiumLightCard({ title, children }: any) {
  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm relative overflow-hidden">
      <h3 className="text-[11px] uppercase tracking-[0.2em] font-bold text-indigo-700 mb-6 flex items-center gap-2">
        <span className="h-1.5 w-1.5 rounded-full bg-sky-600" /> {title}
      </h3>
      <div className="space-y-4">{children}</div>
    </div>
  );
}

function PremiumLightRow({ icon, label, value, isDate, isStatus }: any) {
  const displayValue =
    isDate && value
      ? new Date(value).toLocaleDateString("en-IN", {
          day: "2-digit",
          month: "short",
          year: "numeric",
        })
      : value || "—";

  return (
    <div className="flex items-center justify-between py-2 border-b border-slate-100 last:border-0 last:pb-0">
      <div className="flex items-center gap-3 text-slate-500">
        <span className="text-sky-800">
          {icon}
        </span>
        <span className="text-xs font-medium text-sky-800">{label}</span>
      </div>

      {isStatus ? (
        <span className="bg-emerald-50 text-emerald-700 border border-emerald-100 px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wide uppercase">
          {displayValue}
        </span>
      ) : (
        <span className="text-xs font-bold text-slate-800 tracking-wide">
          {displayValue}
        </span>
      )}
    </div>
  );
}