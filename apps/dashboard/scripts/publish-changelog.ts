import * as fs from 'fs';
import * as path from 'path';

// Uso: bun run scripts/publish-changelog.ts <nombre-del-archivo.md>
// Ejemplo: bun run scripts/publish-changelog.ts v1.0.md

const BRAND_NAME = "Pandora's Growth OS - Core Engine";

async function publishToDiscord() {
  const fileName = process.argv[2];
  if (!fileName) {
    console.error('❌ Especifica el archivo a publicar. Ej: bun run scripts/publish-changelog.ts v1.0.md');
    process.exit(1);
  }

  const webhookUrl = process.env.DISCORD_CHANGELOG_WEBHOOK;
  if (!webhookUrl) {
    console.error('❌ Variable de entorno DISCORD_CHANGELOG_WEBHOOK no configurada.');
    process.exit(1);
  }

  const dirPath = path.join(process.cwd(), 'content', 'changelog');
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }

  const filePath = path.join(dirPath, fileName);
  if (!fs.existsSync(filePath)) {
    console.error(`❌ El archivo no existe: ${filePath}`);
    process.exit(1);
  }

  const content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split('\n');
  const titleLine = lines.find((line) => line.startsWith('# ')) ?? '# Actualización de API';
  const body = lines.filter((line) => line !== titleLine).join('\n').trim();
  const cleanTitle = titleLine.replace('# ', '');

  const payload = {
    embeds: [
      {
        title: `🚀 Nuevo Release: ${cleanTitle}`,
        description: body.substring(0, 4000),
        color: 5814783,
        footer: {
          text: BRAND_NAME,
        },
        timestamp: new Date().toISOString(),
      },
    ],
  };

  try {
    console.log(`📤 Enviando a Discord: ${cleanTitle}...`);
    const res = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (res.ok) {
      console.log('✅ Changelog publicado en Discord.');
    } else {
      console.error(`❌ Error Discord: ${res.status} ${res.statusText}`);
    }
  } catch (error) {
    console.error('❌ Error de red:', error);
    process.exit(1);
  }
}

publishToDiscord();
