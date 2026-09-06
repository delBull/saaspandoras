const fs = require('fs');
const file = 'apps/dashboard/src/app/nexus/rooms/DealRoomConsole.tsx';
let code = fs.readFileSync(file, 'utf8');

// Update component signature
code = code.replace(
  'export default function DealRoomConsole() {',
  'export default function DealRoomConsole({ isSuperAdmin = false }: { isSuperAdmin?: boolean }) {'
);

// Hide header blocks
code = code.replace(
  '<span className="text-sm font-semibold text-zinc-100 tracking-tight truncate">PANDORAS NEXUS · DEAL ROOM</span>',
  '<span className="text-sm font-semibold text-zinc-100 tracking-tight truncate">{isSuperAdmin ? "PANDORAS NEXUS · DEAL ROOM" : "PANDORAS NEXUS"}</span>'
);

code = code.replace(
  '<span className="px-1.5 py-0.5 rounded border border-amber-500/30 bg-amber-500/10 text-amber-300 text-[9px] tracking-widest">NIVEL 2</span>',
  '{isSuperAdmin && <span className="px-1.5 py-0.5 rounded border border-amber-500/30 bg-amber-500/10 text-amber-300 text-[9px] tracking-widest">NIVEL 2</span>}'
);

code = code.replace(
  '<p className="text-[10px] text-zinc-500 truncate">TRANSACTION ROOMS · ADMINISTRACIÓN</p>',
  '{isSuperAdmin && <p className="text-[10px] text-zinc-500 truncate">TRANSACTION ROOMS · ADMINISTRACIÓN</p>}'
);

// Hide portal and spec links
const linksBlock = `<Link
            href="/deal/sign"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-amber-500/40 bg-amber-500/10 text-amber-300 hover:bg-amber-500/20 text-[10px] font-mono transition-colors shadow-sm shadow-amber-500/10"
            title="Abrir Portal Funcional de Firmas Soberanas"
            target="_blank"
          >
            <FileSignature className="w-3.5 h-3.5 text-amber-400" />
            <span>PORTAL DE FIRMAS</span>
          </Link>
          <Link
            href="/deal/sovereign-esign"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-indigo-500/30 bg-indigo-500/10 text-indigo-300 hover:bg-indigo-500/20 text-[10px] font-mono transition-colors"
            title="Sovereign On-Chain E-Sign & NOM-151 Protocol Specification"
            target="_blank"
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>ESPECIFICACIÓN</span>
          </Link>`;

code = code.replace(linksBlock, `{isSuperAdmin && (<>\n${linksBlock}\n</>)}`);

// Hide main body
code = code.replace(
  '<div className="flex-1 flex min-h-0">',
  `{isSuperAdmin ? (
        <div className="flex-1 flex min-h-0">`
);

// We need to find the matching closing div for the main body.
// It ends just before the </div></main>
code = code.replace(
  `        </div>
      </div>

      {confirmDelete && selected && (`,
  `        </div>
      </div>
      ) : (
        <div className="flex-1 flex flex-col items-center justify-center p-8 bg-zinc-950/50">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center border border-white/5 bg-black/40 mb-4">
            <Lock className="w-8 h-8 text-white/10" />
          </div>
          <h2 className="text-xl font-semibold text-white tracking-tight mb-2">Acceso Restringido</h2>
          <p className="text-sm text-zinc-500 max-w-md text-center">
            El Deal Room Institucional y la Bóveda de Transacciones están reservados para la Capa Ejecutiva (Super Admin).
          </p>
        </div>
      )}

      {confirmDelete && selected && (`
);

fs.writeFileSync(file, code);
