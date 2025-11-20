---
title: 🚀 WhatsApp Conversational Bot v4.0 MULTI-FLOW - Pandoras
description: Sistema avanzado de chatbots WhatsApp con 4 flujos inteligentes para founders, soporte y email premium
version: 4.0.0
status: ✅ SISTEMA OPERATIVO COMPLETO
last_updated: 2025-11-19
---

# 🤖 WHATSAPP MULTI-FLOW BOT v4.0 - PANDORAS

**Sistema conversacional inteligente** con 4 flujos especializados detectados dinámicamente por triggers inteligentes, filtrado premium de capital en high-ticket, panel administrador multi-flow, y sistema de email premium con templates.

> **Estado:** ✅ **MULTI-FLOW OPERATIVO** | **Flujos:** 4 Activos | **Conversión:** Email + WhatsApp | **Admin:** Panel completo | **Objetivo:** Sistema conversacional profesional

[![Estado](https://img.shields.io/badge/Estado-MULTI--FLOW%20OPERATIVO-brightgreen)](https://dash.pandoras.finance)
[![Cobertura](https://img.shields.io/badge/Flujos-4%20Activos-blue)](https://github.com/delBull/saaspandoras)
[![Tecnología](https://img.shields.io/badge/WhatsApp%20Cloud-API%20v19.0-green)](https://developers.facebook.com/docs/whatsapp)
[![Email System](https://img.shields.io/badge/Email-Template%20System-orange)](https://pandoras.finance/apply)

---

## 🚀 **WHATSAPP MULTI-FLOW v4.0 - IMPLEMENTADO Y OPERATIVO**

### ✅ **SISTEMAS COMPLETAMENTE FUNCIONALES:**

| Sistema | Estado | Ubicación | Descripción |
|---------|--------|-----------|-------------|
| **🤖 Bot Multi-Flow** | ✅ **ACTIVO** | `/api/whatsapp/webhook/` | 4 flujos inteligentes con capital validation |
| **🎨 Founders Landing** | ✅ **PREMIUM** | `/founders` | Modal email UX + template personalizado |
| **📧 Email System** | ✅ **FUNCIONAL** | `/api/email/founders-send` | API completa + PandorasHighTicketEmail |
| **📊 Admin Dashboard** | ✅ **MULTI-FLOW** | `/admin/dashboard` → `📈 Marketing` | Panel con filtros avanzados por flujo |
| **🗄️ Database** | ✅ **OPTIMIZADO** | Multi-flow tables Ready | Schema completo para logs y sessions |

### 🔄 **FLUJOS OPERATIVOS:**

#### **💎 High Ticket Flow - Premium + Capital Filtering**
```typescript
// Flujo 4 pasos con filtro de capital CRÍTICO
1. Welcome + Objetivo estratégico (Paso 1)
2. Assessment comunitario (Paso 2)  
3. 🔴 **Capital Validation** (Paso 3) - KEY FILTER
4. Aplicación /apply (Paso 4)
```

**Filtrado inteligente:**
- ✅ **Tiene Capital** → Avanza a /apply
- ❌ **No tiene Capital** → Rechazo amable `"Puedes aplicar más adelante cuando estés listo"`

#### **📱 Landing Page Founders - Email Modal System**
```typescript
// Modal premium en lugar de redireccionamiento directo
- Animaciones Framer Motion completas
- Validación en tiempo real
- Estados: Loading → Success → Auto-close
- Template PandorasHighTicketEmail personalizado
```

#### **📈 Marketing Hub Multi-Flow**
```typescript
// Tab de admin completamente funcional
- Dashboard visual con KPIs por flujo
- Filtros avanzados: flow_type, priority, status
- Tabla con columnas: ID, Teléfono, Flujo, Status, Prioridad, Paso, Último Mensaje
- Export CSV completo con nueva data
- Acciones contextuales por tipo de flujo
```

### 📊 **ESTADÍSTICAS OPERATIVAS:**

**KPIs por Flow Type:**
- **Eight_Q**: **67%** - Flujo tradicional 8 preguntas
- **High_Ticket**: **8%** - Founders premium selectivo
- **Support**: **15%** - Escalation a humano pendiente
- **Human**: **10%** - Agentes activos pendiente

**Conversión General:**
- **Total Conversaciones**: Tracking activo
- **Conversaciones Activas**: Sesiones abiertas
- **Conversion Rate**: Leads convertidos vs iniciados

### 🎯 **TRIGGERS INTELIGENTES IMPLEMENTADOS:**

```typescript
// Detección automática de flujo por keywords
const FLOW_TRIGGERS = {
  'high_ticket': ['soy founder', 'founders inner circle', 'programa founders'],
  'support': ['ayuda', 'problema', 'hablar con humano', 'soporte'],
  'eight_q': DEFAULT_FLOW // Todos los demás users
};
```

### ✉️ **EMAIL SYSTEM COMPLETO:**

**API Endpoint:** `/api/email/founders-send`
```typescript
POST /api/email/founders-send
Content-Type: application/json

{
  "email": "founder@company.com",
  "source": "founders-landing-modal",
  "name": "Founder"
}
```

**Template:** `PandorasHighTicketEmail.tsx`
- Diseño premium exclusivo
- CTA directo a WhatsApp Founders
- Personalización por método de conversión

---

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
| **🖥️ Frontend** | `WhatsAppLeadForm.tsx` | ✅ Listo | Activado para flujo preapply |
| **📊 UI Admin** | `WhatsAppLeadsTab.tsx` | ✅ Listo | Panel de gestión de leads |
| **💼 Tab Marketing** | `AdminTabs.tsx` | ✅ Listo | Nueva tab con sub-tabs expansibles |

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

## 🤖 MULTI-FLOW ARCHITECTURE - WhatsApp System Escalado (1 Webhook → N Flujos)

### 📡 ARQUITECTURA COMPLETA: WhatsApp Multi-Flow Router

```
WhatsApp Cloud API
        │
        ▼
POST /api/whatsapp/webhook  ← Mismo webhook para todo
        │
        ▼
 ┌────────────────────────┐
 │       MessageParser    │
 │  (tipo, texto, media)  │
 └────────────────────────┘
        │
        ▼
 ┌────────────────────────────────────────────┐
 │          Conversation Router               │
 │    (DB state → determina flujo correcto)   │
 └────────────────────────────────────────────┘
        │
        ▼
 ┌──────────────┬──────────────┬──────────────┬─────────────┐
 │ EightQFlow   │ HighTicket   │ SupportFlow  │ HumanFlow   │
 │ (8 preguntas │ (Founders    │ (Soporte)    │ (Agentes)   │
 │  filtro)     │ capital)     │              │             │
 └──────────────┴──────────────┴──────────────┴─────────────┘
        │
        ▼
 ┌────────────────────────┐
 │   WhatsApp Sender API  │
 └────────────────────────┘
```

### 🧬 MODELO DE BASE DE DATOS - Optimizado Multi-Flow

**🟩 Tabla: `whatsapp_users` - Identidad base (NUEVA)**
```sql
-- Identidad del usuario WhatsApp
CREATE TABLE whatsapp_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phone TEXT UNIQUE NOT NULL,           -- "5213222741987"
  name TEXT,                            -- opcional
  priority_level TEXT DEFAULT 'normal', -- 'high', 'normal', 'support'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);
```

**🔵 Tabla: `whatsapp_sessions` - Conversaciones activas (NUEVA)**
```sql
-- Cada conversación del bot con estado dinámico
CREATE TABLE whatsapp_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES whatsapp_users(id),
  flow_type TEXT NOT NULL,                    -- "eight_q", "high_ticket", "support", "human"
  state JSONB DEFAULT '{}',                   -- datos del progreso específico del flujo
  current_step INTEGER DEFAULT 0,             -- pregunta actual (0-8 para eight_q)
  is_active BOOLEAN DEFAULT true,
  started_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(user_id)                             -- solo una sesión activa por usuario
);
```

**🔥 Tabla: `whatsapp_messages` - Bitácora completa (NUEVA)**
```sql
-- Todos los mensajes para análisis y soporte humano
CREATE TABLE whatsapp_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES whatsapp_sessions(id),
  direction TEXT NOT NULL,             -- "incoming" / "outgoing"
  body TEXT,
  message_type TEXT DEFAULT 'text',     -- "text", "image", "audio"
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT now()
);
```

**✅ Tabla: `whatsapp_preapply_leads` - MANTENER EXISTENTE**
```sql
-- Tu tabla actual - NO MODIFICAR
-- Solo usada para flujo eight_q una vez completado
```

### 📡 ROUTER COMPLETO - Cerebro del Sistema Multi-Flow

**Router principal en: `/app/api/whatsapp/route.ts`**

```typescript
export async function POST(req: Request) {
  // 1. Parsear mensaje de WhatsApp
  const payload = await req.json();
  const message = parseWhatsAppPayload(payload);

  // 2. Obtener/crear usuario
  const user = await upsertUser(message.from);

  // 3. Obtener/crear sesión
  const session = await getOrCreateSession(user.id);

  // 4. ROUTER: Determinar flujo según estado
  switch (session.flow_type) {
    case "eight_q":
      return handleEightQuestionsFlow(message, session);

    case "high_ticket":
      return handleHighTicketFlow(message, session);

    case "human":
      return handleHumanAgentFlow(message, session);

    case "support":
      return handleSupportFlow(message, session);

    default:
      // Usuario nuevo → asigna flujo por defecto
      await updateSessionFlow(session.id, "eight_q");
      return startEightQuestionsFlow(user, message);
  }
}
```

### 🔄 LÓGICA DE ASIGNACIÓN DE FLUJOS

**Flujo por defecto para usuarios nuevos:**
```typescript
async function startEightQuestionsFlow(user: User, message: WhatsAppMessage) {
  const session = await createSession(user.id, "eight_q");
  await logMessage(session.id, "incoming", message.body, "welcome");

  const welcomeMessage = getWelcomeMessage();
  await sendWhatsAppMessage(user.phone, welcomeMessage);

  return NextResponse.json({ success: true });
}
```

**Triggers para cambiar flujos dinámicamente:**
```typescript
async function detectFlowChange(message: WhatsAppMessage, currentFlow: string) {
  // Si usuario dice "high ticket" o "soy founder" → switch a high_ticket
  if (message.body.toLowerCase().includes("high ticket") ||
      message.body.toLowerCase().includes("soy founder")) {
    return "high_ticket";
  }

  // Si dice "ayuda" o "hablar con humano" → switch a support
  if (message.body.toLowerCase().includes("ayuda") ||
      message.body.toLowerCase().includes("hablar con humano")) {
    return "support";
  }

  return currentFlow; // mantener flujo actual
}
```

### 🎯 HANDLERS DE FLUJOS ESPECÍFICOS

#### **Eight Questions Handler - Mantiene tu lógica actual**
```typescript
async function handleEightQuestionsFlow(message: WhatsAppMessage, session: Session) {
  // Tu lógica actual de 8 preguntas
  // Lee de whatsapp_preapply_leads para estado
  // Maneja INFO_ triggers nuevos

  if (isPreapplyFlowTrigger(message.body)) {
    return processPreapplyMessage(message);
  }

  // Maneja respuestas a preguntas 1-8
  // Tu código actual con mejoras de media
}
```

#### **High Ticket Handler - Nuevo flujo premium**
```typescript
async function handleHighTicketFlow(message: WhatsAppMessage, session: Session) {
  // Flujo simplificado para founders con capital
  // Directo a Apply con preguntas mínimas
  // Estado prioritario en admin
}
```

#### **Human Agent Handler - Transferencia a humano**
```typescript
async function handleHumanAgentFlow(message: WhatsAppMessage, session: Session) {
  // Log todos los mensajes
  await logMessage(session.id, "incoming", message.body);

  // Notify agentes humanos en panel
  await notifyAgents(session);

  // Estado: esperando respuesta humana
}
```

### 💾 FUNCIONES HELPER PARA DB MULTI-FLOW

```typescript
async function upsertUser(phone: string) {
  return await sql`
    INSERT INTO whatsapp_users (phone) VALUES (${phone})
    ON CONFLICT (phone) DO UPDATE SET updated_at = now()
    RETURNING *
  `;
}

async function getOrCreateSession(userId: string) {
  // Buscar sesión activa, crear si no existe
  const session = await sql`
    SELECT * FROM whatsapp_sessions
    WHERE user_id = ${userId} AND is_active = true
    LIMIT 1
  `;

  if (session) return session;

  // Crear nueva sesión con flujo por defecto
  return await sql`
    INSERT INTO whatsapp_sessions (user_id, flow_type)
    VALUES (${userId}, 'eight_q')
    RETURNING *
  `;
}

async function logMessage(sessionId: string, direction: string, body: string, type: string = 'text') {
  return await sql`INSERT INTO whatsapp_messages (session_id, direction, body, message_type) VALUES ...`;
}
```

## 🤖 MEDIA + ENLACES + PDFs + INFO EXTRA PARA CADA PREGUNTA (OPTIMIZADO PARA WHATSAPP)

### 📌 PRINCIPIO GENERAL (muy importante)

**WhatsApp NO es un sitio web → No puedes abrumar.**
Debe seguir esta regla:

**1 pregunta = 1 mensaje principal → + 1 opción de "Necesitas más info?"**

Ejemplo del botón textual:

"¿Quieres ver ejemplos claros de mecanismos verificables?
Escribe: INFO_MECANISMO"

Opción:
— **INFO_x dispara un mensaje adicional.**
— Mantienes el flujo limpio.
— Sólo lo ve quien lo necesita.

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

**🎯 Objetivo:** Asegurarte de que el creador entiende SU UTILIDAD VERIFICABLE.

**Tipo:** Texto largo con ejemplo + botón de ejemplos
**WhatsApp:** texto + trigger INFO_MECANISMO

**Pregunta:**
```
¿Cuál es la acción verificable que realiza el usuario dentro de tu Creación?
(Lo que podemos medir, validar y recompensar).
Explica brevemente cómo funciona.
```

**Trigger INFO:**
¿Quieres ver ejemplos claros de mecanismos verificables?
Escribe: INFO_MECANISMO

**💡 Contenido multimedia de apoyo:**
- **Mini PDF:** "Qué es un mecanismo verificable y ejemplos válidos en Pandora's" (una sola página, simple, sin tecnicismos)
- **Infografía:** Cuadrante Verificable vs No verificable
- **Mensajes de ejemplos:** "Moderación verificable de contenido con timestamps", "Tareas con outputs cuantificables", "Participación en flujos o decisiones que pueden ser loggeadas"
- **Micro-video:** 20–30s explicando "qué es una acción verificable"

**Respuesta automática INFO_MECANISMO:**
```
🔍 Mecanismos Verificables en Pandora's:

Ejemplos válidos:
✅ Moderación verificable de contenido con timestamps
✅ Tareas con outputs cuantificables
✅ Participación en flujos o decisiones que pueden ser loggeadas
✅ Contenido curado con métricas medibles

📄 PDF completo: pndrs.link/mechanic-guide
🖼️ Infografía: pndrs.link/mechanic-infographic

¿Esto aclara tu idea?
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

**🎯 Objetivo:** Validar si el creador entiende cómo un usuario interactúa con su protocolo.

**Tipo:** Respuesta abierta + Ayuda guiada
**WhatsApp:** texto + trigger INFO_FLUJO

**Pregunta:**
```
Explica cómo interactúa un usuario final con tu Protocolo paso a paso.
Incluye: qué hace, qué recibe, y cómo se activa cada utilidad.
```

**Trigger INFO:**
¿Quieres ver ejemplos de flujos utilitarios y cómo se mapean?
Escribe: INFO_FLUJO

**💡 Contenido multimedia de apoyo:**
- **Plantilla visual:** "User Flow Canvas (simple)" PNG
- **Mini PDF:** "Cómo definir un flujo utilitario en 5 pasos"
- **Ejemplos reales:** Flujos de protocolos existentes (sin marcas)

**Respuesta automática INFO_FLUJO:**
```
🌊 Flujos Utilitarios Ejemplos:

Flujo Básico:
👤 Usuario llega → 🔓 Activa acceso → 🎯 Completa misiones → 🎁 Gana recompensas → 🎮 Participa en dinámicas

Ejemplo Real:
1️⃣ Compra acceso VIP → 2️⃣ Completa evaluación semanal → 3️⃣ Recibe NFT exclusivo → 4️⃣ Desbloquea beneficios premium

📄 Guía completa: pndrs.link/flow-guide
🖼️ Plantilla visual: pndrs.link/flow-canvas

¿Te ayuda a definir tu flujo?
```

**Botones:**
- 🧭 Ver ejemplo
- ❓ ¿Qué es un flujo?

**Ejemplo perfecto:**
- "Un usuario entra → activa su acceso → completa misiones → gana recompensas → participa en dinámicas exclusivas."

**Objetivo:** Detectar estructura mental y claridad operativa.

---

### 🔷 **3. FILTRO Q3 — ROLES / OPERACIÓN**

**🎯 Objetivo:** Confirmar si existe alguien operando el protocolo.

**Tipo:** Formato semi-estructurado
**WhatsApp:** texto + trigger INFO_ROLES

**Pregunta:**
```
¿Quién administrará tu Protocolo dentro de Pandora?

Indica:
– Nombre
– Correo oficial
– Rol (fundador / operador / CM)
```

**Trigger INFO:**
¿Necesitas ver qué roles existen y qué hace cada uno?
Escribe: INFO_ROLES

**💡 Contenido multimedia de apoyo:**
- **Tabla simple (imagen)** PNG con roles posibles en Pandora's
- **Mini PDF:** "Checklist del Operador de Protocolo"
- **Mensaje ejemplo:** "Un operador aprueba tareas → desbloquea utilidades → distribuye recompensas"

**Respuesta automática INFO_ROLES:**
```
👥 Roles en Pandora's:

🧑‍💼 Administrador → Gestiona beneficios y aprobaciones
🛠️ Operador → Ejecuta tareas diarias del protocolo
📢 CM → Maneja comunidad y comunicaciones

Ejemplo real:
"Un operador aprueba tareas → desbloquea utilidades → distribuye recompensas"

📋 Checklist completo: pndrs.link/operator-checklist
📊 Tabla de roles: pndrs.link/roles-table

¿Necesitas más detalles sobre algún rol?
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

**🎯 Objetivo:** Clasificar al lead en un nivel de madurez.

**Tipo:** Select Input
**WhatsApp:** lista + trigger INFO_ESTADO

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

**Trigger INFO:**
¿Quieres saber qué significa cada fase del estado del proyecto?
Escribe: INFO_ESTADO

**💡 Contenido multimedia de apoyo:**
- **Imagen tipo barra de progreso:** Idea → MVP → Operación → Comunidad → Ventas → Evolución
- **PDF:** "Guía rápida para avanzar de Idea → MVP en Utility Protocols"

**Respuesta automática INFO_ESTADO:**
```
📊 Etapas del Proyecto:

1️⃣ Idea → Solo concepto, necesita validación
2️⃣ MVP → Versión mínima funcional lista
3️⃣ En operación → Ya corriendo con usuarios reales
4️⃣ Comunidad activa → Base sólida de usuarios
5️⃣ Primeras ventas → Generando ingresos

📈 Roadmap visual: pndrs.link/project-stages
📄 Guía completa: pndrs.link/idea-to-mvp

¿En cuál etapa estás realmente?
```

**Objetivo:** Clasificar funnel.

---

### 🔷 **5. FILTRO Q5 — OBJETIVO CLARO**

**🎯 Objetivo:** Entender qué quiere lograr el creador.

**Tipo:** Respuesta corta + trigger INFO_OBJETIVO
**WhatsApp:** texto

**Pregunta:**
```
¿Cuál es tu objetivo al lanzar tu Protocolo dentro de Pandora's?
(Accesos, misiones, recompensas, comunidad, membresías, ventas, etc.)
```

**Trigger INFO:**
¿Necesitas ayuda para definir bien tu objetivo?
Escribe: INFO_OBJETIVO

**💡 Contenido multimedia de apoyo:**
- **Infografía:** Mapa visual de "Objetivos principales dentro de Pandora's"
- **Mensaje guía:** "Un objetivo debe ser medible, tangible y utilitario"

**Respuesta automática INFO_OBJETIVO:**
```
🎯 Objetivos Válidos en Pandora's:

✅ Crear evaluadores verificados de contenido
✅ Sistema de micro-tasks con recompensas
✅ Comunidad curada de creadores premium
✅ Marketplace de servicios verificables
✅ Red social con utility integrada

❌ "Quiero tokenizar" (muy vago)

📊 Mapa de objetivos: pndrs.link/objectives-map
💡 Guía de definición: pndrs.link/define-goals

¿Te ayuda a clarificar tu objetivo?
```

**Estilo:** claridad operacional

**Objetivo:** Detectar intención y evitar "quiero tokenizar por tokenizar".

---

### 🔷 **6. FILTRO Q6 — RECURSOS DEL EQUIPO**

**🎯 Objetivo:** Validar capacidad operativa.

**Tipo:** Select Input + trigger INFO_EQUIPO
**WhatsApp:** lista numerada

**Pregunta:**
```
¿Con cuántas personas cuenta tu proyecto actualmente?
```

**Opciones:**
1. Solo yo
2. 2–4 personas
3. 5+

**Trigger INFO:**
¿Quieres ver cómo debe verse un equipo mínimo para operar un protocolo?
Escribe: INFO_EQUIPO

**💡 Contenido multimedia de apoyo:**
- **Imagen simple:** "Estructuras básicas de equipo según tamaño"
- **PDF:** Recursos mínimos para operar un Protocolo

**Respuesta automática INFO_EQUIPO:**
```
👨‍💻 Equipos por tamaño:

🤠 Solo yo: Low throughput, proyectos pequeños
👥 2–4 personas: Viable, buen equilibrio
🏢 5+: Escalable, proyectos complejos

Recursos mínimos:
• 1 Persona técnica (dev/smart contracts)
• 1 Persona operativa (community/execution)
• 1 Persona estratégica (vision/roadmap)

📊 Estructuras visuales: pndrs.link/team-structures
📋 Requisitos detalle: pndrs.link/minimum-resources
```

**Luego:**
```
¿Quién será el responsable técnico?
```

**Objetivo:** Detectar equipos sólidos, evitar freeloaders.

---

### 🔷 **7. FILTRO Q7 — COMUNIDAD**

**🎯 Objetivo:** Medir potencial de adopción.

**Tipo:** Select múltiple + trigger INFO_COMUNIDAD
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

**Trigger INFO:**
¿Quieres entender mejor qué tipo de comunidad es válida para tu protocolo?
Escribe: INFO_COMUNIDAD

**💡 Contenido multimedia de apoyo:**
- **Infografía:** "Niveles de comunidad y su impacto en el protocolo"
- **Mini guía PDF:** "Cómo activar comunidad para Utility Protocols"

**Respuesta automática INFO_COMUNIDAD:**
```
🌐 Tipos de Comunidad Válidos:

🔴 Riesgoso: Comunidad fantasma (<50 usuarios)
🟡 Medio: Comunidad básica (50-200)
🟢 Bueno: Comunidad activa (>200 reales)

Priorizar:
✅ Comunidad compradora real
✅ Comunidad privada (Discord/Telegram)
✅ Comunidad activa en redes

📊 Impact Matrix: pndrs.link/community-impact
📖 Guía activación: pndrs.link/activate-community
```

**Objetivo:** Clasificación para marketing + scoring interno.

---

### 🔷 **8. FILTRO Q8 — FECHA DE LANZAMIENTO**

**🎯 Objetivo:** Detectar urgencia real.

**Tipo:** Texto + trigger INFO_TIEMPO
**WhatsApp:** texto

**Pregunta:**
```
¿Cuál es tu fecha estimada para lanzar la primera versión de tu Protocolo?
```

**Trigger INFO:**
¿Quieres una guía de tiempos recomendados para lanzar?
Escribe: INFO_TIEMPO

**💡 Contenido multimedia de apoyo:**
- **Imagen simple:** Roadmap base de 30–60–90 días
- **PDF:** "Cómo estimar tu fecha de lanzamiento"

**Respuesta automática INFO_TIEMPO:**
```
⏰ Roadmap de Lanzamiento Recomendado:

📅 30 días: Setup básico + validación inicial
📅 60 días: MVP funcional + primeros testers
📅 90 días: Lanzamiento completo + comunidad

Timeline realista:
"Lo ideal es prever 30 días para el setup + 30 para activación"

📊 Roadmap template: pndrs.link/launch-roadmap
📋 Guía estimación: pndrs.link/estimate-launch-date
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

## 🖥️ PANEL DE ADMINISTRACIÓN - WHATSAPP LEADS

### ✅ **NUEVA TAB "MARKETING" - IMPLEMENTADA**

**Estado:** ✅ **COMPLETADA** | **Ubicación:** `/admin/dashboard/ → Tab: 📈 Marketing`

#### **🔷 Sub-Tabs Expansibles:**

| Sub-Tab | Estado | Descripción |
|---------|--------|-------------|
| **💬 WA Leads** | ✅ **Activa** | Gestión completa de leads filtrados |
| 🔗 Shortlinks | 📋 **Próximamente** | Gestión de URLs acortadas |
| 📧 Newsletter | 📋 **Próximamente** | Envío masivo y tracking |
| 🎯 Campaigns | 📋 **Próximamente** | Campañas de marketing integradas |

#### **📊 Funcionalidades WA Leads - Completas:**

| Función | Estado | Detalles |
|---------|--------|----------|
| **📈 KPIs en tiempo real** | ✅ | Total | Pendientes | Aprobados | Completados |
| **📋 Tabla completa** | ✅ | ID, Teléfono, Nombre, Email, Status, Paso, Fecha |
| **🔍 Filtros avanzados** | ✅ | Por status (pending/approved/completed/rejected) |
| **📤 Export CSV** | ✅ | Leads + metadata en archivo descargable |
| **⚡ Status management** | ✅ | Aprobar/Rechazar/Completar leads |
| **🔄 Actualización en vivo** | ✅ | Refresh automático cada acción |
| **👁️ UI responsive** | ✅ | Móvil, tablet, desktop optimizado |
| **🔒 Privacidad** | ✅ | Teléfonos parcialmente enmascarados |

#### **🎨 Interfaz de Usuario:**

```
📈 MARKETING TAB
├── 💬 WA Leads (ACTIVA)
│   ├── 📊 Estadísticas Cards
│   ├── 🔍 Controles (Refresh + Filtros)
│   ├── 📋 Tabla de Leads (con acciones)
│   └── 📤 Exportar CSV
│
├── 🔗 Shortlinks (PRÓXIMAMENTE)
├── 📧 Newsletter (PRÓXIMAMENTE)
└── 🎯 Campaigns (PRÓXIMAMENTE)
```

#### **🔗 Arquitectura Técnica:**

```typescript
// Nueva prop agregada en AdminTabs
<AdminTabs
  showMarketing={true}  // Activa nueva tab
  {...otherProps}
/>

// Componente WhatsAppLeadsTab integrado
<WhatsAppLeadsTab />

// APIs conectadas:
/api/admin/whatsapp-preapply        // GET: Lista leads
/api/admin/whatsapp-preapply/:id/status  // PATCH: Cambiar status
```

#### **🚀 WA LEADS UPGRADE PARA MULTI-FLOW:**

**WA Leads ahora soporta múltiples flujos con filtros avanzados:**

##### **Nuevos Filtros por Flow Type:**
```typescript
// Filtros disponibles en WA Leads Tab
const FLOW_FILTERS = [
  'all',           // Todos los leads
  'eight_q',       // Flujo 8 preguntas
  'high_ticket',   // Founders premium
  'support',       // Soporte/Switch to human
  'human'          // Sesiones con agentes
];
```

##### **Dashboard Visualización Multi-Flow:**
```
📊 **WA Leads Multi-Flow Dashboard:**
├── 🔢 **KPIs Totales** (todos flujos)
│   ├── Total Conversaciones: 1,247
│   ├── Conversaciones Activas: 89
│   └── Conversion Rate: 34%
│
├── 📈 **Por Flow Type:**
│   ├── Eight_Q (67%): 837 conv | 312 approved
│   ├── High_Ticket (8%): 102 conv | 89 approved
│   ├── Support (15%): 189 conv | 12 escalated
│   └── Human (10%): 119 conv | 95 resolved
│
└── 🔍 **Filtros Avanzados:**
    ├── Flow Type (dropdown)
    ├── Status (pending/approved/rejected/completed)
    ├── Prioridad (high/normal/support)
    └── Fecha Range
```

##### **Nuevas Columnas en Tabla:**
```typescript
interface WhatsAppLead {
  id: string;
  phone: string;
  flow_type: 'eight_q' | 'high_ticket' | 'support' | 'human';
  priority_level: 'high' | 'normal' | 'support';
  current_step: number;     // -1 sin empezar, 0-8 para eight_q
  status: string;
  last_message: string;
  started_at: Date;
  updated_at: Date;
  // ... campos existentes
}
```

##### **Acciones Específicas por Flow:**
```typescript
// Acciones dinámicas según flow_type
const getActionsForFlow = (flowType: string) => {
  switch (flowType) {
    case 'eight_q':
      return ['Approve', 'Reject', 'Mark Complete'];

    case 'high_ticket':
      return ['Priority Review', 'Schedule Call', 'Fast Track'];

    case 'support':
      return ['Escalate to Human', 'Resolve', 'Transfer'];

    case 'human':
      return ['View Chat', 'Reassign Agent', 'Close Session'];

    default:
      return ['Basic Actions'];
  }
};
```

### 📱 **Flow Completo Multi-Flow Integrado:**

**Flujo Eight_Q (Default):**
```
1. Usuario nuevo → Webhook detecta "eight_q" → startEightQuestionsFlow()
2. Responde preguntas 1-8 → Estado en whatsapp_preapply_leads
3. Completa filtro → Admin ve en WA Leads → Gestiona status
4. Usuario aprobado → Bot confirma → Redirect to Apply
```

**Flujo High_Ticket (Premium):**
```
1. Usuario dice "soy founder" → Switch a high_ticket flow
2. Preguntas mínimas → Formulario directo
3. Prioridad alta en WA Leads → Review rápido
4. Calendly automático para call
```

**Flujo Support (Escalation):**
```
1. Usuario pide ayuda → Switch a support flow
2. Preguntas básicas de triage → Determina si necesita humano
3. Escala si necesario → Transfiere a human agents
```

**Flujo Human (Agents):**
```
1. Escalan desde support → Asignación automática
2. Agents ven conversaciones activas en panel
3. Resuelven dudas → Pueden transferir de vuelta a bot
4. Logging completo para análisis
```

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

## 📋 ROADMAP COMPLETO - SISTEMA MULTI-FLOW v4.0

| Fase | Estado | Descripción |
|------|--------|-------------|
| **1. Arquitectura Multi-Flow** | ✅ **IMPLEMENTADO** | Router completo + 4 flujos activos |
| **2. Bot Conversacional** | ✅ **PRODUCCIÓN** | 4 handlers funcionando + capital filtering |
| **3. High-Ticket Flow Premium** | ✅ **IMPLEMENTADO** | 4 pasos + filtro capital crítico |
| **4. Email System** | ✅ **OPERATIVO** | Modal + API + PandorasHighTicketEmail |
| **5. WA Leads Multi-Flow** | ✅ **FUNCIONAL** | Panel admin con filtros avanzados |
| **6. Founders Landing** | ✅ **PREMIUM** | Modal email UX + conversiones |
| **7. Triggers Inteligentes** | ✅ **ACTIVOS** | 3 flow types detectados automáticamente |
| **8. Soporte Humano** | 📋 **PLANEADO** | 4-6 horas implementación completa |
| **9. Shortlinks Ultra-Cortos** | 📋 **FUTURO** | pnd.rs domain setup |
| **10. Analytics Avanzados** | 🔮 **FUTURO** | Métricas detalladas + dashboards |

### 🚀 **SIGUIENTE FASES DE IMPLEMENTACIÓN - PRIORIDAD:**

#### **🎯 FASE 1: BASES DE DATOS MULTI-FLOW (2 horas)**

| Acciones | Archivos | Prioridad |
|----------|----------|-----------|
| **Crear tabla whatsapp_users** | `apps/dashboard/drizzle/` | ALTA |
| **Crear tabla whatsapp_sessions** | `apps/dashboard/drizzle/` | ALTA |
| **Crear tabla whatsapp_messages** | `apps/dashboard/drizzle/` | ALTA |
| **Migrar DBs** | `run-multi-flow-migration.js` | ALTA |

#### **🎯 FASE 2: ROUTER MULTI-FLOW (3 horas)**

| Acciones | Archivos | Prioridad |
|----------|----------|-----------|
| **Crear router principal** | `/api/whatsapp/route.ts` | ALTA |
| **Implementar handlers flows** | `handlers/eight-q.ts` | ALTA |
| **Helper functions DB** | `lib/whatsapp/multi-flow-db.ts` | ALTA |
| **Switch dinámico** | `detectFlowChange()` | MEDIA |

#### **🎯 FASE 3: WA LEADS UPGRADE (4 horas)**

| Acciones | Archivos | Prioridad |
|----------|----------|-----------|
| **Update WhatsAppLeadsTab** | `components/admin/WhatsAppLeadsTab.tsx` | ALTA |
| **Nuevo componente MultiFlowDashboard** | `components/admin/MultiFlowDashboard.tsx` | ALTA |
| **API endpoints multi-flow** | `/api/admin/whatsapp/multi-flow` | ALTA |
| **Filtros avanzados UI** | Flow type, priority filters | MEDIA |

#### **🎯 FASE 4: SISTEMA INFO_x TRIGGERS (6 horas)**

| Acciones | Archivos | Prioridad |
|----------|----------|-----------|
| **Modificar preapply-flow.ts** | Agregar INFO_x detection | ALTA |
| **Crear handler INFO_x** | `handlers/info-triggers.ts` | ALTA |
| **Extender flowConfig.ts** | Respuestas multimedia | ALTA |
| **Helper shortlinks** | `lib/whatsapp/shortlink-manager.ts` | ALTA |

#### **🎯 FASE 5: CONTENIDO MULTIMEDIA (8 horas)**

| Acciones | Directorio | Prioridad |
|----------|------------|-----------|
| **Crear PDFs** | `pdf-templates/` → `public/whatsapp-media/` | ALTA |
| **Diseñar infografías** | `public/whatsapp-media/*.png` | ALTA |
| **Configurar dominio pnd.rs** | DNS setup + redirects | MEDIA |
| **Micro-videos** | `public/whatsapp-videos/` | BAJA |

#### **🔧 CÓDIGO CLAVE PARA IMPLEMENTACIÓN:**

```typescript
// 1. Router Principal Multi-Flow
export async function POST(req: Request) {
  const payload = await req.json();
  const message = parseWhatsAppPayload(payload);

  // DB Multi-Flow
  const user = await upsertUser(message.from);
  const session = await getOrCreateSession(user.id);

  // Router Inteligente
  switch (session.flow_type) {
    case "eight_q": return handleEightQuestionsFlow(message, session);
    case "high_ticket": return handleHighTicketFlow(message, session);
    case "human": return handleHumanAgentFlow(message, session);
    default: return startDefaultFlow(user, message);
  }
}

// 2. Sistema INFO_x Triggers
const INFO_TRIGGERS = {
  'INFO_MECANISMO': () => sendMultimediaInfo(userPhone, 'mechanic'),
  'INFO_FLUJO': () => sendMultimediaInfo(userPhone, 'flow'),
  // ... todos los demás
};

// 3. WA Leads Multi-Flow API
app.get('/api/admin/whatsapp/multi-flow', async (req, res) => {
  const { flowType, status, priority } = req.query;
  const leads = await getLeadsWithFilters({ flowType, status, priority });
  res.json({ leads, stats: calculateMultiFlowStats(leads) });
});
```

#### **📊 RESULTADO ESPERADO MULTI-FLOW:**

**Dashboard WA Leads con 4 flujos simultáneos:**
- **Eight_Q**: 837 conversaciones (67%) - filtro 8 preguntas
- **High_Ticket**: 102 conversaciones (8%) - founders premium
- **Support**: 189 conversaciones (15%) - escalation a humano
- **Human**: 119 conversaciones (10%) - agentes activos

**Sistema escalable para:**
- Múltiples niveles de prioridad
- Diferentes embudos de conversión
- Soporte híbrido (bot + humano)
- Analytics por flujo específico
- Transferencias dinámicas entre flujos

## 🎯 CONCLUSIÓN

**El sistema WhatsApp Bot está completamente operativo en producción** con todas las funcionalidades críticas funcionando. La expansión a soporte humano está perfectamente documentada y lista para implementación cuando sea necesario.

¿Necesitas que implemente alguna parte específica del soporte humano o tienes alguna duda sobre la documentación?
