import React, { useMemo, useState, ReactNode } from "react";
import { motion } from "framer-motion";
import {
  Users,
  DollarSign,
  TrendingUp,
  Clock,
  Sparkles,
  Calendar,
  Download,
  Zap,
} from "lucide-react";

import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  AreaChart,
  Area,
  XAxis,
  YAxis,
} from "recharts";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { Button } from "../components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";

import { useAnalytics } from "../../hooks/useAnalytics";

/* ================= HELPERS ================= */

const lakh = (n: number): string => `₹${(n / 100000).toFixed(1)}L`;
const money = (n: number): string => `₹${n.toLocaleString("en-IN")}`;

const safeNumber = (v: unknown): number =>
  typeof v === "number" && !isNaN(v) ? v : 0;

/* ================= DASHBOARD ================= */

export default function Dashboard() {
  const [month, setMonth] = useState<number>(
    new Date().getMonth() + 1
  );

  const year = new Date().getFullYear();

  const {
    loading,
    utilization,
    bench,
    revenue,
    suggestions,
  } = useAnalytics(month, year);

  const stats = useMemo(() => {
    const totalEmployees = utilization.length;

    const billable = utilization.filter(
      (u: any) => safeNumber(u.allocatedHours) > 0
    ).length;

    const avgUtilization =
      totalEmployees > 0
        ? Math.round(
            utilization.reduce(
              (s: number, u: any) =>
                s + safeNumber(u.utilizationPct ?? u.utilization),
              0
            ) / totalEmployees
          )
        : 0;

    const totalRevenue = revenue.reduce(
      (s: number, r: any) =>
        s + safeNumber(r.revenue ?? r.amount),
      0
    );

    return {
      totalEmployees,
      billable,
      bench: bench.length,
      avgUtilization,
      totalRevenue,
    };
  }, [utilization, bench, revenue]);

  if (loading) {
    return <div className="p-10 animate-pulse">Loading dashboard…</div>;
  }

  return (
    <div className="min-h-screen bg-sky-50 p-6 lg:p-10">
      {/* HEADER */}
      <div className="flex justify-between mb-10">
        <div>
          <p className="text-xs uppercase tracking-[4px] text-sky-600 font-bold">
            Executive Dashboard
          </p>
          <h1 className="text-4xl font-black">
            Workforce <span className="text-sky-600">OS</span>
          </h1>
        </div>

        <div className="flex gap-3 items-center">
          <Calendar className="w-4 h-4 text-sky-500" />

          <Select value={String(month)} onValueChange={v => setMonth(Number(v))}>
            <SelectTrigger className="w-[140px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"].map(
                (m, i) => (
                  <SelectItem key={m} value={String(i + 1)}>
                    {m}
                  </SelectItem>
                )
              )}
            </SelectContent>
          </Select>

          <Button size="icon" variant="ghost">
            <Download />
          </Button>
        </div>
      </div>

      {/* KPI */}
      <div className="grid md:grid-cols-2 lg:grid-cols-5 gap-5 mb-10">
        <MetricCard label="Employees" value={stats.totalEmployees} icon={<Users />} />
        <MetricCard label="Billable" value={stats.billable} icon={<Zap />} />
        <MetricCard label="Bench" value={stats.bench} icon={<Clock />} />
        <MetricCard label="Utilization" value={`${stats.avgUtilization}%`} icon={<TrendingUp />} />
        <MetricCard label="Revenue" value={lakh(stats.totalRevenue)} icon={<DollarSign />} />
      </div>

      {/* CHARTS */}
      <div className="grid lg:grid-cols-12 gap-6">
        <div className="lg:col-span-8">
          <Card>
            <CardHeader>
              <CardTitle>Revenue Trend</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer height={320}>
                <AreaChart data={revenue}>
                  <XAxis dataKey="month" />
                  <YAxis tickFormatter={lakh} />
                  <Tooltip formatter={v => money(Number(v))} />
                  <Area dataKey="revenue" stroke="#0ea5e9" fill="#bae6fd" />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* RIGHT PANEL */}
        <div className="lg:col-span-4 space-y-6">
          <Card className="bg-sky-600 text-white">
            <CardContent className="p-6">
              <Sparkles />
              <h2 className="font-black mt-3">AI Intelligence</h2>
              <div className="mt-4 space-y-2 text-sm">
                {suggestions.map((s: any, i: number) => (
                  <div key={i} className="bg-white/15 p-2 rounded">
                    {s.message}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Bench Employees</CardTitle>
            </CardHeader>
            <CardContent>
              {bench.map((b: any) => (
                <div key={b.employeeCode} className="flex justify-between mb-2">
                  <span>{b.name}</span>
                  <span className="text-rose-500 font-bold">
                    {safeNumber(b.idleHours)}h
                  </span>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

/* ================= COMPONENTS ================= */

function MetricCard({
  label,
  value,
  icon,
}: {
  label: string;
  value: string | number;
  icon: ReactNode;
}) {
  return (
    <motion.div whileHover={{ y: -4 }} className="bg-white p-6 rounded-3xl shadow">
      {icon}
      <p className="text-xs text-gray-400 mt-2">{label}</p>
      <h2 className="text-2xl font-black">{value}</h2>
    </motion.div>
  );
}