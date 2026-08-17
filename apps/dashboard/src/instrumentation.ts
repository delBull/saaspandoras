/**
 * Next.js Instrumentation Hook
 * Runs once when the server starts (Node.js runtime only).
 * 
 * Purpose:
 * - Suppress ECONNRESET noise from fire-and-forget fetch calls when
 *   the browser navigates away mid-request. These are not application errors.
 * - Suppress t.unmask TypeError from ws native bindings (bufferutil/utf-8-validate
 *   mapped to empty packages in dev).
 */
export async function register() {
    if (process.env.NEXT_RUNTIME === 'nodejs') {
        process.on('uncaughtException', (err: any) => {
            // ECONNRESET: browser navigated away while server was sending a response.
            if (err?.code === 'ECONNRESET') {
                return;
            }
            // t.unmask: ws native addon not available, uses pure-JS fallback automatically.
            if (err instanceof TypeError && err.message?.includes('unmask is not a function')) {
                return;
            }
            console.error('[FATAL] Unhandled Exception:', err);
        });

        process.on('unhandledRejection', (reason: any) => {
            if (reason?.code === 'ECONNRESET') {
                return;
            }
            console.error('[FATAL] Unhandled Promise Rejection:', reason);
        });
    }
}
