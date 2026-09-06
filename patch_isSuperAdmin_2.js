const fs = require('fs');
const file = 'apps/dashboard/src/app/nexus/NexusCommandCenter.tsx';
let code = fs.readFileSync(file, 'utf8');

code = code.replace(
  '      {\n        <div \n          className={`absolute top-0 bottom-0 z-50 flex flex-col justify-center transition-all duration-700 cubic-bezier(0.87, 0, 0.13, 1) ${',
  '        <div \n          className={`absolute top-0 bottom-0 z-50 flex flex-col justify-center transition-all duration-700 cubic-bezier(0.87, 0, 0.13, 1) ${'
);
code = code.replace(
  '          </button>\n        </div>\n      )}',
  '          </button>\n        </div>'
);

code = code.replace(
  '      {\n        <div \n          className={`absolute inset-0 transition-transform duration-700 cubic-bezier(0.87, 0, 0.13, 1) ${',
  '        <div \n          className={`absolute inset-0 transition-transform duration-700 cubic-bezier(0.87, 0, 0.13, 1) ${'
);
code = code.replace(
  '            <DealRoomConsole />\n          </div>\n        </div>\n      )}',
  '            <DealRoomConsole />\n          </div>\n        </div>'
);

fs.writeFileSync(file, code);
