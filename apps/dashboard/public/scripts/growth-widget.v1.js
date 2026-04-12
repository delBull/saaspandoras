/**
 * Pandoras Growth OS - Widget SDK v1.0 (Growth Infra)
 * 
 * Provides:
 * - Gamified "Early Access" UI
 * - Funnel Tracking (VIEW, CLICK, LEAD_CREATED, XP_EARNED)
 * - Web3 Identity Capture (Optional Wallet)
 * - Fingerprint-based ID Resolution
 */
(function() {
    const script = document.currentScript;
    const projectId = script.getAttribute('data-project-id');
    const apiKey = script.getAttribute('data-api-key');
    const accentColor = script.getAttribute('data-color') || '#7c3aed';
    const customTitle = script.getAttribute('data-title') || 'Early Access';
    const customSubtitle = script.getAttribute('data-subtitle') || 'Join the inner circle of the protocol ecosystem.';
    const customBtnText = script.getAttribute('data-button-text') || 'Unlock Early Access';
    const customActionText = script.getAttribute('data-action-text') || 'Claim My Spot';
    const theme = script.getAttribute('data-theme') || 'light';
    const position = script.getAttribute('data-position') || 'right';
    const successUrl = script.getAttribute('data-success-url');
    const hideButton = script.getAttribute('data-hide-button') === 'true';
    
    // Config
    // Use the script source itself to determine the base URL (Staging vs Prod)
    const getBaseUrl = () => {
        try {
            if (script && script.src) {
                const url = new URL(script.src);
                return `${url.protocol}//${url.host}`;
            }
        } catch (e) {
            console.warn('[Pandoras] Failed to detect script origin, using fallbacks');
        }
        return window.location.hostname === 'localhost' ? 'http://localhost:3000' : 'https://dash.pandoras.finance';
    };

    const BASE_URL = getBaseUrl();
    const API_ENDPOINT = `${BASE_URL}/api/v1/marketing`;
    
    // State
    const state = {
        fingerprint: localStorage.getItem('pd_fp') || (function() {
            const id = 'pd_' + Math.random().toString(36).substr(2, 9) + Date.now().toString(36);
            localStorage.setItem('pd_fp', id);
            return id;
        })(),
        isOpen: false,
        isSubmitting: false,
        joined: localStorage.getItem(`pd_joined_${projectId}`) === 'true'
    };

    /**
     * Send tracking event via Beacon for reliability
     */
    function track(type, metadata = {}) {
        const payload = JSON.stringify({
            event: type,
            projectId,
            fingerprint: state.fingerprint,
            origin: window.location.origin,
            metadata: {
                ...metadata,
                url: window.location.href,
                referrer: document.referrer
            }
        });

        if (navigator.sendBeacon) {
            navigator.sendBeacon(`${API_ENDPOINT}/events`, payload);
        } else {
            fetch(`${API_ENDPOINT}/events`, { 
                method: 'POST', 
                body: payload, 
                keepalive: true,
                headers: { 'Content-Type': 'application/json', 'x-api-key': apiKey }
            }).catch(() => {});
        }
    }

    /**
     * Public API - Lead Registration
     */
    async function registerLead(data) {
        const { email, name, phoneNumber, walletAddress, intent, metadata } = data;
        
        if (!email || !email.includes('@')) {
            console.error('[Pandoras] Invalid email');
            return { success: false, error: 'Invalid email' };
        }

        state.isSubmitting = true;
        updateUI();

        try {
            const response = await fetch(`${API_ENDPOINT}/leads/register`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-api-key': apiKey
                },
                body: JSON.stringify({
                    projectId,
                    email,
                    name: name || null,
                    phoneNumber: phoneNumber || null,
                    walletAddress: walletAddress || null,
                    fingerprint: state.fingerprint,
                    origin: window.location.origin,
                    intent: intent || 'early_access',
                    consent: true,
                    metadata: metadata || {}
                })
            });

            const result = await response.json();
            
            if (result.success) {
                state.joined = true;
                localStorage.setItem(`pd_joined_${projectId}`, 'true');
                track('LEAD_CREATED', { method: 'sdk_api_v1' });
                showSuccess();
                
                if (successUrl) {
                    setTimeout(() => { window.location.href = successUrl; }, 1500);
                }
            }
            return result;
        } catch (e) {
            console.error('[Pandoras] Registration Error:', e);
            return { success: false, error: 'Service unavailable' };
        } finally {
            state.isSubmitting = false;
            updateUI();
        }
    }

    /**
     * Public API - Commerce Modal (Iframe based)
     */
    function openCheckout(slug, tier) {
        if (!slug || !tier) {
            console.error('[Pandoras] Missing slug or tier for checkout');
            return;
        }
        
        const url = `${BASE_URL}/pay/${slug}/${tier}?widget=true&origin=${encodeURIComponent(window.location.origin)}`;
        track('COMMERCE_MODAL_OPEN', { slug, tier });

        let container = document.getElementById('pd-checkout-modal');
        if (!container) {
            container = document.createElement('div');
            container.id = 'pd-checkout-modal';
            Object.assign(container.style, {
                position: 'fixed', top: '0', left: '0', width: '100%', height: '100%',
                backgroundColor: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                zIndex: '2147483647', transition: 'all 0.3s ease'
            });

            const content = document.createElement('div');
            Object.assign(content.style, {
                width: '100%', maxWidth: '480px', height: '90%', maxHeight: '720px',
                position: 'relative', borderRadius: '24px', overflow: 'hidden',
                boxShadow: '0 25px 50px -12px rgba(0,0,0,1)', backgroundColor: '#000'
            });

            const closeBtn = document.createElement('button');
            closeBtn.innerHTML = '&times;';
            Object.assign(closeBtn.style, {
                position: 'absolute', top: '15px', right: '15px', width: '32px', height: '32px',
                borderRadius: '50%', background: 'rgba(255,255,255,0.1)', color: '#fff', border: 'none',
                cursor: 'pointer', fontSize: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                zIndex: '2147483648'
            });
            closeBtn.onclick = () => container.remove();

            const iframe = document.createElement('iframe');
            iframe.id = 'pd-checkout-iframe';
            iframe.src = url;
            Object.assign(iframe.style, {
                width: '100%', height: '100%', border: 'none', background: 'transparent'
            });

            content.appendChild(closeBtn);
            content.appendChild(iframe);
            container.appendChild(content);
            document.body.appendChild(container);
        } else {
            // Update existing iframe if it exists
            const iframe = document.getElementById('pd-checkout-iframe');
            if (iframe) iframe.src = url;
        }
    }

    // Expose Global API
    window.PandorasGrowth = {
        registerLead,
        open: openModal,
        openCheckout,
        track,
        login: openModal // Legacy compatibility for external projects
    };

    // --- UI ENGINE ---

    function updateUI() {
        const btn = document.getElementById('pd-growth-trigger');
        if (btn) btn.innerText = state.isSubmitting ? 'Syncing...' : customBtnText;
    }

    function showSuccess() {
        const content = document.getElementById('pd-modal-content');
        if (content) {
            content.innerHTML = `
                <div style="text-align:center; padding: 20px 0;">
                    <div style="font-size: 40px; margin-bottom: 15px;">🚀</div>
                    <h3 style="margin:0 0 10px 0; color:var(--pd-text); font-family:sans-serif;">You're on the list!</h3>
                    <p style="color:var(--pd-subtext); font-size:14px; margin-bottom: 20px; font-family:sans-serif;">Welcome to the next generation. We'll contact you soon.</p>
                    <div style="background:var(--pd-border); padding:12px; border-radius:8px; opacity: 0.8;">
                        <span style="font-size:12px; color:var(--pd-text); font-weight:bold; font-family:sans-serif;">STATUS: VERIFIED LEAD</span>
                    </div>
                    <button onclick="document.getElementById('pd-growth-modal').remove()" style="margin-top:20px; width:100%; border:none; background:${accentColor}; color:#fff; padding:12px; border-radius:8px; cursor:pointer; font-weight:bold;">Awesome</button>
                </div>
            `;
        }
    }

    function injectStyles() {
        const isDark = theme === 'dark';
        const css = `
            :root {
                --pd-bg: ${isDark ? '#18181b' : '#ffffff'};
                --pd-text: ${isDark ? '#fafafa' : '#111111'};
                --pd-subtext: ${isDark ? '#a1a1aa' : '#666666'};
                --pd-border: ${isDark ? '#27272a' : '#e5e7eb'};
                --pd-shadow: ${isDark ? 'rgba(0,0,0,0.5)' : 'rgba(0,0,0,0.1)'};
            }
            #pd-growth-trigger {
                position: fixed; bottom: 24px; ${position}: 24px;
                background: ${accentColor}; color: white;
                padding: 14px 22px; border-radius: 99px;
                border: none; cursor: pointer; font-weight: bold;
                box-shadow: 0 10px 15px -3px var(--pd-shadow);
                transition: all 0.2s; z-index: 2147483646;
                font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
                display: flex; align-items: center; gap: 8px;
            }
            #pd-growth-trigger:hover { transform: translateY(-2px); filter: brightness(1.1); }
            .pd-glow { animation: pd-pulse 2s infinite; }
            @keyframes pd-pulse { 0% { box-shadow: 0 0 0 0 ${accentColor}66; } 70% { box-shadow: 0 0 0 10px ${accentColor}00; } 100% { box-shadow: 0 0 0 0 ${accentColor}00; } }
            
            #pd-growth-modal * { box-sizing: border-box; }
        `;
        const style = document.createElement('style');
        style.appendChild(document.createTextNode(css));
        document.head.appendChild(style);
    }

    /**
     * Internal: Fetch UX state from the engine
     */
    async function getAccessState() {
        try {
            const response = await fetch(`${BASE_URL}/api/access-state?project=${projectId}`);
            return await response.json();
        } catch (e) {
            console.warn('[Pandoras] Failed to resolve UX state', e);
            return null;
        }
    }

    async function openModal() {
        if (document.getElementById('pd-growth-modal')) return;
        
        track('WIDGET_CLICK');

        // ✨ V5.1 Contextual Auth Bypass
        // If this is an external project, check if we should skip the lead ritual 
        const isInternal = projectId === 'pandoras' || projectId === 'dashboard';
        if (!isInternal) {
            const access = await getAccessState();
            // If the server tells us to skip lead capture, we trigger the Auth Drawer instead
            if (access?.ux?.flow && access.ux.flow !== 'lead_generation') {
                const width = 480;
                const height = 700;
                const left = (window.screen.width / 2) - (width / 2);
                const top = (window.screen.height / 2) - (height / 2);
                
                const authUrl = `${BASE_URL}/?project=${projectId}&bypass=ritual&origin=${encodeURIComponent(window.location.origin)}`;
                
                console.log('[Pandoras] Bypassing lead capture for external project:', projectId);
                window.open(authUrl, 'PandorasAuth', `width=${width},height=${height},top=${top},left=${left},scrollbars=no,resizable=no`);
                return;
            }
        }
        
        const modal = document.createElement('div');
        modal.id = 'pd-growth-modal';
        Object.assign(modal.style, {
            position: 'fixed', top: '0', left: '0', width: '100%', height: '100%',
            backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center',
            zIndex: '2147483647', backdropFilter: 'blur(4px)',
            fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif'
        });

        modal.innerHTML = `
            <div style="background:var(--pd-bg); padding:32px; border-radius:24px; width:360px; position:relative; box-shadow: 0 25px 50px -12px rgba(0,0,0,0.5); border: 1px solid var(--pd-border);">
                <button onclick="this.parentElement.parentElement.remove()" style="position:absolute; top:20px; right:20px; border:none; background:none; cursor:pointer; color:var(--pd-subtext); font-size:20px;">&times;</button>
                <div id="pd-modal-content">
                    <div style="margin-bottom:24px;">
                        <h2 style="margin:0 0 8px 0; color:var(--pd-text); font-size:24px; font-weight:800;">🎟 ${customTitle}</h2>
                        <p style="margin:0; color:var(--pd-subtext); font-size:14px; line-height:1.5;">${customSubtitle}</p>
                    </div>
                    
                    <div style="margin-bottom:24px; background:var(--pd-border); padding:16px; border-radius:16px;">
                        <div style="display:flex; justify-content:space-between; margin-bottom:8px;">
                            <span style="font-size:10px; font-weight:900; color:${accentColor}; text-transform:uppercase; tracking: 0.1em;">Ecosystem Tier</span>
                            <span style="font-size:10px; color:var(--pd-subtext); font-weight:bold;">75% Full</span>
                        </div>
                        <div style="height:6px; background:rgba(0,0,0,0.1); border-radius:3px; overflow:hidden;">
                            <div style="width:75%; height:100%; background:${accentColor}; border-radius:3px;"></div>
                        </div>
                    </div>

                    <div style="display:flex; flex-direction:column; gap:12px;">
                        <input id="pd-email" type="email" placeholder="Your best email" style="padding:14px; border:1px solid var(--pd-border); border-radius:12px; width:100%; outline:none; background:transparent; color:var(--pd-text); font-size:14px;" />
                        <input id="pd-wallet" type="text" placeholder="Wallet address (optional)" style="padding:14px; border:1px solid var(--pd-border); border-radius:12px; width:100%; outline:none; background:transparent; color:var(--pd-text); font-size:14px;" />
                        <button id="pd-submit-action" style="background:${accentColor}; color:white; border:none; padding:16px; border-radius:12px; font-weight:bold; cursor:pointer; margin-top:8px; transition: opacity 0.2s; font-size:15px;">${customActionText}</button>
                        <p style="font-size:10px; color:var(--pd-subtext); text-align:center; line-height:1.4;">By joining, you agree to our <br/> Terms and Growth Privacy Policy.</p>
                    </div>
                </div>
                <div style="margin-top:28px; padding-top:20px; border-top:1px solid var(--pd-border); display:flex; flex-direction:column; align-items:center; gap:4px;">
                    <span style="font-size:9px; color:var(--pd-subtext); font-weight:bold; letter-spacing:0.05em; text-transform:uppercase;">Powered by</span>
                    <span style="font-size:11px; font-weight:900; color:var(--pd-text); letter-spacing:1px;">PANDORAS <span style="color:${accentColor}">GROWTH OS</span></span>
                </div>
            </div>
        `;

        document.body.appendChild(modal);
        
        document.getElementById('pd-submit-action').onclick = () => {
            const email = document.getElementById('pd-email').value;
            const walletAddress = document.getElementById('pd-wallet').value;
            if (!email || !email.includes('@')) return alert('Please enter a valid email');
            registerLead({ email, walletAddress });
        };
    }

    /**
     * Auto-setup for data-based links
     */
    function setupAutoLinks() {
        document.addEventListener('click', (e) => {
            const target = e.target.closest('[data-pd-checkout-slug]');
            if (target) {
                e.preventDefault();
                const slug = target.getAttribute('data-pd-checkout-slug');
                const tier = target.getAttribute('data-pd-checkout-tier');
                openCheckout(slug, tier);
            }
        });
    }

    function initTrigger() {
        if (state.joined && !successUrl) return; 
        
        if (!hideButton) {
            const btn = document.createElement('button');
            btn.id = 'pd-growth-trigger';
            btn.className = 'pd-glow';
            btn.innerText = customBtnText;
            btn.onclick = openModal;
            document.body.appendChild(btn);
            track('WIDGET_VIEW');
        } else {
            track('WIDGET_INIT_SILENT');
        }

        setupAutoLinks();
    }

    // --- External Login Bridge ---
    window.addEventListener('message', (event) => {
        if (event.data === 'growth_os:auth_success') {
            console.log('[Pandoras] External Auth Success detected via bridge.');
            
            state.joined = true;
            localStorage.setItem(`pd_joined_${projectId}`, 'true');
            
            // Dispatch event for parent applications (like React) to react to
            window.dispatchEvent(new CustomEvent('pd-session-changed', { detail: { authenticated: true } }));
            
            // For external projects that use standard widget setup
            setTimeout(() => {
                window.location.reload();
            }, 500);
        }
    });

    // Start
    if (projectId && apiKey) {
        injectStyles();
        if (document.readyState === 'complete') {
            initTrigger();
        } else {
            window.addEventListener('load', initTrigger);
        }
    } else {
        console.warn('[Pandoras] Missing Project ID or API Key');
    }
})();
