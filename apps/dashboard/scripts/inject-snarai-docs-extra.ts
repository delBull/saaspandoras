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

const onePagerEn = `
# A NEW MODEL FOR PREMIUM REAL ESTATE ACCESS
Traditional real estate requires high capital concentration, operational overhead and limited flexibility. Narai introduces a structured participation framework that combines:

- **Luxury utility access** and lifestyle integration.
- **Operational upside participation** in asset yield.
- **Flexible capital exposure** without title friction.
- **Ecosystem governance** for founding members.

*"Participate in premium real estate economics without traditional ownership friction."*

## BUCERÍAS, RIVIERA NAYARIT
Narai is positioned within one of Mexico’s strongest luxury growth corridors, driven by growing international demand and premium inventory scarcity.

**ASSET SNAPSHOT**
- **Category:** Luxury Condo-Hotel
- **Development Value:** $100M MXN
- **Location:** Zona Dorada, Bucerías

## PARTICIPATION STRUCTURE
**Acquire Participation Certificates → Unlock Access + Utility + Rights**

- Annual stay allocations and priority booking.
- Founder privileges and exclusive property access.
- Ecosystem participation and future liquidity pathways.

*Narai is an access and utility ecosystem, not direct title ownership.*

## CURRENT RELEASE: FOUNDER ALLOCATION
Includes preferred access pricing, early ecosystem positioning, and founder status recognition within the Narai community.
**FOUNDER ALLOCATION IS INTENTIONALLY LIMITED.**

Powered by Pandoras
Supported by robust infrastructure for onboarding, participation logic, and operational transparency.
`;

const onePagerEs = `
# UN NUEVO MODELO DE ACCESO A REAL ESTATE PREMIUM
El sector inmobiliario tradicional exige alta concentración de capital y una carga operativa compleja. Narai introduce un marco de participación estructurado que combina:

- **Utilidad y acceso de lujo:** Uso y disfrute del activo.
- **Participación operativa:** Exposición a los beneficios del proyecto.
- **Exposición de capital flexible:** Sin las fricciones del título tradicional.
- **Gobernanza del ecosistema:** Influencia para miembros fundadores.

*"Participe en la economía del Real Estate de lujo sin la fricción de la propiedad tradicional."*

## BUCERÍAS, RIVIERA NAYARIT
Narai se posiciona en uno de los corredores de mayor crecimiento en México, impulsado por la demanda internacional y la escasez de inventario premium.

**RESUMEN DEL ACTIVO**
- **Categoría:** Condo-Hotel de Lujo
- **Valor de Desarrollo:** $100M MXN
- **Ubicación:** Zona Dorada, Bucerías

## ESTRUCTURA DE PARTICIPACIÓN
**Adquisición de Certificados → Acceso + Utilidad + Derechos de Participación**

- Asignación anual de estancias y reservas prioritarias.
- Privilegios de fundador y acceso exclusivo a la propiedad.
- Participación en el ecosistema y futuras vías de liquidez.

*Narai es un ecosistema de acceso y utilidad, no una propiedad de título directo.*

## LANZAMIENTO ACTUAL: ALOCACIÓN FUNDADOR
Incluye precios preferenciales de acceso, posicionamiento temprano en el ecosistema y reconocimiento de estatus de fundador dentro de la comunidad Narai.
**LA ALOCACIÓN PARA FUNDADORES ES INTENCIONALMENTE LIMITADA.**

Respaldado por Pandoras
Soportado por infraestructura robusta para sistemas de registro, lógica de participación y transparencia operativa.
`;

