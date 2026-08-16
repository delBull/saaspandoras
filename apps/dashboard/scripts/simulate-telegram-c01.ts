async function run() {
  const url = process.env.WEBHOOK_URL || 'http://localhost:3000/api/v1/external/telegram/webhook?tenant=snarai';
  
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

  console.log(`[C0.1] Disparando webhook simulado de Telegram a ${url}...`);

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
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
    console.log(`✅ [C0.1] Webhook de Telegram aceptó el request.`);
    console.log(`[C0.1] Respuesta:`, JSON.stringify(data, null, 2));
    
  } catch (error) {
    console.error(`❌ [C0.1] Error de conexión:`, error);
    console.log(`Asegúrate de que el servidor dev (npm run dev) esté corriendo en el puerto 3000.`);
  }
}

run();
