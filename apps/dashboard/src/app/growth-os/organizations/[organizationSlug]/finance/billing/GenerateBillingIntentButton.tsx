"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

export function GenerateBillingIntentButton({ organizationSlug }: { organizationSlug: string }) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleCreateIntent = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/v1/growth/billing/create-intent`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planId: "growth-starter" })
      });
      const data = await res.json();
      
      if (!res.ok) throw new Error(data.error || "Error creando intención");
      
      toast.success("Intención de pago generada correctamente");
      // P1-5: The intent ID generated is a PlatformBillingContext intent targeting Pandora's Treasury
      router.push(`/growth-os/organizations/${organizationSlug}/finance/billing?intentId=${data.intentId}`);
    } catch (e: any) {
      toast.error(e.message);
      setLoading(false);
    }
  };

  return (
    <button 
      onClick={handleCreateIntent}
      disabled={loading}
      className="px-4 py-2 rounded-xl bg-lime-400 text-black font-bold hover:bg-lime-500 transition-colors disabled:opacity-50 flex items-center justify-center min-w-[200px]"
    >
      {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Renovar Subscripción"}
    </button>
  );
}
