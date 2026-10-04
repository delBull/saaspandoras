# ADR-012: Platform Experience Boundary

**Status:** Accepted
**Date:** 2026-08-17

## Contexto
El ecosistema Pandora's Platform ha madurado hasta el punto de requerir una separación explícita de sus superficies de experiencia. Actualmente, `dash.pandoras.finance` sirve a una multitud de usuarios, mezclando experiencias de "Project Operators" con "End Users". Esto rompe la semántica de la identidad y genera deuda técnica. A su vez, se requiere preparar la Telegram Mini App (TMA) y una futura Consumer Web App (`app.pandoras.finance`). 

Para poder escalar sin duplicar plataformas o backend, establecemos el principio fundamental de que **Pandora's tiene una sola plataforma compartida (Shared Platform), con una única identidad canónica, sobre la cual se exponen distintas interfaces de experiencia**.

## Decisión Arquitectónica

Pandora's tendrá dos superficies principales de experiencia y una TMA mobile-first prioritaria, consumiendo un único dominio, identidad y base de datos:

1. **`dash.pandoras.finance`**: Project / Organization Control Plane.
2. **`app.pandoras.finance`**: Consumer / User Experience.
3. **Telegram Mini App**: Primary Consumer Mobile Experience.

Ninguna de las tres experiencias podrá crear identidad, autorización, persistencia o lógica paralela.

## Invariantes Arquitectónicos (EXP)

*   **EXP-001** — Dash es Project/Organization Control Plane.
*   **EXP-002** — App es Consumer/User Experience.
*   **EXP-003** — TMA es Consumer Experience prioritario para mobile.
*   **EXP-004** — Una sola identidad canónica de usuario (`userId` como raíz de persona).
*   **EXP-005** — Thirdweb/Identity Layer es infraestructura compartida.
*   **EXP-006** — `organizationId` es autoridad empresarial; `userId` es identidad personal.
*   **EXP-007** — Telegram Identity ≠ Telegram Channel Identity.
*   **EXP-008** — Ningún cliente puede duplicar la lógica de autorización.
*   **EXP-009** — Hermes no puede conceder privilegios administrativos directamente (propone/recolecta, la plataforma valida y ejecuta).
*   **EXP-010** — Dash/App/TMA comparten dominio y contratos (SDKs), no necesariamente UI.
*   **EXP-011** — La separación de aplicaciones no implica separación de DB.
*   **EXP-012** — Ninguna migración de experiencia puede romper los clientes existentes.
*   **EXP-013** — Canonical User Identity: Una persona/entidad puede autenticarse mediante múltiples canales, pero todos deben resolver hacia una identidad canónica antes de acceder a recursos. Thirdweb, Telegram, etc., son proveedores de autenticación, no la identidad en sí misma.
*   **EXP-014** — Experience Independence: Ninguna experiencia de usuario (`dash`, `app`, `tma`) podrá convertirse en fuente de verdad de identidad, autorización o dominio. Las experiencias consumen contextos compartidos; no los redefinen.

## Consecuencias
Esta separación protege la arquitectura de Hermes y Journeys, quienes dependerán de distinguir claramente entre `userId`, `actorId` y `organizationId`. Se establece un "Boundary/Inventory Audit" (Fase 0) obligatorio antes de generar nuevo código en el monorepo.
