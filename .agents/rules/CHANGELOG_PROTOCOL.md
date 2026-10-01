# PROTOCOLO DE CHANGELOG PÚBLICO

Este protocolo debe ser respetado por el Agente (Antigravity/Hermes) en TODAS las sesiones de desarrollo dentro del monorepo.

## 1. Regla de Aprobación Obligatoria (Humano en el Loop)
Al terminar de implementar con éxito una nueva característica, endpoint, o refactorización arquitectónica que tenga impacto en los Developers o Usuarios, el Agente **TIENE ESTRICTAMENTE PROHIBIDO** finalizar la conversación sin antes preguntar al usuario:

> *"He terminado la implementación. ¿Deseas que redacte una entrada para el Changelog Público y prepare el anuncio para Discord?"*

## 2. Redacción Segura
Si el usuario aprueba, el Agente debe redactar la entrada asegurándose de:
- Usar un tono profesional de Developer Marketing (estilo Stripe / Vercel).
- **JAMÁS** incluir secretos, paths absolutos de archivos, o vulnerabilidades específicas que fueron parchadas.
- Traducir la complejidad técnica en valor tangible (ej. en lugar de "Cambié el webhook a async", usar "Mejora de latencia en la entrega de Webhooks").

## 3. Publicación
- El Agente proveerá el comando exacto para que el usuario corra el script de publicación a Discord si corresponde.
