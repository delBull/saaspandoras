import fs from 'fs';
import path from 'path';

/**
 * Architectural Grep Test for Phase 6.5.1
 * Verifies that Cognitive Runtime domains do not contain channel-specific logic leakage.
 */

const COGNITIVE_DOMAINS_DIR = path.join(__dirname, '../src/lib/pandoras/core/domains');
const FORBIDDEN_KEYWORDS = ['channel === "portal"', 'channel === "telegram"', 'channelType === "portal"', 'channelType === "telegram"'];
const ALLOWED_DOMAINS = ['channels'];

function scanDirectory(dir: string, domainName: string): string[] {
  const violations: string[] = [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      violations.push(...scanDirectory(fullPath, domainName));
    } else if (entry.isFile() && (entry.name.endsWith('.ts') || entry.name.endsWith('.tsx'))) {
      const content = fs.readFileSync(fullPath, 'utf-8');
      for (const kw of FORBIDDEN_KEYWORDS) {
        if (content.includes(kw)) {
          violations.push(`[Boundary Violation] ${path.relative(process.cwd(), fullPath)} contains forbidden channel check: '${kw}'`);
        }
      }
    }
  }

  return violations;
}

function verifyOmnichannelBoundary() {
  console.log('[Boundary Verification] Inspecting Cognitive Domains...');
  const domainEntries = fs.readdirSync(COGNITIVE_DOMAINS_DIR, { withFileTypes: true });
  let totalViolations: string[] = [];

  for (const entry of domainEntries) {
    if (entry.isDirectory() && !ALLOWED_DOMAINS.includes(entry.name)) {
      const domainDir = path.join(COGNITIVE_DOMAINS_DIR, entry.name);
      const violations = scanDirectory(domainDir, entry.name);
      totalViolations.push(...violations);
    }
  }

  if (totalViolations.length > 0) {
    console.error('[Boundary Verification Failed]:');
    totalViolations.forEach(v => console.error(v));
    process.exit(1);
  } else {
    console.log('✅ [Boundary Verification Passed]: Cognitive Runtime domains are 100% channel agnostic!');
  }
}

verifyOmnichannelBoundary();
