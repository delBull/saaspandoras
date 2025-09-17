import Link from "next/link";
import { headers } from "next/headers";
import { Button } from "@saasfly/ui/button";
import { getAuth } from "@/lib/auth";
import { isAdmin } from "@/lib/auth";
import { SUPER_ADMIN_WALLET } from "@/lib/constants";
import { db } from "~/db";
import { desc } from "drizzle-orm";
import { projects as projectsTable, type administrators } from "~/db/schema";
import { ProjectActions } from "~/components/admin/ProjectActions";
import { AdminTabs } from "~/components/admin/AdminTabs";
import { AdminSettings } from "~/components/admin/AdminSettings";

interface Project {
  id: number;
  title: string;
  status: 'pending' | 'approved' | 'live' | 'completed' | 'rejected';
  raisedAmount: number | null;
  slug: string;
  createdAt: Date;
}

// Mock de datos de swaps. En una app real, esto vendría de tu API/backend.
const MOCK_SWAPS = [
    { txHash: '0x123...', from: '0xabc...', toToken: 'ETH', fromAmountUsd: 150.50, feeUsd: 0.75, status: 'success' },
    { txHash: '0x456...', from: '0xdef...', toToken: 'USDC', fromAmountUsd: 300.00, feeUsd: 1.50, status: 'success' },
    { txHash: '0x789...', from: '0xghi...', toToken: 'WETH', fromAmountUsd: 50.00, feeUsd: 0.25, status: 'failed' },
];

export default async function AdminDashboardPage() {
  console.log('📊 AdminDashboardPage: COMIENZA EJECUCIÓN');

  const headersList = await headers();
  const { session } = getAuth(headersList);
  const userIsAdmin = await isAdmin(session?.userId);

  console.log('📊 AdminDashboardPage: Resultado:', {
    hasSession: !!session,
    sessionUserId: session?.userId,
    userIsAdmin,
    superAdminWallet: '0x00c9f7EE6d1808C09B61E561Af6c787060BFE7C9'
  });

  if (!userIsAdmin) {
    console.log('❌ AdminDashboardPage: ACCESO DENEGADO');
    return (
        <div className="flex items-center justify-center min-h-[70vh]">
            <div className="text-center p-8 bg-zinc-900 rounded-lg">
                <h2 className="text-2xl font-bold text-red-500">Acceso Restringido</h2>
                <p className="text-gray-400 mt-2">Esta página es solo para administradores.</p>
            </div>
        </div>
    );
  }

  console.log('✅ AdminDashboardPage: ACCESO PERMITIDO');

  // Fetching de datos del servidor
  const projects = (await db.query.projects.findMany({ orderBy: desc(projectsTable.createdAt) })) as Project[];
  let admins: (typeof administrators.$inferSelect)[] = [];
  try {
    // Obtiene los administradores y filtra al Super Admin para que no se muestre en la UI.
    const allAdmins = await db.query.administrators.findMany();
    admins = allAdmins.filter(admin => admin.walletAddress.toLowerCase() !== SUPER_ADMIN_WALLET);

  } catch (e) {
    console.warn("Could not fetch administrators. Did you run the database migration?", e);
    // Continúa sin administradores si la tabla no existe.
  }
  const swaps = MOCK_SWAPS; // Mantenemos los swaps como mock por ahora

  return (
    <section className="py-12 md:py-24">
        <div className="bg-zinc-900/80 rounded-2xl p-6 md:p-8 max-w-5xl mx-auto border border-lime-400/20">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold text-lime-400">
                    Panel de Administración
                </h1>
                <Link href="/admin/projects/new/edit" passHref>
                    <Button className="bg-lime-500 hover:bg-lime-600 text-zinc-900 font-bold">
                        Añadir Proyecto
                    </Button>
                </Link>
            </div>
            <AdminTabs swaps={swaps} showSettings={session?.userId?.toLowerCase() === SUPER_ADMIN_WALLET}>
                {/* Este es el contenido para la pestaña de proyectos */}
                <div className="max-h-[400px] overflow-auto">
                    <h2 className="text-xl font-bold mb-4 text-white">Gestión de Proyectos</h2>
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="text-lime-200 border-b border-lime-800">
                                    <th className="py-2 text-left">Proyecto</th>
                                    <th className="py-2 text-left">Estado</th>
                                    <th className="py-2 text-right">Recaudado (USD)</th>
                                    <th className="py-2 text-right">Acciones</th>
                                </tr>
                            </thead>
                            <tbody>
                                {projects.map((p) => (
                                <tr key={p.id} className="border-b border-zinc-800 hover:bg-zinc-800/50">
                                    <td className="py-3 font-semibold">{p.title}</td>
                                    <td>
                                        <span className={`px-2 py-1 text-xs rounded-full font-semibold
                                            ${p.status === 'live' && 'bg-green-800 text-green-200'}
                                            ${p.status === 'approved' && 'bg-sky-800 text-sky-200'}
                                            ${p.status === 'pending' && 'bg-yellow-800 text-yellow-200'}
                                            ${p.status === 'rejected' && 'bg-red-800 text-red-200'}
                                            ${p.status === 'completed' && 'bg-gray-700 text-gray-300'}
                                        `}>
                                            {p.status}
                                        </span>
                                    </td>
                                    <td className="text-right font-mono">${Number(p.raisedAmount).toLocaleString()}</td>
                                    <td className="py-2 text-right">
                                        <div className="flex items-center justify-end gap-2">
                                            <ProjectActions projectId={p.id} currentStatus={p.status} />
                                            <Link href={`/projects/${p.slug}`} passHref>
                                                <Button variant="outline" size="sm" className="border-zinc-600">Ver</Button>
                                            </Link>
                                            <Link href={`/admin/projects/${p.id}/edit`} passHref>
                                                <Button variant="secondary" size="sm">Editar</Button>
                                            </Link>
                                        </div>
                                    </td>
                                </tr>
                                ))}
                            </tbody>
                        </table>
                </div>
                {/* Contenido para la pestaña de configuración */}
                <div>
                    <AdminSettings initialAdmins={admins} />
                </div>
            </AdminTabs>
        </div>
    </section>
  );
}
