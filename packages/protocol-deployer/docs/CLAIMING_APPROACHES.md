# PBOX Claiming Approaches

Este documento describe detalladamente los dos enfoques para gestionar la distribución on-chain de los tokens PBOX ganados off-chain por los usuarios.

---

## Approach A: Backend Minting (Gasless para el usuario)

### Estado: ACTIVO (Para Alpha / Beta)

En este modelo, el backend de **Pandora's Core** asume las operaciones de red. El servidor utiliza una "hot wallet" (relayer) autorizada que posee permisos de minteo (`MINTER_ROLE` a través de la fábrica o asignado directamente).

#### Arquitectura del Approach A
* **Frontend/Telegram App**: El usuario visualiza su saldo "earned" off-chain y hace clic en "Reclamar". 
* **API Route (Edge/Core)**: Valida la identidad (con `userId` provisto en el JWT). Si el ledger confirma fondos suficientes, el servidor inicia una TX Ethers/Viem con la private key de la _Treasury/Relayer_.
* **Blockchain**: La transacción mintea tokens PBOX a favor de la wallet asociada al `userId`.
* **Database**: El estado pasa de `EARNED` -> `RESERVED` -> `CLAIMED`.

**Ventajas:**
* Cero fricción (El usuario no paga Gas / MNT fees ni tiene que tener un balance inicial on-chain).
* Experiencia 100% Web2 "Click and Earn".

**Desventajas:**
* Pandora asume todos los costos por gas.
* La seguridad recae en no comprometer la clave privada del backend. (Para esto existe un `MAX_TOTAL_SUPPLY` y roles granulares).

---

## Approach B: EIP-712 Vouchers (Descentralizado)

### Estado: PLANEADO (Para V2 / Despliegue Masivo)

Para escalar y derivar los costos de red hacia los usuarios cuando el token posea mercado e incentivos mayores, se desplegará el contrato auxiliar: `ClaimVerifier.sol`.

#### Arquitectura del Approach B
* **Frontend/Telegram App**: El usuario pide retirar su balance. Se invoca a una API `POST /api/pbox/claim-voucher`.
* **Backend de Pandora**: 
  * Revisa el ledger.
  * Genera el payload estructurado `Voucher`.
  * Lo cifra y devuelve una **firma criptográfica EIP-712**.
* **Frontend/Telegram App**: Usa un SDK/Wallet (Como Thirdweb) para construir una transacción llamando a `ClaimVerifier.claim(voucher, signature)`. 
* **Blockchain**: El usuario asume el costo de TX. El contrato `ClaimVerifier` recupera la firma, valida el `claimSigner` oficial, incrementa el nonce (preveniendo Replay Attacks) y llama a `pboxToken.mint(...)`.

**Ventajas:**
* Retiro del gas responsibility de Pandora.
* Aumenta la robustez técnica delegando la última fase de validación a la máquina virtual (EVM).

**Desventajas:**
* Fricción de usuario (Debe entender Web3, fondeo, Gas fees, confirmaciones).
* Complejidad de UI/UX en la Telegram App.

### Estructura de Diseño del ClaimVerifier (v2-friendly)
```solidity
struct Voucher {
    address user;       // A quién pertenece la recompensa
    uint256 amount;     // Cantidad de wei/pbox validado
    uint256 nonce;      // Incremental por usuario para evitar repeticiones
    uint256 deadline;   // Epoch time en el futuro antes del cual el voucher es ignorado
}
```
Todos estos detalles aseguran una soberanía clara. Ninguno de estos aproches depende o vive dentro del repositorio de la Telegram App. Todo reside en `Pandora's Core`.
