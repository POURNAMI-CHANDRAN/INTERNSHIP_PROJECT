import { useState, useEffect } from "react";
import api from "../../api/api";
import {
  Brain,
  Send,
  Loader2,
  AlertCircle,
  TrendingUp,
  Users,
  Briefcase,
  IndianRupee,
} from "lucide-react";

/* ================= TYPES ================= */

type InsightRow = Record<string, any>;

type AIResponse = {
  query: string;
  answer: string;
  insights: InsightRow[];
};

type DashboardSummary = {
  totalEmployees: number;
  billableEmployees: number;
  benchCount: number;
  averageUtilizationPct: number;
  revenueForecast: number;
};

/* ================= COMPONENT ================= */

export default function AIInsights() {
  const [question, setQuestion] = useState("");
  const [response, setResponse] = useState<AIResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [kpi, setKpi] = useState<DashboardSummary | null>(null);

  /* ================= LOAD DASHBOARD ================= */

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    try {
      const now = new Date();
      const month = now.getMonth() + 1;
      const year = now.getFullYear();

      const [utilizationRes, benchRes, revenueRes] = await Promise.all([
        api.get("/utilization", { params: { month, year } }),
        api.get("/bench", { params: { month, year } }),
        api.get("/revenue", { params: { month, year } }),
      ]);

      const utilization = utilizationRes.data?.data || [];
      const bench = benchRes.data?.data || [];
      const revenue = revenueRes.data?.data || [];

      const totalEmployees = utilization.length;

      const billableEmployees = utilization.filter(
        (e: any) => e.billableHours > 0
      ).length;

      const benchCount = bench.length;

      const averageUtilizationPct =
        totalEmployees > 0
          ? utilization.reduce(
              (sum: number, e: any) => sum + (e.utilizationPct || 0),
              0
            ) / totalEmployees
          : 0;

      const revenueForecast = revenue.reduce(
        (sum: number, r: any) => sum + (r.revenue || 0),
        0
      );

      setKpi({
        totalEmployees,
        billableEmployees,
        benchCount,
        averageUtilizationPct: Number(averageUtilizationPct.toFixed(2)),
        revenueForecast,
      });
    } catch (err) {
      console.error(err);
      setKpi(null);
    }
  };

  /* ================= AI CALL ================= */

  const askAI = async () => {
    if (!question.trim()) return;

    try {
      setLoading(true);
      setError("");

      const res = await api.post("/ai/ask", {
        question,
      });

      setResponse({
        query: question,
        answer: res.data?.answer,
        insights: res.data?.insights || [],
      });

      setQuestion("");
    } catch (err: any) {
      setError(err?.response?.data?.message || "AI request failed");
    } finally {
      setLoading(false);
    }
  };

  /* ================= SMART INSIGHT ENGINE ================= */

  const getInsightLabel = () => {
    if (!kpi) return "";

    if (kpi.averageUtilizationPct < 50)
      return "🔴 Low utilization – urgent resource optimization needed";

    if (kpi.averageUtilizationPct < 75)
      return "🟡 Moderate utilization – optimization needed";

    return "🟢 Healthy utilization";
  };

  /* ================= UI ================= */

  return (
    <div className="p-6 space-y-6">

      {/* HEADER */}
      <div className="flex items-center gap-3">
        <Brain className="text-indigo-600" />
        <h1 className="text-2xl font-bold">AI Insights Dashboard</h1>
      </div>

      {/* INPUT */}
      <div className="flex gap-2">
        <input
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          className="border p-3 w-full rounded-lg"
          placeholder="Ask AI about workforce..."
        />

        <button
          onClick={askAI}
          className="bg-black text-white px-5 rounded-lg flex items-center gap-2"
        >
          {loading ? <Loader2 className="animate-spin w-4 h-4" /> : <Send />}
          Ask
        </button>
      </div>

      {/* ERROR */}
      {error && (
        <div className="text-red-600 flex gap-2">
          <AlertCircle /> {error}
        </div>
      )}

      {/* KPI DASHBOARD */}
      {kpi && (
        <>
          <div className="grid grid-cols-4 gap-4 mt-4">

            <div className="p-4 border rounded-xl">
              <TrendingUp />
              <p>Utilization</p>
              <h2>{kpi.averageUtilizationPct}%</h2>
            </div>

            <div className="p-4 border rounded-xl">
              <Users />
              <p>Bench</p>
              <h2>{kpi.benchCount}</h2>
            </div>

            <div className="p-4 border rounded-xl">
              <Briefcase />
              <p>Billable</p>
              <h2>{kpi.billableEmployees}</h2>
            </div>

            <div className="p-4 border rounded-xl">
              <IndianRupee />
              <p>Revenue</p>
              <h2>₹{kpi.revenueForecast.toLocaleString()}</h2>
            </div>

          </div>

          {/* AI INSIGHT BANNER */}
          <div className="p-4 mt-4 border rounded-xl bg-yellow-50 text-yellow-800 font-medium">
            {getInsightLabel()}
          </div>
        </>
      )}

      {/* AI RESPONSE */}
      {response && (
        <div className="p-4 border rounded-xl space-y-2">
          <h2 className="font-bold text-lg">{response.answer}</h2>

          {response.insights.length > 0 && (
            <div className="text-sm text-gray-600">
              <pre>{JSON.stringify(response.insights, null, 2)}</pre>
            </div>
          )}
        </div>
      )}

    </div>
  );
}