import fs from 'fs';
const path = 'apps/dashboard/src/app/api/public/project/[slug]/state/route.ts';
let code = fs.readFileSync(path, 'utf8');
code = code.replace(/inArray\(projectDocuments.visibility, \['PUBLIC', 'PARTNER', 'INVESTOR'\]\)/g, "inArray(projectDocuments.visibility, ['PUBLIC', 'PARTNER', 'INVESTOR', 'REGISTERED_USER'])");
fs.writeFileSync(path, code);
