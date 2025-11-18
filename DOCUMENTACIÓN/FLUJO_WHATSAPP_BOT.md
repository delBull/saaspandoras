---
title: 🚀 WhatsApp Conversational Bot v3.0 - Pandoras
description: Sistema avanzado de filtro WhatsApp con 8 preguntas críticas para protocolos de utilidad
version: 3.0.0
status: ✅ SISTEMA COMPLETO
last_updated: 2025-11-18
---

# 🤖 WHATSAPP CONVERSATIONAL BOT v3.0 - PANDORAS

**Sistema de filtro avanzado WhatsApp** optimizado para detectar protocolos de utilidad reales mediante preguntas críticas y algoritmos de scoring.

> **Estado:** ✅ **SISTEMA COMPLETO** | **Cobertura:** 8 preguntas filtradas | **DB:** Existente + Nueva tabla | **Objetivo:** Filtro efectivo

[![Estado](https://img.shields.io/badge/Estado-SISTEMA%20COMPLETO-brightgreen)](https://dash.pandoras.finance)
[![Cobertura](https://img.shields.io/badge/Cobertura-8%20preguntas%20filtradas-blue)](https://github.com/delBull/saaspandoras)
[![Tecnología](https://img.shields.io/badge/WhatsApp%20Cloud-API%20v19.0-green)](https://developers.facebook.com/docs/whatsapp)

## 📊 STATUS ADAPTACIÓN ACTUAL

### ✅ **BASE EXISTENTE (REUTILIZAR):**

| Componente | Estado | Detalles |
|------------|--------|----------|
| **🗄️ Base de Datos** | ✅ Available | `whatsapp_application_states` existentes |

| Componente | Estado | Detalles |
|------------|--------|----------|
| **🌐 Webhook API** | ✅ Separados | `/api/whatsapp/` (33q) + `/api/whatsapp/preapply/` (8q) |
| **📤 WhatsApp API** | ✅ Ready | Helper `sendWhatsAppMessage()` compartido |
| **🎮 Gamificación** | ✅ Ready | Integration preparada |

### 🔄 **NUEVO SISTEMA COMPLETADO:**

| Componente | Archivo | Estado | Detalles |
|------------|---------|--------|----------|
| **📄 Schema DB** | `schema.ts` | ✅ Listo | Tabla `whatsapp_preapply_leads` |
| **💾 DB Helpers** | `preapply-db.ts` | ✅ Listo | get/create/save/status functions |
| **🤖 Flow Processor** | `preapply-flow.ts` | ✅ Listo | 8 preguntas + validaciones |
| **📡 Pre-Apply Webhook** | `/api/whatsapp/preapply/` | ✅ Listo | Webhook dedicada |
| **⚙️ Configuración** | `flowConfig.ts` | ✅ Listo | Preguntas + mensajes personalizados |

### 🎯 **OBJETIVO v3.0:**

**Cambiar de "33 preguntas cumplidoras" → "8 preguntas filtradas inteligentes"**

**Antes:** Cuestionario exhaustivo (orientation → requirements → tokenomics → legal)
**Ahora:** Filtro rápido para detectar utilidad real + staffing + timeline + audience

### 💡 **CAPACIDADES NUEVAS:**

- ✅ **Filtro de calidad** (detectar proyectos reales vs. vaporware)
- ✅ **Scoring inteligente** (mechanic validation frozen)
- ✅ **Transferencia automática** al web form cuando pase filtro
- ✅ **Status management** (Pending → Approved) desde admin
- ✅ ** Comunicación bidireccional** (bot ⇄ admin ⇄ usuario)

---

## 🤖 FLUJO WHATSAPP v3.0 - 8 PREGUNTAS FILTRADAS

### 🎯 **OBJETIVO PRINCIPAL:**

Filtrar rápido, captar solo creadores funcionales, detectar utilidad real, eliminar ruido, y mandar TODO al mismo "Apply" final.

### 🔷 **0. MENSAJE DE ENTRADA - PITCH OPTIMIZADO**

**Tipo:** Mensaje de bienvenida corto + CTA inmediata
**WhatsApp:** texto normal

```
¡Gracias por tu interés en lanzar tu Protocolo de Utilidad dentro de Pandora's!
Antes de avanzar al módulo técnico, necesitamos validar algunos puntos clave sobre tu Creación.
Te haré unas preguntas rápidas para confirmar su viabilidad. ¿Listo?
```

**Quick Buttons:**
- ✔ Sí, comenzar
- ❓ ¿Qué es un Protocolo de Utilidad? (Quick Info)

**Quick Info Respuesta:**
Un Protocolo de Utilidad es un sistema donde las acciones verificables del usuario generan valor o recompensas.
Ejemplos: tareas medibles, contenido curado, flujos verificables, aportes reales.

---

### 🔷 **1. FILTRO Q1 — MECANISMO DE UTILIDAD VERIFICABLE**

**Tipo:** Texto largo con ejemplo + botón de ejemplos
**WhatsApp:** texto + quick reply "Ver ejemplos"

**Pregunta:**
```
¿Cuál es la acción verificable que realiza el usuario dentro de tu Creación?
(Lo que podemos medir, validar y recompensar).
Explica brevemente cómo funciona.
```

**Botones:**
- 🧩 Ver ejemplos
- ❓ ¿Qué significa "verificable"?

**Quick Info (Verificable):**
Algo que el sistema pueda medir sin interpretación humana.
Ejemplo: enviar contenido, votar, subir tarea, confirmar asistencia, completar misión digital.

**Objetivo:** Excluir ideas vacías y proyectos sin utilidad funcional real.

---

### 🔷 **2. FILTRO Q2 — FLUJO DEL USUARIO**

**Tipo:** Respuesta abierta + Ayuda guiada
**WhatsApp:** texto + quick replies

**Pregunta:**
```
Explica cómo interactúa un usuario final con tu Protocolo paso a paso.
Incluye: qué hace, qué recibe, y cómo se activa cada utilidad.
```

**Botones:**
- 🧭 Ver ejemplo
- ❓ ¿Qué es un flujo?

**Ejemplo perfecto:**
- "Un usuario entra → activa su acceso → completa misiones → gana recompensas → participa en dinámicas exclusivas."

**Objetivo:** Detectar estructura mental y claridad operativa.

---

### 🔷 **3. FILTRO Q3 — ROLES / OPERACIÓN**

**Tipo:** Formato semi-estructurado
**WhatsApp:** texto normal + guía en bullets

**Pregunta:**
```
¿Quién administrará tu Protocolo dentro de Pandora?

Indica:
– Nombre
– Correo oficial
– Rol (fundador / operador / CM)
```

**Extra (opcional activado por la IA según respuesta):**

```
¿Cuáles acciones administrativas crees que necesitarás?
– Activar beneficios
– Aprobar participaciones
– Subir contenido
– Validar tareas
– Gestionar recompensas
```

**Objetivo:** Ver si tienen equipo operativo REAL. Sin responsable = NO-GO automático.

---

### 🔷 **4. FILTRO Q4 — ETAPA DEL PROYECTO**

**Tipo:** Select Input
**WhatsApp:** lista numerada

**Pregunta:**
```
¿En qué etapa está actualmente tu Protocolo?
```

**Opciones:**
1. Idea
2. MVP
3. En operación
4. Comunidad activa
5. Primeras ventas

**Objetivo:** Clasificar funnel.

---

### 🔷 **5. FILTRO Q5 — OBJETIVO CLARO**

**Tipo:** Respuesta corta (ideal)
**WhatsApp:** texto
**Estilo:** claridad operacional

**Pregunta:**
```
¿Cuál es tu objetivo al lanzar tu Protocolo dentro de Pandora's?
(Accesos, misiones, recompensas, comunidad, membresías, ventas, etc.)
```

**Objetivo:** Detectar intención y evitar "quiero tokenizar por tokenizar".

---

### 🔷 **6. FILTRO Q6 — RECURSOS DEL EQUIPO**

**Tipo:** Select Input + texto extra
**WhatsApp:** lista numerada

**Pregunta:**
```
¿Con cuántas personas cuenta tu proyecto actualmente?
```

**Opciones:**
1. Solo yo
2. 2–4 personas
3. 5+

**Luego:**
```
¿Quién será el responsable técnico?
```

**Objetivo:** Detectar equipos sólidos, evitar freeloaders.

---

### 🔷 **7. FILTRO Q7 — COMUNIDAD**

**Tipo:** Select Input múltiple
**WhatsApp:** numerado (1–8)

**Pregunta:**
```
¿Tu proyecto ya cuenta con comunidad o audiencia?
Elige todas las que apliquen.
```

**Opciones:**
1. No existe audiencia
2. < 50
3. 50–200
4. 200–1000
5. 1000+
6. Comunidad activa en redes
7. Comunidad compradora real
8. Comunidad privada (Discord/Telegram)

**Objetivo:** Clasificación para marketing + scoring interno.

---

### 🔷 **8. FILTRO Q8 — FECHA DE LANZAMIENTO**

**Tipo:** Respuesta corta (texto)
**WhatsApp:** texto

**Pregunta:**
```
¿Cuál es tu fecha estimada para lanzar la primera versión de tu Protocolo?
```

**Objetivo:** Detectar urgencia real.

---

## 🟣 FINAL — FORZAR CONVERGENCIA A APPLY (CAPA 2)

**Cuando el último filtro se responde:**

```
Gracias, Creador.
Hemos registrado tu información.
Ahora completa la última capa para formalizar tu Protocolo aquí 👇

🔗 pandor.as/apply
```

**El usuario SIEMPRE aterriza aquí.**

---

## 🛠 ADMIN — ESTADOS: PENDING / APPROVED

### 🔶 **Estado: "Pendiente"** (cambiado desde dashboard)

```
¡Felicidades! Tu aplicación pasó nuestro filtro inicial y está en revisión activa.
Un estratega de arquitectura se pondrá en contacto 24/48h.
Tiempo estimado: 24/48h.
```

**Objetivo:** Ganar tiempo para fuzz testing y validación interna.

---

### 🔷 **Estado: "Aprobado"** (activado desde dashboard)

```
Tu arquitectura ha sido aprobada.
Tu Protocolo ya está parametrizado y listo para deployment en la ModularFactory.
Agenda tu llamada final aquí: [Link Calendly].
```

**Objetivo:** Cerrar la venta y empujar a ejecución.

---

## 🔄 EXPANSIÓN FUTURA: SOPORTE HUMANO ("HABLAR CON HUMANO")

> **Estado:** 📋 **PLANEADO** | **Complejidad:** Media | **Tiempo estimado:** 4-6 horas

### 🎯 **CONCEPTO:**

Cuando el bot detecta ciertos keywords (confusión, urgencia, complejidad), puede transferir la conversación a un agente humano manteniendo el contexto completo.

### 🏗️ **ARQUITECTURA PROPUESTA:**

#### **1. Nuevas Tablas DB:**

```sql
-- Sesiones activas de soporte humano
CREATE TABLE whatsapp_live_sessions (
  id BIGSERIAL PRIMARY KEY,
  user_phone TEXT NOT NULL UNIQUE,
  assigned_agent TEXT NULL,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  started_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  ended_at TIMESTAMP WITH TIME ZONE
);

-- Log completo de mensajes
CREATE TABLE whatsapp_messages (
  id BIGSERIAL PRIMARY KEY,
  user_phone TEXT NOT NULL,
  direction TEXT NOT NULL, -- 'in' | 'out'
  body TEXT,
  meta JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);
```

#### **2. Flujo de Transferencia:**

```
Usuario: "No entiendo cómo funciona esto, necesito ayuda"
↓
Bot detecta: "ayuda", "hablar con humano", "problema"
↓
Bot actualiza: mode = 'human'
↓
Bot informa: "Transfiriendo a un agente humano..."
↓
Sistema asigna agente automático
↓
Bot deja de responder
↓
Agente humano toma control
↓
Agente puede: responder, transferir de vuelta a bot, cerrar sesión
```

#### **3. Panel de Administración:**

Componente React para agentes humanos con:
- Lista de conversaciones activas
- Historial de mensajes
- Botón "Transferir a bot"
- Botón "Cerrar sesión"
- Notificaciones en tiempo real

#### **4. Endpoints Nuevos:**

```typescript
// GET  /api/whatsapp/human/list              - Listar sesiones activas
// POST /api/whatsapp/human/send              - Agente envía mensaje
// POST /api/whatsapp/human/close             - Cerrar sesión humana
// POST /api/whatsapp/human/assign/{agent}    - Asignar agente
```

#### **5. Detección Inteligente:**

El bot reconocerá automáticamente cuando transferir:

```typescript
const humanTriggers = [
  "ayuda", "ayudame", "problema", "no entiendo",
  "hablar con humano", "hablar con alguien",
  "soporte", "urgente", "complejo"
];
```

### 🎨 **UI/UX PROPUESTA:**

```tsx
// Componente simplificado
function WhatsAppAgentPanel() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {sessions.map(session => (
        <ChatCard
          key={session.id}
          phone={session.user_phone}
          agent={session.assigned_agent}
          lastMessage={session.messages[0]}
          onReply={(msg) => handleReply(session.id, msg)}
          onTransferToBot={() => handleTransfer(session.id)}
          onClose={() => handleClose(session.id)}
        />
      ))}
    </div>
  );
}
```

### 📊 **MÉTRICAS Y ANALYTICS:**

- Tasa de transferencias a humano
- Tiempo promedio de resolución
- Satisfacción del usuario (CSAT)
- Conversión por fuente (Web vs WhatsApp)

### 🔧 **IMPLEMENTACIÓN TÉCNICA:**

#### **Helper para enviar mensajes:**
```typescript
// /lib/whatsapp/send.ts
export async function sendWhatsAppText(phone: string, text: string) {
  const res = await fetch(`${WHATSAPP.API_URL}/${PHONE_ID}/messages`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${WHATSAPP.TOKEN}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      messaging_product: 'whatsapp',
      to: phone,
      type: 'text',
      text: { body: text }
    })
  });

  return await res.json();
}
```

#### **Webhook Actualizado:**
```typescript
// Verificar si usuario está en modo humano
if (userState.mode === 'human') {
  // Notificar al panel de agentes
  await notifyAgentWebhook(phone, messageText);
  return;
}

// Procesar normalmente con bot
await processBotMessage(phone, messageText);
```

## 📋 ROADMAP COMPLETO

| Fase | Estado | Descripción |
|------|--------|-------------|
| **1. Bot Conversacional** | ✅ **COMPLETADO** | Funcionando en producción |
| **2. Soporte Humano** | 📋 **PLANEADO** | Estructura definida, implementación pendiente |
| **3. Panel de Agentes** | 🔨 **PENDIENTE** | UI/UX por definir |
| **4. Notificaciones** | 🔨 **PENDIENTE** | Slack/Email alerts |
| **5. Analytics Avanzados** | 🔮 **FUTURO** | Métricas detalladas |

## 🎯 CONCLUSIÓN

**El sistema WhatsApp Bot está completamente operativo en producción** con todas las funcionalidades críticas funcionando. La expansión a soporte humano está perfectamente documentada y lista para implementación cuando sea necesario.

¿Necesitas que implemente alguna parte específica del soporte humano o tienes alguna duda sobre la documentación?
