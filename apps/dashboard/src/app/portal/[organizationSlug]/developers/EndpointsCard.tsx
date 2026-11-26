/**
 * 📚 Endpoints del tenant (Developer Hub)
 *
 * Lista corta de los endpoints que el tenant puede usar hoy. La organización
 * viaja en el path y **el servidor la valida contra la sesión**: un tenant no
 * puede operar sobre otro aunque cambie el slug.
 *
 * Se mantiene a mano a propósito: es documentación operativa, no un registro
 * automático que pueda desincronizarse del código.
 */
const ENDPOINTS = [
  {
    method: 'GET',
    path: '/api/v1/tenant/{slug}/notification-channels',
    desc: 'Canales de aviso (leads, aprobaciones, alertas).',
  },
  {
    method: 'PUT',
    path: '/api/v1/tenant/{slug}/notification-channels',
    desc: 'Conecta el webhook de Discord del tenant.',
  },
  {
    method: 'GET',
    path: '/api/v1/tenant/{slug}/media-assets',
    desc: 'Biblioteca de medios: imágenes con URL pública.',
  },
  {
    method: 'POST',
    path: '/api/v1/tenant/{slug}/media-assets',
    desc: 'Sube una imagen (multipart, JPG/PNG/WebP ≤ 8 MB).',
  },
  {
    method: 'POST',
    path: '/api/v1/hermes/media/render?organizationSlug={slug}',
    desc: 'Genera una pieza con las plantillas (cover/statement/levels/cta).',
  },
  {
    method: 'PATCH',
    path: '/api/v1/nexus/approvals',
    desc: 'Resuelve una aprobación (sesión de portal del owner o admin de plataforma).',
  },
];

export function EndpointsCard() {
  return (
    <section className="rounded-2xl border border-white/10 bg-white/[0.02] p-6">
      <p className="text-[10px] font-mono uppercase tracking-[0.25em] text-zinc-500">Developer Hub</p>
      <h2 className="mt-2 text-lg font-semibold text-white">Endpoints del tenant</h2>
      <p className="mt-2 max-w-2xl text-[12px] leading-relaxed text-zinc-400">
        Todas las rutas resuelven la organización en el servidor desde la sesión (o la API key del
        tenant). El <span className="font-mono">{'{slug}'}</span> es contexto de ruta, no autoridad.
      </p>

      <div className="mt-4 overflow-hidden rounded-xl border border-white/10">
        <table className="w-full text-left">
          <thead className="bg-white/[0.03] text-[10px] font-mono uppercase tracking-widest text-zinc-500">
            <tr>
              <th className="px-3 py-2">Método</th>
              <th className="px-3 py-2">Ruta</th>
              <th className="px-3 py-2">Qué hace</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {ENDPOINTS.map((endpoint) => (
              <tr key={`${endpoint.method}-${endpoint.path}`} className="text-[11px] text-zinc-300">
                <td className="whitespace-nowrap px-3 py-2 font-mono text-[10px] text-emerald-300">
                  {endpoint.method}
                </td>
                <td className="px-3 py-2 font-mono text-[10px] text-zinc-400">{endpoint.path}</td>
                <td className="px-3 py-2 text-zinc-400">{endpoint.desc}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
