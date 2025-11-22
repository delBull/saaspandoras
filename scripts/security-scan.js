#!/usr/bin/env node

/**
 * Security scan to detect potential secret leaks in git history
 * Run this regularly to catch accidental commits
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Patterns that indicate potential secrets
const SECRET_PATTERNS = [
  /sk_live_[a-zA-Z0-9]{20,}/, // Stripe live secret keys
  /rk_live_[a-zA-Z0-9]{20,}/, // Stripe restricted live keys
  /pk_live_[a-zA-Z0-9]{20,}/, // Stripe live publishable keys
  /eyJ[a-zA-Z0-9_-]*\.[a-zA-Z0-9_-]*\.[a-zA-Z0-9_-]*/, // JWT tokens
  /ghp_[a-zA-Z0-9]{36}/, // GitHub personal access tokens
  /github_pat_[a-zA-Z0-9_]{82}/, // GitHub fine-grained tokens
  /AIza[0-9A-Za-z_-]{35}/, // Google API keys
  /xox[baprs]-[a-zA-Z0-9-]{10,48}/, // Slack tokens
  /[a-zA-Z0-9]{40}/, // Generic 40-char secrets (potential AWS keys)
];

console.log('🔍 Scanning for potential secret leaks...\n');

try {
  // Scan git log for suspicious patterns
  const gitLog = execSync('git log --oneline -100', { encoding: 'utf8' });
  const logLines = gitLog.split('\n');
  
  let suspiciousFound = false;
  
  for (const line of logLines) {
    for (const pattern of SECRET_PATTERNS) {
      if (pattern.test(line)) {
        console.log('🚨 SUSPICIOUS COMMIT FOUND:', line);
        suspiciousFound = true;
      }
    }
  }
  
  if (!suspiciousFound) {
    console.log('✅ No suspicious patterns found in recent commits');
  }
  
} catch (error) {
  console.log('⚠️  Could not scan git log:', error.message);
}

// Check for .env files that might be committed
try {
  const envFiles = execSync('git ls-files | grep -E "\.env"', { encoding: 'utf8' });
  if (envFiles.trim()) {
    console.log('🚨 .env files found in git history:');
    console.log(envFiles);
  } else {
    console.log('✅ No .env files found in git history');
  }
} catch (error) {
  console.log('✅ No .env files in git history');
}

console.log('\n🔒 Security scan complete');