"use client";
import "./globals.css";
import { Toaster } from "sonner";
import { ThemeProvider } from "@/components/theme-provider";
import { ThirdwebProvider } from "thirdweb/react";
import { useThirdwebUserSync } from "@/hooks/useThirdwebUserSync";

// 🔧 CONFIGURACIÓN THIRDWEB v5 BÁSICA FUNCIONANDO
// Para expandir con social login, revisar documentación:
// https://portal.thirdweb.com/auth/social-login

function ThirdwebUserSyncWrapper() {
  // Este componente se renderiza DENTRO de ThirdwebProvider
  // por lo tanto sí tiene acceso a los hooks
  useThirdwebUserSync();

  // No renderiza nada visible
  return null;
}

export function Providers({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="dark"
      enableSystem={false}
    >
      <ThirdwebProvider>
        {children}
        <ThirdwebUserSyncWrapper />
        <Toaster
          theme="dark"
          richColors
          position="top-center"
        />
      </ThirdwebProvider>
    </ThemeProvider>
  );
}

// 🔄 PARA EXPANDIR CON SOCIAL LOGIN:
// 1. Agregar a ThirdwebProvider: embededWallet con auth.options
// 2. Crear hook useThirdwebProfileSync para capturar datos sociales
// 3. Usar el PUT /api/user-sync/connect para actualizar perfil
