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

  // Only respond if directly addressed
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
