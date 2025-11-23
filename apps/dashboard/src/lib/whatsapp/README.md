# WhatsApp Module - Sistema Simplificado

## 📁 Estructura del Módulo

```
src/lib/whatsapp/
├── core/              # Lógica principal del sistema
│   ├── index.ts       # Exports principales
│   └── simpleRouter.ts # Router simplificado (5 flujos independientes)
├── config/            # Configuraciones
│   ├── index.ts       # Exports de configuración
│   └── landingConfig.ts # Configuración específica por landing
├── utils/             # Utilidades
│   ├── index.ts       # Exports de utilidades
│   └── client.ts      # Cliente WhatsApp API
├── legacy-backup/     # Archivos del sistema anterior (deprecated)
├── index.ts           # Exports principales del módulo
└── README.md          # Esta documentación
```

## 🎯 Flujos Independientes

El sistema implementa 5 flujos completamente independientes:

### 1. **Eight Questions** (`eight_q`)
- **Landing:** `/start`
- **Archivo:** `core/simpleRouter.ts` - función `handleEightQFlow`
- **Config:** `config/landingConfig.ts` - key `'start'`

### 2. **Utility Protocol** (`utility`) 
- **Landing:** `/utility-protocol`
- **Archivo:** `core/simpleRouter.ts` - función `handleUtilityFlow`
- **Config:** `config/landingConfig.ts` - key `'utility-protocol'`

### 3. **High Ticket Founders** (`high_ticket`)
- **Landing:** `/founders`
- **Archivo:** `core/simpleRouter.ts` - función `handleHighTicketFlow`
- **Config:** `config/landingConfig.ts` - key `'founders'`

### 4. **Support** (`support`)
- **Propósito:** Soporte técnico
- **Archivo:** `core/simpleRouter.ts` - función `handleSupportFlow`
- **Config:** `config/landingConfig.ts` - key `'support'`

### 5. **Human** (`human`)
- **Propósito:** Escalado a humano
- **Archivo:** `core/simpleRouter.ts` - función `handleHumanFlow`
- **Config:** `config/landingConfig.ts` - key `'human'`

## 🚀 Uso

### En Componentes
```typescript
import { getWhatsAppUrl } from '@/lib/whatsapp/config';

const whatsappUrl = getWhatsAppUrl('start'); // Para landing /start
```

### En APIs
```typescript
import { routeSimpleMessage } from '@/lib/whatsapp/core';

const result = await routeSimpleMessage(payload);
```

### Enviar Mensajes
```typescript
import { sendWhatsAppMessage } from '@/lib/whatsapp/utils';

await sendWhatsAppMessage(phone, message);
```

## 🔧 Configuración

### Variables de Entorno Requeridas
```env
WHATSAPP_ACCESS_TOKEN=tu_token
WHATSAPP_PHONE_NUMBER_ID=tu_phone_id
WHATSAPP_BUSINESS_ACCOUNT_ID=tu_business_id
WHATSAPP_VERIFY_TOKEN=tu_verify_token
NEXT_PUBLIC_WHATSAPP_BUSINESS_PHONE=5213221374392
```

### Configuración por Landing
Editar `config/landingConfig.ts` para modificar:
- Mensajes de inicio por flujo
- URLs de WhatsApp
- Mapeo de landing pages
- Restricciones por flujo

## 🗄️ Base de Datos

### Tablas Principales
- `whatsapp_users` - Usuarios de WhatsApp
- `whatsapp_sessions` - Sesiones activas por flujo
- `whatsapp_messages` - Historial de mensajes

### API de Admin
```
GET /api/admin/whatsapp/multi-flow
```

Retorna estadísticas por flujo y lista de conversaciones activas.

## 📡 Webhooks

### Webhook Principal
```
POST /api/whatsapp/simple
```

Webhook simplificado que procesa todos los flujos independientes.

### Verificación
```
GET /api/whatsapp/simple
```

Endpoint de estado y verificación del webhook.

## ⚡ Reglas del Sistema

### ✅ Reglas Implementadas
1. **Un número = Un flujo** - No switching entre flujos
2. **Asignación inicial** - Primer mensaje define el flujo
3. **Persistencia** - El flujo se mantiene hasta completar
4. **Idempotencia** - No se procesan mensajes duplicados

### ⚠️ Restricciones
1. No se puede cambiar de flujo una vez asignado
2. Usuarios del sistema anterior deben reiniciar conversación
3. Solo una sesión activa por usuario

## 🔄 Migración desde Sistema Anterior

Los siguientes archivos del sistema anterior están en `legacy-backup/`:
- `router.ts` - Sistema complejo con switching
- `flow.ts` - Handler legacy  
- `db.ts` - Funciones legacy
- `config.ts` - Configuración anterior
- `flowConfig.ts` - Configuración legacy
- `api/whatsapp/route.ts` - Webhook anterior

**Para revertir la migración:**
```bash
cp legacy-backup/* .
```

## 🧪 Testing

### Probar Flujos
1. **Start (Eight Questions)**: `https://tu-dominio.com/dashboard/start`
2. **Utility Protocol**: `https://tu-dominio.com/dashboard/utility-protocol`  
3. **Founders**: `https://tu-dominio.com/dashboard/founders`

### Verificar API
```bash
curl https://tu-dominio.com/api/admin/whatsapp/multi-flow
```

### Logs del Sistema
Revisar logs en:
- Webhook: `/api/whatsapp/simple`
- Admin API: `/api/admin/whatsapp/multi-flow`

## 🆘 Solución de Problemas

### Error: "Usuario ya tiene flujo asignado"
- **Causa:** Usuario del sistema anterior
- **Solución:** Usuario debe enviar mensaje nuevo

### Error: "Módulo no encontrado"
- **Causa:** Imports incorrectos
- **Solución:** Usar `@/lib/whatsapp/core` o `@/lib/whatsapp/config`

### Error: "Configuración no encontrada"
- **Causa:** Variables de entorno faltantes
- **Solución:** Verificar todas las variables WhatsApp en `.env`

---

**Sistema WhatsApp v4.0 - Flujos Independientes** 🎯