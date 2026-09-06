"use client";

import { useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { ConnectButton, useActiveAccount } from "thirdweb/react";
import { client } from "@/lib/thirdweb-client";
import { Loader2, CheckCircle2, AlertTriangle, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";

function DiscordVerifyContent() {
  const searchParams = useSearchParams();
  const discordId = searchParams.get("discord_id");
  const account = useActiveAccount();

  const [status, setStatus] = useState<"idle" | "signing" | "linking" | "success" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  const handleLink = async () => {
    if (!account) return;
    if (!discordId) {
      setErrorMsg("No se proporcionó un discord_id en la URL.");
      setStatus("error");
      return;
    }

    try {
      setStatus("signing");
      const message = `Autorizo vincular la cuenta de Discord ${discordId} a mis credenciales de operador en Pandoras. Fecha: ${new Date().toISOString()}`;
      
      const signature = await account.signMessage({ message });

      setStatus("linking");
      const res = await fetch("/api/v1/internal/admin/discord/link", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          discordId,
          signature,
          message,
          walletAddress: account.address
        })
      });

      const data = await res.json();
      if (data.success) {
        setStatus("success");
      } else {
        setErrorMsg(data.error || "Error al vincular cuenta");
        setStatus("error");
      }
    } catch (e: any) {
      console.error(e);
      setErrorMsg(e.message || "Error al firmar mensaje");
      setStatus("error");
    }
  };

  return (
    <div className="max-w-md w-full bg-[#111] border border-white/10 rounded-2xl p-8 shadow-2xl flex flex-col items-center text-center">
      <div className="w-16 h-16 bg-blue-500/10 rounded-full flex items-center justify-center mb-6">
        <ShieldCheck className="w-8 h-8 text-blue-500" />
      </div>
      
      <h1 className="text-2xl font-semibold mb-2">Verificación Zero-Trust</h1>
      <p className="text-gray-400 mb-8 text-sm">
        Vincula tu identidad criptográfica (Smart Wallet) con tu perfil de operador en Discord para autorizar tus mensajes de escalamiento de forma segura.
      </p>

      {!discordId ? (
        <div className="w-full bg-red-500/10 border border-red-500/20 text-red-500 rounded-lg p-4 mb-6 flex items-center gap-3 text-sm">
          <AlertTriangle className="w-5 h-5 shrink-0" />
          <div className="text-left">
            Falta el parámetro <code>discord_id</code> en la URL. Asegúrate de hacer clic en el enlace desde Discord.
          </div>
        </div>
      ) : (
        <>
          <div className="w-full flex justify-center mb-6">
            <ConnectButton client={client} />
          </div>

          {account && status === "idle" && (
            <Button onClick={handleLink} className="w-full bg-blue-600 hover:bg-blue-700 h-12 text-md">
              Firmar y Vincular Cuenta
            </Button>
          )}

          {status === "signing" && (
            <Button disabled className="w-full bg-blue-600/50 h-12 text-md">
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Firma requerida en wallet...
            </Button>
          )}

          {status === "linking" && (
            <Button disabled className="w-full bg-blue-600/50 h-12 text-md">
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Verificando...
            </Button>
          )}

          {status === "success" && (
            <div className="w-full bg-green-500/10 border border-green-500/20 text-green-500 rounded-lg p-4 flex flex-col items-center gap-3 mt-4">
              <CheckCircle2 className="w-8 h-8" />
              <span className="font-medium text-sm">¡Cuenta de Discord vinculada exitosamente! Ya puedes cerrar esta ventana y regresar a Discord.</span>
            </div>
          )}

          {status === "error" && (
            <div className="w-full bg-red-500/10 border border-red-500/20 text-red-500 rounded-lg p-4 flex items-center gap-3 text-sm mt-4 text-left">
              <AlertTriangle className="w-5 h-5 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default function DiscordVerifyPage() {
  return (
    <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-6">
      <Suspense fallback={<div className="animate-pulse w-full max-w-md h-[400px] bg-[#111] rounded-2xl border border-white/10" />}>
        <DiscordVerifyContent />
      </Suspense>
    </div>
  );
}
