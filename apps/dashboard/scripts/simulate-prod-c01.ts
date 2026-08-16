async function run() {
  const url = 'https://dash.pandoras.finance/api/v1/external/telegram/webhook?tenant=snarai';
  
  const payload = {
    update_id: Date.now(),
    message: {
      message_id: 1,
      from: {
        id: 123456789,
        is_bot: false,
        first_name: "Test User",
        username: "testuser"
      },
      chat: {
        id: 123456789,
        first_name: "Test User",
        username: "testuser",
        type: "private"
      },
      date: Math.floor(Date.now() / 1000),
      text: "Hola, me interesa el portal"
    }
  };

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    
    console.log(`Status: ${response.status}`);
    const text = await response.text();
    console.log(`Response:`, text);
  } catch (error) {
    console.error(`Error:`, error);
  }
}
run();
