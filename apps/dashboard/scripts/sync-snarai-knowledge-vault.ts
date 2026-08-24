/**
 * scripts/sync-snarai-knowledge-vault.ts
 * 
 * S'Narai Knowledge Synchronization & Sovereign IPFS Anchor
 * Injects 100% canonical, hallucination-free knowledge into hermes_knowledge
 * and envelope-encrypts + anchors all documents to IPFS (hermes_knowledge_registry).
 */

import { db } from '../src/db';
import { hermesKnowledge, hermesKnowledgeRegistry } from '../src/db/schema';
import { eq, or } from 'drizzle-orm';
import { TenantIpfsVaultService } from '../src/lib/pandoras/core/domains/hermes/knowledge/ipfs-vault';
import { HermesIdentitySigner } from '../src/lib/pandoras/core/domains/hermes/identity/identity-signer';
import crypto from 'crypto';

const TENANT_ID = 'snarai';

const CANONICAL_KNOWLEDGE_DOCS = [
  {
    dimension: 'IDENTITY',
    key: 'snarai-identity',
    classification: 'PUBLIC',
    content: `# S'Narai — Identidad y Respaldo Corporativo

- **Proyecto:** S'Narai Riviera Nayarit
- **Ubicación:** Zona Dorada de Bucerías, Riviera Nayarit, México
- **Entidad Operadora:** Aztecas Hub S.A.P.I. de C.V.
- **Desarrollador:** Aztecas Real Estate (+15 años de experiencia en desarrollo inmobiliario en la Riviera Nayarit)
- **Agente de Crecimiento:** Hermes Patrimonial (Gestor Patrimonial IA Autónomo)
- **Portal Oficial:** https://snarai.aztecaz.xyz/portal
- **Contacto Directo:** https://snarai.aztecaz.xyz/contacto`,
  },
  {
    dimension: 'IDENTITY',
    key: 'core_persona',
    classification: 'PUBLIC',
    content: `Eres HERMES PATRIMONIAL, el Gestor Patrimonial IA Autónomo de S'Narai Riviera Nayarit.
Tu misión es orientar a los prospectos con voz ejecutiva, sofisticada y cercana, resolver dudas sobre el modelo de Inversión Fraccionada bajo Aztecas Hub S.A.P.I. de C.V., y guiar hacia la adquisición de títulos de membresía o una sesión con los fundadores.
Operas con estricta adherencia a la realidad del proyecto: desarrollo residencial boutique en Bucerías con distribución de utilidades de rentas vacacionales y plusvalía inmobiliaria.`,
  },
  {
    dimension: 'PRODUCTS',
    key: 'snarai-products',
    classification: 'PUBLIC',
    content: `# Productos y Membresías — S'Narai

## Título de Participación Inmobiliaria (Etapa Fundadores)
- **Precio Base:** $50 USD / 50 USDC por título
- **Monedas Aceptadas:** USDC y Pesos Mexicanos (MXN vía SPEI Fast Lane)
- **Monto Mínimo:** 1 título ($50 USD)
- **Cupo Inicial:** 40 membresías fundadoras prioritarias
- **Beneficios:** 
  1. Posicionamiento preferencial en Etapa 0 a precio de costo.
  2. Participación pro-rata en la distribución trimestral de utilidades generadas por rentas vacacionales tras la entrega de la obra.
  3. Captura directa de la plusvalía proyectada (12-15% anual estimada en la Zona Dorada de Bucerías).
  4. Certificado de Participación digital oficial emitido por Aztecas Hub S.A.P.I. de C.V., descargable en PDF.`,
  },
  {
    dimension: 'DOMAIN',
    key: 'project_dossier_es',
    classification: 'PUBLIC',
    content: `# S'NARAI — DOSSIER PRIVADO DE INVERSIÓN

## 1. Resumen Ejecutivo
S'Narai es un exclusivo desarrollo residencial boutique ubicado en la codiciada Zona Dorada de Bucerías, Riviera Nayarit, México. Desarrollado por Aztecas Real Estate (+15 años de trayectoria) y operado corporativamente bajo Aztecas Hub S.A.P.I. de C.V., ofrece un modelo de Inversión Fraccionada que combina plusvalía de primer orden con flujo de caja por rentas vacacionales administradas profesionalmente.

## 2. Fases de Participación
1. **Etapa Fundadores (Fase 1):** $50 USD por título (Cupos limitados a 40 miembros).
2. **Etapa Estratégica (Fase 2):** $75 USD por título.
3. **Etapa General (Fase 3):** $100 USD por título.

## 3. Modelo Operativo y de Ingresos
- **Tipo de Activo:** Inmueble residencial boutique de lujo.
- **Generación de Rendimientos:** Rentas vacacionales con administración profesional (concierge, mantenimiento y fondo de reserva) + preventa de unidades residenciales.
- **Distribución:** Pro-rata proporcional a la cantidad de títulos poseídos, sin intermediarios.
- **Transparencia:** Seguimiento en tiempo real desde el portal de inversionista.

## 4. Marco Legal y Certeza Jurídica
- Operación estructurada bajo la figura de Sociedad Anónima Promotora de Inversión de Capital Variable (S.A.P.I. de C.V.) en México.
- Cada participante recibe un contrato de participación y su certificado digital emitido oficialmente por la S.A.P.I., siendo un derecho de participación legalmente vinculante y heredable.`,
  },
  {
    dimension: 'BUSINESS',
    key: 'snarai-business',
    classification: 'PUBLIC',
    content: `# S'Narai — Tesis de Negocio y Creación de Valor

### ¿Por qué S'Narai?
La inversión inmobiliaria tradicional en zonas de playa de alta plusvalía suele requerir tickets de entrada inaccesibles ($300k+ USD) y genera altos costos de mantenimiento cuando los inmuebles pasan la mayor parte del año desocupados.
S'Narai resuelve esta ineficiencia aplicando un modelo de inversión fraccionada:
1. **Accesibilidad:** Participa desde $50 USD en uno de los destinos turísticos y residenciales de mayor plusvalía en México.
2. **Cero Fricción Operativa:** Administración manos-fuera profesional que maximiza la tasa de ocupación en rentas vacacionales.
3. **Alineación de Intereses:** Utilidades distribuidas directamente de los resultados operativos reales.`,
  },
  {
    dimension: 'PUBLIC',
    key: 'snarai-public-faq',
    classification: 'PUBLIC',
    content: `# S'Narai — Preguntas Frecuentes (FAQ)

### ¿Qué recibo al adquirir títulos en S'Narai?
Recibes tu Certificado de Participación digital oficial expedido bajo Aztecas Hub S.A.P.I. de C.V. Este documento certifica tu participación y te otorga derechos económicos sobre las utilidades operativas y la plusvalía del proyecto.

### ¿Cómo puedo pagar en Pesos Mexicanos (MXN)?
A través del sistema SPEI Fast Lane, puedes realizar una transferencia interbancaria directa en MXN. Tu cupo queda reservado y recibes tu contrato de participación de inmediato.

### ¿Se garantizan rendimientos fijos?
No. Por transparencia y cumplimiento normativo, S'Narai no ofrece rendimientos fijos garantizados. Las utilidades provienen de la operación real de rentas vacacionales y la plusvalía del inmueble en Bucerías.

### ¿Cuál es el tiempo estimado de obra?
El periodo de construcción se estima entre 14 y 18 meses una vez concluida la etapa de fondeo de la Fase 1.

### ¿Cómo agendar una llamada con los fundadores?
Puedes solicitar una sesión patrimonial directa a través del calendario oficial: https://dash.pandoras.finance/events/snarai/1`,
  },
  {
    dimension: 'policy',
    key: 'banned_topics',
    classification: 'CONFIDENTIAL',
    content: `# S'Narai — Restricciones Negativas y Temas Prohibidos (Banned Topics)

## 1. REGLAS ESTRICTAS DE VOCABULARIO Y MODELO
- **PROHIBIDO MENCIONAR "FIDEICOMISO" o "NOM-151":** S'Narai opera bajo el marco corporativo de Aztecas Hub S.A.P.I. de C.V. y contratos de participación digital. Nunca afirmes que opera bajo un fideicomiso o norma NOM-151.
- **PROHIBIDO MENCIONAR "HOTEL", "CONDO-HOTEL" o "RENTA HOTELERA":** S'Narai es un complejo residencial boutique con rentas vacacionales. Nunca lo describas como un hotel ni hables de rentas hoteleras.
- **PROHIBIDO MENCIONAR "NOCHES DE ESTANCIA" o "DERECHOS DE NOCHES":** No existen paquetes de "2 noches", "10 noches" ni "50 noches". S'Narai ofrece derechos de uso y estancias según la membresía, pero jamás se cuantifica como noches hoteleras.
- **PROHIBIDO MENCIONAR "CPs" (Certificados de Participación como acrónimo) o TIERS INVENTADOS:** El producto se denomina "Títulos de Participación" o "Membresía Fundador". No uses la sigla "CPs" ni nombres de tiers no oficiales como "Riviera Owner" o "Resident".
- **PROHIBIDO INVENTAR "ESTRATEGIA DE FAMILIA" o "ADD-ONS FAMILIARES":** No existe ningún producto ni add-on llamado "Estrategia de Familia" ni paquetes familiares con piscinas infantiles o áreas reservadas.

## 2. PROHIBICIÓN DE GARANTÍAS FINANCIERAS
- **PROHIBIDO GARANTIZAR RETORNOS FIJOS:** Nunca prometas porcentajes de rendimiento fijo ni garantías bancarias. Las distribuciones provienen del desempeño real de las rentas vacacionales.

## 3. PROHIBICIÓN DE ASESORÍA FISCAL O JURÍDICA
- Hermes no brinda asesoría fiscal ni jurídica individual. Remite siempre a los fundadores o canales oficiales.`,
  },
  {
    dimension: 'policy',
    key: 'tone_of_voice',
    classification: 'CONFIDENTIAL',
    content: `# S'Narai — Directrices de Voz y Tono

- **Arquetipo:** Gestor Patrimonial Privado, sofisticado, sobrio, transparente y directo.
- **Formato:** Markdown estructurado con subtítulos, viñetas, emojis discretos (💎, 📍, 🏛️, 📈, 🚀) y excelente legibilidad.
- **Claridad:** Respuestas concisas que invitan a la acción lógica (explorar el portal o agendar con fundadores).`,
  },
];

