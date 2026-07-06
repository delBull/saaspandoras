# Plan de Arquitectura: Pandoras Whitelabel Sites (Plantillas Dinámicas)

El objetivo es convertir el diseño premium y la lógica funcional de S'Narai en un **motor de plantillas escalable** para que cualquier nuevo proyecto en Pandoras Growth OS pueda tener su landing page, portal y documentos configurados automáticamente, sin necesidad de compilar un nuevo proyecto desde cero cada vez.

## ⚠️ Cambio de Paradigma: Multi-Tenant vs Deploy Individual

La estrategia tradicional es clonar el repositorio de S'Narai, cambiar las variables de entorno y hacer un nuevo deploy en Vercel por cada cliente. **Esto no es escalable**, consume mucho tiempo de compilación y hace imposible mantener actualizaciones globales (si arreglamos un bug, tendríamos que actualizar 50 repositorios).

### Propuesta: Arquitectura Multi-Tenant (Un solo código, múltiples dominios)
En lugar de proyectos separados, crearemos una única aplicación Next.js (`apps/sites`) que actuará como el motor gráfico universal. Usaremos la característica de **Middleware de Vercel/Next.js** para detectar qué dominio está visitando el usuario y renderizar el contenido adecuado.

## 1. El Flujo Multi-Tenant (Hostname Routing)

1. El usuario visita `https://proyectonuevo.com` o `https://proyecto.aztecaz.xyz`.
2. La petición llega a nuestra única app de Next.js (`apps/sites`).
3. El `middleware.ts` lee el dominio y lo busca en nuestra base de datos.
4. El middleware hace un "Rewrite" silencioso interno hacia la ruta `/[slug]`.
5. La página obtiene el JSON del proyecto desde el API de Pandoras (`/api/public/project/[slug]/state`).
6. La página renderiza el logo, los colores, las fases y los botones específicos de ese proyecto.

> [!TIP]
> **Tiempo de lanzamiento de un cliente: 0 Segundos.**
> En cuanto el administrador del proyecto guarda su configuración en el Dashboard de Pandoras y apunta su DNS, el sitio web ya está vivo. No hay tiempos de compilación ni despliegues adicionales.

## 2. Motor de Theming Dinámico (CSS Variables)

Para que el sitio deje de ser "verde y dorado" (S'Narai) y pueda ser "azul y plateado" para otro proyecto, inyectaremos variables CSS en tiempo de ejecución.

El API de estado (`extraConfig.branding`) devolverá:
- `primaryColor` (ej. `#032B25`)
- `accentColor` (ej. `#D4A853`)
- `logoUrl`
- `fontFamily` (Opción de Serif o Sans-Serif)

**En el código base (Tailwind):**
En lugar de usar `bg-narai-green-deep`, usaremos `bg-theme-primary` y `text-theme-accent`. Estas variables se definirán en el `<head>` del HTML basado en la respuesta del API.

## 3. Motor de Secciones Modulares (Block Engine)

Desglosaremos el landing de S'Narai en bloques independientes y configurables. El administrador del proyecto podrá elegir qué bloques encender desde su Dashboard.

1. **HeroBlock:** Título, *tagline*, imagen de fondo dinámica, y botón CTA inteligente (detecta si hay fase activa).
2. **InvestmentGridBlock:** Lee las fases dinámicas desde `/api/v1/projects/[slug]/analytics`. Se oculta automáticamente si no hay fases configuradas.
3. **PortalBlock:** El "Mi Portal" universal. Se conecta a la wallet y lee la base de datos centralizada de Pandoras.
4. **DocumentsBlock:** Botones hacia `/docs/[docType]` que leerán los *Documentos Nativos Dinámicos* configurados en el dashboard.
5. **MeetingBlock:** El botón y modal de "Agenda una sesión", vinculado automáticamente a `dash.pandoras.finance/events/[slug]/1`.

## 4. Estrategia de Carga (ISR - Incremental Static Regeneration)

Para garantizar que los sitios sean **extremadamente rápidos** (ligeros) y buenos para el SEO de cada cliente, usaremos la caché de Next.js (ISR).

- Cuando un usuario visita el sitio, recibe un HTML estático generado previamente.
- Next.js revalidará la información (precios, fases, etc.) cada 60 segundos en segundo plano.
- Esto significa que la base de datos de Pandoras no colapsará aunque el sitio de un cliente tenga un pico de 100,000 visitas.

## Open Questions para ti

> [!IMPORTANT]
> **Decisión de Arquitectura 1:**
> ¿Deseas que esta nueva app universal de "Sites" viva dentro del monorepo actual de `saaspandoras` (ej. `apps/sites`) para que comparta el código de base de datos y UI con el Dashboard, o prefieres que sea un repositorio completamente separado pero conectado al API? *(Se recomienda dentro del monorepo para facilidad de mantenimiento).*

> [!IMPORTANT]
> **Decisión de Arquitectura 2:**
> La funcionalidad de Múltiples Dominios requiere la API de Vercel (si usamos Vercel) para registrar dominios customizados programáticamente. ¿Todos los proyectos usarán subdominios propios como `[slug].pandoras.finance` / `[slug].aztecaz.xyz`, o permitiremos que conecten sus propios dominios `.com` externos?

## Resumen de la Propuesta
- **Stack:** Next.js 15 (App Router) alojado en Vercel.
- **Enfoque:** Multi-tenant estático con ISR.
- **Beneficio:** 1 solo código fuente que mantener. Lanzamiento instantáneo de clientes. 100% Whitelabel.
