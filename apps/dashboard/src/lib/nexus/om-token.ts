import jwt from "jsonwebtoken";

/**
 * Token de acceso al OM (memorándum de inversión).
 *
 * Separado del token de la sala: caduca en 7 días, liga correo + deal y solo
 * sirve para descargar el PDF. Se firma con `NEXUS_DEAL_TOKEN_SECRET`
 * (fail-closed: sin secreto no hay token).
 */
const SECRET = process.env.NEXUS_DEAL_TOKEN_SECRET;
const TTL_DAYS = 7;

export interface OmTokenPayload {
  type: "om_access";
  publicId: string;
  email: string;
}

export function signOmToken(publicId: string, email: string): string | null {
  if (!SECRET) return null;
  return jwt.sign(
    { type: "om_access", publicId, email: email.toLowerCase() },
    SECRET,
    { expiresIn: `${TTL_DAYS}d` }
  );
}

export function verifyOmToken(token: string): OmTokenPayload | null {
  if (!SECRET || !token) return null;
  try {
    const payload = jwt.verify(token, SECRET) as OmTokenPayload;
    if (payload?.type !== "om_access") return null;
    return payload;
  } catch {
    return null;
  }
}

export function omUrl(publicId: string, email: string): string | null {
  const token = signOmToken(publicId, email);
  if (!token) return null;
  const base = (process.env.NEXT_PUBLIC_APP_URL ?? "https://nexus.pandoras.finance").replace(/\/$/, "");
  return `${base}/api/public/deals/${encodeURIComponent(publicId)}/om?t=${encodeURIComponent(token)}`;
}
