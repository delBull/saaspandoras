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

Narai combines premium real estate exposure, structured utility participation, digital infrastructure, and operational governance architecture.

### KEY HIGHLIGHTS
- **ASSET TARGET:** $100,000,000 MXN
- **LOCATION:** Golden Zone, Bucerías
- **FOUNDER ACCESS:** Currently Active
- **MIN. POSITION:** $500 USD

## 02 / MARKET THESIS
**WHY RIVIERA NAYARIT**

One of Mexico’s highest-performing luxury coastal corridors. Bucerías specifically benefits from strategic proximity to PVR and limited premium inventory.

### HISTORICAL METRICS
- Annual appreciation: 12–15% historical range
- Hospitality occupancy: 70%+ in premium zones
- Strategic factors: Expanding luxury demand and high-affluent migration

*"Scarcity plus demand concentration creates asymmetric upside conditions."*

## 03 / UNDERLYING ASSET
**PREMIUM CONDO-HOTEL**

Narai is structured around a residential asset in the Golden Zone of Bucerías. Optimized for premium short stays, operational yield, and long-term value positioning.

### ASSET SNAPSHOT
- **Development Target:** $100,000,000 MXN
- **Type:** Luxury Condo-Hotel
- **Positioning:** Premium hospitality + digital participation

## 04 / PARTICIPATION ARCHITECTURE
**DIGITAL CERTIFICATES**

Participants acquire structured digital participation certificates (CPs) designed to unlock ecosystem rights and participation mechanics.

### CERTIFICATE BENEFITS
- Rights to ecosystem utility and privileges
- Governance pathways and future transfer mechanics
- Founder recognition and priority positioning

*Capital Efficiency:* Exposure to high-end real estate without the direct property management burden or title acquisition friction.

## 05 / ALLOCATION STRUCTURE
**GATED RELEASE PHASES**

- **Founder Release:** 10,000 CPs | $50 USD
- **Strategic Release:** 22,000 CPs | $75 USD
- **General Release:** 25,000 CPs | $100 USD
- **Institutional Reserve:** 13,000 CPs | —

*Current Status: Founder Phase Active*  
Initial access is intentionally restricted to strategic participants.

## 06 / PARTICIPATION TIERS

- **Explorer ($500 USD):** 10 CPs — Ecosystem entry, founder recognition.
- **Resident ($2,500 USD):** 50 CPs — 2 nights annually, enhanced access.
- **Ambassador ($10,000 USD):** 200 CPs — 10 nights annually, dashboard privileges.
- **Riviera Owner ($50,000 USD):** 1,000 CPs — 50 nights annually, priority allocation.

## 07 / ECONOMIC ARCHITECTURE
**VALUE MECHANICS**

1. **PRIMARY DISTRIBUTION:** Certificate issuance and ecosystem positioning.
2. **OPERATIONAL PARTICIPATION:** Potential exposure to operational economics following activation.
3. **SECONDARY MARKETS:** Future transfer pathways via secondary ecosystem infrastructure.

## 08 / CAPITAL ALLOCATION
**DEPLOYMENT FRAMEWORK**

Milestone-based release architecture ensures capital efficiency and reduces execution risk.

- Acquisition / Development execution
- Construction and premium materials
- Operational reserves and legal framework
- Digital ecosystem infrastructure

## 09 / LEGAL & STRUCTURAL FRAMEWORK
**LAYERED ARCHITECTURE**

Designed for participant confidence and operational integrity.

### LEGAL STACK
- S.A.P.I. framework
- Trust architecture / fiduciary layers
- NOM-151 compliant documentation

*Private legal materials available during onboarding.*

## 10 / POWERED BY PANDORAS
**INSTITUTIONAL INFRASTRUCTURE**

Narai is incubated by Pandoras Infrastructure, providing the protocol stack for the ecosystem.

- Growth OS
- DAO layers
- AGORA marketplace
- Onboarding systems
- Telegram App UI
- Smart contracts

## 11 / EXECUTION ROADMAP
**TIMELINE**

