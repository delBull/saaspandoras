// Archivo: generar-dominios.js (en la raíz de tu app 'dashboard')
const https = require("https");
const { URL } = require("url");
const fs = require("fs");
const path = require("path");

// --- Configuración ---
const TOKENLIST_URL = "https://tokens.uniswap.org";

// CORREGIDO: La ruta ahora apunta al archivo en el directorio actual.
const CONFIG_FILE_PATH = path.join(process.cwd(), 'next.config.mjs');
const START_MARKER = "// START: AUTO-GENERATED HOSTNAMES";
const END_MARKER = "// END: AUTO-GENERATED HOSTNAMES";

console.log(`📥 Descargando lista de tokens desde ${TOKENLIST_URL}...`);

https.get(TOKENLIST_URL, (res) => {
    let data = "";
    res.on("data", (chunk) => (data += chunk));
    res.on("end", () => {
      try {
        const json = JSON.parse(data);
        const hostSet = new Set();
        
        json.tokens.forEach((token) => {
          if (token.logoURI && token.logoURI.startsWith("http")) {
            try {
              const url = new URL(token.logoURI);
              hostSet.add(url.hostname);
            } catch (e) {
              // Ignora URLs inválidas
            }
          }
        });
        
        const sortedHosts = Array.from(hostSet).sort();
        console.log(`🔍 Se encontraron ${sortedHosts.length} dominios únicos.`);

        const newPatterns = sortedHosts.map(h => 
          `      { protocol: 'https', hostname: '${h}' },`
        ).join('\n');
        
        if (!fs.existsSync(CONFIG_FILE_PATH)) {
            console.error(`❌ Error: No se encontró el archivo de configuración en la ruta: ${CONFIG_FILE_PATH}`);
            return;
        }

        let fileContent = fs.readFileSync(CONFIG_FILE_PATH, 'utf8');
        
        const regex = new RegExp(`(${START_MARKER})([\\s\\S]*)(${END_MARKER})`, 'm');

        if (!regex.test(fileContent)) {
            console.error(`❌ Error: No se encontraron los marcadores en ${CONFIG_FILE_PATH}`);
            console.error(`Asegúrate de que tu archivo contenga ${START_MARKER} y ${END_MARKER}`);
            return;
        }

        const newFileContent = fileContent.replace(regex, `$1\n${newPatterns}\n      $3`);

        fs.writeFileSync(CONFIG_FILE_PATH, newFileContent, 'utf8');

        console.log(`✅ ¡Éxito! El archivo ${CONFIG_FILE_PATH} ha sido actualizado.`);

      } catch (e) {
          console.error("❌ Error al procesar el JSON de la lista de tokens:", e);
      }
    });
  })
  .on("error", (err) => console.error("❌ Error al descargar la lista de tokens:", err.message));