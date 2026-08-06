# ADR-000: Hermes Constitution

## 1. Contexto
Hermes ha evolucionado orgánicamente. Para asegurar su escalabilidad y mantener su base de código limpia de responsabilidades ajenas, es necesario establecer los principios fundacionales que rigen qué pertenece y qué no pertenece al sistema.

## 2. Decisión
Se establece la presente Constitución de Hermes como la máxima autoridad arquitectónica del sistema.

### 2.1. Propósito y Principios
El propósito de Hermes es actuar como un **Cognitive Operating System** (OS). 
Sus principios son:
* **Agnosticismo:** Hermes no conoce implementaciones concretas ni nombres propios (ej. Sofía, Minerva, Media Co).
* **Desacoplamiento:** Las interfaces y los registros son independientes del Runtime y la ejecución.
* **Orquestación sobre Ejecución:** Hermes no "hace" el trabajo funcional pesado, lo delega.

### 2.2. La Regla de Oro (Golden Rule)
Todo componente nuevo del ecosistema debe responder afirmativamente a al menos UNA de estas preguntas. Si no, no pertenece al ecosistema:
1. ¿Es un Service Provider?
2. ¿Es una Business Application?
3. ¿Es un Channel Adapter?
4. ¿Es parte del Kernel?
5. ¿Es parte de la Shared Platform?

### 2.3. No Goals (Lo que Hermes NO es)
Hermes **NO ES**:
* Un CRM o ERP.
* Un CMS o editor WYSIWYG.
* Una plataforma de email marketing.
* Un generador de imágenes o videos.
* Un bot de Telegram con lógica de negocio específica.
* Una aplicación de negocio específica (como S'Narai).

Hermes **únicamente**: Decide, Orquesta, Ejecuta y Coordina.

## 3. Consecuencias
Cualquier intento de introducir lógica de negocio acoplada, nombres de proveedores específicos dentro del Kernel, o interfaces monolíticas, será rechazado en revisión de código, protegiendo así la pureza arquitectónica de Hermes.
