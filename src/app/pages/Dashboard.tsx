import React, { useState, useMemo } from "react";
import { motion } from "framer-motion";
import {
  Users,
  DollarSign,
  TrendingUp,
  Clock,
  Sparkles,
  Calendar,
  Download,
  ArrowUpRight,
  Zap,
} from "lucide-react";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
  Legend,
  LabelList,
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

/* =====================================================
   HELPERS
===================================================== */
const money = (n: number) =>
  `₹${Number(n || 0).toLocaleString("en-IN")}`;

const lakh = (n: number) =>
  `₹${(Number(n || 0) / 100000).toFixed(1)}L`;

const safe = (v: any) =>
  Number(v || 0);

/* =====================================================
   MAIN
===================================================== */
export default function PremiumDashboard() {
  const [selectedMonth, setSelectedMonth] =
    useState(new Date().getMonth() + 1);

  const selectedYear =
    new Date().getFullYear();

  const {
    loading,
    utilization = [],
    bench = [],
    revenue = [],
    suggestions = [],
  } = useAnalytics(
    selectedMonth,
    selectedYear
  );

  /* =====================================================
     CLEAN BACKEND MAPPING
  ===================================================== */
  const stats = useMemo(() => {
    const totalEmployees =
      utilization.length;

    const billable =
      utilization.filter(
        (row: any) =>
          safe(
            row.allocatedHours
          ) > 0
      ).length;

    const benchCount =
      bench.length;

    const avgUtilization =
      totalEmployees > 0
        ? Math.round(
            utilization.reduce(
              (
                sum: number,
                row: any
              ) =>
                sum +
                safe(
                  row.utilizationPct ||
                    row.utilization
                ),
              0
            ) / totalEmployees
          )
        : 0;

    const totalRevenue =
      revenue.reduce(
        (
          sum: number,
          row: any
        ) =>
          sum +
          safe(
            row.revenue
          ),
        0
      );

    return {
      totalEmployees,
      billable,
      benchCount,
      avgUtilization,
      totalRevenue,
    };
  }, [
    utilization,
    bench,
    revenue,
  ]);

  /* =====================================================
     CHART DATA CLEANING
  ===================================================== */
  const revenueData =
    revenue.map(
      (r: any, i: number) => ({
        name:
          r.projectName ||
          r.project ||
          `Project ${i + 1}`,
        revenue: safe(
          r.revenue
        ),
      })
    );

  if (loading)
    return <PremiumSkeleton />;

  return (
    <div className="min-h-screen bg-sky-50 p-6 lg:p-10 text-slate-900">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between gap-6 mb-10">
        <div>
          <p className="text-xs uppercase tracking-[4px] text-sky-600 font-bold mb-2">
            Executive Dashboard
          </p>

          <h1 className="text-4xl font-black">
            Workforce{" "}
            <span className="text-sky-600">
              OS
            </span>
          </h1>
        </div>

        <div className="bg-white rounded-2xl px-4 py-2 border border-sky-100 shadow-sm flex items-center gap-3">
          <Calendar className="w-4 h-4 text-sky-500" />

          <Select
            value={selectedMonth.toString()}
            onValueChange={(
              v
            ) =>
              setSelectedMonth(
                Number(v)
              )
            }
          >
            <SelectTrigger className="w-[140px] border-none shadow-none">
              <SelectValue />
            </SelectTrigger>

            <SelectContent>
              {[
                "January",
                "February",
                "March",
                "April",
                "May",
                "June",
                "July",
                "August",
                "September",
                "October",
                "November",
                "December",
              ].map(
                (
                  month,
                  index
                ) => (
                  <SelectItem
                    key={month}
                    value={String(
                      index + 1
                    )}
                  >
                    {month}
                  </SelectItem>
                )
              )}
            </SelectContent>
          </Select>

          <Button
            size="icon"
            variant="ghost"
          >
            <Download className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* KPI */}
      <div className="grid md:grid-cols-2 lg:grid-cols-5 gap-5 mb-10">
        <MetricCard
          label="Employees"
          value={
            stats.totalEmployees
          }
          trend="+4"
          icon={<Users />}
          color="sky"
        />

        <MetricCard
          label="Billable"
          value={stats.billable}
          trend="+2"
          icon={<Zap />}
          color="green"
        />

        <MetricCard
          label="Bench"
          value={
            stats.benchCount
          }
          trend="-1"
          icon={<Clock />}
          color="red"
        />

        <MetricCard
          label="Utilization"
          value={`${stats.avgUtilization}%`}
          trend="+3%"
          icon={
            <TrendingUp />
          }
          color="violet"
        />

        <MetricCard
          label="Revenue"
          value={lakh(
            stats.totalRevenue
          )}
          trend="+8%"
          icon={
            <DollarSign />
          }
          color="amber"
        />
      </div>

      {/* BODY */}
      <div className="grid lg:grid-cols-12 gap-6">
        {/* LEFT */}
        <div className="lg:col-span-8 space-y-6">
          <div className="grid md:grid-cols-2 gap-6">
            {/* PIE */}
            <ChartCard
              title="Workforce Split"
              subtitle="Billable vs Bench"
            >
              <div className="h-[280px]">
                <ResponsiveContainer>
                  <PieChart>
                    <Pie
                      data={[
                        {
                          name: "Billable",
                          value:
                            stats.billable,
                        },
                        {
                          name: "Bench",
                          value:
                            stats.benchCount,
                        },
                      ]}
                      dataKey="value"
                      nameKey="name"
                      innerRadius={60}
                      outerRadius={90}
                      label
                    >
                      <Cell fill="#0ea5e9" />
                      <Cell fill="#f43f5e" />
                    </Pie>

                    <Legend />
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </ChartCard>

            {/* BAR */}
            <ChartCard
              title="Top Revenue Projects"
              subtitle="Highest earning projects"
            >
              <div className="h-[280px]">
                <ResponsiveContainer>
                  <BarChart
                    data={revenueData.slice(
                      0,
                      5
                    )}
                    layout="vertical"
                    margin={{
                      left: 20,
                    }}
                  >
                    <CartesianGrid
                      strokeDasharray="3 3"
                    />

                    <XAxis
                      type="number"
                      tickFormatter={
                        lakh
                      }
                    />

                    <YAxis
                      dataKey="name"
                      type="category"
                      width={120}
                    />

                    <Tooltip
                      formatter={(
                        v
                      ) =>
                        money(
                          Number(v)
                        )
                      }
                    />

                    <Bar
                      dataKey="revenue"
                      fill="#38bdf8"
                      radius={[
                        0,
                        10,
                        10,
                        0,
                      ]}
                    >
                      <LabelList
                        dataKey="revenue"
                        position="right"
                        formatter={
                          lakh
                        }
                      />
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </ChartCard>
          </div>

          {/* AREA */}
          <ChartCard
            title="Revenue Trend"
            subtitle="Monthly project revenue"
          >
            <div className="h-[340px]">
              <ResponsiveContainer>
                <AreaChart
                  data={
                    revenueData
                  }
                >
                  <defs>
                    <linearGradient
                      id="fillBlue"
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >
                      <stop
                        offset="5%"
                        stopColor="#0ea5e9"
                        stopOpacity={
                          0.4
                        }
                      />
                      <stop
                        offset="95%"
                        stopColor="#0ea5e9"
                        stopOpacity={
                          0
                        }
                      />
                    </linearGradient>
                  </defs>

                  <CartesianGrid
                    stroke="#e2e8f0"
                    strokeDasharray="3 3"
                  />

                  <XAxis
                    dataKey="name"
                    tick={{
                      fontSize: 10,
                    }}
                  />

                  <YAxis
                    tickFormatter={
                      lakh
                    }
                  />

                  <Tooltip
                    formatter={(
                      v
                    ) =>
                      money(
                        Number(v)
                      )
                    }
                  />

                  <Area
                    type="monotone"
                    dataKey="revenue"
                    stroke="#0ea5e9"
                    fill="url(#fillBlue)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </ChartCard>
        </div>

        {/* RIGHT */}
        <div className="lg:col-span-4 space-y-6">
          {/* AI */}
          <Card className="rounded-3xl bg-sky-600 text-white border-0 shadow-xl">
            <CardContent className="p-7">
              <Sparkles className="mb-4" />

              <p className="text-xs uppercase tracking-[4px] mb-2">
                AI Strategist
              </p>

              <h3 className="text-2xl font-black mb-5">
                Suggestions
              </h3>

              <div className="space-y-3 mb-6">
                {suggestions.length >
                0 ? (
                  suggestions.map(
                    (
                      s: any,
                      i: number
                    ) => (
                      <div
                        key={i}
                        className="bg-white/15 rounded-xl p-3 text-sm"
                      >
                        {s.message}
                      </div>
                    )
                  )
                ) : (
                  <div className="bg-white/15 rounded-xl p-3 text-sm">
                    No suggestions available
                  </div>
                )}
              </div>

              <Button className="w-full bg-white text-sky-700 hover:bg-sky-100 rounded-xl">
                Run Optimization
              </Button>
            </CardContent>
          </Card>

          {/* BENCH */}
          <ChartCard
            title="Bench Employees"
            subtitle="Currently unallocated"
          >
            <div className="space-y-4">
              {bench
                .slice(0, 5)
                .map(
                  (
                    row: any,
                    i: number
                  ) => (
                    <div
                      key={
                        row.employeeId ||
                        i
                      }
                      className="bg-sky-50 rounded-xl p-3 flex justify-between"
                    >
                      <div>
                        <p className="font-bold text-sm">
                          {
                            row.name
                          }
                        </p>

                        <p className="text-xs text-slate-500">
                          {
                            row.employeeCode
                          }
                        </p>
                      </div>

                      <div className="text-right">
                        <p className="font-bold text-rose-500">
                          {safe(
                            row.idleHours
                          )}
                          h
                        </p>

                        <p className="text-xs text-slate-400">
                          Idle
                        </p>
                      </div>
                    </div>
                  )
                )}
            </div>
          </ChartCard>
        </div>
      </div>
    </div>
  );
}

