# Guía de Integración para Narai V4 ⚡

Para activar el **Growth OS** y los **Pagos en Popup** en la landing de Narai, sigue estos pasos:

## 1. Instalación del Script (SDK)
Añade este script al final del `<body>` de tu sitio. Asegúrate de usar tu API Key real de Staging/Prod.

```html
<script 
    src="https://staging.dash.pandoras.finance/api/widget/v1.js" 
    data-project-id="narai" 
    data-api-key="pk_grow_live_..."
    defer
></script>
```

---

## 2. Captación de Leads (Waitlist VIP)
Si quieres que un usuario sea marcado como de "Alta Intensidad" (ej. compró una unidad completa), usa este snippet en tu formulario de registro actual:

```javascript
// Disparar cuando el usuario envíe su formulario en Narai
window.PandorasGrowth.registerLead({
    email: 'usuario@correo.com',
    name: 'Nombre del Cliente',
    phoneNumber: '+521234567890',
    intent: 'whitelist',
    metadata: {
        tags: ['FULL_UNIT'] // <--- Esto activa el bypass VIP en Pandora
    }
});
```

---

## 3. Botones de Pago (Popup Checkout)
Para los 3 tiers de Narai, simplemente usa estos atributos en tus botones de compra actuales. El widget de Pandora detectará el clic automáticamente y abrirá la ventana emergente segura.

### Fase: Fundador
```html
<button 
    data-pd-checkout-slug="narai" 
    data-pd-checkout-tier="fundador"
>
    Comprar Fundador
</button>
```

### Fase: Estratégico
```html
<button 
    data-pd-checkout-slug="narai" 
    data-pd-checkout-tier="estrategico"
>
    Comprar Estratégico
</button>
```

### Fase: Geeral
```html
<button 
    data-pd-checkout-slug="narai" 
    data-pd-checkout-tier="geeral"
>
    Comprar Geeral
</button>
```

---

## 4. Verificación de Acceso (Handshake)
Cuando el usuario regrese o abra la página de pago, Pandora ejecutará automáticamente un "Handshake" invisible que asocia su wallet con el acceso al protocolo de Narai. No necesitas código extra para esto en el frontend.

---

> [!TIP]
> **Popups Bloqueados:** Si el navegador del usuario bloquea la ventana emergente, el script redirigirá automáticamente a la página de pago en la misma pestaña como respaldo (fallback) para asegurar la venta.
