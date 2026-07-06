import 'dotenv/config';
import { drizzle } from 'drizzle-orm/node-postgres';
import pkg from 'pg';
const { Pool } = pkg;
import * as schema from '../src/db/schema.js';
import { eq } from 'drizzle-orm';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});
const db = drizzle(pool, { schema });

const dossierEn = `
# NARAI PRIVATE DOSSIER
Private circulation only  
Confidential investment material

## 01 / EXECUTIVE SUMMARY
**STRATEGIC REAL ESTATE PARTICIPATION**

Narai is a structured participation protocol providing curated access to premium real estate exposure in Riviera Nayarit.
Participants access a utility-based ecosystem through participation certificates designed to align capital efficiency, premium lifestyle exposure and future ecosystem participation.

### KEY HIGHLIGHTS
- **ASSET TARGET:** $100,000,000 MXN
- **LOCATION:** Golden Zone, Bucerías
- **FOUNDER ACCESS:** Currently Active
- **MIN. POSITION:** $500 USD

## 02 / MARKET THESIS
**WHY RIVIERA NAYARIT**

One of Mexico’s highest-performing luxury coastal corridors.
*"Scarcity plus demand concentration creates asymmetric upside conditions."*

## 03 / PARTICIPATION ARCHITECTURE
**DIGITAL CERTIFICATES**

Participants acquire structured digital participation certificates (CPs) designed to unlock ecosystem rights and participation mechanics.

- **Explorer ($500 USD):** 10 CPs
- **Resident ($2,500 USD):** 50 CPs — 2 nights annually
- **Ambassador ($10,000 USD):** 200 CPs — 10 nights annually
- **Riviera Owner ($50,000 USD):** 1,000 CPs — 50 nights annually

## 04 / POWERED BY PANDORAS
**INSTITUTIONAL INFRASTRUCTURE**

Narai is incubated by Pandoras Infrastructure, providing the protocol stack for the ecosystem.
`;

const dossierEs = `
# NARAI PRIVATE DOSSIER
Solo para circulación privada  
Material de inversión confidencial

## 01 / RESUMEN EJECUTIVO
**PARTICIPACIÓN ESTRATÉGICA EN BIENES RAÍCES**

Narai es un protocolo de participación estructurada que brinda acceso curado a exposición inmobiliaria premium en la Riviera Nayarit.
Los participantes acceden a un ecosistema basado en utilidad a través de certificados de participación diseñados para alinear eficiencia de capital, exposición a un estilo de vida premium y participación futura.

### PUNTOS CLAVE
- **OBJETIVO DEL ACTIVO:** $100,000,000 MXN
- **UBICACIÓN:** Zona Dorada, Bucerías
- **ACCESO FOUNDER:** Actualmente Activo
- **POSICIÓN MÍNIMA:** $500 USD

## 02 / TESIS DE MERCADO
**POR QUÉ RIVIERA NAYARIT**

Uno de los corredores costeros de lujo con mayor rendimiento en México.
*"La escasez sumada a la concentración de la demanda crea condiciones asimétricas de crecimiento."*

## 03 / ARQUITECTURA DE PARTICIPACIÓN
**CERTIFICADOS DIGITALES**

- **Explorer ($500 USD):** 10 CPs
- **Resident ($2,500 USD):** 50 CPs — 2 noches anuales
- **Ambassador ($10,000 USD):** 200 CPs — 10 noches anuales
- **Riviera Owner ($50,000 USD):** 1,000 CPs — 50 noches anuales

## 04 / IMPULSADO POR PANDORAS
**INFRAESTRUCTURA INSTITUCIONAL**

Narai está incubado por Pandoras Infrastructure, que proporciona todo el stack de protocolos para el ecosistema.
`;

const deckEn = `
# S'NARAI
## THE FUTURE OF PREMIUM REAL ESTATE EXPOSURE

---

## THE OPPORTUNITY
> "The highest-performing luxury coastal corridor in Mexico."
- **Golden Zone, Bucerías**
- 12-15% Historical Annual Appreciation
- 70%+ Premium Hospitality Occupancy

---

## THE ASSET
**$100,000,000 MXN TARGET DEVELOPMENT**

A luxury condo-hotel optimized for high-yield short stays and long-term value positioning.
- Premium Hospitality Design
- Digital Participation Infrastructure

---

## THE INNOVATION
**STRUCTURED DIGITAL CERTIFICATES (CPs)**

Why buy a fraction when you can hold a protocol?
- **Capital Efficiency**
- **Ecosystem Rights**
- **Governance Pathways**

---

## ALLOCATION
**GATED PHASES**

1. **Founder Release:** 10,000 CPs @ $50 USD
2. **Strategic Release:** 22,000 CPs @ $75 USD
3. **General Release:** 25,000 CPs @ $100 USD

---

## JOIN THE PROTOCOL
**Currently in Founder Phase.**
Access is restricted. Verify your wallet and request allocation today.
`;

