const fs = require('fs');
const file = 'apps/dashboard/src/app/()/dashboard-client-wrapper.tsx';
let code = fs.readFileSync(file, 'utf8');

code = code.replace(
  'const hideSidebar = (isRoot && !hasAccess) || isBusinessManageRoute;',
  'const hideSidebar = isBusinessManageRoute;'
);

fs.writeFileSync(file, code);
