import { PrivatePaymentCheckout } from "@/components/payments/PrivatePaymentCheckout";

export default async function PrivatePaymentPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return (
    <main className="h-dvh bg-[#070707] text-white flex flex-col items-center justify-center">
      {/* Ambient glow — pointer-events-none so it never blocks touches */}
      <div className="fixed top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] bg-lime-500/5 blur-[140px] pointer-events-none rounded-full" />
      <div className="relative z-10 w-full h-full flex items-center justify-center p-3 sm:p-4">
        <PrivatePaymentCheckout id={id} />
      </div>
    </main>
  );
}

