/**
 * Script for C0.1: WhatsApp Edge -> Hermes Channel Boundary
 * Run with: npx tsx apps/dashboard/scripts/simulate-whatsapp-c01.ts
 * 
 * Note: Ensure your Next.js dev server is running on localhost:3000
 */

async function run() {
  const url = process.env.WEBHOOK_URL || 'http://localhost:3000/api/v1/external/whatsapp/webhook';
  const bridgeToken = process.env.WA_BRIDGE_SECRET || 'dev_bridge_secret';
  
  // The normalized Envelope from wa-sofia-bridge
  const payload = {
    source: "whatsapp",
    externalId: `wamid.HBgL${Date.now()}`,
    identity: {
      phone: "+5213221374392",
      name: "Customer Zero"
    },
    payload: {
      text: "Hola Hermes",
      timestamp: new Date().toISOString()
    },
    context: {
      line: "hermes-business",
      tenantId: "pandoras-corporate" // Should be explicitly ignored by the webhook to enforce C5.11
    }
  };

  console.log(`[C0.1] Disparando webhook simulado a ${url}...`);
  console.log(`[C0.1] Payload:`, JSON.stringify(payload, null, 2));

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-bridge-token': bridgeToken
      },
      body: JSON.stringify(payload)
    });

    const status = response.status;
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ [C0.1] Webhook falló con status ${status}:`, errorText);
      process.exit(1);
    }

    const data = await response.json();
    console.log(`✅ [C0.1] Webhook aceptó el request.`);
    console.log(`[C0.1] Respuesta:`, JSON.stringify(data, null, 2));
    
    if (data.status === 'ACCEPTED' && data.organizationId) {
      console.log(`\n🎉 CERTIFICACIÓN C0.1 COMPLETADA: La identidad canónica se resolvió exitosamente a la organización '${data.organizationId}' y se despachó asíncronamente al Runtime.`);
    }

  } catch (error) {
    console.error(`❌ [C0.1] Error de conexión:`, error);
    console.log(`Asegúrate de que el servidor dev (npm run dev) esté corriendo en el puerto 3000.`);
  }
}

run();
