/**
 * Hermes Universal Lead Intake SDK (F9.12)
 * Embed this script into any landing page to capture leads securely into Pandora's Growth OS.
 */

(function () {
  if (window.HermesIntakeInitialized) return;
  window.HermesIntakeInitialized = true;

  console.log('[Hermes SDK] Initialized for Project:', window.PandorasConfig?.projectId);

  const API_URL = 'https://dash.pandoras.finance/api/v1/hermes/intake/webhook';

  window.HermesIntake = {
    /**
     * Submit a lead payload manually
     */
    submitLead: async function (payload) {
      const config = window.PandorasConfig || {};
      const apiKey = config.apiKey || null;

      if (!apiKey) {
        console.error('[Hermes SDK] Missing apiKey in window.PandorasConfig');
        return { success: false, error: 'Missing API Key' };
      }

      try {
        const response = await fetch(API_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`
          },
          body: JSON.stringify({
            ...payload,
            source: payload.source || window.location.hostname,
            referrer: document.referrer || null,
          }),
        });

        const data = await response.json();
        
        if (response.ok) {
          console.log('[Hermes SDK] Lead captured successfully:', data.leadId);
          return { success: true, leadId: data.leadId };
        } else {
          console.error('[Hermes SDK] Failed to capture lead:', data.error);
          return { success: false, error: data.error };
        }
      } catch (err) {
        console.error('[Hermes SDK] Network error:', err);
        return { success: false, error: 'Network error' };
      }
    },

    /**
     * Automatically bind to a form with data-hermes-intake attribute
     */
    bindForms: function () {
      const forms = document.querySelectorAll('form[data-hermes-intake]');
      
      forms.forEach(form => {
        form.addEventListener('submit', async (e) => {
          e.preventDefault();
          
          const formData = new FormData(form);
          const payload = {};
          
          formData.forEach((value, key) => {
            payload[key] = value;
          });

          // Disable button state
          const submitBtn = form.querySelector('button[type="submit"]');
          const originalText = submitBtn ? submitBtn.innerText : '';
          if (submitBtn) {
            submitBtn.disabled = true;
            submitBtn.innerText = 'Enviando...';
          }

          const result = await this.submitLead(payload);

          if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.innerText = result.success ? 'Enviado ✔' : 'Error (Reintentar)';
            if (result.success) {
              setTimeout(() => {
                submitBtn.innerText = originalText;
                form.reset();
              }, 3000);
            }
          }
        });
      });
    }
  };

  // Auto-bind on load
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => window.HermesIntake.bindForms());
  } else {
    window.HermesIntake.bindForms();
  }
})();
