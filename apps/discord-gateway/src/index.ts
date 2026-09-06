import { Client, GatewayIntentBits, Message, Partials } from 'discord.js';
import dotenv from 'dotenv';
import axios from 'axios';

dotenv.config();

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.DirectMessages,
  ],
  partials: [Partials.Channel, Partials.Message]
});

const HERMES_API_URL = process.env.HERMES_API_URL || 'http://localhost:3000/api/v1/internal/discord/chat';
const INTERNAL_SECRET = process.env.INTERNAL_SECRET || 'dev_secret_key';

client.once('ready', () => {
  console.log(`[Hermes Discord Gateway] Logged in as ${client.user?.tag}`);
});

client.on('messageCreate', async (message: Message) => {
  // Ignore messages from bots (including ourselves)
  if (message.author.bot) return;

  const isMentioned = client.user && message.mentions.has(client.user.id);
  const isDirectMessage = message.channel.isDMBased();
  const isReplyToHermes = message.reference && message.mentions.repliedUser?.id === client.user?.id;
  const isThread = message.channel.isThread();

  // Zero-Trust Linking Flow
  if (message.content.trim() === '!link-wallet') {
    const link = `https://admin.pandoras.finance/admin/discord-verify?discord_id=${message.author.id}`;
    await message.author.send(`¡Hola! Haz clic en el siguiente enlace para verificar tu Smart Wallet y vincular tu cuenta de Discord a los privilegios de operador en Pandoras Growth OS:\n\n${link}`);
    if (!isDirectMessage) {
      await message.reply("Te he enviado un mensaje privado con el enlace de vinculación.");
    }
    return;
  }

  // HITL Operator Reply Flow
  // If the message is in a thread and doesn't mention Hermes directly, treat it as a human reply to the user.
  if (isThread && !isMentioned && (!message.content.startsWith('!') || message.content.trim() === '!resolver')) {
    try {
      // Fetch the starter message to extract Conversation ID
      const thread = message.channel;
      let conversationId = null;
      if (thread.isThread()) {
        const starterMessage = await thread.fetchStarterMessage();
        if (starterMessage) {
          // Look for something like "Conversation ID: conv_12345" or similar in the embed or text
          const textToSearch = starterMessage.content + (starterMessage.embeds[0]?.description || '');
          const match = textToSearch.match(/Conversation ID:\s*([a-zA-Z0-9_-]+)/i);
          if (match && match[1]) {
            conversationId = match[1];
          }
        }
      }

      if (!conversationId) {
        await message.react('❓');
        await message.author.send(`No pude extraer el 'Conversation ID' del mensaje original de este hilo. Asegúrate de que el webhook incluya 'Conversation ID: [id]'.`);
        return;
      }

      // Send to the HITL endpoint
      const releaseTakeover = message.content.trim() === '!resolver';
      const actualMessage = releaseTakeover ? "Conversación marcada como resuelta. Hermes retoma el control." : message.content;

      const hitlResponse = await axios.post('http://localhost:3000/api/v1/internal/discord/hitl-reply', {
        discordUserId: message.author.id,
        message: actualMessage,
        channelId: message.channel.id,
        conversationId,
        releaseTakeover
      }, {
        headers: { 'x-internal-secret': INTERNAL_SECRET, 'Content-Type': 'application/json' }
      });
      
      if (hitlResponse.data.ok || hitlResponse.data.success) {
        await message.react('✅');
      } else {
        await message.react('❌');
        await message.reply(`Error de enrutamiento: ${hitlResponse.data.error || 'Desconocido'}`);
      }
    } catch (e: any) {
      await message.react('❌');
      const errReason = e.response?.data?.error || e.message;
      await message.author.send(`Tu mensaje en el hilo no pudo ser enviado al usuario porque no tienes permisos en el Tenant (Zero-Trust Validation Failed) o hubo un error: ${errReason}`);
      await message.delete();
    }
    return;
  }

  // Only respond to Hermes Agent commands if directly addressed
  if (!isMentioned && !isDirectMessage && !isReplyToHermes) return;

  // Clean the message content by removing the bot mention string if present
  let content = message.content;
  if (client.user) {
      const mentionRegex = new RegExp(`^<@!?${client.user.id}>\\s*`);
      content = content.replace(mentionRegex, '');
  }

  try {
    // Show typing indicator
    if ('sendTyping' in message.channel) {
      await message.channel.sendTyping();
    }

    // Forward to Hermes Dashboard Runtime
    const payload = {
      channel: 'discord_internal',
      discordUserId: message.author.id,
      discordUsername: message.author.username,
      content,
      channelId: message.channel.id,
      guildId: message.guildId,
      messageId: message.id
    };

    const response = await axios.post(HERMES_API_URL, payload, {
      headers: {
        'x-internal-secret': INTERNAL_SECRET,
        'Content-Type': 'application/json'
      }
    });

    if (response.data && response.data.reply) {
      // Split large replies if necessary (Discord limit is 2000 chars)
      const replyText = response.data.reply;
      if (replyText.length > 2000) {
        const chunks = replyText.match(/[\s\S]{1,1990}/g) || [];
        for (const chunk of chunks) {
            await message.reply(chunk);
        }
      } else {
        await message.reply(replyText);
      }
    } else {
       await message.reply("*(Silencio operativo - Comando procesado sin respuesta textual)*");
    }

  } catch (error: any) {
    console.error('Error forwarding message to Hermes Runtime:', error.message);
    await message.reply("⚠️ **Hermes Core Error:** No se pudo contactar al servidor central o hubo un fallo en la ejecución. Revisa los logs del Dashboard.");
  }
});

client.login(process.env.DISCORD_BOT_TOKEN);
