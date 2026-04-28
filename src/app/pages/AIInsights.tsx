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
  Sparkles,
  Activity,
  ShieldAlert,
  User,
  BadgeCheck,
} from "lucide-react";

/* =====================================================
   TYPES
===================================================== */
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

/* =====================================================
   MAIN COMPONENT
===================================================== */
export default function AIInsights() {
  const [question, setQuestion] = useState("");
  const [response, setResponse] =
    useState<AIResponse | null>(null);

  const [loading, setLoading] =
    useState(false);

  const [error, setError] =
    useState("");

  const [kpi, setKpi] =
    useState<DashboardSummary | null>(
      null
    );

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard =
    async () => {
      try {
        const res =
          await api.post(
            "/ai/ask",
            {
              question:
                "dashboard summary",
            }
          );

        setKpi(
          res.data?.data ||
            null
        );
      } catch (err) {
        console.error(err);
      }
    };

  const askAI =
    async () => {
      if (!question.trim())
        return;

      try {
        setLoading(true);
        setError("");

        const res =
          await api.post(
            "/ai/ask",
            {
              question,
            }
          );

        setResponse({
          query:
            question,
          answer:
            res.data?.answer,
          intent:
            res.data?.intent,
          data:
            res.data?.data,
        });

        setQuestion("");
      } catch (
        err: any
      ) {
        setError(
          err?.response
            ?.data
            ?.error ||
            "AI Request Failed"
        );
      } finally {
        setLoading(
          false
        );
      }
    };

  const onKeyDown = (
    e: React.KeyboardEvent<HTMLInputElement>
  ) => {
    if (
      e.key ===
      "Enter"
    ) {
      askAI();
    }
  };

  return (
    <div className="min-h-screen bg-sky-50 p-6 space-y-6 text-slate-800">
      {/* HEADER */}
      <div className="flex items-center gap-3">
        <div className="p-3 bg-sky-500 rounded-2xl shadow-md">
          <Brain className="w-6 h-6 text-white" />
        </div>

        <div>
        <h1 className="text-3xl font-black text-slate-900 tracking-tight">
          <span className="text-sky-600">Alloc</span>AI
        </h1>
          <p className="text-sky-700 text-sm">
            Smart staffing insights dashboard
          </p>
        </div>
      </div>

      {/* ASK BOX */}
      <div className="bg-white border border-sky-200 rounded-2xl shadow-md p-4 flex gap-3">
        <input
          value={question}
          onChange={(e) =>
            setQuestion(
              e.target.value
            )
          }
          onKeyDown={onKeyDown}
          placeholder="Ask about staffing, bench, revenue..."
          className="w-full border border-sky-300 rounded-xl px-4 py-3 bg-white text-slate-800 placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-sky-300"
        />

        <button
          onClick={askAI}
          className="bg-sky-500 hover:bg-sky-600 text-white px-5 rounded-xl flex items-center gap-2 font-semibold"
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
        <>
          <div className="grid md:grid-cols-4 gap-4">
          <Card
            icon={<TrendingUp />}
            title="Utilization"
            value={`₹${(kpi?.avgUtilization || 0).toLocaleString()}`}
          />

          <Card
            icon={<Users />}
            title="Bench"
            value={`₹${(kpi?.benchCount || 0).toLocaleString()}`}
          />

          <Card
            icon={<Briefcase />}
            title="Revenue"
            value={`₹${(kpi?.totalRevenue || 0).toLocaleString()}`}
          />

          <Card
            icon={<IndianRupee />}
            title="Margin"
            value={`₹${(kpi?.totalMargin || 0).toLocaleString()}`}
          />
          </div>

          <div className="bg-sky-100 border border-sky-300 rounded-2xl p-4 text-sky-900 font-semibold flex gap-2">
            <Sparkles className="w-4 h-4" />
            Workforce Insights Ready
          </div>
        </>
      )}

      {/* QUICK BUTTONS */}
      <div className="grid md:grid-cols-3 gap-3">
        <QuickButton
          label="Who is on Bench?"
          setQuestion={
            setQuestion
          }
        />

        <QuickButton
          label="Forecast Revenue"
          setQuestion={
            setQuestion
          }
        />

        <QuickButton
          label="Need React Developers"
          setQuestion={
            setQuestion
          }
        />
      </div>

      {/* RESPONSE */}
      {response && (
        <div className="bg-white border border-sky-200 rounded-2xl shadow-md p-5 space-y-4">
          <div className="flex items-center gap-2">
            <Activity className="w-5 h-5 text-sky-600" />
            <h2 className="font-bold text-xl text-sky-900">
              {response.data}
            </h2>
          </div>

          <p className="text-sm text-slate-500">
            Intent:{" "}
            {response.intent}
          </p>

          <RenderAIData
            data={
              response.data
            }
          />
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

/* =====================================================
   DATA RENDERER
===================================================== */
function RenderAIData({
  data,
}: any) {
  if (
    data === null ||
    data === undefined
  )
    return null;

  if (
    Array.isArray(data)
  ) {
    return (
      <div className="space-y-4">
        {data.map(
          (
            row,
            index
          ) => (
            <EmployeeCard
              key={index}
              row={row}
            />
          )
        )}
      </div>
    );
  }

  if (
    typeof data ===
    "object"
  ) {
    return (
      <div className="grid md:grid-cols-2 gap-4">
        {Object.entries(
          data
        ).map(
          ([
            key,
            value,
          ]) => (
            <div
              key={key}
              className="bg-sky-50 border border-sky-200 rounded-xl p-4"
            >
              <p className="text-xs uppercase text-slate-500 mb-2">
                {beautifyKey(
                  key
                )}
              </p>

              <p className="text-xl font-bold text-slate-800">
                {formatValue(
                  key,
                  value
                )}
              </p>
            </div>
          )
        )}
      </div>
    );
  }

  return (
    <div className="font-semibold text-slate-800">
      {String(data)}
    </div>
  );
}

/* =====================================================
   EMPLOYEE CARD
===================================================== */
function EmployeeCard({
  row,
}: any) {
  const cleanId =
    row.employeeCode ||
    row.employeeId ||
    row.id ||
    "-";

  return (
    <div className="bg-sky-50 border border-sky-200 rounded-2xl p-5 space-y-4">
      <div className="flex justify-between items-start">
        <div>
          <h3 className="font-bold text-lg flex items-center gap-2 text-slate-800">
            <User className="w-4 h-4 text-sky-600" />
            {row.name ||
              "Employee"}
          </h3>

          <p className="text-sm text-sky-700 font-medium">
            ID: {cleanId}
          </p>
        </div>

        {row.recommendation && (
          <span className="px-3 py-1 text-xs rounded-full bg-sky-500 text-white font-semibold flex items-center gap-1">
            <BadgeCheck className="w-3 h-3" />
            {
              row.recommendation
            }
          </span>
        )}
      </div>

      <div className="grid md:grid-cols-2 gap-3">
        {Object.entries(
          row
        )
          .filter(
            ([key]) =>
              ![
                "name",
                "employeeId",
                "employeeCode",
                "id",
                "recommendation",
              ].includes(
                key
              )
          )
          .map(
            ([
              key,
              value,
            ]) => (
              <div
                key={key}
                className="bg-white border border-sky-200 rounded-xl p-3"
              >
                <p className="text-xs text-slate-500 mb-1">
                  {beautifyKey(
                    key
                  )}
                </p>

                <p className="font-semibold text-slate-800 break-words">
                  {formatValue(
                    key,
                    value
                  )}
                </p>
              </div>
            )
          )}
      </div>
    </div>
  );
}

/* =====================================================
   HELPERS
===================================================== */
function formatValue(
  key: string,
  value: any
) {
  if (
    Array.isArray(value)
  ) {
    return value
      .map((item) =>
        typeof item ===
        "object"
          ? item.name ||
            item.skillName ||
            item.skill ||
            "-"
          : item
      )
      .join(", ");
  }

  if (
    typeof value ===
      "object" &&
    value !== null
  ) {
    return (
      value.name ||
      value.skillName ||
      value.skill ||
      "-"
    );
  }

  if (
    typeof value ===
    "number"
  ) {
    const k =
      key.toLowerCase();

    if (
      k.includes(
        "revenue"
      ) ||
      k.includes(
        "margin"
      )
    ) {
      return `₹${value.toLocaleString()}`;
    }

    if (
      k.includes(
        "pct"
      ) ||
      k.includes(
        "utilization"
      )
    ) {
      return `${value}%`;
    }

    if (
      k.includes(
        "hours"
      )
    ) {
      return `${value} hrs`;
    }
  }

  return String(value);
}

function beautifyKey(
  text: string
) {
  return text
    .replace(
      /([A-Z])/g,
      " $1"
    )
    .replace(
      /_/g,
      " "
    )
    .trim();
}

/* =====================================================
   CARD
===================================================== */
function Card({
  icon,
  title,
  value,
}: any) {
  return (
    <div className="bg-white border border-sky-200 rounded-2xl p-4 shadow-md">
      <div className="text-sky-600 mb-2">
        {icon}
      </div>

      <p className="text-sm text-slate-500">
        {title}
      </p>

      <h2 className="text-2xl font-bold text-slate-800">
        {value}
      </h2>
    </div>
  );
}

/* =====================================================
   QUICK BUTTON
===================================================== */
function QuickButton({
  label,
  setQuestion,
}: any) {
  return (
    <button
      onClick={() =>
        setQuestion(
          label
        )
      }
      className="bg-white border border-sky-200 rounded-xl p-3 text-left text-slate-700 hover:bg-sky-50 transition font-medium"
    >
      {label}
    </button>
  );
}