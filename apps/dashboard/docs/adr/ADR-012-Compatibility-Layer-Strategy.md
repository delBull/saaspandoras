# ADR-012: Compatibility Layer Strategy

## 1. Contexto
A medida que Hermes se consolida en su versión 1.0 (Cognitive OS), existen componentes heredados (ej. bot de Telegram y flujos de ventas acoplados) que contienen lógica de negocio compleja que aún no ha sido migrada a los módulos puros del Kernel (Planificador, Runtimes de Conocimiento, etc.). Modificar el Kernel para acomodar este código legacy o refactorizar todas esas funciones inmediatamente representa un riesgo inaceptable para la producción.

## 2. Decisión
Todo código previo a Hermes v1 permanecerá encapsulado detrás de **Providers de Compatibilidad** (ej. `Compatibility Provider`). 

1. El Kernel nunca conocerá implementaciones heredadas ni nombres de canales (Telegram, WhatsApp) en su núcleo lógico.
2. No se crearán capacidades ficticias (ej. `system.legacy_telegram`). En su lugar, se registrarán **Capacidades Reales** (`sales.pitch`, `knowledge.answer`, `commerce.checkout`) cuyos *Bindings* apuntarán de manera temporal al `Compatibility Provider`.
3. La migración hacia los motores puros del Kernel será progresiva: reemplazando los Bindings en el Registro, nunca modificando el Core ni rompiendo el flujo.

## 3. Consecuencias
Esta estrategia aísla el daño potencial del código antiguo. Permite que los canales actúen de inmediato como Adapters puros (`telegram-adapter`) y que el `Unified Execution API` (`Hermes.execute`) comience a operar inmediatamente sin necesidad de haber construido todos los motores del Sprint 8 (Resource Manager, Planner). Eventualmente, el `Compatibility Provider` se volverá obsoleto y será eliminado cuando todos los bindings hayan sido migrados a Providers nativos.
