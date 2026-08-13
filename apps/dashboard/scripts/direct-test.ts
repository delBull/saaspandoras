import { POST } from '../src/app/api/v1/external/whatsapp/webhook/route';

async function testWebhook() {
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
      tenantId: "pandoras-corporate"
    }
  };

  const request = new Request('http://localhost/api/v1/external/whatsapp/webhook', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-bridge-token': 'dev_bridge_secret'
    },
    body: JSON.stringify(payload)
  });

  try {
    const response = await POST(request);
    console.log('Status:', response.status);
    console.log('Body:', await response.text());
  } catch (err) {
    console.error('Crash:', err);
  }
}

testWebhook();
