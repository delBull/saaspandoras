import { UXData } from "@/components/auth/AuthProvider";
import { AccessState } from "./state-machine";
import { db } from "@/db";
import { platformSettings } from "@/db/schema";
import { eq } from "drizzle-orm";
import { accessCache, withTimeout } from "./resilience";

interface ExperimentConfig {
  flow: string;
  delay: number;
  copyVariant: string;
  cta: string;
}

const DEFAULT_CONFIGS: Record<string, ExperimentConfig> = {
  admin: { flow: "god_mode", delay: 0, copyVariant: "ALPHA", cta: "Control Panel" },
  holder: { flow: "dashboard_standard", delay: 0, copyVariant: "A", cta: "Enter Dashboard" },
  ritual: { flow: "ritual_ritual", delay: 1200, copyVariant: "B", cta: "Start the Ritual" },
  lead: { flow: "lead_generation", delay: 800, copyVariant: "C", cta: "Join the Protocol" }
};

/**
 * Remote Config Resolver: Fetches experiment data from DB with distributed caching.
 */
async function getRemoteConfig(): Promise<Record<string, ExperimentConfig>> {
    const cacheKey = "remote_ux_config";
    const cached = await accessCache.get<Record<string, ExperimentConfig>>(cacheKey);
    if (cached) return cached;

    try {
        const setting = await withTimeout(
            db.query.platformSettings.findFirst({
                where: eq(platformSettings.key, "genesis_access_ux_config")
            }),
            500 // 500ms safety limit
        );

        const remote = setting?.value ? JSON.parse(setting.value) : DEFAULT_CONFIGS;
        await accessCache.set(cacheKey, remote, 60); // 60s TTL
        return remote;
    } catch {
        return DEFAULT_CONFIGS;
    }
}

/**
 * Config-Driven Resolver: Maps user context to a specific UX experiment.
 */
export async function resolveUXConfig(address: string | undefined, state: AccessState, isAdmin: boolean, projectSlug: string = "pandoras"): Promise<UXData> {
  // 1. FETCH CONFIG (Remote + Distributed Cache)
  const configs = await getRemoteConfig();

  // 2. DYNAMIC SEGMENTATION
  let segment = "lead";
  if (isAdmin) segment = "admin";
  else if (state === AccessState.HAS_ACCESS) segment = "holder";
  else if (state === AccessState.WALLET_NO_ACCESS) segment = "ritual";

  // 🛡️ EXTERNAL PROJECT BYPASS
  // For external projects (like Narai), if the user is in lead segment (no wallet), 
  // we force them into 'ritual' flow to show the Connect Wallet/Login UI instead of Lead capture.
  const isInternal = projectSlug === "pandoras" || projectSlug === "dashboard";
  if (!isInternal && segment === "lead") {
    segment = "ritual"; 
  }

  const base = (configs[segment as keyof typeof configs] || configs.lead) as ExperimentConfig;

  // 3. A/B TESTING (Deterministic based on address)
  const isVariantB = address ? (parseInt(address.slice(-1), 16) % 2 === 0) : false;

  return {
    segment,
    cta: projectSlug !== "pandoras" && segment === "ritual" ? "Connect Wallet" : base.cta,
    flow: base.flow,
    delay: isVariantB ? base.delay * 1.5 : base.delay, 
    copyVariant: isVariantB ? "B_REINFORCED" : base.copyVariant,
    scarcityHint: segment === "ritual" ? "Only 12 keys available for this sector." : undefined
  };
}
