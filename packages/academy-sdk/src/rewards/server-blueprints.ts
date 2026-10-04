import 'server-only';

/**
 * 🔒 Confidential Server-Only Vault Storage for Academy Blueprints
 * apps/dashboard/src/lib/pandoras/core/domains/academy/rewards/server-blueprints.ts
 *
 * Strictly isolated to server runtime. Protected with 'server-only' to prevent
 * any accidental bundle leaks to the client browser.
 */

const SERVER_BLUEPRINT_CONTENTS: Record<string, string> = {
  bp_coo_wyoming_holding: `# Operating Agreement Master & Subordinated SPVs Framework
**Clasificación:** Confidencial / Nivel Ejecutivo Pandora's Tier 1
**Autoridad:** Pandora's Legal Engineering & COO Operations

## 1. Principio de Segregación de Pasivos
Ninguna entidad comercial u operativa podrá celebrar contratos de prestación de servicios bajo la razón social matriz titular de la Propiedad Intelectual (*MXHUB ECOSISTEMA BLOCKCHAIN S.A. DE C.V.*). 

## 2. Estructura de Capas
- **Capa 3 (Holding IP):** Depósito del código fuente, patentes, marcas IMPI y licencias maestras.
- **Capa 5 (Wyoming Operating LLC):** Entidad de facturación internacional y contratación de proveedores SaaS.
- **Capa 6 (Special Purpose Vehicles - SPVs):** Sociedades vehículos locales para la custodia inmobiliaria o activos específicos.

## 3. Cláusula de Safe-Stop Operativo
En caso de controversia societaria o demanda civil contra una filial operativa, la Matriz revoca de forma inmediata y automática la sublicencia de software, aislando los activos digitales de cualquier embargo.`,

  bp_cmo_mediaco_playbook: `# Pandora's Media Co Playbook (v1.0)
**Clasificación:** Estrategia de Crecimiento Institucional
**Libros Canónicos:** Libro IV & Libro VII

## 1. El Motor de Autoridad
Para colocar tickets institucionales (> $50,000 USD), la pauta fría directa tiene una tasa de rebote del 98%. Pandora's Media Co opera bajo el principio de **Educación Previa**:
1. Reporte de Investigación Profundo (Whitepaper / Valuation Model).
2. Sindicación en X (Twitter) mediante hilos ejecutivos de 7 tweets.
3. Repurposing en video pills de 60s con subtítulos dinámicos.
4. Captura de lead hacia el Nexus Deal Room con firma de NDA en 1 click.

## 2. Directiva de Marca IMPI (Clases 36 y 42)
Todo partner autorizado debe utilizar exclusivamente el sello "Powered by Pandora's Growth OS" con tipografía y paleta oficial, quedando estrictamente prohibida la emisión de fondos no regulados con el nombre de Pandora's.`,

  bp_cfo_pas_vault_model: `# PAS v1.0 Vaults & Buyback Engine Specification
**Estándar:** Pandoras Asset Standard v1.0
**Módulo:** Ingeniería Financiera & Tesorería

## 1. Regla de Colateralización 1:1
Los fondos captados para tokenización de activos reales (RWA) permanecen en Bóvedas Fiduciarias (Escrow Bancario) y solo se liberan contra:
- Inscripción formal de garantía hipotecaria ante Registro Público.
- Validación pericial de avance de obra.

## 2. Fórmula de Recompra (NAV Protection)
\`\`\`text
NAV_token = (Activos_Totales_Auditados - Pasivos_Exigibles + Reservas_Liquidez) / Total_Tokens_Circulantes
\`\`\`
El Pandora Buyback Pool retiene entre el **10% y el 15%** del flujo neto operativo para absorber ventas secundarias sin diluir el rendimiento corriente de los LPs.`,

  bp_hermes_runtime_spec: `# Hermes Kernel Cognitive Runtime Specification
**Arquitectura:** Event-Driven Cognitive Engine
**Seguridad:** 4-Tier Executive Scope Isolation

## 1. El Pipeline Inmutable de Prompts
Los prompts nunca se concatenan como strings arbitrarios. El \`PromptCompiler\` ensambla bloques tipados:
\`\`\`typescript
const blocks = [
  IDENTITY_BLOCK,        // Tono y directiva raíz
  TENANT_PROFILE_BLOCK,  // Datos del cliente autenticado
  KNOWLEDGE_CANON_BLOCK, // Documentación sellada con SHA-256
  JOURNEY_STATE_BLOCK,   // Next Best Action (Hito actual)
  CHAT_HISTORY_WINDOW    // Últimos 10 mensajes rodantes
];
\`\`\`

## 2. ExecutiveScopeValidator
Los documentos con clearance \`EXECUTIVE_CONFIDENTIAL\` se aíslan a nivel de consulta en Postgres (filtro determinista en SQL) antes de que el LLM reciba tokens, neutralizando ataques de Prompt Injection.`
};

export function getServerBlueprintContent(blueprintId: string): string | null {
  return SERVER_BLUEPRINT_CONTENTS[blueprintId] || null;
}
