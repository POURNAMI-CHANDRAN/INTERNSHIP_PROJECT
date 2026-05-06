import { useState, useEffect, useCallback, KeyboardEvent, ReactNode, useMemo } from "react";
import api from "../../api/api";
import {
  Brain,
  Send,
  Loader2,
  TrendingUp,
  Users,
  Briefcase,
  IndianRupee,
  Sparkles,
  Search,
  ChevronRight,
  LayoutDashboard
} from "lucide-react";


/* ================= TYPES ================= */

type AIResponse = {
  query: string;
  answer: string;
  intent: string;
  entities: Record<string, unknown>[];
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

/* ================= HELPERS ================= */

const toNumber = (v: unknown): number => {
  if (typeof v === "number") return v;
  if (typeof v === "string") {
    const n = Number(v.replace(/[^\d.]/g, ""));
    return Number.isFinite(n) ? n : 0;
  }
  return 0;
};

const formatINR = (v: unknown) => 
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0
  }).format(toNumber(v));

const extractEntities = (res: any): Record<string, unknown>[] => {
  // ✅ 1. Top-level results (MOST IMPORTANT FIX)
  if (Array.isArray(res?.results)) return res.results;

  // ✅ 2. Standard data holders
  const data = res?.data;

  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.results)) return data.results;
  if (Array.isArray(data?.data)) return data.data;

  // ✅ 3. Fallback: find any array inside data
  if (data && typeof data === "object") {
    const found = Object.values(data).find(Array.isArray);
    if (Array.isArray(found)) return found;
  }

  return [];
};

/* ================= COMPONENT ================= */

