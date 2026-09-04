# Roadmap: F11 - End-User Vertical (`app.pandoras.finance`)

> **Estado actual (Pre-requisito):** En F10 estabilizamos el *Experience Plane* y la infraestructura B2B (Tenant bots, Channel Gateway, TMA Auth). Actualmente estamos en F10.5 (Certificación manual E2E en Staging).
> **Siguiente parada (F11):** La migración y construcción del frontend de consumo público (Retail/B2C).

---

## F11: End-User Vertical (`app.pandoras.finance`)
Esta es la fase donde tomamos el control total del frontend de consumo público, asegurando que sea independiente del Dashboard B2B (`dash.pandoras.finance`). 

### F11.1 - Migración del Home "Legacy" y Arquitectura Base
- **Objetivo:** Tomar el código de aterrizaje (Landing) original que estaba en `dash.pandoras.finance` (antes de que lo convirtiéramos en un dashboard SaaS estricto) y migrarlo/restaurarlo como el nuevo home `/` de `app.pandoras.finance` (o en su defecto `Narai/apps/web`).
- **Consideraciones técnicas:**
  - Configurar las variables de entorno para que el frontend apunte a la API de `saaspandoras` correctamente.
  - Asegurar que Next.js App Router esté configurado limpiamente sin mezclar layouts del Dashboard.
  - Verificar que las directivas de CORS en `saaspandoras` permitan las peticiones del nuevo dominio de consumo.

### F11.2 - Re-styling y Modernización (Premium Aesthetics)
- **Objetivo:** Aplicar las directivas de diseño de grado masivo y de alto impacto visual (WOW effect). 
- **Implementación UI/UX:**
  - **Framer Motion & View Transitions:** Para micro-interacciones, animaciones de scroll y transiciones entre rutas sin recargas secas.
  - **Paleta y Temas:** Modo Oscuro (Dark mode) primario, gradientes suaves (Tailwind/CSS) y eliminación de colores genéricos planos.
  - **Materiales (Glassmorphism):** Uso extensivo de `backdrop-blur`, fondos semitransparentes y bordes refinados.
  - **Tipografía:** Fuentes modernas y limpias (e.g. Inter, Outfit) que brinden sensación institucional Web3 pero accesible.
- **Mandato:** Si el diseño se ve como un "MVP básico", la fase F11.2 falla. Debe ser un producto final *premium*.

### F11.3 - Integración del Portal de Oportunidades (Data Feed)
- **Objetivo:** Conectar el frontend `app.pandoras.finance` para consumir y renderizar los datos en vivo.
- **Flujo de Datos:**
  - Leer de `/api/public/project/[slug]/state` desde la base de datos maestra (`saaspandoras`).
  - Mostrar la disponibilidad de fraccionamiento, precios de los tokens, progreso de fases, holders y estado del treasury.
  - Implementar SWR (Stale-While-Revalidate) o React Server Components (RSC) para cargas instantáneas amigables para el SEO (meta tags dinámicos).

### F11.4 - Onboarding de Usuario Final B2C (Auth & Claims)
- **Objetivo:** Adaptar el flujo de "Smart Wallet Auth" para que un usuario final (inversor/retail), fuera del ecosistema de Telegram, pueda iniciar sesión y operar.
- **Implementación:**
  - Integrar Thirdweb SDK en el entorno Web estándar (no MiniApp).
  - Generación/Login por Social Login o EOA, que derive en la Smart Wallet y se asocie a la "Pandora's Key".
  - Dashboard de usuario final para visualizar sus **Claim Contracts notarizados**, recompensas (`userRewards`) y poder de gobernanza (`userVotingPower`).

---

## F12: Analytics & Expansion (Futuro a Mediano Plazo)

### F12.1 - WhatsApp Gateway
- **Objetivo:** Reutilizar el trabajo fundacional de `channel-inbound` para conectar un daemon de WhatsApp.
- **Arquitectura:** Usar exactamente el mismo contrato `ChannelContext` y `ExecutionRequest`. El core no debe enterarse de que es WhatsApp; solo cambia la capa "Dumb Transport" de Edge.

### F12.2 - Dashboard Insights (B2B)
- **Objetivo:** Expandir las métricas de los tenants dentro del portal de `dash.pandoras.finance`.
- **Implementación:** Reportes avanzados sobre el embudo de conversión, uso de créditos de inteligencia artificial, engagement de comandos interactivos y analítica Web3 (holders).

---

*Nota de Seguimiento:* Quedo a la espera del reporte de validación (F10.5) para inicializar los repositorios y ramas que correspondan a F11.1.
