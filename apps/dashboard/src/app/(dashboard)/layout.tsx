// ¡SIN 'use client'! Este es un Server Component.
import { DashboardClientWrapper } from "./dashboard-client-wrapper"; // Importa el nuevo wrapper

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  // Este layout ahora es un Server Component.
  // No usa hooks, estado, ni efectos.
  // Solo renderiza el "wrapper" de cliente y le pasa los 'children' (tu página).
  return (
    <DashboardClientWrapper>
      {children}
    </DashboardClientWrapper>
  );
}