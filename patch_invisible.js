const fs = require('fs');
const file = 'apps/dashboard/src/app/nexus/NexusCommandCenter.tsx';
let code = fs.readFileSync(file, 'utf8');

// Filter applications before mapping
code = code.replace(
  '{applications.map((app) => {',
  `{applications
                  .filter(app => {
                    // Deal Room and Books Vault should be completely invisible for non-super-admins
                    if ((app.id === "deal_room" || app.id === "books_vault") && !isSuperAdmin) {
                      return false;
                    }
                    return true;
                  })
                  .map((app) => {`
);

fs.writeFileSync(file, code);
