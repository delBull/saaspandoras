
export type SOWTier = 'TIER_1' | 'TIER_2' | 'TIER_3';

interface SOWVariables {
    sowId: string;
    date: string;
    clientName: string;
    projectName: string;
    amount: string;
}

export const SOW_TEMPLATES: Record<SOWTier, (v: SOWVariables) => string> = {
    TIER_1: (v) => `
<div style="font-family: sans-serif; color: #333; line-height: 1.6;">
    <h1 style="border-bottom: 2px solid #000; padding-bottom: 10px;">SOW — TIER 1: Viability & Utility Definition</h1>
    <p><strong>Pandora’s | Protocol Viability & Utility Definition</strong></p>
    <p>
        <strong>SOW ID:</strong> ${v.sowId}<br>
        <strong>Fecha:</strong> ${v.date}<br>
        <strong>Cliente:</strong> ${v.clientName}<br>
        <strong>Proyecto:</strong> ${v.projectName}<br>
        <strong>Jurisdicción:</strong> México
    </p>

    <h3>1. Propósito</h3>
    <p>Este Statement of Work define el alcance del Tier 1 — Viability & Utility Definition, cuyo objetivo es determinar si el proyecto del Cliente puede existir como un protocolo de utilidad real (Work-to-Earn) desde una perspectiva funcional, operativa y técnica.</p>
    <p>Este servicio no es consultoría general. Es un filtro técnico-operativo obligatorio previo a cualquier arquitectura o desarrollo.</p>

    <h3>2. Alcance y Entregables</h3>
    <p>Pandora’s entregará, dentro del plazo establecido, los siguientes activos:</p>
    <ul>
        <li><strong>Documento de Viabilidad Funcional</strong>: Definición exacta de la acción Work-to-Earn, método de verificación y flujo completo.</li>
        <li><strong>Blueprint Operativo de Utilidad</strong>: Roles involucrados y lógica económica de alto nivel.</li>
        <li><strong>Dictamen Ejecutivo</strong>: Decisión clara (Apto/No Apto) y recomendación explícita. El dictamen no constituye garantía de éxito comercial ni regulatorio.</li>
    </ul>

    <h3>3. Exclusiones</h3>
    <p>No incluye: Programación de smart contracts, auditoría, deployment, asesoría legal formal ni tokenomics detallado.</p>

    <h3>4. Metodología</h3>
    <p>Revisión de inputs, Filtro de Utilidad (8 puntos), Modelado Loom (alto nivel), Dictamen y Sesión de cierre.</p>

    <h3>5. Timeline</h3>
    <p>Inicio: Inmediato tras pago.<br>Entrega: 48 a 72 horas hábiles.<br>Sesión de revisión: Incluida (1x45 min).</p>

    <h3>6. Fee y Condiciones</h3>
    <p><strong>Tarifa:</strong> ${v.amount} USD<br>Pago 100% por adelantado via Crypto/Stripe/Wire.</p>

    <h3>7. Aceptación</h3>

    <p>El Cliente acepta este SOW mediante la realización del pago correspondiente asociado a este enlace.</p>
    <p style="font-size: 11px; color: #888; border-top: 1px solid #eee; padding-top: 5px; margin-top: 10px;">
        Este SOW se rige por el marco técnico descrito en el Litepaper Oficial de Pandora’s Finance (v1.0).
    </p>
    
    <hr>
    <p style="font-size: 12px; color: #666;">Pandora's Finance | legal@pandoras.finance</p>
</div>
`,
    TIER_2: (v) => `
<div style="font-family: sans-serif; color: #333; line-height: 1.6;">
    <h1 style="border-bottom: 2px solid #000; padding-bottom: 10px;">SOW — TIER 2: Arquitectura de Protocolo</h1>
    <p><strong>Pandora’s | Smart Contracts & Economía W2E</strong></p>
    <p>
        <strong>SOW ID:</strong> ${v.sowId}<br>
        <strong>Fecha:</strong> ${v.date}<br>
        <strong>Cliente:</strong> ${v.clientName}<br>
        <strong>Proyecto:</strong> ${v.projectName}
    </p>

    <h3>1. Alcance (Qué SÍ incluye)</h3>
    <ul>
        <li><strong>Arquitectura Loom Protocol (W2E Engine)</strong>: Definición formal de acción verificable, validación y roles.</li>
        <li><strong>Diseño de Tokenomics Funcional</strong>: Token de utilidad, flujos de emisión/quema (sin promesas de ROI).</li>
        <li><strong>Arquitectura de Tesorería (Dual Treasury)</strong>: Tesorería Operativa y de Recompensas.</li>
        <li><strong>Blueprint de Smart Contracts</strong>: Mapa técnico para deployment.</li>
    </ul>

    <h3>2. Lo que NO incluye</h3>
    <p>Desarrollo custom fuera de ModularFactory, auditorías externas, marketing o deployment on-chain (Tier 3).</p>

    <h3>3. Tiempos de Entrega</h3>
    <p>Inicio: Inmediato tras pago.<br>Entrega: 2 a 3 días hábiles.</p>

    <h3>4. Condición de Avance</h3>
    <p>Al finalizar, el proyecto queda "Apto para Tier 3 (Deployment)" o "Requiere Ajustes".</p>

    <h3>5. Propiedad Intelectual</h3>
    <p>El diseño arquitectónico específico del proyecto pertenece al Cliente. Los frameworks, factories y patrones reutilizables permanecen como propiedad de Pandora’s.</p>

    <h3>6. Precio</h3>
    <p><strong>Precio:</strong> ${v.amount} USD.<br>Este SOW forma parte del proceso completo de despliegue.</p>

    <h3>7. Aceptación</h3>
    <p>La aceptación se confirma mediante el pago de este SOW.</p>
    <p style="font-size: 11px; color: #888; border-top: 1px solid #eee; padding-top: 5px; margin-top: 10px;">
        Este SOW se rige por el marco técnico descrito en el Litepaper Oficial de Pandora’s Finance (v1.0).
    </p>
</div>
`,
    TIER_3: (v) => `
<div style="font-family: sans-serif; color: #333; line-height: 1.6;">
    <h1 style="border-bottom: 2px solid #000; padding-bottom: 10px;">SOW — TIER 3: Deployment & Parametrización</h1>
    <p><strong>Pandora’s | Infraestructura On-Chain</strong></p>
    <p>
        <strong>SOW ID:</strong> ${v.sowId}<br>
        <strong>Fecha:</strong> ${v.date}<br>
        <strong>Cliente:</strong> ${v.clientName}<br>
        <strong>Proyecto:</strong> ${v.projectName}
    </p>

    <h3>1. Alcance (Ejecución Pura)</h3>
    <ul>
        <li><strong>Parametrización Final</strong>: Configuración en ModularFactory de reglas W2E y límites.</li>
        <li><strong>Deployment On-chain</strong>: Despliegue en red acordada (Polygon/Base/Eth). Contratos inmutables.</li>
        <li><strong>Dashboard & Accesos</strong>: Activación del panel operativo y visualización de métricas.</li>
        <li><strong>Go-Live Check</strong>: Prueba funcional controlada (Acción -> Recompensa).</li>
    </ul>

    <h3>2. Lo que NO incluye</h3>
    <p>Desarrollo custom, auditorías externas, marketing, soporte indefinido.</p>

    <h3>3. Tiempos</h3>
    <p>Deployment: 24-48 horas tras pago.</p>

    <h3>4. Propiedad y Soberanía</h3>
    <p>Los contratos desplegados pertenecen al Cliente. Pandora’s no retiene llaves ni custodia.</p>

    <h3>5. Precio</h3>
    <p><strong>Precio:</strong> ${v.amount} USD.</p>

    <h3>6. Aceptación</h3>
    <p>El pago de este SOW autoriza el deployment irreversible del Protocolo en blockchain. Una vez realizado el deployment, no existe rollback ni reembolso por errores derivados de decisiones previas del Cliente.</p>
    <p style="font-size: 11px; color: #888; border-top: 1px solid #eee; padding-top: 5px; margin-top: 10px;">
        Este SOW se rige por el marco técnico descrito en el Litepaper Oficial de Pandora’s Finance (v1.0).
    </p>
</div>
`
};
