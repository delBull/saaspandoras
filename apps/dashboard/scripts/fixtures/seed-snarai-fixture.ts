import { db } from '../../src/db';
import { hermesKnowledge, hermesAddonInstallations, hermesAddons } from '../../src/db/schema';
import { eq } from 'drizzle-orm';
import * as crypto from 'crypto';

const ORG_SLUG = 'snarai';
const ORG_ID = 'snarai';

const dossierEs = `
# NARAI PRIVATE DOSSIER
Solo para circulación privada. Material de inversión confidencial.

## 01 / RESUMEN EJECUTIVO
**PARTICIPACIÓN ESTRATÉGICA EN BIENES RAÍCES**
Narai es un protocolo de participación estructurada que brinda acceso curado a exposición inmobiliaria premium en la Riviera Nayarit.
Los participantes acceden a un ecosistema basado en utilidad a través de certificados de participación (CPs) diseñados para alinear eficiencia de capital, exposición a un estilo de vida premium y participación futura.

### PUNTOS CLAVE
- **OBJETIVO DEL ACTIVO:** $100,000,000 MXN
- **UBICACIÓN:** Zona Dorada, Bucerías
- **ACCESO FOUNDER:** Actualmente Activo
- **PORTAFOLIO RECOMENDADO:** $25,000 USD (Nivel Embajador)
- **BENEFICIOS DESTACADOS:** +5% Yield y beneficio de estancias premium

## 02 / TESIS DE MERCADO
Uno de los corredores costeros de lujo con mayor rendimiento en México. 12-15% de Plusvalía Anual Histórica. 70%+ de Ocupación en Hospitalidad Premium.

## 03 / ARQUITECTURA DE PARTICIPACIÓN
**CERTIFICADOS DIGITALES (CPs)**
- **Explorer ($500 USD):** 10 CPs
- **Resident ($2,500 USD):** 50 CPs — 2 noches anuales
- **Ambassador ($10,000 USD):** 200 CPs — 10 noches anuales
- **Riviera Owner ($50,000 USD):** 1,000 CPs — 50 noches anuales

## ASIGNACIÓN (FASES RESTRINGIDAS)
1. **Fase Founder:** 10,000 CPs @ $50 USD
2. **Fase Estratégica:** 22,000 CPs @ $75 USD
3. **Fase General:** 25,000 CPs @ $100 USD

## TECNOLOGÍA Y LEGAL
Impulsado por **Pandoras Growth OS**. Estructura legal bajo el marco S.A.P.I. y Fideicomiso en México, garantizando cumplimiento NOM-151 y seguridad de grado institucional.
`;

async function main() {
  console.log(`🚀 Seeding Hermes G3 Tenant config for: ${ORG_SLUG}`);

  // 1. Identity Pack
  console.log('Inserting Identity Pack...');
  await db.insert(hermesKnowledge).values([
    {
      id: crypto.randomUUID(),
      organizationId: ORG_ID,
      dimension: 'IDENTITY',
      key: 'core_persona',
      content: 'You are Hermes, the cognitive agent for S\'Narai. You guide users through a digital participation protocol backed by a $100M MXN luxury real estate asset in Bucerías, Riviera Nayarit. You are professional and clear.',
      status: 'ACTIVE',
      visibility: 'INTERNAL',
      authority: 'CANONICAL',
      version: 1,
      source: 'SEED',
      createdBy: 'system',
    }
  ]).onConflictDoNothing();

  // 2. Knowledge Pack
  console.log('Inserting Knowledge Pack...');
  await db.insert(hermesKnowledge).values([
    {
      id: crypto.randomUUID(),
      organizationId: ORG_ID,
      dimension: 'DOMAIN',
      key: 'project_dossier_es',
      content: dossierEs,
      status: 'ACTIVE',
      visibility: 'PUBLIC',
      authority: 'CANONICAL',
      version: 1,
      source: 'SEED',
      createdBy: 'system',
    }
  ]).onConflictDoNothing();

  // 3. Addon Definitions
  console.log('Registering Core Addons...');
  await db.insert(hermesAddons).values([
    {
      id: 'hermes.channel.portal',
      name: 'Portal Channel',
      description: 'Enables chat through the tenant portal.',
      type: 'CHANNEL',
      version: '1.0.0',
      manifest: {},
      status: 'ACTIVE',
      createdBy: 'system',
    },
    {
      id: 'hermes.capability.investment_guide',
      name: 'Investment Guide',
      description: 'Guides users through investment flows.',
      type: 'CAPABILITY',
      version: '1.0.0',
      manifest: {},
      status: 'ACTIVE',
      createdBy: 'system',
    }
  ] as any[]).onConflictDoNothing();

  // 4. Addon Installations
  console.log('Inserting Portal Channel Addon & Core Governance...');
  await db.insert(hermesAddonInstallations).values([
    {
      id: crypto.randomUUID(),
      organizationId: ORG_ID,
      addonId: 'hermes.channel.portal',
      version: '1.0.0',
      status: 'ACTIVE',
      configuration: { enabled: true },
      manifestSnapshot: {},
      installedBy: 'system',
      approvedBy: 'system',
      installedAt: new Date(),
      activatedAt: new Date(),
    },
    {
      id: crypto.randomUUID(),
      organizationId: ORG_ID,
      addonId: 'hermes.capability.investment_guide',
      version: '1.0.0',
      status: 'ACTIVE',
      configuration: { enabled: true },
      manifestSnapshot: {},
      installedBy: 'system',
      approvedBy: 'system',
      installedAt: new Date(),
      activatedAt: new Date(),
    }
  ]).onConflictDoNothing();

  console.log('✅ Seeding complete.');
  process.exit(0);
}

main().catch(e => {
  console.error(e);
  process.exit(1);
});