/* =====================================================
   KPI CARD
===================================================== */
function MetricCard({
  label,
  value,
  trend,
  icon,
  color,
}: any) {
  const colors: any = {
    sky: "bg-sky-100 text-sky-600",
    green:
      "bg-emerald-100 text-emerald-600",
    red: "bg-rose-100 text-rose-600",
    violet:
      "bg-indigo-100 text-indigo-600",
    amber:
      "bg-amber-100 text-amber-600",
  };

  return (
    <motion.div
      whileHover={{
        y: -4,
      }}
      className="bg-white rounded-3xl p-6 border border-sky-100 shadow-sm"
    >
      <div className="flex justify-between mb-5">
        <div
          className={`p-3 rounded-2xl ${colors[color]}`}
        >
          {React.cloneElement(
            icon,
            {
              size: 22,
            }
          )}
        </div>

        <span className="text-xs font-bold text-emerald-600">
          <ArrowUpRight className="inline w-3 h-3 mr-1" />
          {trend}
        </span>
      </div>

      <p className="text-xs uppercase tracking-wider text-slate-400 font-bold">
        {label}
      </p>

      <h2 className="text-3xl font-black mt-1">
        {value}
      </h2>
    </motion.div>
  );
}

/* =====================================================
   CHART CARD
===================================================== */
function ChartCard({
  title,
  subtitle,
  children,
}: any) {
  return (
    <Card className="rounded-3xl bg-white border border-sky-100 shadow-sm">
      <CardHeader>
        <CardTitle className="text-xl font-black">
          {title}
        </CardTitle>

        <p className="text-sm text-slate-500">
          {subtitle}
        </p>
      </CardHeader>

      <CardContent>
        {children}
      </CardContent>
    </Card>
  );
}

/* =====================================================
   LOADING
===================================================== */
function PremiumSkeleton() {
  return (
    <div className="min-h-screen bg-sky-50 p-10 animate-pulse">
      <div className="h-10 w-56 rounded-full bg-sky-100 mb-8" />

      <div className="grid grid-cols-5 gap-4 mb-8">
        {[1, 2, 3, 4, 5].map(
          (i) => (
            <div
              key={i}
              className="h-32 bg-white rounded-3xl"
            />
          )
        )}
      </div>

      <div className="grid grid-cols-12 gap-6">
        <div className="col-span-8 h-96 bg-white rounded-3xl" />
        <div className="col-span-4 h-96 bg-white rounded-3xl" />
      </div>
    </div>
  );
}