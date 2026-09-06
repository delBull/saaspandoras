const fs = require('fs');
const file = 'apps/dashboard/src/app/nexus/NexusCommandCenter.tsx';
let code = fs.readFileSync(file, 'utf8');

// 1. Add DealRoomConsole import and Menu icon
if (!code.includes('DealRoomConsole')) {
  code = code.replace(
    'import { HermesFloatingGuide } from "@/components/guides/HermesFloatingGuide";',
    'import { HermesFloatingGuide } from "@/components/guides/HermesFloatingGuide";\nimport DealRoomConsole from "./rooms/DealRoomConsole";\nimport { Menu, X } from "lucide-react";'
  );
}

// 2. Add isDrawerOpen state
if (!code.includes('isDrawerOpen')) {
  code = code.replace(
    'const [customStations, setCustomStations] = React.useState<any[] | undefined>();',
    'const [customStations, setCustomStations] = React.useState<any[] | undefined>();\n  const [isDrawerOpen, setIsDrawerOpen] = React.useState(false);'
  );
}

// 3. Filter applications array
code = code.replace(
  'const applications = [',
  'let applications = ['
);

code = code.replace(
  `    {
      id: "books_vault",
      title: "Bóveda Constitucional & Libros",
      description: "Constitución y Libros Fundacionales I al IX de Pandora's Protocol. Protegido con doble capa de seguridad criptográfica.",
      icon: Lock,
      href: "https://app.pandoras.finance/libros/constitucion",
      allowed: role === "SUPER_ADMIN", // Restringido solo a Super Admin por ahora
      color: "zinc",
      requirementText: "Exclusivo Super Admin",
    },
  ];`,
  `    {
      id: "books_vault",
      title: "Bóveda Constitucional & Libros",
      description: "Constitución y Libros Fundacionales I al IX de Pandora's Protocol. Protegido con doble capa de seguridad criptográfica.",
      icon: Lock,
      href: "https://app.pandoras.finance/libros/constitucion",
      allowed: role === "SUPER_ADMIN", // Restringido solo a Super Admin por ahora
      color: "zinc",
      requirementText: "Exclusivo Super Admin",
    },
  ];

  // Restringir visualmente: Ocultar Deal Room y Libros por completo si no es Super Admin
  if (role !== "SUPER_ADMIN") {
    applications = applications.filter(app => app.id !== "deal_room" && app.id !== "books_vault");
  }`
);

// 4. Add the Drawer sliding UI and Toggle Button
const replacementDiv = `    <div className="relative min-h-screen bg-[#08080A] selection:bg-amber-500/30 overflow-hidden font-sans">
      
      {/* Sliding Drawer for Legacy Console */}
      <div 
        className={\`fixed inset-y-0 right-0 z-50 w-full md:w-[85vw] lg:w-[75vw] xl:w-[65vw] bg-[#08080A] border-l border-white/10 shadow-2xl transition-transform duration-500 ease-in-out \${isDrawerOpen ? 'translate-x-0' : 'translate-x-full'}\`}
      >
        <button 
          onClick={() => setIsDrawerOpen(false)}
          className="absolute top-4 -left-12 p-2 bg-[#0C0C10] border border-white/10 rounded-l-xl text-zinc-400 hover:text-white transition-colors shadow-lg z-50 flex items-center justify-center"
        >
          <X className="w-5 h-5" />
        </button>
        <div className="w-full h-full overflow-y-auto">
          {isDrawerOpen && <DealRoomConsole isSuperAdmin={role === "SUPER_ADMIN"} />}
        </div>
      </div>

      {/* Overlay */}
      {isDrawerOpen && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 transition-opacity" 
          onClick={() => setIsDrawerOpen(false)}
        />
      )}

      {/* Main Content */}
      <div className={\`max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-12 transition-transform duration-500 \${isDrawerOpen ? '-translate-x-[10vw] opacity-40' : ''}\`}>
`;

code = code.replace(
  '    <div className="min-h-screen bg-[#08080A] selection:bg-amber-500/30 font-sans">\n      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-12">',
  replacementDiv
);

// 5. Add the toggle button in the header right next to the tour button
code = code.replace(
  `<button
                  onClick={() => setIsTourOpen(true)}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500/20 via-purple-500/20 to-indigo-500/20 hover:from-amber-500/30 hover:to-indigo-500/30 border border-amber-500/30 text-amber-300 text-xs font-semibold shadow-lg shadow-amber-500/10 transition-all group"
                >
                  <Compass className="w-4 h-4 text-amber-400 group-hover:rotate-45 transition-transform duration-300" />
                  <span>🧭 Iniciar Recorrido del Ecosistema con Hermes</span>
                </button>`,
  `<button
                  onClick={() => setIsDrawerOpen(true)}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-white/10 text-zinc-300 hover:text-white text-xs font-semibold transition-all"
                >
                  <Menu className="w-4 h-4" />
                  <span>Nexus Legacy Console</span>
                </button>
                <button
                  onClick={() => setIsTourOpen(true)}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500/20 via-purple-500/20 to-indigo-500/20 hover:from-amber-500/30 hover:to-indigo-500/30 border border-amber-500/30 text-amber-300 text-xs font-semibold shadow-lg shadow-amber-500/10 transition-all group"
                >
                  <Compass className="w-4 h-4 text-amber-400 group-hover:rotate-45 transition-transform duration-300" />
                  <span className="hidden sm:inline">🧭 Iniciar Recorrido</span>
                </button>`
);

fs.writeFileSync(file, code);
