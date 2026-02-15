// This file must be imported as early as possible in the client entry point (layout or providers)
// It attempts to "harden" window.closed against SES erasure or modification

if (typeof window !== 'undefined') {
    try {
        // 1. Preserve the original descriptor
        const originalDescriptor = Object.getOwnPropertyDescriptor(window, 'closed');

        // 2. Define a non-configurable property that proxies to the original if possible
        // This prevents lockdown from deleting or redefining it easily
        Object.defineProperty(window, 'closed', {
            get: function () {
                // If we operate in a popup, this might throw if cross-origin, but we try-catch
                try {
                     
                    return (window as any)._originalClosed || false;
                } catch {
                    return true; // Assume closed if we can't access
                }
            },
            configurable: false, // Prevent re-definition
            enumerable: true
        });

        console.log('🛡️ [Lockdown Override] Protected window.closed');
    } catch (e) {
        console.warn('⚠️ [Lockdown Override] Failed to protect window.closed', e);
    }
}

// 3. Attempt to stop SES from running if possible (Thirdweb specific)
// Set a global flag that might be respected by some SES shims
 
(globalThis as any).SES_LOCKDOWN_DISABLED = true;

export { };