export default function AIInsights() {
  const [question, setQuestion] = useState<string>("");
  const [response, setResponse] = useState<AIResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [kpi, setKpi] = useState<DashboardSummary | null>(null);
  const [loadingAI, setLoadingAI] = useState(false);

  const loadDashboard = useCallback(async () => {
    try {
      setLoadingAI(true);

      const res = await api.post("/ai/ask", { question: "Dashboard Summary" });
      const d = res.data?.data ?? {};

      setKpi({
        totalEmployees: toNumber(d.totalEmployees),
        benchCount: toNumber(d.benchCount),
        underutilizedCount: toNumber(d.underutilizedCount),
        overallocatedCount: toNumber(d.overallocatedCount),
        avgUtilization: toNumber(d.avgUtilization),
        totalRevenue: toNumber(d.totalRevenue),
        totalMargin: toNumber(d.totalMargin),
      });

    } catch (err) {
      console.error("Dashboard Load Failed", err);
    } finally {
      setLoadingAI(false);
    }
  }, [api, setKpi]);

  const askAI = useCallback(async () => {
    if (!question.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const res = await api.post("/ai/ask", { question });
      setResponse({
        query: question,
        answer: res.data?.answer ?? "Analysis Complete.",
        intent: res.data?.intent ?? "GENERAL_QUERY",
        entities: extractEntities(res.data),
      });
      setQuestion("");
    } catch (err) {
      setError("I Encountered an Issue Processing that Request.");
    } finally {
      setLoading(false);
    }
  }, [question]);

  const metrics = useMemo(() => {
    if (!kpi) return null;
    return [
      { icon: <Users size={20} />, 
        title: "Head Count", 
        value: kpi.totalEmployees, 
        color: "text-blue-600" },

      { icon: <TrendingUp size={20} />, 
      title: "Utilization", 
      value: `${kpi.avgUtilization}%`, 
      color: "text-emerald-600" },

      { icon: <Briefcase size={20} />, 
        title: "Revenue", 
        value: formatINR(kpi.totalRevenue), 
        color: "text-indigo-600" },

      { icon: <IndianRupee size={20} />, 
        title: "Gross Margin", 
        value: formatINR(kpi.totalMargin), 
        color: "text-sky-600" },
    ];
  }, [kpi]);

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-900 font-sans selection:bg-sky-100">
      <div className="max-w-6xl mx-auto p-6 space-y-8">
        
        {/* HEADER */}
        <header className="flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="bg-sky-600 p-2 rounded-xl shadow-lg shadow-sky-200">
              <Brain className="text-white" size={28} />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">AllocAI <span className="text-sky-600">Insights</span></h1>
              <p className="text-xs text-slate-500 font-medium uppercase tracking-wider">Enterprise Intelligence</p>
            </div>
          </div>
          <button onClick={loadDashboard} className="p-2 hover:bg-slate-200 rounded-full transition-colors">
            <LayoutDashboard size={20} className="text-slate-600" />
          </button>
        </header>

        {/* INPUT SECTION */}
        <div className="relative group">
          <div className="absolute -inset-1 bg-gradient-to-r from-sky-400 to-indigo-400 rounded-2xl blur opacity-25 group-focus-within:opacity-50 transition duration-1000"></div>
          <div className="relative flex items-center bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden px-4">
            <Search className="text-slate-400" size={20} />
            <input
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && askAI()}
              className="flex-1 p-5 focus:outline-none text-lg placeholder:text-slate-400"
              placeholder="Ask about project staffing, bench costs, or revenue forecasts..."
            />
            <button
              onClick={askAI}
              disabled={loading || !question.trim()}
              className="bg-slate-900 hover:bg-sky-600 disabled:bg-slate-200 text-white p-3 rounded-xl transition-all duration-200 flex items-center gap-2"
            >
              {loading ? <Loader2 className="animate-spin" size={20} /> : <Sparkles size={20} />}
            </button>
          </div>
        </div>

        {/* KPI GRID */}
        {metrics && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {metrics.map((m, i) => (
              <MetricCard key={i} {...m} />
            ))}
          </div>
        )}

        {/* MAIN CONTENT AREA */}
        <div className="grid grid-cols-1 gap-6">
          {error && (
            <div className="bg-red-50 border border-red-100 text-red-600 p-4 rounded-2xl flex items-center gap-3 animate-in fade-in slide-in-from-top-2">
              <div className="bg-red-100 p-1 rounded-full text-red-600">!</div>
              {error}
            </div>
          )}

          {response && (
            <div className="bg-white border border-slate-200 rounded-3xl shadow-xl shadow-slate-200/50 overflow-hidden animate-in zoom-in-95 duration-300">
              <div className="bg-slate-50 border-b border-slate-100 p-6">
                <div className="flex items-center gap-2 text-sky-600 mb-2">
                  <Sparkles size={16} />
                  <span className="text-xs font-bold uppercase tracking-widest">AI Intelligence Report</span>
                </div>
                <h2 className="text-2xl font-semibold text-slate-800 leading-tight">
                  {response.answer}
                </h2>
              </div>
              
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider">Contextual Data</h3>
                  <span className="px-3 py-1 bg-slate-100 text-slate-600 rounded-full text-xs font-medium">
                    Intent: {response.intent}
                  </span>
                </div>

                {response.entities.length === 0 ? (
                  <div className="py-10 text-center border-2 border-dashed border-slate-100 rounded-2xl">
                    <p className="text-slate-400">No matching records found for this query.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {response.entities.map((e, i) => (
                      <EntityCard key={i} data={e} />
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ================= UPGRADED UI COMPONENTS ================= */

function EntityCard({ data }: { data: Record<string, unknown> }) {
  // Try to find a primary label like "name" or "title"
  const entries = Object.entries(data);
  const titleKey = entries.find(([k]) => /name|title|id/i.test(k))?.[0] || entries[0][0];
  
  return (
    <div className="group border border-slate-100 bg-slate-50/50 hover:bg-white hover:border-sky-200 hover:shadow-md transition-all duration-200 p-4 rounded-2xl">
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <p className="text-xs font-bold text-sky-600 uppercase tracking-tighter">{titleKey}</p>
          <p className="text-lg font-bold text-slate-800">{String(data[titleKey])}</p>
        </div>
        <ChevronRight size={18} className="text-slate-300 group-hover:text-sky-400 transition-colors" />
      </div>
      <div className="mt-3 pt-3 border-t border-slate-100 grid grid-cols-2 gap-2">
        {entries.filter(([k]) => k !== titleKey).slice(0, 4).map(([k, v]) => (
          <div key={k} className="overflow-hidden">
            <p className="text-[10px] text-slate-400 uppercase font-bold truncate">{k}</p>
            <p className="text-sm font-medium text-slate-600 truncate">{String(v)}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function MetricCard({ icon, title, value, color }: { icon: ReactNode; title: string; value: string | number; color: string }) {
  return (
    <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
      <div className={`${color} bg-opacity-10 p-2 w-fit rounded-lg mb-3`}>
        {icon}
      </div>
      <p className="text-sm font-medium text-slate-500">{title}</p>
      <h2 className="text-2xl font-bold text-slate-900 mt-1">{value}</h2>
    </div>
  );
}