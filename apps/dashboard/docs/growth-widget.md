# Growth OS Widget Integration Guide (v2.0)

El widget de Growth OS es el motor de captura y progresión para tus protocolos. La versión 2.0 utiliza una arquitectura híbrida que se sincroniza automáticamente con el **Progression Economy** de Pandoras.

## 🚀 Instalación Rápida

Copia este snippet en el `<body>` de tu sitio web:

```html
<script
  src="https://growthos.io/api/v1/widget/v1.js"
  data-project="TU_PROYECTO_SLUG"
  data-key="TU_PUBLIC_API_KEY"
  data-version="2.0"
></script>
```

## 🛠 Atributos de Configuración

| Atributo | Requerido | Descripción |
| :--- | :---: | :--- |
| `data-project` | ✅ | El slug de tu proyecto en Pandoras. |
| `data-key` | ✅ | Tu Public API Key (empieza con `pk_`). |
| `data-version` | ✅ | Debe ser `2.0` para habilitar la economía de progresión. |
| `data-theme` | ❌ | `dark` (default) o `light`. |

## 📡 Public API Endpoints

Puedes consumir estos datos directamente si prefieres construir tu propia interfaz:

### 1. Configuración del Proyecto
`GET /api/public/project/:slug/config`
Devuelve las fases de venta, los niveles (tiers) y los beneficios configurados.
**Header:** `x-api-key: TU_PUBLIC_KEY`

### 2. Estado en Tiempo Real
`GET /api/public/project/:slug/state?wallet=0x...`
Devuelve el suministro actual de artefactos y, si se proporciona una wallet, el nivel actual del usuario y su progreso hacia el siguiente.

## 📦 Estructura de Progresión (Real-time State)

La API de estado devuelve un objeto `progression` detallado:

```json
{
  "userArtifactCount": 15,
  "currentTier": {
    "name": "Gold Member",
    "perks": ["Acceso a DAO", "Prioridad en Preventa"]
  },
  "nextTier": {
    "name": "Platinum Executive",
    "artifactCountThreshold": 20,
    "unlockDelta": 5
  },
  "progressPercentage": 75,
  "isUnlockMoment": false
}
```

## 🎭 Eventos del Widget

El widget emite eventos para que puedas reaccionar a la progresión del usuario:

- `growth_os:tier_unlocked`: Se dispara cuando el usuario alcanza un nuevo hito.
- `growth_os:purchase_success`: Confirmación de adquisición de artefactos.
- `growth_os:near_tier`: Se dispara cuando al usuario le faltan menos de 10 artefactos para el siguiente nivel.

---
© 2026 Growth OS by Pandoras. Optimizado para la economía descentralizada.
