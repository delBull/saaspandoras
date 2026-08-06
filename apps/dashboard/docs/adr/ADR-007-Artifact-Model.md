# ADR-007: Artifact Model

## 1. Contexto
Las respuestas de los agentes y motores cognitivos varían enormemente en formato: desde un mensaje de texto simple, hasta esquemas complejos de JSON, código AST, reportes generados o flujos de trabajo completos.

## 2. Decisión
Cualquier resultado generado en el ecosistema (por Hermes o por un Service Provider) será catalogado como un **Artifact**. 
El modelo de Artifact permite que las salidas sean almacenables, trazables y renderizables, estandarizando cómo las aplicaciones cliente (S'Narai, Workbench, Telegram) consumen los resultados cognitivos.

## 3. Consecuencias
Las APIs no devolverán meras cadenas de texto (`string`). Se estructurarán como Artifacts (`markdown`, `json`, `ast`, `landing`), lo cual delega la responsabilidad de renderizado a la UI sin requerir entendimiento previo del tipo de contenido por parte del canal.