const deckEs = `
# S'NARAI
**Un Nuevo Estándar para la Participación en Activos de Lujo**

Founder Access · Riviera Nayarit · Private Release

Resumen confidencial preparado para participantes fundadores prospectivos.

---

## LA TESIS
**El Futuro de la Propiedad Es el Acceso**
El sector inmobiliario tradicional fue construido para una era diferente.

**Modelo Tradicional**
El capital se concentra típicamente en activos ilíquidos cargados de:
- Costos operativos elevados
- Fricción administrativa constante
- Flexibilidad limitada
- Asignación ineficiente de capital

**Modelo Narai**
Narai introduce un marco de participación moderno diseñado en torno a:
- Eficiencia de capital
- Opcionalidad estratégica
- Acceso respaldado por utilidad
- Exposición operativa estructurada

*"El acceso se está volviendo más valioso que la propiedad estática."*

---

## OPORTUNIDAD DE MERCADO
**Una Posición Estratégica en Riviera Nayarit**
Riviera Nayarit ha emergido como uno de los corredores de hospitalidad de lujo y residencial más sólidos de México. Narai está posicionado en la Zona Dorada de Bucerías, donde convergen las tendencias macroeconómicas más relevantes.

- **Crecimiento del Turismo Premium:** Demanda internacional en expansión sostenida hacia destinos de lujo en el Pacífico mexicano.
- **Inventario de Lujo Limitado:** Escasez estructural de oferta premium en la zona, generando presión alcista sobre valores.
- **Entorno ADR Sólido:** Tarifas diarias promedio en niveles históricamente altos con tendencia positiva.
- **Demanda Internacional Creciente:** Flujo sostenido de participantes internacionales buscando exposición a activos mexicanos de lujo.
- **Escasez Estructural de Tierra:** La disponibilidad de terrenos premium en la Zona Dorada es inherentemente limitada e irrecuperable.

*Esta no es simplemente una entrada al mercado inmobiliario. Es participación en una tesis de crecimiento regional.*

---

## EL ACTIVO
**El Activo Subyacente**
Snapshot del Desarrollo: Diseñado como un activo premium de estilo de vida y generación de rendimiento.

- **Valor del Desarrollo:** $100M MXN
- **Ubicación:** Zona Dorada, Bucerías, Nayarit
- **Categoría:** Residencial de Lujo / Hospitalidad
- **Modelo:** Ecosistema Condo-Hotel de Utilidad

---

## CÓMO FUNCIONA NARAI
**Arquitectura de Participación**
Asignación → Certificados → Acceso y utilidad → Gobernanza

Los participantes adquieren certificados digitales que representan acceso estructurado al ecosistema Narai. Estos certificados están diseñados para desbloquear múltiples capas de valor dentro del ecosistema.

- **Privilegios de Acceso:** Asignaciones de estadía, ventanas de reserva prioritaria y privilegios exclusivos de miembro.
- **Mecánicas de Participación:** Participación en el desempeño operativo e incentivos del ecosistema.
- **Capas de Gobernanza:** Acceso a mecanismos de gobernanza del ecosistema y toma de decisiones colectiva.
- **Liquidez Futura:** Vías de liquidez secundaria diseñadas para fases posteriores del ecosistema.

*Los participantes ingresan a un ecosistema de acceso y utilidad, no adquieren título de propiedad directo.*

---

## BENEFICIOS PARA MIEMBROS
**Utilidad y Beneficios de Participación**

**Acceso**
- Asignaciones anuales de estadía
- Ventanas de reserva prioritaria
- Privilegios exclusivos de miembro

**Participación**
- Mecánicas de participación en desempeño operativo
- Incentivos del ecosistema

**Flexibilidad**
- Participación transferible en el ecosistema
- Mecanismos secundarios futuros

**Comunidad**
- Estatus de fundador
- Acceso a gobernanza

---

## MARCO LEGAL Y OPERATIVO
**Estructurado para Transparencia e Integridad Operativa**
Narai está diseñado con una arquitectura operativa y legal en capas, construida para soportar participación disciplinada y claridad operativa en cada fase del ecosistema.

- **Sistemas de Integridad Documental:** Documentación estructurada para garantizar transparencia en cada capa del ecosistema.
- **Capas de Trazabilidad de Flujo de Capital:** Visibilidad sobre el movimiento y asignación de capital dentro del ecosistema.

*Construido para soportar participación disciplinada y claridad operativa.*

- **Estructura de Participación Corporativa:** Marco societario diseñado para claridad y trazabilidad.
- **Lógica de Asignación Contractual:** Mecanismos contractuales que definen derechos y obligaciones de participación.
- **Mecanismos de Gobernanza Operativa:** Sistemas de toma de decisiones colectiva y supervisión operativa.

---

## NIVELES DE ACCESO
**Asignación de Acceso Fundador**

| Nivel | Posicionamiento | Características |
| --- | --- | --- |
| **Founder** | Asignación temprana, máximo posicionamiento | Precio preferencial, prioridad máxima, reconocimiento fundador |
| **Strategic** | Asignación mid-phase, privilegios mejorados | Posicionamiento mejorado, acceso prioritario al ecosistema |
| **Access** | Asignación estándar, entrada al ecosistema | Entrada al ecosistema, beneficios base de participación |

*La asignación Founder recibe: precio de acceso más temprano · máxima prioridad de posicionamiento · reconocimiento exclusivo de fundador*

**¿Por Qué el Acceso Fundador Importa Ahora?**
El acceso fundador es intencionalmente limitado. Las condiciones de entrada disponibles hoy no se espera que permanezcan disponibles en fases posteriores.

- **Fase de Precio Preferencial:** Acceso a las condiciones de participación más favorables del ciclo de vida del ecosistema.
- **Acceso Prioritario al Ecosistema:** Posicionamiento de utilidad mejorado desde el primer momento de activación.
- **Ventajas de Asignación Temprana:** La liberación fundador está intencionalmente limitada. El cupo es finito y no se repone.

---

## ROADMAP
**Roadmap de Ejecución**

- **Q2 2026:** Incubación del protocolo y asignación de acceso fundador.
- **Q2–Q4 2026:** Despliegue de capital y cumplimiento de hitos operativos clave.
- **2027:** Ejecución del desarrollo y avance de obra.
- **Q3 2027:** Objetivo de activación operativa del ecosistema.
- **Post-Activación:** Sistemas de utilidad para miembros y participación operativa en plena operación.

---

## Preguntas Frecuentes

**¿Qué estoy adquiriendo?**
Certificados de participación estructurada dentro del ecosistema Narai.

**¿Es esto propiedad directa de un inmueble?**
No. Narai es un modelo de acceso y participación, no de titularidad directa.

**¿Cómo se gestiona la participación?**
A través de gobernanza operativa y sistemas de plataforma del ecosistema.

**¿Puedo incrementar mi posición más adelante?**
Sujeto a disponibilidad de fase y capacidad de asignación en etapas posteriores.

**¿Cómo ingreso?**
Acceso fundador privado u onboarding directo aprobado a través de canales oficiales.

---

**Acceso Fundador**
Narai está actualmente incorporando un número limitado de participantes fundadores. Esta es una liberación privada destinada a participantes alineados que buscan exposición premium a modelos de participación en activos de lujo.

- **Cupo Limitado:** La liberación fundador es intencionalmente restringida. Las condiciones actuales no estarán disponibles en fases posteriores.
- **Acceso Privado:** Proceso de incorporación exclusivo para participantes alineados con la visión del ecosistema Narai.

*Powered by Pandoras Infrastructure*
*Infraestructura, gobernanza y sistemas de acceso impulsados por el ecosistema Pandoras.*
`;

