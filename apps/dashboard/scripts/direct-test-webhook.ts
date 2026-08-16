import { DefaultOmnichannelGateway } from '../src/lib/pandoras/core/domains/channels/omnichannel-gateway';
import { DefaultCognitiveChannelDispatcher } from '../src/lib/pandoras/core/domains/channels/channel-dispatcher';

async function run() {
  const omnichannelGateway = new DefaultOmnichannelGateway();
  const channelDispatcher = new DefaultCognitiveChannelDispatcher();

  console.log('Testing WhatsApp Webhook directly...');
  try {
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

    const normalized = await omnichannelGateway.receive({
      channelType: 'whatsapp',
      externalId: payload.externalId,
      rawPayload: payload
    });

    console.log('Normalized output:', normalized);
    
    // Dispatch
    await channelDispatcher.dispatchAsync(normalized);
    console.log('Dispatched successfully!');
    
  } catch (err: any) {
    console.error('Direct Test Error:', err);
  }
}

run();
