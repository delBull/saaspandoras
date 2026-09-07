const fs = require('fs');
const file = 'apps/dashboard/src/components/admin/views/AdminRwaView.tsx';
let code = fs.readFileSync(file, 'utf8');

// Add imports
const imports = `import { MultiStepForm } from '@/app/admin/projects/[slug]/edit/multi-step-form';
import { TokenomicsBotsTab } from '@/app/()/profile/projects/[slug]/manage/tabs/TokenomicsBotsTab';
import { LegalTab } from '@/components/projects/LegalTab';
import { toast } from 'sonner';`;

code = code.replace(
  "import { PlatformActor } from '@/lib/dash-contracts/admin';",
  `import { PlatformActor } from '@/lib/dash-contracts/admin';\n${imports}`
);

// Add openLegacyDrawer function inside DealActionRow
const funcInject = `  const openLegacyDrawer = async (actionType: 'EDIT' | 'PHASES' | 'LEGAL') => {
    try {
      startTransition(async () => {
        try {
          const res = await fetch(\`/api/admin/projects/\${deal.id}\`);
          if (!res.ok) throw new Error('Error al cargar proyecto completo');
          const data = await res.json();
          const fullProject = data.data || data; // Handle depending on wrapper
          
          let component = null;
          let drawerSize: 'normal' | 'large' | 'full' = 'large';
          
          if (actionType === 'EDIT') {
            drawerSize = 'full';
            component = (
              <div className="bg-[#050505] -mx-6 -mt-6 p-6 min-h-screen">
                <MultiStepForm project={fullProject} isEdit={true} apiEndpoint={\`/api/admin/projects/\${deal.id}\`} isPublic={false} />
              </div>
            );
          } else if (actionType === 'PHASES') {
            drawerSize = 'full';
            component = (
              <div className="bg-[#050505] -mx-6 -mt-6 p-6 min-h-screen">
                <TokenomicsBotsTab project={fullProject} />
              </div>
            );
          } else if (actionType === 'LEGAL') {
            drawerSize = 'large';
            component = (
              <div className="bg-[#050505] -mx-6 -mt-6 p-6 min-h-screen">
                <LegalTab project={fullProject} />
              </div>
            );
          }
          
          inspect({
            id: String(deal.id),
            type: 'RWA_DEAL',
            title: \`\${deal.title} - \${actionType === 'EDIT' ? 'Editar' : actionType === 'PHASES' ? 'Fases' : 'Legal'}\`,
            badge: deal.stage,
            badgeColor: 'violet',
            drawerSize,
            customComponent: component
          });
        } catch (e: any) {
          setError(e.message);
        }
      });
    } catch (e: any) {
      setError(e.message);
    }
  };`;

// Inject into DealActionRow, wait, we need `inspect` which is in AdminRwaView, NOT in DealActionRow. 
// Let's pass `inspect` to DealActionRow as a prop, or use `usePlatformInspector` inside DealActionRow.
// Let's use `usePlatformInspector` inside DealActionRow.
