'use server';

export async function submitPartnershipContact(formData: FormData) {
  const name = formData.get('name') as string;
  const email = formData.get('email') as string;
  const community = formData.get('community') as string;
  const message = formData.get('message') as string;

  if (!name || !email) {
    return { success: false, message: 'Name and Email are required.' };
  }

  const webhookUrl = process.env.DISCORD_WEBHOOK_ALERTS;
  
  if (!webhookUrl) {
    console.error('[BitcoinInitiative] DISCORD_WEBHOOK_ALERTS not found.');
    return { success: false, message: 'Configuration error. Please try again later.' };
  }

  try {
    const payload = {
      embeds: [{
        title: "₿ New Bitcoin Partnership Inquiry",
        color: 16225050, // Bitcoin Orange #F7931A
        fields: [
          { name: "Name", value: name || "N/A", inline: true },
          { name: "Email", value: email || "N/A", inline: true },
          { name: "Community/Organization", value: community || "N/A", inline: false },
          { name: "Message", value: message || "No message provided", inline: false },
        ],
        footer: { text: "Pandoras Bitcoin Real Estate Initiative" },
        timestamp: new Date().toISOString()
      }]
    };

    const res = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (!res.ok) {
      console.error('[BitcoinInitiative] Discord webhook error:', await res.text());
      return { success: false, message: 'Failed to send notification.' };
    }

    return { success: true, message: 'Your inquiry has been received. We will contact you shortly.' };
  } catch (error) {
    console.error('[BitcoinInitiative] Error sending webhook:', error);
    return { success: false, message: 'An unexpected error occurred.' };
  }
}
