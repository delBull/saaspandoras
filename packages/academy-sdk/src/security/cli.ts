/**
 * 🔒 Pandora's Academy — Leakage Test Suite CLI
 * apps/dashboard/src/lib/pandoras/core/domains/academy/security/cli.ts
 */

import { LeakageTestRunner } from './leakage-test-runner';

function runCli() {
  console.log('================================================================================');
  console.log('🔒 PANDORA\'S ACADEMY — 10-SCENARIO CONTEXT ISOLATION & LEAKAGE TEST SUITE');
  console.log('================================================================================\n');

  const summary = LeakageTestRunner.runAll();

  for (const r of summary.results) {
    const icon = r.passed ? '✅' : '❌';
    console.log(`${icon} [${r.id}] ${r.title}`);
    console.log(`   ${r.details}\n`);
  }

  console.log('--------------------------------------------------------------------------------');
  console.log(`📊 TOTAL: ${summary.total} | APROBADOS: ${summary.passed} | FALLIDOS: ${summary.failed} | TASA: ${((summary.passed / summary.total) * 100).toFixed(1)}%`);
  console.log('--------------------------------------------------------------------------------\n');

  if (summary.failed === 0) {
    console.log('🎖️  VEREDICTO: ✅ 100% AISLAMIENTO DE CONTEXTO CERTIFICADO (CERO FUGAS)');
  } else {
    console.error('🚨 VEREDICTO: ❌ FALLA DE SEGURIDAD DETECTADA EN FRONTERAS DE CONTEXTO');
    process.exit(1);
  }
}

runCli();