- **Q1 2026:** Founder release
- **30% Funding:** Strategic phase unlock
- **50% Funding:** Supplier prepayment phase
- **100% Funding:** Protocol close
- **Q3 2027:** Target activation

## 12 / RISK CONSIDERATIONS
**KEY FACTORS**

- Construction timelines and market conditions
- Regulatory evolution and operational execution
- Liquidity timing on secondary infrastructure

## 13 / NEXT STEPS
**PRIVATE ACCESS**

1. Request onboarding
2. Founder verification
3. Allocation access
4. Checkout participation

**REQUEST PRIVATE ACCESS**  
*Or schedule a founder call for strategic inquiries.*
`;

const dossierEs = `
# NARAI PRIVATE DOSSIER
Solo para circulación privada  
Material de inversión confidencial

## 01 / RESUMEN EJECUTIVO
**PARTICIPACIÓN ESTRATÉGICA EN BIENES RAÍCES**

Narai es un protocolo de participación estructurada que brinda acceso curado a exposición inmobiliaria premium en la Riviera Nayarit.

Los participantes acceden a un ecosistema basado en utilidad a través de certificados de participación diseñados para alinear eficiencia de capital, exposición a un estilo de vida premium y participación futura en el ecosistema.

Narai combina exposición a bienes raíces premium, participación estructurada en utilidades, infraestructura digital y arquitectura de gobernanza operativa.

### PUNTOS CLAVE
- **OBJETIVO DEL ACTIVO:** $100,000,000 MXN
- **UBICACIÓN:** Zona Dorada, Bucerías
- **ACCESO FOUNDER:** Actualmente Activo
- **POSICIÓN MÍNIMA:** $500 USD

## 02 / TESIS DE MERCADO
**POR QUÉ RIVIERA NAYARIT**

Uno de los corredores costeros de lujo con mayor rendimiento en México. Bucerías se beneficia específicamente de su proximidad estratégica a PVR y de un inventario premium limitado.

### MÉTRICAS HISTÓRICAS
- Plusvalía anual: rango histórico del 12–15%
- Ocupación hotelera: 70%+ en zonas premium
- Factores estratégicos: Expansión de la demanda de lujo y migración de alto nivel adquisitivo.

*"La escasez sumada a la concentración de la demanda crea condiciones asimétricas de crecimiento."*

## 03 / ACTIVO SUBYACENTE
**CONDO-HOTEL PREMIUM**

Narai está estructurado en torno a un activo residencial en la Zona Dorada de Bucerías. Optimizado para estancias cortas premium, rendimiento operativo y posicionamiento de valor a largo plazo.

### RESUMEN DEL ACTIVO
- **Objetivo de Desarrollo:** $100,000,000 MXN
- **Tipo:** Condo-Hotel de Lujo
- **Posicionamiento:** Hospitalidad premium + participación digital

## 04 / ARQUITECTURA DE PARTICIPACIÓN
**CERTIFICADOS DIGITALES**

Los participantes adquieren certificados digitales de participación estructurada (CPs) diseñados para desbloquear derechos del ecosistema y mecánicas de participación.

### BENEFICIOS DEL CERTIFICADO
- Derechos de acceso a utilidades y privilegios del ecosistema
- Vías de gobernanza y futuras mecánicas de transferencia
- Reconocimiento Founder y posicionamiento prioritario

*Eficiencia de Capital:* Exposición a bienes raíces de alta gama sin la carga directa de la gestión de la propiedad ni la fricción en la adquisición de títulos.

## 05 / ESTRUCTURA DE ASIGNACIÓN
**FASES DE LANZAMIENTO CONTROLADAS**

- **Fase Founder:** 10,000 CPs | $50 USD
- **Lanzamiento Estratégico:** 22,000 CPs | $75 USD
- **Lanzamiento General:** 25,000 CPs | $100 USD
- **Reserva Institucional:** 13,000 CPs | —

*Estado Actual: Fase Founder Activa*  
El acceso inicial está restringido intencionalmente a participantes estratégicos.

## 06 / NIVELES DE PARTICIPACIÓN (TIERS)

