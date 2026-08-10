import fs from 'fs';
import path from 'path';

const filesToUpdate = [
  'src/lib/user-sync.ts',
  'src/app/api/upload/pdf/route.ts',
  'src/app/api/admin/tenants/route.ts',
  'src/app/api/admin/tenants/[id]/route.ts',
  'src/app/api/admin/telegram-bridge/missions/route.ts',
  'src/app/api/admin/telegram-bridge/missions/[missionId]/route.ts',
  'src/app/api/admin/deploy/nft-pass/route.ts',
  'src/app/api/admin/deploy-protocol/[slug]/route.ts',
  'src/app/api/referrals/process/route.ts',
  'src/app/api/referrals/my/route.ts'
];

for (const file of filesToUpdate) {
  const fullPath = path.join(process.cwd(), 'apps/dashboard', file);
  if (!fs.existsSync(fullPath)) {
    console.log(`Skipping ${file} - not found`);
    continue;
  }
  
  let content = fs.readFileSync(fullPath, 'utf8');
  let changed = false;

  // Add import if not present and we need to use it
  const importStatement = `import { requireEnvUrl } from '@/lib/env-utils';\n`;

  // Pattern replacements
  const patterns = [
    {
      regex: /const baseUrl = process\.env\.NEXT_PUBLIC_APP_URL (\|\||\?\?) 'http:\/\/localhost:3000';/g,
      replacement: `const baseUrl = requireEnvUrl(process.env.NEXT_PUBLIC_APP_URL, 'NEXT_PUBLIC_APP_URL', 'http://localhost:3000');`
    },
    {
      regex: /process\.env\.NEXT_PUBLIC_BASE_URL \|\| 'http:\/\/localhost:3000'/g,
      replacement: `requireEnvUrl(process.env.NEXT_PUBLIC_BASE_URL, 'NEXT_PUBLIC_BASE_URL', 'http://localhost:3000')`
    },
    {
      regex: /const baseUrl = process\.env\.NEXT_PUBLIC_DASHBOARD_URL \?\? 'http:\/\/localhost:3001';/g,
      replacement: `const baseUrl = requireEnvUrl(process.env.NEXT_PUBLIC_DASHBOARD_URL, 'NEXT_PUBLIC_DASHBOARD_URL', 'http://localhost:3001');`
    },
    {
      regex: /const API_URL = process\.env\.NEXT_PUBLIC_API_URL \|\| 'http:\/\/localhost:8080';/g,
      replacement: `const API_URL = requireEnvUrl(process.env.NEXT_PUBLIC_API_URL, 'NEXT_PUBLIC_API_URL', 'http://localhost:8080');`
    },
    {
      regex: /const EDGE_API_URL = process\.env\.NEXT_PUBLIC_API_URL \|\| 'http:\/\/localhost:8080';/g,
      replacement: `const EDGE_API_URL = requireEnvUrl(process.env.NEXT_PUBLIC_API_URL, 'NEXT_PUBLIC_API_URL', 'http://localhost:8080');`
    },
    {
      regex: /const DEPLOY_SERVICE_URL = process\.env\.DEPLOY_SERVICE_URL \|\| "http:\/\/localhost:3000";/g,
      replacement: `const DEPLOY_SERVICE_URL = requireEnvUrl(process.env.DEPLOY_SERVICE_URL, 'DEPLOY_SERVICE_URL', 'http://localhost:3000');`
    },
    {
      regex: /let DEPLOY_SERVICE_URL = process\.env\.DEPLOY_SERVICE_URL \|\| "http:\/\/localhost:3000";/g,
      replacement: `let DEPLOY_SERVICE_URL = requireEnvUrl(process.env.DEPLOY_SERVICE_URL, 'DEPLOY_SERVICE_URL', 'http://localhost:3000');`
    }
  ];

  for (const p of patterns) {
    if (p.regex.test(content)) {
      content = content.replace(p.regex, p.replacement);
      changed = true;
    }
  }

  if (changed) {
    // Determine relative path for import
    const depth = file.split('/').length - 2;
    let importPath = '@/lib/env-utils';
    
    if (!content.includes('requireEnvUrl')) {
        // Just checking in case
    }
    
    content = `import { requireEnvUrl } from '${importPath}';\n` + content;
    fs.writeFileSync(fullPath, content, 'utf8');
    console.log(`Updated ${file}`);
  }
}
