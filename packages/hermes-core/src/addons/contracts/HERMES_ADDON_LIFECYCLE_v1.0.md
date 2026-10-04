# HERMES_ADDON_LIFECYCLE_v1.0

**Status:** `FROZEN`

## 1. Purpose
Definir el ciclo de vida completo de un Add-On desde su descubrimiento hasta su retiro.

---

## 2. Definition States
```text
AVAILABLE → INSTALLING → CONFIGURING → PENDING_APPROVAL → ACTIVE → PAUSED → DEPRECATED → RETIRED
```

---

## 3. AVAILABLE
El Add-On existe en el Registry. Todavía no pertenece al Tenant. No tiene capacidades activas.

---

## 4. INSTALLING
El Tenant solicita instalación. Hermes verifica compatibilidad, versión, dependencias, canales y requerimientos. Se crea un `AddOnInstallation`.

---

## 5. CONFIGURING
El Tenant proporciona la información requerida (ej. program name, referral rules). La configuración incompleta impide pasar a `ACTIVE`.

---

## 6. PENDING_APPROVAL
Toda configuración con implicaciones comerciales, regulatorias, financieras o de acceso requiere aprobación humana. No puede ejecutar acciones restringidas.

---

## 7. ACTIVE
Un Add-On solamente alcanza ACTIVE cuando:
1. Instalación válida
2. Configuración completa
3. Dependencias satisfechas
4. Governance satisfecho
5. Aprobaciones requeridas completadas

---

## 8. PAUSED
Permite detener temporalmente el Add-On sin perder configuración, versión, conocimiento, historial o audit trail.

---

## 9. DEPRECATED
Una versión nueva sustituye a la anterior. La versión antigua permanece disponible para auditoría.

---

## 10. RETIRED
El Add-On deja de estar operativo. Nunca debe eliminarse históricamente (se conserva installation record, version, configuration, audit, events).

---

## 11. State Transition Rules
- `AVAILABLE → INSTALLING`
- `INSTALLING → CONFIGURING`
- `CONFIGURING → PENDING_APPROVAL`
- `CONFIGURING → ACTIVE` (solo si no hay aprobación requerida)
- `PENDING_APPROVAL → ACTIVE`
- `ACTIVE ↔ PAUSED`
- `ACTIVE → DEPRECATED → RETIRED`

No se permite `RETIRED → ACTIVE` ni `PENDING_APPROVAL → ACTIVE` sin aprobación.

---

## 12. Versioning
Cada instalación debe identificar `addonId`, `addonVersion`, `installedAt`.
Las actualizaciones requieren `UPGRADE REQUEST → COMPATIBILITY → MIGRATION → APPROVAL → NEW VERSION ACTIVE`.

---

## 13. Audit Events
Todos los eventos (`ADDON_INSTALLED`, `ADDON_ACTIVATED`, `ADDON_APPROVED`, etc.) deben incluir:
`organizationId`, `addonId`, `version`, `actorId`, `timestamp`, `correlationId`, `previousState`, `newState`.

---

## 14. Failure Rule
Si falla una operación de instalación/configuración: `NO PARTIAL ACTIVATION`. El Tenant permanece en el último estado seguro.

---

## 15. Rollback
Un upgrade fallido vuelve a la versión previa **solo mediante una transición gobernada**, nunca silenciosa.
