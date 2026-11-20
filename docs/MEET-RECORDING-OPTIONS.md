# Grabación de reuniones — límites y opciones

Fecha: 20 nov 2026 · Contexto: Sovereign Meet (JaaS/Jitsi embebido) + minuta IA.

## El límite real

Jitsi corre dentro de un iframe **cross-origin** (`8x8.vc`). La página padre
(`nexus.pandoras.finance`) **no puede leer el audio de los demás participantes**:
el navegador aísla el origen. Tampoco existe una API que exponga el audio de la
sala sin permisos del usuario.

Conclusión: **no hay grabación 100% automática e invisible** desde nuestra UI.

## Lo implementado (v1)

- Botón **“Grabar”** en el dock (solo host).
- Un clic → `getDisplayMedia({ audio: true })`: el host comparte **la pestaña con
  audio**; se mezcla su micrófono (`getUserMedia`) en un `AudioContext`.
- Codificación Opus a **24 kbps** (45 min ≈ 8 MB; el tope del servidor es 10 MB).
- Al pulsar **Finalizar** se detiene, se crea el archivo y **se sube automáticamente**
  para generar resumen + tareas.
- Indicador visible **“Grabando mm:ss”** y botón **“Descargar audio”** en la pantalla
  de cierre (copia local para reenviar el resumen después).
- Si el host deja de compartir, la grabación se detiene y se sube igual.

Costo: **un clic** al inicio de cada reunión. No se puede evitar (política del
navegador: `getDisplayMedia` exige gesto del usuario).

## Opciones para automatizarlo de verdad

### A. Grabación en la nube de JaaS (recomendada a mediano plazo)

JaaS puede grabar en servidor si el plan la habilita. Flujo:

```
JaaS recording webhook → /api/webhooks/jaas/recording
  → descarga el archivo con la URL firmada
  → sube a storage (S3/R2)
  → invoca el mismo procesador (Gemini → OpenAI)
  → guarda resumen/tareas y marca el seguimiento listo
```

Ventajas: sin clic, sin depender del navegador del host, audio completo (todos los
participantes). Requisitos: plan de JaaS con grabación, `JITSI_APP_ID`/`JWT` con
permiso `recording`, y un webhook público con secreto. **No está implementado**:
falta confirmar el plan y las credenciales.

### B. Bot grabador (Jibri o similar)

Un proceso headless entra a la sala como participante y graba. Es la solución de
Jitsi "clásica". Costo: infraestructura (VM con Chrome + ffmpeg), operación y
riesgo de fallos. Solo tiene sentido si hay volumen alto de reuniones.

### C. Captura local del host (sin cambios de producto)

QuickTime / OBS graba la salida de audio del sistema y el host sube el archivo en
Minuta. Cero desarrollo, pero depende de disciplina manual.

### D. Extensión de navegador

Una extensión con permiso `tabCapture` puede iniciar la captura sin gesto por
reunión (el permiso se otorga una vez). Requiere publicar/mantener una extensión
en Chrome/Edge. Es la única forma de acercarse a "cero clics" sin tocar JaaS.

## Recomendación

1. **Ahora:** usar el botón “Grabar” (v1). Un clic, cero archivos sueltos.
2. **Siguiente:** confirmar si el plan de JaaS incluye grabación y montar el webhook
   (opción A). Eso elimina el clic y el riesgo de que el host olvide grabar.
3. **Descartar por ahora:** B (infra pesada) y D (mantenimiento de extensión).
