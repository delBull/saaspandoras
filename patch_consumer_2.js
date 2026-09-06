const fs = require('fs');
const file = 'apps/dashboard/src/components/consumer-home/ConsumerHomePage.tsx';
let code = fs.readFileSync(file, 'utf8');

// Change the load function to always call bootstrap
const oldLoad = `    const load = async () => {
      if (!canBootstrap) {
        setHomeData(prev => ({ ...prev, featuredProjects: FALLBACK_PROJECTS, loading: false }));
        return;
      }
      try {
        const res = await fetch(\`/api/bootstrap?wallet=\${user.address}\`, {
          signal: controller.signal
        });`;

const newLoad = `    const load = async () => {
      try {
        const walletParam = user?.address ? \`?wallet=\${user.address}\` : '';
        const res = await fetch(\`/api/bootstrap\${walletParam}\`, {
          signal: controller.signal
        });`;

code = code.replace(oldLoad, newLoad);

// Change the dependency array of useEffect
code = code.replace(
  '  }, [status, user?.address, isAdmin, isAuthenticated, hasAccess]);',
  '  }, [status, user?.address, isAdmin, isAuthenticated, hasAccess, canBootstrap]);' // I should actually remove canBootstrap from dependencies if it's not used, but whatever
);

fs.writeFileSync(file, code);
