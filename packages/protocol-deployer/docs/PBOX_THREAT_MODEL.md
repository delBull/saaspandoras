# PBOX Token Threat Model & Emergency Shutdown Design

Este documento detalla el diseño de seguridad, análisis de riesgos y mecanismos de emergencia implementados en el contrato `PBOXToken.sol` y su ecosistema asociado dentro de Pandora's Core.

## 1. Threat Model (Modelo de Amenazas)

### A. Compromiso del Servidor de Backend (MINTER_ROLE)
* **Riesgo**: Si un atacante compromete la wallet del backend (PboxService / Approach A) que tiene permisos de `MINTER_ROLE`.
* **Impacto On-Chain**: Podría intentar mintear tokens infinitos.
* **Mitigación Integrada**: `MAX_TOTAL_SUPPLY` = 100,000,000 PBOX (Hard Cap). El backend **nunca** podrá inflar el token por encima de este límite, mitigando una inflación descontrolada.
* **Reacción Inmediata**: Invocar `pause()` desde la wallet `ADMIN_ROLE` para detener todas las emisiones y conversiones de liquidez.

### B. Compromiso del Contrato Fábrica
* **Riesgo**: La Fábrica (que tiene `MINTER_ROLE` y `BURNER_ROLE`) es explotada.
* **Impacto On-Chain**: Acuñación maliciosa o quema no autorizada de fondos de terceros.
* **Mitigación**: `ADMIN_ROLE` puede llamar a `updateFactory(address(0))` para revocar instantáneamente los roles de la fábrica comprometida e invocar `pause()`.

### C. Fuga de Liquidez vía Conversión
* **Riesgo**: Un bug en el mecanismo de recompensa permite a un usuario acumular PBOX ilegítimo y tratar de drenar la tesorería convirtiéndolo.
* **Mitigación**:
  * `maxDailyConversion` limita cuánto valor puede extraer un usuario en 24 horas.
  * `minConversionAmount` evita spam de micro-transacciones.
  * Todo proceso está sujeto al botón de pánico global `pause()`.

### D. Compromiso del EIP-712 Signer (Approach B)
* **Riesgo**: Si el `claimSigner` del contrato `ClaimVerifier` es comprometido, un atacante podría generar firmas válidas.
* **Impacto On-Chain**: Minteo de tokens hasta llegar al límite de la economía o del usuario.
* **Mitigación**:
  * `updateSigner()` por parte del `ADMIN_ROLE` invalida inmediatamente cualquier firma comprometida pendiente.
  * Llamar `pause()` en el `ClaimVerifier`.

---

## 2. Emergency Shutdown Design (Diseño de Emergencias)

El sistema ahora cuenta con el módulo `Pausable` heredado de OpenZeppelin. 

### El "Botón de Pánico" Global (`pause()`)
Sólo el `ADMIN_ROLE` puede llamar a `pause()` en `PBOXToken.sol`.

**¿Qué bloquea?**
1. **Minteo**: Nadie, ni siquiera fábricas legítimas o firmas EIP-712 válidas (`ClaimVerifier`), podrá crear nuevos PBOX. Poner `whenNotPaused` detiene `mint(...)`.
2. **Conversión a Liquidez**: `convertToLiquidity(...)` falla inmediatamente. 

**¿Qué NO bloquea?**
* **Transferencias Peer-to-Peer**: Los usuarios pueden continuar moviendo libremente los tokens que ya poseen en PBOX. (A no ser que se requiera pausa total; en el diseño actual PBOX no asume pausa en `_transfer` para evitar disrupción de mercados secundarios o pools).

### Recuperación
1. **Identificar la fuga/intrusión**: Desplegar un parche en la API o revocar claves comprometidas (`updateFactory` o `revokeBurner`).
2. **Sanear la economía**: Usar el `BURNER_ROLE` si fuera estrictamente legal para recuperar fondos (aunque idealmente la inmutabilidad prioriza).
3. **Reanudar Operaciones**: `ADMIN_ROLE` invoca `unpause()`.

### Rescate de Activos
* En caso de recibir ETH/MNT accidentalmente en el contrato `PBOXToken` de manera irreversible, el `ADMIN_ROLE` tiene la capacidad de llamar a `withdrawETH(to)` para garantizar que no haya valor capturado en un contrato sin funcionalidad de routing de liquidez propia.
