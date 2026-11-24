"use client";

import { Suspense, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { ConnectButton, useActiveAccount } from "thirdweb/react";
import { client } from "@saasfly/shared/thirdweb-client";
import { wallets } from "@/lib/wallets";
import { Loader2, CheckCircle2, AlertTriangle, ShieldCheck } from "lucide-react";
import { buildLinkMessage } from "@/lib/discord/oauth";
import { Button } from "@/components/ui/button";

/**
 * `/discord/link?t=<token>&u=<usuario>`
 *
 * Cierra el vínculo Discord ↔ wallet. El OAuth prueba la identidad en Discord;
 * la firma prueba la posesión de la wallet. Sin ambas no se asignan roles.
 */
function DiscordLinkContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get("t") || "";
  const username = searchParams.get("u") || "";
  const errorParam = searchParams.get("error");
  const account = useActiveAccount();

  const [status, setStatus] = useState<"idle" | "signing" | "linking" | "success" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const [result, setResult] = useState<any>(null);

  // El token es `discordId.expiración.hmac`: el id es público para el usuario.
  const discordUserId = useMemo(() => (token ? token.split(".")[0] : ""), [token]);

  const handleLink = async () => {
    if (!account) return;
    if (!token || !discordUserId) {
      setErrorMsg("El enlace no es válido. Vuelve a iniciar el vínculo desde el principio.");
      setStatus("error");
      return;
    }
    try {
      setStatus("signing");
      const message = buildLinkMessage(discordUserId, token);
      const signature = await account.signMessage({ message });

      setStatus("linking");
      const res = await fetch("/api/v1/discord/link", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, walletAddress: account.address, signature, message }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        setErrorMsg(data?.error || `Error ${res.status}`);
        setStatus("error");
        return;
      }
      setResult(data);
      setStatus("success");
    } catch (err: any) {
      setErrorMsg(err?.message || "No se pudo firmar el mensaje.");
      setStatus("error");
    }
  };

  const errorMessages: Record<string, string> = {
    not_configured: "La integración de Discord aún no está configurada.",
    denied: "Cancelaste la autorización en Discord.",
    state: "La sesión de autorización expiró. Inténtalo de nuevo.",
    exchange: "Discord no confirmó la autorización. Inténtalo de nuevo.",
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#07070B] px-6 py-16 text-white">
      <div className="w-full max-w-lg rounded-3xl border border-white/10 bg-white/[0.02] p-8">
        <div className="flex items-center gap-3">
          <ShieldCheck className="h-6 w-6 text-emerald-400" />
          <h1 className="text-lg font-semibold">Vincular Discord con tu wallet</h1>
        </div>

        <p className="mt-3 text-sm leading-relaxed text-zinc-400">
          Verificamos dos cosas: que la cuenta de Discord es tuya (OAuth) y que la wallet es tuya
          (firma). Con eso asignamos el acceso al canal de miembros de S'Narai.
        </p>

        {username && (
          <p className="mt-4 rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm">
            Discord: <span className="font-semibold">@{username}</span>
          </p>
        )}

        {errorParam && (
          <div className="mt-4 flex items-start gap-2 rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-300">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
            <span>{errorMessages[errorParam] || "No se pudo completar el vínculo."}</span>
          </div>
        )}

        <div className="mt-6">
          <ConnectButton client={client} wallets={wallets} />
        </div>

        {account && (
          <Button
            className="mt-4 w-full"
            disabled={status === "signing" || status === "linking" || status === "success"}
            onClick={handleLink}
          >
            {status === "signing" && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {status === "linking" && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {status === "success" ? "Vinculado" : "Firmar y vincular"}
          </Button>
        )}

        {status === "error" && (
          <div className="mt-4 flex items-start gap-2 rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-300">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {status === "success" && result && (
          <div className="mt-4 space-y-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-sm text-emerald-200">
            <div className="flex items-center gap-2 font-semibold">
              <CheckCircle2 className="h-4 w-4" />
              Vínculo completado
            </div>
            <p className="text-emerald-100/80">
              {result.membership?.isParticipant
                ? `Participación verificada${result.membership?.tier ? ` · nivel ${result.membership.tier}` : ""}.`
                : "Wallet vinculada. Cuando registres una participación, el acceso se activa solo."}
            </p>
            <p className="text-[12px] text-emerald-100/60">
              Roles añadidos: {result.roles?.added?.length ?? 0}
              {result.roles?.errors?.length ? ` · errores: ${result.roles.errors.length}` : ""}
            </p>
          </div>
        )}

        <p className="mt-6 text-[11px] leading-relaxed text-zinc-600">
          Este mensaje no autoriza transacciones ni transferencias. Puedes revocar el acceso en
          cualquier momento desde el portal.
        </p>
      </div>
    </main>
  );
}

export default function DiscordLinkPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#07070B]" />}>
      <DiscordLinkContent />
    </Suspense>
  );
}
