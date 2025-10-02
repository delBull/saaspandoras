#!/usr/bin/env node

/**
 * Migration Script: Replace old profile API endpoints with new unified `/api/profile`
 *
 * - Finds `/api/profile/kyc` and `/api/profile/edit`
 * - Replaces with `/api/profile`
 * - Works recursively on .ts, .tsx, .js files
 */

import fs from "fs";
import path from "path";

const rootDir = process.cwd();
const targetExts = [".ts", ".tsx", ".js"];

function scanDir(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      if (["node_modules", ".next", "dist"].includes(entry.name)) continue;
      scanDir(fullPath);
    } else if (targetExts.includes(path.extname(entry.name))) {
      migrateFile(fullPath);
    }
  }
}

function migrateFile(filePath) {
  let content = fs.readFileSync(filePath, "utf-8");
  let updated = content;

  updated = updated.replace(/\/api\/profile\/kyc/g, "/api/profile");
  updated = updated.replace(/\/api\/profile\/edit/g, "/api/profile");

  if (updated !== content) {
    fs.writeFileSync(filePath, updated, "utf-8");
    console.log(`✅ Updated: ${filePath}`);
  }
}

console.log("🔍 Starting migration: replacing old /api/profile/* endpoints...");
scanDir(rootDir);
console.log("🎉 Migration complete!");
