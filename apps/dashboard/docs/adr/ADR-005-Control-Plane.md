# ADR-005: Control Plane

## 1. Contexto
A medida que el ecosistema de Pandora's crece (S'Narai, Rabbitty, etc.), múltiples aplicaciones requerían acceder al estado de sus configuraciones y capacidades desde diferentes rutas de la base de datos o endpoints obsoletos.

## 2. Decisión
Se establece un **Control Plane** unificado. El Control Plane es la única capa de administración y gestión del estado del sistema, actuando como la autoridad central para todas las aplicaciones cliente. 

## 3. Consecuencias
Ninguna aplicación periférica de Pandora's leerá el estado de la base de datos de manera fragmentada (ej. consumiendo configuraciones legacy atómicas). Toda comunicación de estado pasará obligatoriamente por las rutas expuestas por el Control Plane, garantizando consistencia, seguridad de acceso y centralización de la lógica del Cognitive OS.
