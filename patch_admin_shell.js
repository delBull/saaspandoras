const fs = require('fs');
const file = 'apps/dashboard/src/components/admin/shell/PlatformAdminShell.tsx';
let code = fs.readFileSync(file, 'utf8');

// Change CRM (HQ Deal Room) to SUPER_ADMIN only
code = code.replace(
  "      id: 'crm',\n      label: 'HQ Deal Room',\n      href: '/?tab=crm',\n      icon: Briefcase,\n      active: currentTab === 'crm',\n      allowedRoles: ['SUPER_ADMIN', 'ADMIN', 'OPERATOR'] as PlatformRole[],",
  "      id: 'crm',\n      label: 'HQ Deal Room',\n      href: '/?tab=crm',\n      icon: Briefcase,\n      active: currentTab === 'crm',\n      allowedRoles: ['SUPER_ADMIN'] as PlatformRole[],"
);

// Change RWA (Pipeline RWA & Capital Structuring) to SUPER_ADMIN only, since it has Deal Room badge
code = code.replace(
  "      id: 'rwa',\n      label: 'Pipeline RWA',\n      href: '/admin?tab=rwa',\n      icon: ShieldCheck,\n      active: currentTab === 'rwa',\n      badge: 'Deal Room',\n      allowedRoles: ['SUPER_ADMIN', 'ADMIN', 'VIEWER'] as PlatformRole[],",
  "      id: 'rwa',\n      label: 'Pipeline RWA',\n      href: '/admin?tab=rwa',\n      icon: ShieldCheck,\n      active: currentTab === 'rwa',\n      badge: 'Deal Room',\n      allowedRoles: ['SUPER_ADMIN'] as PlatformRole[],"
);

fs.writeFileSync(file, code);
