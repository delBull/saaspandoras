/**
 * 🛠️ LEGACY SESSION HELPER (HARDENED)
 * 
 * Este archivo se mantiene para compatibilidad con las páginas de administración (Admin Dashboard, Formulario Multistep).
 * En el nuevo sistema Level 10, preferimos usar useAuth() de AuthContext.
 */

let sessionPromise: Promise<any> | null = null;

/**
 * Espera a que la sesión esté lista. 
 * Útil en useEffects para evitar peticiones 401 mientras el AuthProvider hidrata.
 */
export async function waitForSession(specificAddress?: string) {
    if (typeof window === 'undefined') return null;

    // Si ya hay una promesa en curso, la devolvemos para evitar múltiples fetches paralelos
    if (sessionPromise) return sessionPromise;

    sessionPromise = (async () => {
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 8000);

            const res = await fetch("/api/auth/session", {
                headers: {
                    "Cache-Control": "no-store",
                    ...(specificAddress ? { "x-wallet-address": specificAddress } : {})
                },
                signal: controller.signal
            });

            clearTimeout(timeoutId);

            if (!res.ok) return null;
            return await res.json();
        } catch (err) {
            console.warn("⚠️ [Session Cache] Fetch failed or timed out:", err);
            return null;
        } finally {
            // Nota: Mantenemos el sessionPromise cacheado para evitar redundancia,
            // pero se puede limpiar con bustSessionCache()
        }
    })();

    return sessionPromise;
}

/**
 * Limpia el cache de la sesión para forzar un nuevo fetch.
 */
export function bustSessionCache() {
    sessionPromise = null;
}
