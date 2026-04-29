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
  Activity,
  ShieldAlert,
  User,
  BadgeCheck,
} from "lucide-react";

/* ================= TYPES ================= */

type AIResponse = {
  query: string;
  answer: string;
  intent?: string;
  data?: any;
};

type DashboardSummary = {
  totalEmployees: number;
  benchCount: number;
  underutilizedCount: number;
  overallocatedCount: number;
  avgUtilization: number;
  totalRevenue: number;
  totalMargin: number;
};

/* ================= MAIN ================= */

export default function AIInsights() {
  const [question, setQuestion] = useState("");
  const [response, setResponse] = useState<AIResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [kpi, setKpi] = useState<DashboardSummary | null>(null);

  useEffect(() => {
    loadDashboard();
  }, []);

  /* ================= DASHBOARD ================= */

  const loadDashboard = async () => {
    try {
      const res = await api.post("/ai/ask", {
        question: "dashboard summary",
      });

      setKpi(res.data?.data || null);
    } catch (err) {
      console.error(err);
    }
  };

  /* ================= ASK AI ================= */

  const askAI = async () => {
    if (!question.trim()) return;

    try {
      setLoading(true);
      setError("");

      const res = await api.post("/ai/ask", { question });

      const normalized: AIResponse = {
        query: question,
        answer: res.data?.answer || "No answer generated",
        intent: res.data?.intent || "UNKNOWN",
        data: res.data?.data ?? res.data?.contextUsed ?? [],
      };

      setResponse(normalized);
      setQuestion("");
    } catch (err: any) {
      setError(err?.response?.data?.error || "AI Request Failed");
    } finally {
      setLoading(false);
    }
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") askAI();
  };

  /* ================= UI ================= */

  return (
    <div className="min-h-screen bg-sky-50 p-6 space-y-6 text-slate-800">

      {/* HEADER */}
      <div className="flex items-center gap-3">
        <div className="p-3 bg-sky-500 rounded-2xl shadow-md">
          <Brain className="w-6 h-6 text-white" />
        </div>

        <div>
          <h1 className="text-3xl font-black text-slate-900">
            <span className="text-sky-600">Alloc</span>AI
          </h1>
          <p className="text-sky-700 text-sm">
            Smart staffing insights dashboard
          </p>
        </div>
      </div>

      {/* INPUT */}
      <div className="bg-white border border-sky-200 rounded-2xl p-4 flex gap-3">
        <input
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          onKeyDown={onKeyDown}
          placeholder="Ask about staffing, bench, revenue..."
          className="w-full border border-sky-300 rounded-xl px-4 py-3"
        />

        <button
          onClick={askAI}
          className="bg-sky-500 hover:bg-sky-600 text-white px-5 rounded-xl flex items-center gap-2"
        >
          {loading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Send className="w-4 h-4" />
          )}
          Ask
        </button>
      </div>

      {/* ERROR */}
      {error && (
        <div className="bg-red-50 border border-red-300 text-red-700 rounded-xl p-3 flex gap-2">
          <AlertCircle className="w-4 h-4" />
          {error}
        </div>
      )}

      {/* KPI */}
      {kpi && (
        <div className="grid md:grid-cols-4 gap-4">
          <Card icon={<TrendingUp />} title="Utilization" value={`${kpi.avgUtilization ?? 0}%`} />
          <Card icon={<Users />} title="Bench" value={kpi.benchCount ?? 0} />
          <Card icon={<Briefcase />} title="Revenue" value={`₹${kpi.totalRevenue ?? 0}`} />
          <Card icon={<IndianRupee />} title="Margin" value={`₹${kpi.totalMargin ?? 0}`} />
        </div>
      )}

      {/* QUICK ACTIONS */}
      <div className="grid md:grid-cols-3 gap-3">
        <QuickButton label="Who is on Bench?" setQuestion={setQuestion} />
        <QuickButton label="Forecast Revenue" setQuestion={setQuestion} />
        <QuickButton label="Need React Developers" setQuestion={setQuestion} />
      </div>

      {/* RESPONSE */}
      {response && (
        <div className="bg-white border border-sky-200 rounded-2xl p-5 space-y-4">

          <div className="flex items-center gap-2">
            <Activity className="w-5 h-5 text-sky-600" />
            <h2 className="font-bold text-xl text-sky-900">
              {response.intent === "GENERAL_RAG"
                ? "AI Insights Generated"
                : response.answer}
            </h2>
          </div>

          <p className="text-sm text-slate-500">
            Intent: {response.intent}
          </p>

          <RenderAIData data={response.data} />
        </div>
      )}

      {/* FOOTER */}
      <div className="text-xs text-slate-500 flex gap-2">
        <ShieldAlert className="w-4 h-4" />
        Internal AI insights powered by company data
      </div>
    </div>
  );
}

/* ================= DATA RENDERER ================= */

function RenderAIData({ data }: any) {
  if (!data) return null;

  const list = Array.isArray(data) ? data : [data];

  return (
    <div className="space-y-4">
      {list.map((row: any, index: number) => (
        <EmployeeCard
          key={`${row._id || index}-${index}`}
          row={row}
        />
      ))}
    </div>
  );
}

/* ================= CARD ================= */

function EmployeeCard({ row }: any) {
  return (
    <div className="bg-sky-50 border border-sky-200 rounded-2xl p-5 space-y-3">

      <div className="flex justify-between">
        <h3 className="font-bold flex items-center gap-2">
          <User className="w-4 h-4 text-sky-600" />
          {row.name || "Unknown"}
        </h3>

        {row.recommendation && (
          <span className="bg-sky-500 text-white px-2 py-1 text-xs rounded-full flex items-center gap-1">
            <BadgeCheck className="w-3 h-3" />
            {row.recommendation}
          </span>
        )}
      </div>

      <div className="grid md:grid-cols-2 gap-3">
        {Object.entries(row)
          .filter(([key]) =>
            !["_id", "name", "id", "recommendation"].includes(key)
          )
          .map(([key, value]) => (
            <div
              key={`${key}-${row._id || ""}`}
              className="bg-white border border-sky-200 rounded-xl p-3"
            >
              <p className="text-xs text-slate-500">{key}</p>
              <p className="font-semibold break-words">
                {formatValue(value)}
              </p>
            </div>
          ))}
      </div>
    </div>
  );
}

/* ================= HELPERS ================= */

function formatValue(value: any) {
  if (value === null || value === undefined) return "-";

  if (Array.isArray(value)) {
    return value.map(v =>
      typeof v === "object" ? v.name || v.skill || JSON.stringify(v) : v
    ).join(", ");
  }

  if (typeof value === "object") {
    return value.name || value.title || JSON.stringify(value);
  }

  return String(value);
}

/* ================= UI COMPONENTS ================= */

function Card({ icon, title, value }: any) {
  return (
    <div className="bg-white border border-sky-200 rounded-2xl p-4">
      <div className="text-sky-600">{icon}</div>
      <p className="text-sm text-slate-500">{title}</p>
      <h2 className="text-2xl font-bold">{value}</h2>
    </div>
  );
}

function QuickButton({ label, setQuestion }: any) {
  return (
    <button
      onClick={() => setQuestion(label)}
      className="bg-white border border-sky-200 rounded-xl p-3 text-left hover:bg-sky-50"
    >
      {label}
    </button>
  );
}