- **Explorer ($500 USD):** 10 CPs — Entrada al ecosistema, reconocimiento founder.
- **Resident ($2,500 USD):** 50 CPs — 2 noches anuales, acceso mejorado.
- **Ambassador ($10,000 USD):** 200 CPs — 10 noches anuales, privilegios en el dashboard.
- **Riviera Owner ($50,000 USD):** 1,000 CPs — 50 noches anuales, asignación prioritaria.

## 07 / ARQUITECTURA ECONÓMICA
**MECÁNICAS DE VALOR**

1. **DISTRIBUCIÓN PRIMARIA:** Emisión de certificados y posicionamiento en el ecosistema.
2. **PARTICIPACIÓN OPERATIVA:** Posible exposición a la economía operativa tras la activación.
3. **MERCADOS SECUNDARIOS:** Futuras vías de transferencia mediante infraestructura secundaria del ecosistema.

## 08 / ASIGNACIÓN DE CAPITAL
**MARCO DE DESPLIEGUE**

La arquitectura de liberación basada en hitos garantiza la eficiencia del capital y reduce el riesgo de ejecución.

- Adquisición / Ejecución de desarrollo
- Construcción y materiales premium
- Reservas operativas y marco legal
- Infraestructura del ecosistema digital

## 09 / MARCO LEGAL Y ESTRUCTURAL
**ARQUITECTURA EN CAPAS**

Diseñada para la confianza de los participantes y la integridad operativa.

### STACK LEGAL
- Estructura S.A.P.I.
- Arquitectura de Fideicomiso / capas fiduciarias
- Documentación conforme a la NOM-151

*Los materiales legales privados estarán disponibles durante el onboarding.*

## 10 / IMPULSADO POR PANDORAS
**INFRAESTRUCTURA INSTITUCIONAL**

Narai está incubado por Pandoras Infrastructure, que proporciona todo el stack de protocolos para el ecosistema.

- Growth OS
- Capas DAO
- Marketplace AGORA
- Sistemas de Onboarding
- App de Telegram (UI)
- Contratos inteligentes (Smart contracts)

## 11 / HOJA DE RUTA DE EJECUCIÓN
**LÍNEA DE TIEMPO**

- **Q1 2026:** Lanzamiento Founder
- **30% Fondeado:** Desbloqueo de fase estratégica
- **50% Fondeado:** Fase de prepago a proveedores
- **100% Fondeado:** Cierre del protocolo
- **Q3 2027:** Activación del objetivo (Target activation)

## 12 / CONSIDERACIONES DE RIESGO
**FACTORES CLAVE**

- Tiempos de construcción y condiciones del mercado
- Evolución regulatoria y ejecución operativa
- Tiempos de liquidez en la infraestructura secundaria

## 13 / PRÓXIMOS PASOS
**ACCESO PRIVADO**

1. Solicitar Onboarding
2. Verificación Founder
3. Acceso a asignación
4. Participación en Checkout

**SOLICITAR ACCESO PRIVADO**  
*O agenda una llamada de fundador para consultas estratégicas.*
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

    // Default placeholders for One Pager and Deck
    if (!markdownDocs.one_pager_en) markdownDocs.one_pager_en = "# One Pager\n\nContent goes here...";
    if (!markdownDocs.one_pager_es) markdownDocs.one_pager_es = "# One Pager\n\nEl contenido va aquí...";
    if (!markdownDocs.deck_en) markdownDocs.deck_en = "# Deck Overview\n\nContent goes here...";
    if (!markdownDocs.deck_es) markdownDocs.deck_es = "# Deck Overview\n\nEl contenido va aquí...";

    resourceHub.markdownDocs = markdownDocs;
    (extraConfig as any).resourceHub = resourceHub;

    console.log("Updating DB...");
    await db.update(schema.projects)
        .set({ extraConfig })
        .where(eq(schema.projects.id, project.id));

    console.log("✅ Successfully injected markdown Dossier to S'Narai");
    process.exit(0);
}

main().catch(console.error);
