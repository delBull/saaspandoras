import { headers } from "next/headers";
import { PrivatePaymentCheckout } from "@/components/payments/PrivatePaymentCheckout";

/**
 * País del pagador para la rampa de tarjeta (thirdweb).
 * Se toma de headers de proxy (Vercel/Cloudflare) y se usa SOLO para mostrar los
 * proveedores disponibles; nunca para autorizar nada.
 */
async function resolvePayerCountry(): Promise<string> {
  const h = await headers();
  const raw =
    h.get("x-vercel-ip-country") ??
    h.get("cf-ipcountry") ??
    h.get("x-country-code") ??
    "";
  const code = raw.trim().toUpperCase();
  return /^[A-Z]{2}$/.test(code) ? code : "MX";
}

export default async function PrivatePaymentPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const country = await resolvePayerCountry();

  return (
    <main className="h-dvh bg-[#070707] text-white flex flex-col items-center justify-center">
      {/* Ambient glow — pointer-events-none so it never blocks touches */}
      <div className="fixed top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] bg-lime-500/5 blur-[140px] pointer-events-none rounded-full" />
      <div className="relative z-10 w-full h-full flex items-center justify-center p-3 sm:p-4">
        <PrivatePaymentCheckout id={id} payerCountry={country} />
      </div>
    </main>
  );
}
