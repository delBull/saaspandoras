const fs = require('fs');
const file = 'apps/dashboard/src/components/consumer-home/ConsumerHomePage.tsx';
let code = fs.readFileSync(file, 'utf8');

code = code.replace(
  'const load = async () => {\n      if (!canBootstrap) return;\n      try {',
  'const load = async () => {\n      if (!canBootstrap) {\n        setHomeData(prev => ({ ...prev, featuredProjects: FALLBACK_PROJECTS, loading: false }));\n        return;\n      }\n      try {'
);

fs.writeFileSync(file, code);
