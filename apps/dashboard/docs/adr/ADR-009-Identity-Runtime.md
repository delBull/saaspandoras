# ADR-009: Identity Runtime

## 1. Contexto
Pandora's Growth OS aloja múltiples proyectos ("Tenants" como S'Narai o Rabbitty), requiriendo que Hermes altere su contexto operativo y reglas de negocio según quién hace la solicitud.

## 2. Decisión
Se establece el concepto de **Identity Runtime**. Hermes cargará una Identidad Cognitiva específica al vuelo para cada Tenant, manteniendo total aislamiento de memoria, políticas, y configuración entre ecosistemas durante la ejecución.

## 3. Consecuencias
El código duro desaparece. No habrá condicionales como `if (tenant === 'snarai')` en el Kernel. Las reglas son resueltas dinámicamente mediante los registros (Binding Registry) y el Identity Runtime, facilitando una escalabilidad horizontal para incorporar nuevos proyectos en Pandora's.
