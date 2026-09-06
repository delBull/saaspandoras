"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { 
  ShieldCheck, 
  AlertTriangle, 
  CheckCircle2, 
  XCircle, 
  RefreshCw, 
  Cpu, 
  Layers, 
  Lock, 
  Flame, 
  Database,
  ArrowLeft,
  ChevronDown,
  ChevronUp,
  Terminal,
  Activity
} from "lucide-react";
import Link from "next/link";
import { QACertificationReport, ScenarioResult } from "@/lib/pandoras/core/domains/hermes/qa/types";

export default function HermesQAPage() {
  const [report, setReport] = useState<QACertificationReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");
  const [expandedScenarioId, setExpandedScenarioId] = useState<string | null>(null);
  const [runningMode, setRunningMode] = useState<"MOCK" | "INTEGRATION" | "CERTIFICATION">("MOCK");

  const runSuite = async (mode = runningMode) => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/hermes/qa", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode })
      });
      const data = await res.json();
      if (data.success) {
        setReport(data.report);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    runSuite();
  }, []);

  const filteredScenarios = report?.results.filter(s => {
    if (selectedCategory === "ALL") return true;
    return s.category === selectedCategory;
  }) || [];

  return (
    <div className="min-h-screen bg-[#08080A] text-zinc-100 p-6 md:p-10 font-sans">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Header Navigation */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/10 pb-6">
          <div className="flex items-center gap-4">
            <Link 
              href="/admin/dashboard" 
              className="p-2 rounded-xl bg-white/5 border border-white/10 text-zinc-400 hover:text-white hover:bg-white/10 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <div className="flex items-center gap-3">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono uppercase tracking-widest bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 font-bold">
                  Internal Control Plane
                </span>
                <span className="text-xs font-mono text-zinc-500">Suite v1.0 (34 Scenarios)</span>
              </div>
              <h1 className="text-2xl md:text-3xl font-bold text-white tracking-tight mt-1 flex items-center gap-3">
                Hermes OS · Behavior & Security Matrix
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <select
              value={runningMode}
              onChange={(e) => setRunningMode(e.target.value as any)}
              className="bg-black/40 border border-white/15 rounded-xl px-3 py-2 text-xs font-mono text-zinc-300 focus:outline-none focus:border-amber-400"
            >
              <option value="MOCK">Modo: MOCK (CI Fast)</option>
              <option value="INTEGRATION">Modo: INTEGRATION (DB & Events)</option>
              <option value="CERTIFICATION">Modo: CERTIFICATION (Full Engine)</option>
            </select>

            <button
              onClick={() => runSuite(runningMode)}
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-semibold text-xs font-mono transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
              {loading ? "EJECUTANDO..." : "EJECUTAR SUITE"}
            </button>
          </div>
        </div>

        {loading && !report ? (
          <div className="p-16 text-center space-y-4">
            <RefreshCw className="w-10 h-10 text-amber-400 animate-spin mx-auto" />
            <p className="text-sm font-mono text-zinc-400">Ejecutando 34 escenarios de certificación de Hermes OS...</p>
          </div>
        ) : report ? (
          <>
            {/* Top Verdict Card */}
            <div className={`p-6 rounded-2xl border ${
              report.verdict === 'CERTIFIED' 
                ? 'bg-emerald-500/[0.04] border-emerald-500/30' 
                : report.verdict === 'BLOCKED'
                ? 'bg-red-500/[0.04] border-red-500/30'
                : 'bg-amber-500/[0.04] border-amber-500/30'
            }`}>
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="flex items-start gap-4">
                  <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 border ${
                    report.verdict === 'CERTIFIED'
                      ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                      : report.verdict === 'BLOCKED'
                      ? 'bg-red-500/10 border-red-500/30 text-red-400'
                      : 'bg-amber-500/10 border-amber-500/30 text-amber-400'
                  }`}>
                    {report.verdict === 'CERTIFIED' ? <ShieldCheck className="w-8 h-8" /> : <AlertTriangle className="w-8 h-8" />}
                  </div>
                  <div>
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-mono uppercase tracking-widest text-zinc-400">Estado de Certificación</span>
                      <span className={`px-2.5 py-0.5 rounded text-xs font-mono font-bold uppercase tracking-wider ${
                        report.verdict === 'CERTIFIED'
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                          : 'bg-red-500/20 text-red-300 border border-red-500/40'
                      }`}>
                        {report.verdict}
                      </span>
                    </div>
                    <h2 className="text-xl font-bold text-white mt-1">{report.summaryMessage}</h2>
                    <p className="text-xs text-zinc-400 mt-1 font-mono">
                      Runtime: {report.runtimeVersion} · Evaluador: {report.evaluatorVersion} · Git: {report.gitCommit}
                    </p>
                  </div>
                </div>

                {/* Scorecards */}
                <div className="grid grid-cols-3 gap-3">
                  <div className="p-3.5 rounded-xl bg-black/40 border border-white/10 text-center">
                    <p className="text-[10px] font-mono text-zinc-500 uppercase">Aprobación General</p>
                    <p className="text-2xl font-bold text-white font-mono">{report.overallPassRatePercent.toFixed(1)}%</p>
                    <p className="text-[10px] text-emerald-400 font-mono">{report.passedCount}/{report.totalScenarios} passed</p>
                  </div>
                  <div className="p-3.5 rounded-xl bg-black/40 border border-white/10 text-center">
                    <p className="text-[10px] font-mono text-zinc-500 uppercase">Fallas Críticas</p>
                    <p className={`text-2xl font-bold font-mono ${report.criticalFailuresCount === 0 ? "text-emerald-400" : "text-red-400"}`}>
                      {report.criticalFailuresCount}
                    </p>
                    <p className="text-[10px] text-zinc-500 font-mono">Gate: 0 fallas</p>
                  </div>
                  <div className="p-3.5 rounded-xl bg-black/40 border border-white/10 text-center">
                    <p className="text-[10px] font-mono text-zinc-500 uppercase">Fallas Altas</p>
                    <p className={`text-2xl font-bold font-mono ${report.highFailuresCount === 0 ? "text-emerald-400" : "text-amber-400"}`}>
                      {report.highFailuresCount}
                    </p>
                    <p className="text-[10px] text-zinc-500 font-mono">Gate: 0 en Prod</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Cryptographic Hashes Strip */}
            <div className="p-4 rounded-xl bg-black/50 border border-white/10 grid grid-cols-1 md:grid-cols-4 gap-4 text-xs font-mono">
              <div className="space-y-1">
                <span className="text-zinc-500 flex items-center gap-1.5"><Terminal className="w-3.5 h-3.5 text-amber-400" /> Prompt Hash</span>
                <span className="text-zinc-300 font-semibold block truncate">{report.systemPromptHash}</span>
              </div>
              <div className="space-y-1">
                <span className="text-zinc-500 flex items-center gap-1.5"><Database className="w-3.5 h-3.5 text-blue-400" /> Snapshot Hash</span>
                <span className="text-zinc-300 font-semibold block truncate">{report.knowledgeSnapshotHash}</span>
              </div>
              <div className="space-y-1">
                <span className="text-zinc-500 flex items-center gap-1.5"><Cpu className="w-3.5 h-3.5 text-emerald-400" /> Motor / Modelo</span>
                <span className="text-zinc-300 font-semibold block truncate">{report.model}</span>
              </div>
              <div className="space-y-1">
                <span className="text-zinc-500 flex items-center gap-1.5"><Activity className="w-3.5 h-3.5 text-purple-400" /> Timestamp ISO</span>
                <span className="text-zinc-300 font-semibold block truncate">{new Date(report.timestamp).toLocaleTimeString()}</span>
              </div>
            </div>

            {/* Category Filter Tabs */}
            <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-white/10 scrollbar-none">
              <button
                onClick={() => setSelectedCategory("ALL")}
                className={`px-3 py-1.5 rounded-lg text-xs font-mono transition-colors shrink-0 ${
                  selectedCategory === "ALL" 
                    ? "bg-amber-500 text-black font-bold" 
                    : "bg-white/5 text-zinc-400 hover:text-white"
                }`}
              >
                TODOS ({report.totalScenarios})
              </button>
              {Object.entries(report.categoryBreakdown).map(([cat, summary]) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono transition-colors shrink-0 ${
                    selectedCategory === cat 
                      ? "bg-amber-500 text-black font-bold" 
                      : "bg-white/5 text-zinc-400 hover:text-white"
                  }`}
                >
                  <span>{cat}</span>
                  <span className={`px-1.5 py-0.2 rounded text-[10px] ${
                    summary.failed === 0 ? "bg-emerald-500/20 text-emerald-300" : "bg-red-500/20 text-red-300"
                  }`}>
                    {summary.passed}/{summary.total}
                  </span>
                </button>
              ))}
            </div>

            {/* Scenario Grid / List */}
            <div className="space-y-3">
              {filteredScenarios.map((scenario) => {
                const isExpanded = expandedScenarioId === scenario.scenarioId;
                const isCritical = scenario.gateLevel === "CRITICAL";
                const isHigh = scenario.gateLevel === "HIGH";

                return (
                  <div
                    key={scenario.scenarioId}
                    className="p-4 rounded-xl bg-[#0C0C10] border border-white/10 hover:border-white/20 transition-all space-y-3"
                  >
                    <div 
                      onClick={() => setExpandedScenarioId(isExpanded ? null : scenario.scenarioId)}
                      className="flex items-center justify-between cursor-pointer select-none"
                    >
                      <div className="flex items-center gap-3">
                        <span className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-mono font-bold ${
                          scenario.status === 'PASSED'
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                            : 'bg-red-500/10 text-red-400 border border-red-500/30'
                        }`}>
                          {scenario.scenarioId}
                        </span>

                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-semibold text-white">{scenario.title}</span>
                            <span className={`px-2 py-0.5 rounded text-[9px] font-mono font-bold uppercase ${
                              isCritical 
                                ? 'bg-red-500/20 text-red-300 border border-red-500/40' 
                                : isHigh 
                                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                                : 'bg-zinc-800 text-zinc-400'
                            }`}>
                              {scenario.gateLevel}
                            </span>
                            <span className="text-[10px] font-mono text-zinc-500">{scenario.category}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-4">
                        <span className="text-xs font-mono text-zinc-500">{scenario.latencyMs}ms</span>
                        <span className={`flex items-center gap-1.5 text-xs font-mono font-bold ${
                          scenario.status === 'PASSED' ? 'text-emerald-400' : 'text-red-400'
                        }`}>
                          {scenario.status === 'PASSED' ? <CheckCircle2 className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
                          {scenario.status}
                        </span>
                        {isExpanded ? <ChevronUp className="w-4 h-4 text-zinc-500" /> : <ChevronDown className="w-4 h-4 text-zinc-500" />}
                      </div>
                    </div>

                    {isExpanded && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        className="pt-3 border-t border-white/10 space-y-3 text-xs"
                      >
                        {/* Assertion Breakdown */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                          {/* Deterministic */}
                          <div className="p-3 rounded-lg bg-black/40 border border-white/5 space-y-2">
                            <p className="text-[10px] font-mono uppercase tracking-wider text-amber-400 font-bold">1. Aserciones Deterministas</p>
                            {scenario.deterministicResults.map((a, i) => (
                              <div key={i} className="flex items-start gap-2">
                                {a.passed ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" /> : <XCircle className="w-3.5 h-3.5 text-red-400 shrink-0 mt-0.5" />}
                                <div className="min-w-0">
                                  <p className="text-zinc-300 text-[11px]">{a.description}</p>
                                  {a.error && <p className="text-red-400 font-mono text-[10px]">{a.error}</p>}
                                </div>
                              </div>
                            ))}
                          </div>

                          {/* Semantic */}
                          <div className="p-3 rounded-lg bg-black/40 border border-white/5 space-y-2">
                            <p className="text-[10px] font-mono uppercase tracking-wider text-blue-400 font-bold">2. Aserciones Semánticas</p>
                            {scenario.semanticResults.map((a, i) => (
                              <div key={i} className="flex items-start gap-2">
                                {a.passed ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" /> : <XCircle className="w-3.5 h-3.5 text-red-400 shrink-0 mt-0.5" />}
                                <div className="min-w-0">
                                  <p className="text-zinc-300 text-[11px]">{a.description}</p>
                                  {a.error && <p className="text-red-400 font-mono text-[10px]">{a.error}</p>}
                                </div>
                              </div>
                            ))}
                          </div>

                          {/* Policy */}
                          <div className="p-3 rounded-lg bg-black/40 border border-white/5 space-y-2">
                            <p className="text-[10px] font-mono uppercase tracking-wider text-purple-400 font-bold">3. Aserciones de Gobernanza</p>
                            {scenario.policyResults.map((a, i) => (
                              <div key={i} className="flex items-start gap-2">
                                {a.passed ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" /> : <XCircle className="w-3.5 h-3.5 text-red-400 shrink-0 mt-0.5" />}
                                <div className="min-w-0">
                                  <p className="text-zinc-300 text-[11px]">{a.description}</p>
                                  {a.error && <p className="text-red-400 font-mono text-[10px]">{a.error}</p>}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </div>
                );
              })}
            </div>
          </>
        ) : null}
      </div>
    </div>
  );
}
