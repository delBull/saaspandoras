# Prueba de fondos (POF) integrada en la firma — por deal

Fecha: 23 nov 2026 · Estado: **implementado, sin desplegar**.

## 1. Decisión

La POF deja de ser global: **se activa al crear el deal**, sólo para los tratos que
la requieren (compra de activo, acceso a OM). Si un deal no la activa:

- no aparece en la sala,
- no se exige para entregar el OM (basta el NDA firmado).

## 2. Cómo se activa

Al crear el Deal Room: casilla **"Pedir prueba de fondos (POF)"** en la consola
(`/nexus/rooms`). Se guarda en `nexus_deal_rooms.pof_enabled` (default `false`).

El deal de Village quedó con `pof_enabled = true` (migración 0115).

## 3. Flujo en la sala (una sola acción)

```
Tarjeta del NDA
 ├─ campos POF (entidad, fondo, rango, notas, archivo)  ← opcionales
 ├─ casilla "he leído y acepto"
 └─ [ FIRMAR NDA ON-CHAIN ]
        ├─ 1. firma EIP-191 → /nda (registra aceptación)
        └─ 2. si hay archivo adjunto → /pof (declaración + carta)
```

- La firma **nunca** depende de la POF: si no hay archivo, el NDA se firma igual.
- Si el envío de la POF falla después de firmar, se avisa: "El NDA quedó firmado.
  La prueba de fondos no se pudo enviar: puedes reintentarla abajo."
- Después de firmar, la tarjeta de POF independiente sigue visible para enviarla
  o reintentarla (si el deal la activó).

## 4. Efecto en la entrega del OM

`/api/public/deals/[id]/om` ahora exige:

- NDA firmado (siempre).
- POF **verificada** sólo si `room.pofEnabled` es `true`.

Así un deal sin POF no queda bloqueado por un requisito que no aplica.

## 5. Evidencia

```
Migración 0115 aplicada en la base operativa
  → nexus_deal_rooms.pof_enabled boolean NOT NULL DEFAULT false
  → PDR-VILLAGE: pof_enabled = t, nda_enabled = t

tsc --noEmit: 0 errores nuevos
DEAL_OPS_EMAIL configurado en Vercel (producción) = marco.munoz9@gmail.com
  (el valor requiere un redeploy para tomar efecto)
```

**No verificado en producción:** el envío de la POF en el mismo gesto de la firma
(requiere una firma real con archivo). Se comprueba tras el deploy.