const deckEn = `
# S'NARAI
**A New Standard for Luxury Asset Participation**

Founder Access · Riviera Nayarit · Private Release

Confidential overview prepared for prospective founding participants.

---

## THE THESIS
**The Future of Ownership is Access**
Traditional real estate was built for a different era.

**Traditional Model**
Capital is typically concentrated in illiquid assets burdened with:
- High operational costs
- Constant administrative friction
- Limited flexibility
- Inefficient capital allocation

**Narai Model**
Narai introduces a modern participation framework designed around:
- Capital efficiency
- Strategic optionality
- Utility-backed access
- Structured operational exposure

*"Access is becoming more valuable than static ownership."*

---

## MARKET OPPORTUNITY
**A Strategic Position in Riviera Nayarit**
Riviera Nayarit has emerged as one of Mexico's strongest luxury hospitality and residential corridors. Narai is positioned in the Golden Zone of Bucerías, where the most relevant macroeconomic trends converge.

- **Premium Tourism Growth:** Sustained expanding international demand toward luxury destinations in the Mexican Pacific.
- **Limited Luxury Inventory:** Structural scarcity of premium supply in the area, generating upward pressure on values.
- **Solid ADR Environment:** Average daily rates at historically high levels with a positive trend.
- **Growing International Demand:** Sustained flow of international participants seeking exposure to Mexican luxury assets.
- **Structural Land Scarcity:** Premium land availability in the Golden Zone is inherently limited and irreplaceable.

*This is not simply a real estate market entry. It is participation in a regional growth thesis.*

---

## THE ASSET
**The Underlying Asset**
Development Snapshot: Designed as a premium lifestyle and yield-generating asset.

- **Development Value:** $100M MXN
- **Location:** Golden Zone, Bucerías, Nayarit
- **Category:** Luxury Residential / Hospitality
- **Model:** Utility Condo-Hotel Ecosystem

---

## HOW NARAI WORKS
**Participation Architecture**
Allocation → Certificates → Access & Utility → Governance

Participants acquire digital certificates representing structured access to the Narai ecosystem. These certificates are designed to unlock multiple layers of value within the ecosystem.

- **Access Privileges:** Stay allocations, priority booking windows, and exclusive member privileges.
- **Participation Mechanics:** Participation in operational performance and ecosystem incentives.
- **Governance Layers:** Access to ecosystem governance mechanisms and collective decision-making.
- **Future Liquidity:** Secondary liquidity pathways designed for later ecosystem phases.

*Participants enter an access and utility ecosystem; they do not acquire direct title ownership.*

---

## MEMBER BENEFITS
**Utility and Participation Benefits**

**Access**
- Annual stay allocations
- Priority booking windows
- Exclusive member privileges

**Participation**
- Participation mechanics in operational performance
- Ecosystem incentives

**Flexibility**
- Transferable participation within the ecosystem
- Future secondary mechanisms

**Community**
- Founder status
- Access to governance

---

## LEGAL & OPERATIONAL FRAMEWORK
**Structured for Transparency and Operational Integrity**
Narai is designed with a layered operational and legal architecture, built to support disciplined participation and operational clarity at every phase of the ecosystem.

- **Document Integrity Systems:** Structured documentation to ensure transparency across every ecosystem layer.
- **Capital Flow Traceability Layers:** Visibility over the movement and allocation of capital within the ecosystem.

*Built to support disciplined participation and operational clarity.*

- **Corporate Participation Structure:** Corporate framework designed for clarity and traceability.
- **Contractual Allocation Logic:** Contractual mechanisms defining participation rights and obligations.
- **Operational Governance Mechanisms:** Collective decision-making and operational oversight systems.

---

## ACCESS TIERS
**Founder Access Allocation**

| Tier | Positioning | Features |
| --- | --- | --- |
| **Founder** | Early allocation, maximum positioning | Preferred pricing, highest priority, founder recognition |
| **Strategic** | Mid-phase allocation, enhanced privileges | Enhanced positioning, priority ecosystem access |
| **Access** | Standard allocation, ecosystem entry | Ecosystem entry, baseline participation benefits |

*The Founder allocation receives: earliest access pricing · highest positioning priority · exclusive founder recognition*

**Why Founder Access Matters Now?**
Founder access is intentionally limited. Entry conditions available today are not expected to remain available in subsequent phases.

- **Preferred Pricing Phase:** Access to the most favorable participation conditions in the ecosystem's lifecycle.
- **Priority Ecosystem Access:** Enhanced utility positioning from the very first moment of activation.
- **Early Allocation Advantages:** The founder release is intentionally limited. Capacity is finite and will not be replenished.

---

## ROADMAP
**Execution Roadmap**

- **Q2 2026:** Protocol incubation and founder access allocation.
- **Q2–Q4 2026:** Capital deployment and fulfillment of key operational milestones.
- **2027:** Development execution and construction progress.
- **Q3 2027:** Ecosystem operational activation target.
- **Post-Activation:** Member utility systems and operational participation in full operation.

---

## Frequently Asked Questions

**What am I acquiring?**
Structured participation certificates within the Narai ecosystem.

**Is this direct property ownership?**
No. Narai is an access and participation model, not direct title ownership.

**How is participation managed?**
Through operational governance and ecosystem platform systems.

**Can I increase my position later?**
Subject to phase availability and allocation capacity in subsequent stages.

**How do I enter?**
Private founder access or approved direct onboarding through official channels.

---

**Founder Access**
Narai is currently onboarding a limited number of founding participants. This is a private release intended for aligned participants seeking premium exposure to luxury asset participation models.

- **Limited Capacity:** Founder release is intentionally restricted. Current conditions will not be available in later phases.
- **Private Access:** Exclusive onboarding process for participants aligned with the Narai ecosystem vision.

*Powered by Pandoras Infrastructure*
*Infrastructure, governance, and access systems powered by the Pandoras ecosystem.*
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

    markdownDocs.one_pager_en = onePagerEn.trim();
    markdownDocs.one_pager_es = onePagerEs.trim();
    markdownDocs.deck_en = deckEn.trim();
    markdownDocs.deck_es = deckEs.trim();

    resourceHub.markdownDocs = markdownDocs;
    (extraConfig as any).resourceHub = resourceHub;

    console.log("Updating DB...");
    await db.update(schema.projects)
        .set({ extraConfig })
        .where(eq(schema.projects.id, project.id));

    console.log("✅ Successfully injected markdown One Pager and Deck to S'Narai");
    process.exit(0);
}

main().catch(console.error);
