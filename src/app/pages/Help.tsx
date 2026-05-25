// FILE: src/pages/HelpPage.tsx

import { useMemo, useState, useEffect } from "react";
import {
  HelpCircle,
  Search,
  LayoutDashboard,
  Users,
  FolderKanban,
  ArrowRightLeft,
  BarChart3,
  Filter,
  AlertTriangle,
  BrainCircuit,
  Wrench,
  ChevronDown,
  ChevronUp,
  Mail,
  Phone,
  BookOpen,
  CheckCircle,
  Clock,
  Sparkles,
  Info,
  Terminal,
  Compass,
  CornerDownRight,
} from "lucide-react";

const ENHANCED_SECTIONS = [
  {
    id: "dashboard",
    title: "Dashboard Overview",
    icon: LayoutDashboard,
    tagline: "High-level operational summary & baseline health metrics",
    metrics: ["Total Employees", "Active Projects", "Bench %", "Total FTE", "Utilization %"],
    fteRules: [
      { fte: "1.0 FTE", hours: "160 Hours / Month", desc: "Standard Full-Time Baseline" },
      { fte: "0.5 FTE", hours: "80 Hours / Month", desc: "Half-Time Allocation" },
      { fte: "2.0 FTE", hours: "320 Hours / Month", desc: "Double Over-Allocation" },
    ],
    body: "The central flight deck of the platform. It processes real-time resource utilization, project assignments, bench overheads, and capacity tracking vectors to output aggregate delivery performance scores.",
  },
  {
    id: "employees",
    title: "Employee Management",
    icon: Users,
    tagline: "Lifecycle states, skills mapping, and resource pools",
    statuses: [
      { name: "Active", color: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20" },
      { name: "BENCH", color: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20" },
      { name: "On_Hold", color: "bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/20" },
      { name: "RELEASED", color: "bg-zinc-500/10 text-zinc-600 dark:text-slate-600 border-zinc-500/20" },
    ],
    actions: ["Provision staff profiles globally", "Map technical capabilities", "Track historical utilization indexes", "Align structural departmental costs"],
    body: "The underlying repository of your global human capital asset engine. Manage deep profiles, align billing metrics, and execute precision talent-matching based on direct historical skill mappings.",
  },
  {
    id: "projects",
    title: "Project Architecture",
    icon: FolderKanban,
    tagline: "Client environments, allocation forecasting, and tracking rules",
    features: ["Enterprise Client Mapping", "Flexible Billing Matrix (T&M, Fixed-Bid)", "Milestone Tracking & Timelines", "Forward Capacity Forecasts", "Revenue Run-Rate Tracking"],
    body: "Establish complex, multi-layered delivery frameworks. Scale resource blocks seamlessly alongside project lifecycles while monitoring structural revenue run-rates and hard timeline boundaries.",
  },
  {
    id: "allocations",
    title: "Allocation Engine",
    icon: ArrowRightLeft,
    tagline: "FTE math, capacity configurations, and concurrency management",
    rules: [
      "Hard Rule: Total Operational Hours = Assigned FTE × 160",
      "Dynamic guardrails automatically block over-allocation across overlapping horizons",
      "Real-time capacity decrementing updates globally upon draft submission",
    ],
    types: ["Full Allocation (1.0 FTE)", "Partial Assignment (< 1.0 FTE)", "Shadow / Pipeline Allocation", "Backup / Contingency Support"],
    body: "The core logistical dispatch center. This module translates fractional FTE requests into clean hourly assignments while structurally shielding your workforce from capacity burnout.",
  },
  {
    id: "reports",
    title: "Reports & Intelligence",
    icon: BarChart3,
    tagline: "Utilization trends, revenue leakage analytics, and ledger mirrors",
    targets: ["Historical Utilization Benchmarks", "Forward Resource Forecast Maps", "Projected Yield Run-Rates", "Bench Optimization Channels", "Over-allocation Risk Vectors"],
    body: "Generate high-fidelity business intelligence instantly. Uncover utilization leakages and optimize bench cost structures. Supports pristine vector-based data downloads.",
  },
  {
    id: "filters",
    title: "Filters & Smart Search",
    icon: Filter,
    tagline: "System-wide querying across unified relational layers",
    indexes: ["Corporate Department", "Active Project Assignment", "Workforce Availability Status", "Technical Capabilities Matrix", "Account Billing Blueprint"],
    body: "Isolate granular rows across dense relational databases. Combine cascading multi-select indices with lightning-fast text queries to reveal pinpoint resource answers.",
  },
  {
    id: "validation",
    title: "Validation Matrix",
    icon: AlertTriangle,
    tagline: "System-wide rules preventing capacity debt and reporting errors",
    alerts: [
      "Critical warning flags trigger if collective individual FTE allocations exceed 1.0",
      "System blocks invalid chronological ranges or mismatched client deadlines",
      "Mandatory missing tracking fields isolate records automatically from analytical views",
    ],
    body: "Automated real-time gatekeepers processing system mutations. Preserves perfect transactional integrity and prevents operational errors down the reporting chain.",
  },
  {
    id: "logic",
    title: "Core Business Formulas",
    icon: BrainCircuit,
    tagline: "Mathematical definitions governing systemic reporting",
    formulas: [
      { title: "Net Utilization", base: "Utilization %", derivation: "(Allocated Operational Hours / 160 Baseline) × 100" },
      { title: "Organic Bench", base: "Bench Metric", derivation: "Total System Capacity - Total Allocated Asset Units" },
      { title: "Rolling Forecast Matrix", base: "Predictive Capacity Horizon", derivation: "Σ (Active Allocation Blocks Over Target Window)" },
    ],
    body: "The transparent, hardcoded mathematical framework powering every chart, scorecard, metric container, and ledger view generated across the enterprise application layout.",
  },
  {
    id: "troubleshooting",
    title: "Troubleshooting Guide",
    icon: Wrench,
    tagline: "Rapid self-service resolutions for typical behavioral edge-cases",
    issues: [
      { problem: "Allocation edits failing to submit?", action: "Verify required data attributes, inspect client budget status fields, and check role permission matrix rules." },
      { problem: "Hourly metric calculation mismatch?", action: "Recalibrate underlying fractional FTE inputs to clear variable rounding anomalies." },
      { problem: "Workforce asset missing from tables?", action: "Reset your local multi-select filters and check if the individual is marked as 'Released'." },
    ],
    body: "Quick resolution pathways for system state anomalies. Run through these basic operational steps before creating a support tier assignment.",
  },
];

const FAQS = [
  {
    question: "Why are client hours auto-calculated by the engine?",
    answer: "To completely eliminate tracking errors. All hour pools derive strictly from a standardized base: Hours = FTE × 160 units monthly.",
  },
  {
    question: "Can I manually override allocations higher than 1.0 FTE?",
    answer: "Structural guardrails prevent over-allocation to defend engineering limits. Bypassing this requires explicit admin overrides or flagged overtime waivers.",
  },
  {
    question: "Why can't I locate a specific employee profile anywhere?",
    answer: "This is usually caused by active filter parameters. Reset your global filter panel, look for 'Released' markers, and verify department mapping layers.",
  },
  {
    question: "Why do generated analytics reports return empty rows?",
    answer: "This occurs when conflicting filter layers narrow the search too much. Clearing active tags or extending your tracking window instantly restores views.",
  },
];

export default function HelpPage() {
  const [search, setSearch] = useState("");
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const [activeSection, setActiveSection] = useState("dashboard");

  const filteredSections = useMemo(() => {
    if (!search) return ENHANCED_SECTIONS;
    const cleanSearch = search.toLowerCase();
    return ENHANCED_SECTIONS.filter(
      (s) =>
        s.title.toLowerCase().includes(cleanSearch) ||
        s.body.toLowerCase().includes(cleanSearch) ||
        s.tagline.toLowerCase().includes(cleanSearch)
    );
  }, [search]);

  useEffect(() => {
    const handleScroll = () => {
      const scrollPosition = window.scrollY + 260;
      for (const section of ENHANCED_SECTIONS) {
        const el = document.getElementById(section.id);
        if (el) {
          const top = el.offsetTop;
          const height = el.offsetHeight;
          if (scrollPosition >= top && scrollPosition < top + height) {
            setActiveSection(section.id);
            break;
          }
        }
      }
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-b from-zinc-50 via-white to-zinc-50/50 text-zinc-900 antialiased font-sans selection:bg-cyan-50 selection:text-cyan-900 flex">
      
      {/* PREMIUM STICKY SIDEBAR */}
      <aside className="w-80 border-r border-zinc-200/60 bg-white/80 backdrop-blur-md p-6 sticky top-0 h-screen hidden lg:flex flex-col justify-between shrink-0 z-20">
        <div className="overflow-y-auto pr-2 space-y-7 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:bg-zinc-200 [&::-webkit-scrollbar-thumb]:rounded-full">
          
          {/* Brand/Identity Frame */}
          <div className="flex items-center gap-3 px-1 pt-2">
            <div className="p-2 rounded-xl bg-gradient-to-tr from-cyan-600 via-cyan-500 to-sky-400 text-white shadow-lg shadow-cyan-500/20 ring-1 ring-white/20">
              <BookOpen size={20} strokeWidth={2.2} />
            </div>
            <div>
              <h1 className="text-[14px] font-bold tracking-widest text-zinc-900 uppercase">
                Operations Core
              </h1>
              <p className="text-[10px] font-semibold text-cyan-600 tracking-tight">
                SYSTEM CORE BLUEPRINTS
              </p>
            </div>
          </div>

          {/* Luxury Navigation Node Links */}
          <nav className="space-y-1">
            <div className="flex items-center gap-2 px-3 mb-3">
              <Compass size={14} className="text-cyan-800" />
              <p className="text-[14px] font-bold tracking-widest text-cyan-800 uppercase">
                System Infrastructure
              </p>
            </div>
            {ENHANCED_SECTIONS.map((section) => {
              const Icon = section.icon;
              const isActive = activeSection === section.id;

              return (
                <a
                  key={section.id}
                  href={`#${section.id}`}
                  onClick={() => setActiveSection(section.id)}
                  className={`group flex items-center justify-between px-3 py-2.5 rounded-xl text-md font-medium tracking-tight transition-all duration-200 relative ${
                    isActive
                      ? "bg-gradient-to-r from-cyan-50 to-cyan-50/30 text-cyan-600 font-bold"
                      : "text-zinc-800 hover:bg-zinc-50 hover:text-zinc-900"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon 
                      size={15} 
                      className={`transition-transform duration-200 ${isActive ? "text-cyan-600 scale-105" : "text-slate-600 group-hover:text-zinc-600"}`} 
                      strokeWidth={isActive ? 2.2 : 1.8}
                    />
                    <span>{section.title}</span>
                  </div>
                  {isActive && (
                    <span className="h-5 w-0.5 rounded-full bg-cyan-600 absolute right-0 top-1/2 -translate-y-1/2" />
                  )}
                </a>
              );
            })}
          </nav>
        </div>

        {/* Live Ledger Pulse Footer */}
        <div className="pt-4 border-t border-zinc-100 text-[10px] font-bold text-slate-600 tracking-wide flex items-center justify-between bg-white">
          <span className="uppercase">Fleet Operations Active</span>
          <span className="flex h-2 w-2 rounded-full bg-emerald-500 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
          </span>
        </div>
      </aside>

      {/* SYSTEM MAIN DOCUMENT FRAMEWORK FEED */}
      <main className="flex-1 min-w-0 p-6 sm:p-10 lg:p-12 xl:p-16 max-w-[1400px] mx-auto w-full">
        
        {/* HERO BANNER HEADLINE */}
        <header className="mb-14 pb-8 border-b border-zinc-200/60 relative">
          <div className="inline-flex items-center gap-2 bg-gradient-to-r from-cyan-50 to-sky-50 dark:from-cyan-500/10 dark:to-sky-500/10 text-cyan-700 dark:text-cyan-400 px-3 py-1 rounded-full text-[14px] font-bold mb-4 border border-cyan-100/80">
            <Sparkles size={20} strokeWidth={2.5} className="animate-pulse text-cyan-700" />
            <span>Operational Architecture Framework</span>
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-zinc-900">
            Platform Capabilities & Infrastructure Hub
          </h1>
          <p className="text-sm text-zinc-500 mt-3 max-w-3xl font-medium leading-relaxed">
            Eliminate operational guesswork. Deep dive into automated resource matching structures, downstream computational validation engines, and micro-metric calculations.
          </p>
        </header>

        {/* DYNAMIC TWO-COLUMN ENGAGEMENT ENGINE */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-12 items-start">
          
          {/* PRIMARY DETAILED CALCULATOR CARDS */}
          <div className="xl:col-span-2 space-y-8">
            {filteredSections.length > 0 ? (
              filteredSections.map((section) => {
                const Icon = section.icon;

                return (
                  <section
                    key={section.id}
                    id={section.id}
                    className="scroll-mt-8 bg-white rounded-2xl border border-zinc-200/70 shadow-sm shadow-zinc-100/40 hover:shadow-md hover:border-zinc-300 transition-all duration-300 p-6 sm:p-8 relative overflow-hidden group"
                  >
                    <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-cyan-500/0 via-cyan-500/40 to-cyan-500/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                    {/* Premium Card Header Grid */}
                    <div className="flex items-start gap-4 mb-5 pb-5 border-b border-zinc-100">
                      <div className="p-3 rounded-xl bg-zinc-50 border border-zinc-100 text-zinc-700 group-hover:bg-cyan-50 group-hover:text-cyan-600 group-hover:border-cyan-100 transition-all duration-300 shrink-0">
                        <Icon size={20} strokeWidth={2} />
                      </div>
                      <div className="space-y-0.5">
                        <h2 className="text-base font-bold text-zinc-900 tracking-tight group-hover:text-cyan-950 transition-colors">
                          {section.title}
                        </h2>
                        <p className="text-xs font-medium text-slate-600">
                          {section.tagline}
                        </p>
                      </div>
                    </div>

                    {/* Explanatory Context Body */}
                    <p className="text-xs font-medium leading-relaxed text-zinc-500 mb-5">
                      {section.body}
                    </p>

                    {/* CONTENT CONDITIONAL MATRIX SUB-COMPONENTS */}
                    
                    {/* Performance Chips Metric Framework */}
                    {section.metrics && (
                      <div className="mt-5 space-y-2.5">
                        <p className="text-[10px] font-bold text-slate-600 tracking-widest uppercase">Monitored System Metrics</p>
                        <div className="flex flex-wrap gap-2">
                          {section.metrics.map((m, idx) => (
                            <span key={idx} className="bg-zinc-50/80 border border-zinc-200/60 text-zinc-700 font-semibold text-[11px] px-3 py-1.5 rounded-xl hover:bg-white hover:border-zinc-300 hover:shadow-sm transition-all duration-150 cursor-default">
                              {m}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Luxury FTE Micro-Matrix Conversion Table */}
                    {section.fteRules && (
                      <div className="mt-5 border border-zinc-200/60 rounded-xl overflow-hidden shadow-sm">
                        <table className="w-full text-left border-collapse">
                          <thead>
                            <tr className="bg-zinc-50 border-b border-zinc-200/60 text-[10px] font-bold text-slate-600 uppercase tracking-widest">
                              <th className="py-2.5 px-4">Allocation Metric</th>
                              <th className="py-2.5 px-4">Hour Conversion</th>
                              <th className="py-2.5 px-4">Operational Definition</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-zinc-100 text-xs font-medium text-zinc-700">
                            {section.fteRules.map((rule, idx) => (
                              <tr key={idx} className="hover:bg-zinc-50/40 transition-colors">
                                <td className="py-3 px-4 text-cyan-600 font-bold">{rule.fte}</td>
                                <td className="py-3 px-4 font-mono text-[11px] text-zinc-600">{rule.hours}</td>
                                <td className="py-3 px-4 text-slate-600 text-[11px]">{rule.desc}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}

                    {/* System Platform Context States Badges */}
                    {section.statuses && (
                      <div className="mt-5 space-y-2.5">
                        <p className="text-[10px] font-bold text-slate-600 tracking-widest uppercase">Platform Core Lifecycle States</p>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                          {section.statuses.map((st, idx) => (
                            <div key={idx} className={`border rounded-xl p-2.5 text-center text-xs font-bold tracking-wider transition-transform duration-150 hover:scale-[1.02] ${st.color}`}>
                              {st.name}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Grid List Bullet Architecture */}
                    {(section.features || section.actions || section.types || section.indexes) && (
                      <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                        {(section.features || section.actions || section.types || section.indexes || []).map((item, idx) => (
                          <div key={idx} className="flex items-center gap-3 bg-zinc-50/50 border border-zinc-100 p-3 rounded-xl text-xs font-semibold text-zinc-700 hover:bg-white hover:border-zinc-200 transition-colors">
                            <CheckCircle size={13} className="text-cyan-500 shrink-0" strokeWidth={2.5} />
                            <span>{item}</span>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Guardrails Context Block */}
                    {section.rules && (
                      <div className="mt-5 space-y-2">
                        {section.rules.map((rule, idx) => (
                          <div key={idx} className="flex items-start gap-3 bg-gradient-to-r from-amber-50/60 to-amber-50/10 border border-amber-200/60 p-3.5 rounded-xl text-xs font-medium text-amber-800">
                            <Clock size={14} className="text-amber-600 mt-0.5 shrink-0" />
                            <span>{rule}</span>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Critical Hard Real-Time Validation Alert Block */}
                    {section.alerts && (
                      <div className="mt-5 space-y-2">
                        {section.alerts.map((alert, idx) => (
                          <div key={idx} className="flex items-start gap-3 bg-gradient-to-r from-rose-50/60 to-rose-50/10 border border-rose-100 p-3.5 rounded-xl text-xs font-medium text-rose-900">
                            <AlertTriangle size={14} className="text-rose-500 mt-0.5 shrink-0" />
                            <span>{alert}</span>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* High-Fidelity Code Formula Workspace Frame */}
                    {section.formulas && (
                      <div className="mt-5 space-y-3.5">
                        {section.formulas.map((f, idx) => (
                          <div key={idx} className="border border-zinc-200 rounded-xl overflow-hidden shadow-sm">
                            <div className="bg-zinc-50 px-4 py-2 border-b border-zinc-200 text-[10px] font-bold text-zinc-900 uppercase tracking-widest flex items-center gap-2">
                              <Terminal size={12} className="text-slate-600" />
                              <span>{f.title} Engine Algorithm</span>
                            </div>
                            <div className="p-4 bg-sky-100 text-zinc-100 font-mono text-xs overflow-x-auto whitespace-nowrap flex items-center gap-2">
                              <span className="text-[#6e027a] font-bold">{f.base}</span>
                              <span className="text-zinc-900">=</span>
                              <span className="text-emerald-700 font-bold">{f.derivation}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Premium Action Troubleshooting Flow Nodes */}
                    {section.issues && (
                      <div className="mt-5 space-y-3">
                        {section.issues.map((iss, idx) => (
                          <div key={idx} className="border border-zinc-100 rounded-xl p-4 bg-zinc-50/40 hover:bg-zinc-50 transition-colors">
                            <div className="text-xs font-bold text-zinc-900 flex items-center gap-2">
                              <span className="h-1.5 w-1.5 rounded-full bg-rose-500 shadow-sm shadow-rose-500" />
                              {iss.problem}
                            </div>
                            <div className="text-[11px] font-medium text-zinc-500 mt-2 pl-3 border-l-2 border-cyan-500/40 flex items-start gap-1.5">
                              <CornerDownRight size={12} className="text-slate-600 mt-0.5 shrink-0" />
                              <span>{iss.action}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Anchor ID Pro Tip Footer component */}
                    <div className="mt-6 pt-4 border-t border-zinc-100/80 flex items-center gap-2 text-[9px] font-bold text-slate-600 uppercase tracking-widest">
                      <Info size={11} className="text-cyan-500" />
                      <span>Component Anchored Node Reference Reference Matrix: #{section.id}</span>
                    </div>

                  </section>
                );
              })
            ) : (
              <div className="text-center py-20 border border-dashed border-zinc-200 rounded-2xl bg-white p-8">
                <Search className="mx-auto text-zinc-300 mb-4 animate-pulse" size={36} />
                <h3 className="text-xs font-bold text-zinc-800 uppercase tracking-wider">No Documentation Matches</h3>
                <p className="text-xs text-slate-600 mt-1.5 max-w-xs mx-auto font-medium">
                  We couldn't locate references to that query parameter. Try adjusting filters or browsing main layout modules.
                </p>
              </div>
            )}
          </div>

          {/* SECONDARY SIDE COLUMN LAYER: CONSOLE ACCORDIONS + INTERACTIVE DESK */}
          <div className="space-y-8 xl:sticky xl:top-12">
            
            {/* FAQ PREMIUM INTERFACES ACCORDION */}
            <section className="bg-white border border-zinc-200 rounded-2xl p-6 shadow-sm shadow-zinc-100/40">
              <div className="mb-5">
                <h2 className="text-xs font-bold text-zinc-900 tracking-widest uppercase">
                  Common Infrastructure FAQs
                </h2>
                <p className="text-[11px] font-medium text-slate-600 mt-0.5">
                  Instant administrative clarity directives
                </p>
              </div>

              <div className="space-y-2.5">
                {FAQS.map((faq, index) => {
                  const isOpen = openFaq === index;

                  return (
                    <div
                      key={index}
                      className={`border rounded-xl transition-all duration-200 overflow-hidden ${
                        isOpen 
                          ? "border-cyan-200 bg-cyan-50/10 shadow-sm" 
                          : "border-zinc-100 bg-white hover:border-zinc-200"
                      }`}
                    >
                      <button
                        onClick={() => setOpenFaq(isOpen ? null : index)}
                        className="w-full flex items-center justify-between gap-4 px-4 py-3.5 text-left group"
                      >
                        <span className={`text-xs font-bold tracking-tight transition-colors ${isOpen ? "text-cyan-950" : "text-zinc-700 group-hover:text-zinc-900"}`}>
                          {faq.question}
                        </span>
                        <div className={`shrink-0 p-1 rounded-lg transition-all duration-200 ${isOpen ? "text-cyan-600 bg-cyan-50" : "text-slate-600 bg-zinc-50 group-hover:text-zinc-600"}`}>
                          {isOpen ? <ChevronUp size={12} strokeWidth={2.5} /> : <ChevronDown size={12} strokeWidth={2.5} />}
                        </div>
                      </button>

                      {isOpen && (
                        <div className="px-4 pb-4 text-xs font-medium text-zinc-500 leading-relaxed border-t border-cyan-100/30 pt-2.5 bg-white/40">
                          {faq.answer}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </section>

            {/* HIGH-ENGAGEMENT COMMAND CENTER CALLOUT */}
            <section className="bg-gradient-to-b from-sky-200 to-sky-200 text-white rounded-2xl p-6 shadow-xl shadow-zinc-950/10 relative overflow-hidden group border border-sky-800">
              <div className="absolute -right-8 -top-8 w-28 h-28 bg-cyan-500/10 rounded-full blur-2xl group-hover:bg-cyan-500/20 transition-all duration-500" />
              
              <h2 className="text-md font-bold tracking-widest uppercase text-cyan-900 mb-1.5 flex items-center gap-2">
                <HelpCircle size={20} className="text-cyan-900" />
                <span>Escalate Operations</span>
              </h2>
              <p className="text-[11px] text-slate-800 font-medium mb-5 leading-relaxed">
                Connect live with system architects or human capital infrastructure controllers to patch running state anomalies.
              </p>

              <div className="space-y-2.5 relative z-10">
                <a
                  href="mailto:support@company.com"
                  className="flex items-center gap-3 bg-sky-100/40 border border-sky-800 hover:border-sky-500/50 hover:bg-sky-800/80 text-slate-900 hover:text-white px-4 py-3 rounded-xl transition duration-200 text-xs font-bold"
                >
                  <Mail size={20} className="text-cyan-900" />
                  <span>support@company.com</span>
                </a>

                <a
                  href="tel:+919876543210"
                  className="flex items-center gap-3 bg-sky-100/40 border border-sky-800 hover:border-sky-500/50 hover:bg-sky-800/80 text-slate-900 hover:text-white px-4 py-3 rounded-xl transition duration-200 text-xs font-bold"
                >
                  <Phone size={20} className="text-cyan-900" />
                  <span>+91 9876543210</span>
                </a>
              </div>
            </section>

          </div>
        </div>
      </main>
    </div>
  );
}