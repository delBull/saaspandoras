/**
 * Portal Architecture Boundary Check — Phase 6.1
 * scripts/verify-portal-boundaries.ts
 * 
 * Detects forbidden imports from Portal UI into Runtime/DB internals.
 * This is an architectural regression detector, not a security mechanism.
 * 
 * Forbidden in app/portal/** and components/hermes-portal/**:
 *   - @/db (direct database)
 *   - drizzle-orm
 *   - DomainPackLoader
 *   - HermesCognitiveLayer / CognitiveProvider
 *   - ExecutionOS
 *   - MemoryProvider
 *   - OutboxProcessor
 *   - PolicyEngine
 * 
 * Run: bun run scripts/verify-portal-boundaries.ts
 */

import { readFileSync, readdirSync, statSync } from 'fs';
import { join, relative } from 'path';

const ROOT = join(process.cwd(), 'src');

const PORTAL_PATHS = [
  join(ROOT, 'app', 'portal'),
  join(ROOT, 'components', 'hermes-portal'),
];

const FORBIDDEN_IMPORTS = [
  { pattern: /from ['"]@\/db['"]/, name: '@/db (direct database access)' },
  { pattern: /from ['"]drizzle-orm['"]/, name: 'drizzle-orm' },
  { pattern: /DomainPackLoader/, name: 'DomainPackLoader' },
  { pattern: /HermesCognitiveLayer/, name: 'HermesCognitiveLayer' },
  { pattern: /CognitiveProvider/, name: 'CognitiveProvider' },
  { pattern: /ExecutionOS/, name: 'ExecutionOS' },
  { pattern: /MemoryProvider/, name: 'MemoryProvider' },
  { pattern: /OutboxProcessor/, name: 'OutboxProcessor' },
  { pattern: /PolicyEngine/, name: 'PolicyEngine (direct import)' },
  { pattern: /from ['"]postgres['"]/, name: 'postgres (direct)' },
];

function getAllFiles(dir: string): string[] {
  const results: string[] = [];
  try {
    const entries = readdirSync(dir);
    for (const entry of entries) {
      const full = join(dir, entry);
      const stat = statSync(full);
      if (stat.isDirectory()) {
        results.push(...getAllFiles(full));
      } else if (full.endsWith('.ts') || full.endsWith('.tsx')) {
        results.push(full);
      }
    }
  } catch {
    // Directory may not exist yet
  }
  return results;
}

const violations: Array<{ file: string; line: number; violation: string; content: string }> = [];

for (const portalPath of PORTAL_PATHS) {
  const files = getAllFiles(portalPath);

  for (const file of files) {
    const content = readFileSync(file, 'utf-8');
    const lines = content.split('\n');

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i] ?? '';
      for (const forbidden of FORBIDDEN_IMPORTS) {
        if (forbidden.pattern.test(line)) {
          violations.push({
            file: relative(ROOT, file),
            line: i + 1,
            violation: forbidden.name,
            content: line.trim(),
          });
        }
      }
    }
  }
}

console.log('\n🔍 Portal Architecture Boundary Check');
console.log('════════════════════════════════════════');

if (violations.length === 0) {
  console.log('✅ PASS: Zero boundary violations detected.');
  console.log('   Portal does not import DB, Runtime, or infrastructure internals.\n');
  process.exit(0);
} else {
  console.error(`❌ FAIL: ${violations.length} boundary violation(s) found:\n`);
  for (const v of violations) {
    console.error(`   File:      ${v.file}:${v.line}`);
    console.error(`   Violation: ${v.violation}`);
    console.error(`   Content:   ${v.content}`);
    console.error('');
  }
  console.error('Fix these before declaring Phase 6.1 done.\n');
  process.exit(1);
}
