import { PrivatePaymentCheckout } from "@/components/payments/PrivatePaymentCheckout";

export default async function PrivatePaymentPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return (
    <main className="min-h-screen bg-[#070707] text-white flex flex-col items-center justify-center p-4 relative">
      {/* Background ambient lighting */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[300px] bg-lime-500/5 blur-[120px] pointer-events-none rounded-full" />
      <div className="relative z-10 w-full flex justify-center">
        <PrivatePaymentCheckout id={id} />
      </div>
    </main>
  );
}
