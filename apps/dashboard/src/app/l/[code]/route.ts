import { NextResponse } from "next/server";
import crypto from "node:crypto";
import { db } from "@saasfly/db";
import { nexusOutreachEvents, nexusOutreachLinks, nexusDealPods } from "@saasfly/db/schema";
import { and, eq, isNull, sql } from "@saasfly/db-core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * `/l/<code>` — radar del Deal Pod.
 *
 * Registra la apertura (IP hasheada, user-agent, referer) y redirige a la landing
 * del pod con `?src=<code>`. En el primer toque avisa a Discord.
 *
 * Nunca revela el activo: la URL no contiene nombre, ubicación ni precio.
 */

function hashIp(ip: string): string {
  const salt = process.env.NEXUS_DEAL_TOKEN_SECRET ?? process.env.MEET_JOIN_SECRET ?? "nexus-outreach";
  return crypto.createHash("sha256").update(`${salt}:${ip}`).digest("hex").slice(0, 32);
}

async function notifyDiscord(input: {
  podName: string;
  targetLabel: string | null;
  targetOrg: string | null;
  door: string | null;
  code: string;
}) {
  const webhook = process.env.DISCORD_WEBHOOK_URL || process.env.DISCORD_WEBHOOK_ALERTS;
  if (!webhook) return;

  const body = {
    embeds: [
      {
        title: "🔔 Primer toque",
        description: `**${input.targetLabel ?? input.code}** abrió el teaser de ${input.podName}.`,
        color: 0x10b981,
        fields: [
          { name: "Puerta", value: input.door ?? "sin definir", inline: true },
          { name: "Organización", value: input.targetOrg ?? "—", inline: true },
          { name: "Link", value: `\`/l/${input.code}\``, inline: false },
        ],
        footer: { text: "AZTECAZ · Deal Pod radar" },
        timestamp: new Date().toISOString(),
      },
    ],
  };

  try {
    await fetch(webhook, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
  } catch (error) {
    console.error("[Outreach] Discord notify failed:", error);
  }
}

export async function GET(_req: Request, { params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;

  try {
    const [link] = await db
      .select({
        id: nexusOutreachLinks.id,
        podId: nexusOutreachLinks.podId,
        door: nexusOutreachLinks.door,
        targetLabel: nexusOutreachLinks.targetLabel,
        targetOrg: nexusOutreachLinks.targetOrg,
        destinationUrl: nexusOutreachLinks.destinationUrl,
      })
      .from(nexusOutreachLinks)
      .where(and(eq(nexusOutreachLinks.code, code), isNull(nexusOutreachLinks.disabledAt)))
      .limit(1);

    if (!link) {
      return NextResponse.redirect(new URL("/pitch/village", _req.url), 302);
    }

    const pod = link.podId
      ? (await db
          .select({ code: nexusDealPods.code, displayName: nexusDealPods.displayName })
          .from(nexusDealPods)
          .where(eq(nexusDealPods.id, link.podId))
          .limit(1))[0]
      : undefined;

    const forwarded = _req.headers.get("x-forwarded-for") ?? "";
    const ip = forwarded.split(",")[0]?.trim() || "unknown";
    const userAgent = _req.headers.get("user-agent") ?? null;
    const referer = _req.headers.get("referer") ?? null;

    const previous = await db
      .select({ total: sql<number>`count(*)::int` })
      .from(nexusOutreachEvents)
      .where(and(eq(nexusOutreachEvents.linkId, link.id), eq(nexusOutreachEvents.event, "OPEN")));

    await db.insert(nexusOutreachEvents).values({
      linkId: link.id,
      event: "OPEN",
      ipHash: hashIp(ip),
      userAgent,
      referer,
    });

    const isFirst = Number(previous[0]?.total ?? 0) === 0;
    if (isFirst && pod) {
      await notifyDiscord({
        podName: pod.displayName,
        targetLabel: link.targetLabel,
        targetOrg: link.targetOrg,
        door: link.door,
        code,
      });
    }

    // Destino propio (tenant sin Deal Pod): se respeta y se le añade atribución.
    if (link.destinationUrl) {
      try {
        const custom = new URL(link.destinationUrl);
        custom.searchParams.set("src", code);
        for (const key of ["utm_source", "utm_medium", "utm_campaign"] as const) {
          const value = _req.headers.get(key) ?? new URL(_req.url).searchParams.get(key);
          if (value) custom.searchParams.set(key, value.slice(0, 64));
        }
        return NextResponse.redirect(custom, 302);
      } catch {
        console.warn("[Outreach] destination_url inválida:", link.destinationUrl);
      }
    }

    const destination = new URL(`/pitch/${pod?.code ?? "village"}`, _req.url);
    destination.searchParams.set("src", code);
    return NextResponse.redirect(destination, 302);
  } catch (error) {
    console.error("[Outreach] /l/[code] error:", error);
    return NextResponse.redirect(new URL("/pitch/village", _req.url), 302);
  }
}
