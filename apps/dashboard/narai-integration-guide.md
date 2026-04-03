# Guía de Integración Narai V5 ⚡ (V5.1 - Session & Payments)

Esta guía detalla cómo integrar el ecosistema de **Pandoras Growth OS** en la landing page de Narai, incluyendo la gestión de sesiones (Login/Logout) y las opciones de pago híbrido.

---

## 1. Instalación del SDK (Obligatorio)
Añade el script base antes del cierre del `</body>`. Este script inyecta las funciones globales `window.PandorasGrowth`.

```html
<script 
    src="https://dash.pandoras.finance/api/widget/v1.js" 
    data-project-id="narai" 
    data-api-key="TU_API_KEY_AQUI" 
    data-theme="dark"
    defer
></script>
```

---

## 2. Gestión de Sesión (Login / Logout)
Para que los usuarios puedan conectar su identidad (Email, Google o Web3) directamente en la landing, tienes dos opciones:

### Opción A: Botón de Login Pre-construido (Zonas de UI)
Si quieres un botón que gestione todo el estado automáticamente, añade este contenedor donde quieras que aparezca el botón de conexión:

```html
<!-- El SDK inyectará el botón de Conectar/Perfil aquí automáticamente -->
<div id="pd-connect-button"></div>
```

### Opción B: Control Programático (JS)
Si usas tus propios botones de la interfaz, puedes disparar las funciones del SDK:

```javascript
// Disparar Login
const login = () => window.PandorasGrowth.login();

// Disparar Logout
const logout = () => window.PandorasGrowth.logout();

// Escuchar cambios de sesión (ej. para ocultar/mostrar elementos)
window.addEventListener('pd-session-changed', (event) => {
    const { isLoggedIn, userAddress } = event.detail;
    console.log(`Usuario ${isLoggedIn ? 'Conectado: ' + userAddress : 'Desconectado'}`);
});
```

---

## 3. Opciones de Compra y Métodos de Pago
El sistema V5 de Narai es **Multi-Método**. El modal detectará automáticamente la mejor opción para el usuario.

### Atributos de Gatillo (Trigger)
Usa estos atributos en cualquier botón para abrir el checkout de un tier específico:

```html
<!-- El 'tier' debe coincidir exactamente con el NOMBRE de la fase en el Dashboard (en minúsculas) -->
<button 
    data-pd-checkout-slug="narai" 
    data-pd-checkout-tier="fundador"
>
    Comprar Fundador
</button>
```

### Métodos de Pago Soportados (Automáticos en el Modal):
1. **Cripto (Web3 Native):**
   - **RED:** Base Mainnet (8453).
   - **MONEDA:** USDC (Preferido) o ETH.
   - *Nota: El modal gestiona el cambio de red y la aprobación de USDC automáticamente.*

2. **Tradicional (Web2 Bridge):**
   - **TARJETA:** Visa, Mastercard, AMEX (vía Stripe).
   - **TRANSFERENCIA:** Wire Transfer / SPEI (vía Dashboard Finance).
   - *Nota: El usuario verá un botón de "Pagar con Tarjeta" si no tiene fondos en su wallet.*

---

## 4. Captación de Leads (Eventos de Valor)
Si el usuario se registra en tu formulario de Waitlist, notifícalo a Pandora para marcarlo como lead calificado:

```javascript
window.PandorasGrowth.registerLead({
    email: 'cliente@ejemplo.com',
    name: 'Juan Perez',
    intent: 'whitelist',
    metadata: {
        source: 'landing_hero',
        tags: ['EARLY_BIRD']
    }
});
```

---

> [!IMPORTANT]
> **API KEY:** Sustituye `TU_API_KEY_AQUI` por la llave que encuentras en tu Developer Hub (Admin Dashboard).

> [!TIP]
> **Estilos Personalizados:** El widget hereda el `data-theme="dark"` o `"light"`. Si necesitas personalización profunda de colores, contacta al soporte técnico de Pandoras.
