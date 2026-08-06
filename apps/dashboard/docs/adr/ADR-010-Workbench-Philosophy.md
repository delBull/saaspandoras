# ADR-010: Workbench Philosophy

## 1. Contexto
Hermes y las fábricas funcionales (ej. Pandora's Media Co) empezaban a mostrar un solapamiento en sus respectivos Dashboards, donde ambos querían administrar campañas o agentes.

## 2. Decisión
El Workbench de Hermes se define exclusivamente como un cliente del Control Plane, adoptando una filosofía de visualización tipo "Service Mesh" (similar a Kubernetes). 
El Workbench no duplica la interfaz de sus Service Providers. Solamente visualiza:
* Los Service Providers registrados.
* Las capacidades expuestas por estos.
* El estado de los enlaces dinámicos (Binding Registry).
* La latencia, telemetría y salud de las conexiones (Health y Execution Traces).

## 3. Consecuencias
Se mantiene un límite claro (Dashboard Boundary). Quien requiera configurar campañas de marketing o redactar manuales de identidad usará el Dashboard nativo de Pandora's Media Co. El Workbench de Hermes solo se usa para operar el Cognitive OS, enlazar proveedores y monitorear el flujo de ejecución global del sistema.
