# Manual de Integración: Telegram Mini App ↔ Pandora's Core

Este documento es tu **"Cheat Sheet" (Hoja de Trucos)** para el equipo de desarrollo (o para ti mismo) al momento de ir al repositorio de la **Telegram Mini App**. Detalla exactamente cómo consumir las APIs de Pandora's Core que acabamos de blindar.

> **URL Base del API (Core)**: `https://core.saaspandoras.io` (o `http://localhost:3000` en local)

---

## 1. Autenticación Inicial (Login)

La primera acción que debe hacer la Mini App al abrirse es autenticar al usuario usando la data nativa de Telegram.

**Endpoint:** `POST /api/auth/telegram`
**Headers:** `Content-Type: application/json`

**Body:**
```json
{
  "initData": "user=%7B%22id%22%3A123456789..." // Esto viene de window.Telegram.WebApp.initData
}
```

**Respuesta Exitosa (200 OK):**
```json
{
  "success": true,
  "user": {
    "id": "uuid-del-usuario",
    "telegramId": "123456789",
    "walletAddress": null, // Puede ser null si aún no vincula wallet
    "status": "ACTIVE"
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." // JWT CÍTICO
}
```

**Acción en la App:** 
Guarda el `token` devuelto (en memoria o localStorage). **Este token debe ir en el header `Authorization: Bearer <token>` de todas las peticiones siguientes.**
Guarda también el `user.id` para consultar su progreso.

---

## 2. Consulta de Balances y Logros (El Dashboard)

Para pintar la UI de la Mini App (Nivel, Puntos Totales, Puntos Reclamables, Racha), debes consultar la API de Gamificación.

**Endpoint:** `GET /api/gamification/user/data/:userId` 
*(Reemplaza `:userId` con el `user.id` obtenido en el Login)*

**Headers:** Ninguno estricto (es consulta pública), pero recomendable mandar el `Authorization`.

**Respuesta Exitosa (200 OK):**
```json
{
  "success": true,
  "profile": {
    "totalPoints": 1500,
    "claimedPoints": 500,
    "currentLevel": 3,
    "levelProgress": 50,
    "pointsToNextLevel": 100,
    "currentStreak": 5
  },
  "achievements": [ ... ],
  "leaderboard": [ ... ]
}
```

**Lógica en la App:**
* **Puntos PBOX a mostrar:** Muestra `totalPoints`.
* **PBOX Reclamables ("Claimable"):** Calcula `profile.totalPoints - profile.claimedPoints`. Este es el valor que el botón "Claim" mostrará.

---

## 3. Vinculación de Wallet (Si es necesario)

Si el `user.walletAddress` viene como `null` y el usuario quiere hacer "Claim", **primero debe vincular su wallet**. Usa el SDK de Thirdweb en el frontend (React/Next) para conectar la wallet y firmar un mensaje, luego envíalo al backend.

**Endpoint:** `POST /api/auth/link-wallet`
**Headers:** 
- `Content-Type: application/json`
- `Authorization: Bearer <token>`

*(El payload exacto dependerá de tu implementación de SIWE/Thirdweb en el dashboard, típicamente requiere la `address` y una `signature` de un nonce previo).*

---

## 4. Reclamo de PBOX (Approach A / Alpha)

Aquí está la magia. Cuando el usuario hace clic en **"Claim Tokens"**, la App de Telegram simplemente llama a este endpoint. **Todo el procesamiento, gas y reglas de negocio ocurren en el Backend.**

**Endpoint:** `POST /api/pbox/claim`
**Headers:** 
- `Content-Type: application/json`
- `Authorization: Bearer <token>`

**Body:** Vacío `{}` (El backend ya sabe quién es por el token y cuánto puede reclamar según la base de datos).

**Respuesta Exitosa (200 OK):**
```json
{
  "success": true,
  "message": "Tokens claimed successfully",
  "claimedAmount": 1000,
  "txHash": "0x123abc456def..."
}
```

**Manejo de Errores (La App debe mostrarlos al usuario):**
* `400 Bad Request`: "Verification required: Please link a wallet to claim PBOX" (Falta vincular wallet).
* `400 Bad Request`: "No PBOX available to claim" o "You need at least 50 PBOX to claim".
* `429 Too Many Requests`: "Rate limit exceeded: You can only claim PBOX once every 24 hours".
* `500 Internal Error`: "Failed to mint tokens...". (Hubo un problema con la blockchain, la App debe decir "Intenta más tarde").

---

## 5. Reportar Acciones (Generar Puntos)

Cuando el usuario hace algo valioso directamente en la Telegram App (ej. invitar a un amigo, completar un mini-juego, hacer check-in diario), la App le "avisa" al Core usando este endpoint.

**Endpoint:** `POST /api/gamification/record`
**Headers:** 
- `Content-Type: application/json`
- `Authorization: Bearer <token>`

**Body:**
```json
{
  "type": "activity_completed", // o "daily_login", "referral_made", etc. según tus enums.
  "category": "special",
  "metadata": {
    "action": "played_rulette",
    "score": 100
  }
}
```

**Respuesta Exitosa:**
El Core evaluará los puntos que corresponden (si hay una regla activa para esa acción) y te devolverá si se ganaron puntos o se desbloqueó un logro para que tires confeti en la pantalla de Telegram 🎉.

---

## 🚀 Check-List Mental para irte al repo de Telegram:
1. [ ] Configurar llamadas `fetch` o `axios` apuntando a la URL del Core.
2. [ ] Crear un `AuthContext` o State Manager (Zustand/Redux) para guardar el `token`.
3. [ ] Construir la pantalla de Home que llame al `GET /gamification/user/data/` y pinte los puntos.
4. [ ] Un botón gigante de "Claim" que dispare al `POST /api/pbox/claim`.
5. [ ] Manejo de errores visuales atractivos (Toasts) si el Claim falla o si le faltan puntos.
6. [ ] (Opcional) Integrar Thirdweb `<ConnectButton />` dentro del WebApp si no vienen con wallet vinculada.