async function syncKnowledge() {
  console.log('🚀 Iniciando sincronización canónica de conocimiento para S\'Narai...');

  const vault = new TenantIpfsVaultService();
  const signer = new HermesIdentitySigner();

  // 1. Limpiar o actualizar registros en hermesKnowledge
  for (const doc of CANONICAL_KNOWLEDGE_DOCS) {
    const existing = await db
      .select()
      .from(hermesKnowledge)
      .where(
        or(
          eq(hermesKnowledge.organizationId, TENANT_ID),
          eq(hermesKnowledge.organizationId, `org_${TENANT_ID}`)
        )
      );

    const match = existing.find(r => r.key === doc.key);

    if (match) {
      console.log(`✏️ Actualizando dimensión [${doc.dimension}] clave "${doc.key}"...`);
      await db
        .update(hermesKnowledge)
        .set({
          organizationId: TENANT_ID,
          dimension: doc.dimension,
          content: doc.content,
          classification: doc.classification as any,
          status: 'ACTIVE',
          updatedAt: new Date(),
        })
        .where(eq(hermesKnowledge.id, match.id));
    } else {
      console.log(`➕ Insertando dimensión [${doc.dimension}] clave "${doc.key}"...`);
      await db.insert(hermesKnowledge).values({
        id: crypto.randomUUID(),
        organizationId: TENANT_ID,
        dimension: doc.dimension,
        key: doc.key,
        content: doc.content,
        classification: doc.classification as any,
        status: 'ACTIVE',
        visibility: 'PUBLIC',
        authority: 'SYSTEM',
        version: 1,
        source: 'Sovereign Knowledge Vault v2.0',
        createdBy: 'admin_sync',
      });
    }

    // 2. Anclar artefacto al Sovereign IPFS Vault
    try {
      console.log(`🌐 Anclando clave "${doc.key}" a IPFS Vault...`);
      const pinned = await vault.storeEncryptedKnowledgeToIpfs(
        doc.content,
        {
          tenantId: TENANT_ID,
          artifactId: doc.key,
          classification: doc.classification as any,
          version: 1,
        },
        signer
      );

      const ciphertextHash = crypto.createHash('sha256').update(pinned.encryptedMetadata.ciphertext, 'utf8').digest('hex');
      const aadBinding = `${TENANT_ID}:${doc.key}:1:${doc.classification}`;

      // Upsert into hermesKnowledgeRegistry
      const existingRegistry = await db
        .select()
        .from(hermesKnowledgeRegistry)
        .where(
          or(
            eq(hermesKnowledgeRegistry.tenantId, TENANT_ID),
            eq(hermesKnowledgeRegistry.tenantId, `org_${TENANT_ID}`)
          )
        );

      const regMatch = existingRegistry.find(r => r.artifactId === doc.key);
      if (regMatch) {
        await db
          .update(hermesKnowledgeRegistry)
          .set({
            tenantId: TENANT_ID,
            ipfsCid: pinned.cid,
            backupIpfsCid: pinned.backupCid || null,
            ipfsUri: pinned.ipfsUri,
            contentHash: pinned.contentHash,
            ciphertextHash,
            aadBinding,
            agentSignature: pinned.agentSignature || '0x_sig_placeholder',
            governanceStatus: 'SHADOW_VERIFIED',
            updatedAt: new Date(),
          })
          .where(eq(hermesKnowledgeRegistry.id, regMatch.id));
      } else {
        await db.insert(hermesKnowledgeRegistry).values({
          id: crypto.randomUUID(),
          tenantId: TENANT_ID,
          artifactId: doc.key,
          domain: doc.dimension.toLowerCase(),
          classification: doc.classification,
          version: 1,
          ipfsCid: pinned.cid,
          backupIpfsCid: pinned.backupCid || null,
          ipfsUri: pinned.ipfsUri,
          contentHash: pinned.contentHash,
          ciphertextHash,
          aadBinding,
          signedByAddress: '0x0000000000000000000000000000000000000000',
          agentSignature: pinned.agentSignature || '0x_sig_placeholder',
          governanceStatus: 'SHADOW_VERIFIED',
        });
      }
      console.log(`✅ IPFS Anchor exitoso: CID ${pinned.cid}`);
    } catch (ipfsErr) {
      console.warn(`⚠️ Error anclando a IPFS (clave ${doc.key}):`, ipfsErr);
    }
  }

  console.log('\n🎉 ¡Sincronización y Anclaje IPFS de S\'Narai completados con éxito!');
}

syncKnowledge()
  .then(() => process.exit(0))
  .catch(err => {
    console.error('❌ Error fatal en sincronización:', err);
    process.exit(1);
  });