const deckEs = `
# S'NARAI
## EL FUTURO DE LA EXPOSICIÓN INMOBILIARIA PREMIUM

---

## LA OPORTUNIDAD
> "El corredor costero de lujo con mayor rendimiento en México."
- **Zona Dorada, Bucerías**
- 12-15% de Plusvalía Anual Histórica
- 70%+ de Ocupación en Hospitalidad Premium

---

## EL ACTIVO
**DESARROLLO OBJETIVO DE $100,000,000 MXN**

Un condo-hotel de lujo optimizado para estancias cortas de alto rendimiento y posicionamiento de valor a largo plazo.
- Diseño de Hospitalidad Premium
- Infraestructura de Participación Digital

---

## LA INNOVACIÓN
**CERTIFICADOS DIGITALES ESTRUCTURADOS (CPs)**

¿Por qué comprar una fracción cuando puedes ser dueño de un protocolo?
- **Eficiencia de Capital**
- **Derechos del Ecosistema**
- **Vías de Gobernanza**

---

## ASIGNACIÓN
**FASES RESTRINGIDAS**

1. **Fase Founder:** 10,000 CPs @ $50 USD
2. **Fase Estratégica:** 22,000 CPs @ $75 USD
3. **Fase General:** 25,000 CPs @ $100 USD

---

## ÚNETE AL PROTOCOLO
**Actualmente en Fase Founder.**
El acceso está restringido. Verifica tu wallet y solicita tu asignación hoy.
`;

const onePagerEn = `
# S'NARAI : EXECUTIVE SUMMARY
*Strategic Real Estate Participation Protocol*

## FAST FACTS
- **Asset Type:** Luxury Condo-Hotel
- **Location:** Golden Zone, Bucerías, Riviera Nayarit
- **Development Target:** $100,000,000 MXN
- **Min. Entry:** $500 USD (Explorer Tier)
- **Infrastructure:** Pandoras Growth OS

## THE THESIS
Riviera Nayarit presents asymmetric upside due to limited premium inventory and explosive affluent migration. S'Narai captures this value through a digital participation protocol, replacing traditional fractional friction with highly efficient, utility-bearing Digital Certificates (CPs).

## FINANCIAL STRUCTURE
- **Phase 1 (Founder):** $50 USD per CP
- **Phase 2 (Strategic):** $75 USD per CP
- **Phase 3 (General):** $100 USD per CP

## VALUE CREATION
1. **Capital Growth:** Exposure to a $100M MXN real estate asset in a 12-15% appreciation market.
2. **Operational Yield:** Algorithmic distribution of hospitality revenues.
3. **Direct Utility:** Up to 50 free nights annually based on Tier level.

## TECHNOLOGY & LEGAL
Powered by **Pandoras Growth OS**. Legally wrapped in a robust Mexican S.A.P.I. and Trust (Fideicomiso) framework, ensuring NOM-151 compliance and institutional-grade security.

> **Status:** Founder Phase Active. Restricted Allocation.
`;

const onePagerEs = `
# S'NARAI : RESUMEN EJECUTIVO
*Protocolo Estratégico de Participación Inmobiliaria*

## DATOS CLAVE
- **Tipo de Activo:** Condo-Hotel de Lujo
- **Ubicación:** Zona Dorada, Bucerías, Riviera Nayarit
- **Objetivo de Desarrollo:** $100,000,000 MXN
- **Entrada Mín.:** $500 USD (Nivel Explorer)
- **Infraestructura:** Pandoras Growth OS

## LA TESIS
Riviera Nayarit presenta un potencial asimétrico debido al inventario premium limitado y a la explosiva migración de alto nivel adquisitivo. S'Narai captura este valor a través de un protocolo de participación digital, reemplazando la fricción tradicional con Certificados Digitales (CPs) altamente eficientes.

## ESTRUCTURA FINANCIERA
- **Fase 1 (Founder):** $50 USD por CP
- **Fase 2 (Estratégica):** $75 USD por CP
- **Fase 3 (General):** $100 USD por CP

## CREACIÓN DE VALOR
1. **Crecimiento de Capital:** Exposición a un activo de $100M MXN en un mercado de 12-15% de plusvalía.
2. **Rendimiento Operativo:** Distribución algorítmica de ingresos por hospitalidad.
3. **Utilidad Directa:** Hasta 50 noches gratis anuales según el nivel.

## TECNOLOGÍA Y LEGAL
Impulsado por **Pandoras Growth OS**. Estructura legal bajo el marco S.A.P.I. y Fideicomiso en México, garantizando cumplimiento NOM-151 y seguridad de grado institucional.

> **Estado:** Fase Founder Activa. Asignación Restringida.
`;

async function main() {
    console.log("Fetching S'Narai project...");
    const project = await db.query.projects.findFirst({
        where: eq(schema.projects.slug, 'snarai')
    });

    if (!project) {
        console.error("Project not found!");
        process.exit(1);
    }

    const extraConfig = project.extraConfig || {};
    const resourceHub = (extraConfig as any).resourceHub || {};
    const markdownDocs = resourceHub.markdownDocs || {};

    markdownDocs.dossier_en = dossierEn.trim();
    markdownDocs.dossier_es = dossierEs.trim();
    markdownDocs.deck_en = deckEn.trim();
    markdownDocs.deck_es = deckEs.trim();
    markdownDocs.one_pager_en = onePagerEn.trim();
    markdownDocs.one_pager_es = onePagerEs.trim();

    resourceHub.markdownDocs = markdownDocs;
    (extraConfig as any).resourceHub = resourceHub;

    console.log("Updating DB...");
    await db.update(schema.projects)
        .set({ extraConfig })
        .where(eq(schema.projects.id, project.id));

    console.log("✅ Successfully injected marketing-optimized documents to S'Narai");
    process.exit(0);
}

main().catch(console.error);
