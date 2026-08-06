# ADR-004: Capability Binding

## 1. Contexto
Si Hermes orquesta basado en "Capacidades" (ADR-003) y los proveedores se registran bajo un "Service Registry" (ADR-002), se requiere un mecanismo para enlazar ambos dominios dinámicamente.

## 2. Decisión
Se establece el **Binding Registry**. Su responsabilidad exclusiva es resolver qué Service Provider ejecutará qué Capability, potencialmente bajo qué contexto de Tenant.
Ejemplo:
`content.generate -> Pandora's Media Co`
`language.generate -> OpenAI`

## 3. Consecuencias
El enrutamiento cognitivo se vuelve dinámico. Este diseño es el precursor para el futuro **Resource Manager** (Sprint 8), el cual podrá evaluar múltiples Bindings para una misma Capability y seleccionar dinámicamente el proveedor más eficiente basado en latencia, costo, o estado de salud (SLA).
