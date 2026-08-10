# ADR-005: Integration over Rewrite

## Status
**Accepted** - Phase II (Integration Phase)

## Context
Con el Pandora's Execution OS finalizado (Kernel v1.0), el proyecto entra en la Fase II. Existe el riesgo natural de intentar reconstruir interfaces gráficas (Dashboards, Portales, Formularios) bajo la falsa premisa de que "la nueva arquitectura requiere un nuevo frontend". Esto consumiría recursos masivos y duplicaría el esfuerzo ya invertido en productos funcionales como S'Narai y el Portal SaaS de Pandora's.

## Decision
Se establece la directriz inmutable de **Integración sobre Reescritura**.

1. **Frontends Intocables**: El Frontend, la UX y las pantallas existentes de S'Narai y el Portal de Pandora's **no se reconstruyen ni se duplican**.
2. **Evolución del Backend**: El esfuerzo de desarrollo se centrará exclusivamente en sustituir los motores traseros de la aplicación (los endpoints y la lógica de negocio antigua) por llamadas estructuradas al SDK de Pandora's OS (`createPandorasRuntime()`, `startProcess()`, `HermesShell`, etc.).
3. **El Portal como Panel de Control del OS**: El Portal SaaS existente deja de ser simplemente una tabla de base de datos y evoluciona conceptualmente para convertirse en el **Mission Control / OS Admin Panel**. Desde ahí se administrarán las organizaciones, branding, políticas, y capacidades que alimentarán el `Organization Runtime`.
4. **Server Actions como Puente**: La UI se comunicará con el OS a través de Server Actions o API Routes que actúan como "Gateway Adapters". Visualmente el usuario no notará el cambio; arquitectónicamente, toda ejecución pasará por el OS.

## Consequences
- **Velocidad de entrega**: Al no reescribir UI, la migración de S'Narai y el Portal al OS será considerablemente más rápida.
- **Claridad de Capas**: Garantizamos que el Execution OS es verdaderamente "Headless". No tiene UI propia, es simplemente un motor orquestador consumido por UIs externas.
- **Evitar Deuda Técnica**: No mantenemos dos portales paralelos. El portal actual se convierte orgánicamente en la interfaz de administración de la plataforma.
