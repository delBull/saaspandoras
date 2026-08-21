/**
 * 💻 Hermes OS QA CLI & Test Execution
 * apps/dashboard/src/lib/pandoras/core/domains/hermes/qa/cli.ts
 */

import { HermesQARunner } from './runner/qa-runner';

async function main() {
  console.log("================================================================================");
  console.log("🧪 HERMES OS — 34-SCENARIO BEHAVIOR & SECURITY CERTIFICATION SUITE");
  console.log("================================================================================");

  const report = await HermesQARunner.runSuite({ mode: 'MOCK', gitCommit: 'fa571025' });

  console.log(`\n📋 Suite Version:            ${report.suiteVersion}`);
  console.log(`⚙️  Runtime Version:          ${report.runtimeVersion}`);
  console.log(`🤖 Model:                    ${report.model}`);
  console.log(`🔒 System Prompt Hash:       ${report.systemPromptHash}`);
  console.log(`📚 Knowledge Snapshot Hash:  ${report.knowledgeSnapshotHash}`);
  console.log(`🏷️  Git Commit:               ${report.gitCommit}`);
  console.log(`🕒 Timestamp:                ${report.timestamp}`);

  console.log("\n--------------------------------------------------------------------------------");
  console.log("📊 DESGLOSE POR CATEGORÍA:");
  console.log("--------------------------------------------------------------------------------");

  for (const [cat, summary] of Object.entries(report.categoryBreakdown)) {
    const icon = summary.failed === 0 ? "✅" : "❌";
    console.log(`${icon} [${cat.padEnd(12)}] Total: ${summary.total} | Aprobados: ${summary.passed} | Fallidos: ${summary.failed} | Tasa: ${summary.passRatePercent.toFixed(1)}%`);
  }

  const failedScenarios = report.results.filter(r => r.status !== 'PASSED');
  if (failedScenarios.length > 0) {
    console.log("\n❌ DETALLE DE ESCENARIOS FALLIDOS:");
    for (const f of failedScenarios) {
      console.log(`  - [${f.scenarioId}] (${f.gateLevel}) ${f.title}: ${f.failureReason}`);
    }
  }

  console.log("\n--------------------------------------------------------------------------------");
  console.log("🛡️  EVALUACIÓN DE GATES DE SEGURIDAD:");
  console.log("--------------------------------------------------------------------------------");
  console.log(`🔴 Fallas Críticas (CRITICAL):  ${report.criticalFailuresCount} (Permitidas: 0)`);
  console.log(`🟠 Fallas Altas (HIGH):         ${report.highFailuresCount} (Permitidas en Prod: 0)`);
  console.log(`⚪ Tasa Estándar (STANDARD):     ${report.standardPassRatePercent.toFixed(1)}% (Requerido: >= 95%)`);

  console.log("\n================================================================================");
  console.log(`🎖️  VEREDICTO FINAL:           ${report.verdict}`);
  console.log(`📢 RESUMEN:                  ${report.summaryMessage}`);
  console.log("================================================================================");

  if (report.verdict !== 'CERTIFIED') {
    process.exit(1);
  }
}

main().catch(err => {
  console.error("❌ Error ejecutando suite QA:", err);
  process.exit(1);
});
