#!/usr/bin/env node

/**
 * Script para llamar a la API de creación de tabla users
 * Funciona tanto en desarrollo como en producción
 */

import { execSync } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🚀 Llamando API para crear tabla users...');

// Determinar la URL base
let baseUrl = 'http://localhost:3000'; // Por defecto desarrollo

// Si hay variables de entorno de Vercel, usar la URL de producción
if (process.env.VERCEL_URL) {
  baseUrl = `https://${process.env.VERCEL_URL}`;
  console.log('🌐 Detectado entorno de Vercel');
} else if (process.env.NEXT_PUBLIC_SITE_URL) {
  baseUrl = process.env.NEXT_PUBLIC_SITE_URL;
  console.log('🌐 Usando NEXT_PUBLIC_SITE_URL');
}

// Si estamos en desarrollo y no hay servidor corriendo, intentar cargar .env.local
if (baseUrl === 'http://localhost:3000') {
  try {
    const fs = await import('fs');
    const path = await import('path');
    const dotenv = await import('dotenv');

    const envLocalPath = path.join(__dirname, '.env.local');
    const envPath = path.join(__dirname, '.env');

    if (fs.existsSync(envLocalPath)) {
      dotenv.config({ path: envLocalPath });
      console.log('📋 Variables de entorno cargadas desde .env.local');
    } else if (fs.existsSync(envPath)) {
      dotenv.config({ path: envPath });
      console.log('📋 Variables de entorno cargadas desde .env');
    }

    // Verificar si hay una URL personalizada en las variables de entorno
    if (process.env.NEXT_PUBLIC_SITE_URL) {
      baseUrl = process.env.NEXT_PUBLIC_SITE_URL;
      console.log(`🌐 Usando URL personalizada: ${baseUrl}`);
    }
  } catch (error) {
    console.log('📋 No se pudieron cargar variables de entorno locales');
  }
}

const apiUrl = `${baseUrl}/api/admin/create-users-table`;

console.log(`📡 URL de la API: ${apiUrl}`);

try {
  console.log('📡 Llamando a la API...');

  const response = await fetch(apiUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  const result = await response.json();

  if (response.ok) {
    console.log('✅ API ejecutada exitosamente');
    console.log(`📋 Resultado: ${result.message}`);

    if (result.action === 'created') {
      console.log('🎉 Tabla users creada exitosamente');
      console.log('🔄 La aplicación debería funcionar ahora');
    } else {
      console.log('📋 La tabla users ya existía');
    }
  } else {
    console.error('❌ Error en la API:', result.error);
    if (result.details) {
      console.error('📋 Detalles:', result.details);
    }
  }

} catch (error) {
  console.error('❌ Error llamando a la API:', error.message);

  if (error.message.includes('Authentication Required') || error.message.includes('401')) {
    console.log('🔐 El deployment de Vercel tiene protección habilitada');
    console.log('📋 Opciones para solucionarlo:');
    console.log('   1. Deshabilitar temporalmente la protección en Vercel');
    console.log('   2. Usar el bypass token de Vercel');
    console.log('   3. Ejecutar desde dentro de la aplicación (no desde curl)');
    console.log('');
    console.log('📋 Para deshabilitar la protección:');
    console.log('   - Ve a tu dashboard de Vercel');
    console.log('   - Selecciona tu proyecto');
    console.log('   - Ve a Settings > Functions > Protection');
    console.log('   - Deshabilita temporalmente');
    console.log('');
    console.log('📋 Para usar bypass token:');
    console.log(`   curl -X POST "${apiUrl}?x-vercel-set-bypass-cookie=true&x-vercel-protection-bypass=TU_TOKEN"`);
    console.log('');
    console.log('📋 O ejecuta directamente en la aplicación:');
    console.log('   - Ve a tu staging: https://staging.dash.pandoras.finance');
    console.log('   - Abre DevTools (F12)');
    console.log('   - Ve a Console');
    console.log('   - Ejecuta: fetch("/api/admin/create-users-table", {method: "POST"}).then(r=>r.json()).then(console.log)');
  } else {
    console.log('📋 Intentando método alternativo...');

    // Si fetch no está disponible, usar curl
    try {
      const curlCommand = `curl -X POST "${apiUrl}" -H "Content-Type: application/json" -w "\\nStatus: %{http_code}\\n"`;
      console.log(`📡 Ejecutando: ${curlCommand}`);

      const output = execSync(curlCommand, {
        encoding: 'utf8',
        cwd: __dirname
      });

      console.log('📤 Respuesta de curl:');
      console.log(output);

    } catch (curlError) {
      console.error('❌ Error con curl:', curlError.message);
      console.log('📋 El deployment tiene protección habilitada');
      console.log('📋 Soluciones:');
      console.log('   1. Deshabilitar protección en Vercel Settings');
      console.log('   2. Usar bypass token');
      console.log('   3. Ejecutar desde DevTools en el navegador');
    }
  }
}
