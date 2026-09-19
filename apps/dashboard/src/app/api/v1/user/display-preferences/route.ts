import { NextResponse } from "next/server";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getAuth } from "@/lib/auth";

export const runtime = "nodejs";

const VALID_SCALES = ["100", "115", "130"] as const;
const VALID_THEMES = ["base", "high-contrast", "sepia", "grayscale", "low-light"] as const;
const ALLOWED_KEYS = new Set(["scale", "theme", "magnifier", "reducedMotion"]);

const DEFAULT_PROFILE = {
  scale: "100" as const,
  theme: "base" as const,
  magnifier: false,
  reducedMotion: false,
};

type DisplayProfile = typeof DEFAULT_PROFILE;

const TAG_PREFIX = "display_pref:";

function extractProfileFromTags(tags: unknown): DisplayProfile {
  if (!Array.isArray(tags)) return DEFAULT_PROFILE;
  const prefTag = tags.find((t): t is string => typeof t === "string" && t.startsWith(TAG_PREFIX));
  if (!prefTag) return DEFAULT_PROFILE;

  try {
    const raw = JSON.parse(prefTag.slice(TAG_PREFIX.length));
    return {
      scale: VALID_SCALES.includes(raw.scale) ? raw.scale : DEFAULT_PROFILE.scale,
      theme: VALID_THEMES.includes(raw.theme) ? raw.theme : DEFAULT_PROFILE.theme,
      magnifier: typeof raw.magnifier === "boolean" ? raw.magnifier : DEFAULT_PROFILE.magnifier,
      reducedMotion: typeof raw.reducedMotion === "boolean" ? raw.reducedMotion : DEFAULT_PROFILE.reducedMotion,
    };
  } catch {
    return DEFAULT_PROFILE;
  }
}

/**
 * GET /api/v1/user/display-preferences
 * Returns the persisted display profile for the authenticated identity,
 * or default profile if unauthenticated or not yet set.
 */
export async function GET(req: Request) {
  try {
    const { session, isVerified } = await getAuth(req);

    if (!isVerified || !session.address) {
      return NextResponse.json({ profile: DEFAULT_PROFILE, authenticated: false });
    }

    const walletAddress = session.address.toLowerCase();
    const user = await db.query.users.findFirst({
      where: eq(users.walletAddress, walletAddress),
    });

    if (!user) {
      return NextResponse.json({ profile: DEFAULT_PROFILE, authenticated: false });
    }

    const profile = extractProfileFromTags(user.tags);
    return NextResponse.json({ profile, authenticated: true });
  } catch (error: any) {
    console.error("❌ [DisplayPreferences GET] Error:", error);
    return NextResponse.json(
      { error: "Internal Server Error", profile: DEFAULT_PROFILE },
      { status: 500 }
    );
  }
}

/**
 * POST /api/v1/user/display-preferences
 * Saves display profile for the authenticated user.
 * STRICT SECURITY: Rejects any attempt to overwrite tenantId, role, capabilities, or other attributes.
 */
export async function POST(req: Request) {
  try {
    const { session, isVerified } = await getAuth(req);

    if (!isVerified || !session.address) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    if (!body || typeof body !== "object") {
      return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
    }

    // Strict Allowlist check: reject forbidden fields completely
    const keys = Object.keys(body);
    const forbidden = keys.filter((k) => !ALLOWED_KEYS.has(k));
    if (forbidden.length > 0) {
      return NextResponse.json(
        {
          error: "Forbidden fields detected. Only Sovereign Display parameters are allowed.",
          forbidden,
        },
        { status: 400 }
      );
    }

    // Validate value types and constraints
    const scale = body.scale !== undefined ? String(body.scale) : DEFAULT_PROFILE.scale;
    if (!VALID_SCALES.includes(scale as any)) {
      return NextResponse.json({ error: `Invalid scale. Must be one of: ${VALID_SCALES.join(", ")}` }, { status: 400 });
    }

    const theme = body.theme !== undefined ? String(body.theme) : DEFAULT_PROFILE.theme;
    if (!VALID_THEMES.includes(theme as any)) {
      return NextResponse.json({ error: `Invalid theme. Must be one of: ${VALID_THEMES.join(", ")}` }, { status: 400 });
    }

    const magnifier = body.magnifier !== undefined ? Boolean(body.magnifier) : DEFAULT_PROFILE.magnifier;
    const reducedMotion = body.reducedMotion !== undefined ? Boolean(body.reducedMotion) : DEFAULT_PROFILE.reducedMotion;

    const validatedProfile: DisplayProfile = {
      scale: scale as any,
      theme: theme as any,
      magnifier,
      reducedMotion,
    };

    const walletAddress = session.address.toLowerCase();
    const user = await db.query.users.findFirst({
      where: eq(users.walletAddress, walletAddress),
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Retain existing user tags and replace only the display preference tag
    const currentTags = Array.isArray(user.tags) ? user.tags : [];
    const filteredTags = currentTags.filter(
      (t) => typeof t === "string" && !t.startsWith(TAG_PREFIX)
    );
    const updatedTags = [...filteredTags, `${TAG_PREFIX}${JSON.stringify(validatedProfile)}`];

    await db
      .update(users)
      .set({
        tags: updatedTags,
        updatedAt: new Date(),
      })
      .where(eq(users.id, user.id));

    return NextResponse.json({ success: true, profile: validatedProfile });
  } catch (error: any) {
    console.error("❌ [DisplayPreferences POST] Error:", error);
    return NextResponse.json(
      { error: "Internal Server Error", message: error.message },
      { status: 500 }
    );
  }
}
