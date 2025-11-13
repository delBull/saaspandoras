# 🚀 **Estrategia de Escalamiento: El Modelo Dual-Token**

**Roadmap para Evolucionar $PBOX de Utilidad Interna a Ecosistema Público con $VBOX**

## 🎯 **Visión General**

La evolución del token $PBOX requiere una **transición inteligente** desde un token de utilidad interna pura hacia un **ecosistema dual-token** que separe:

| Token | Rol | Volatilidad | Público/Privado |
|-------|-----|-------------|-----------------|
| **$PBOX** (Utilidad) | Unidad de Trabajo y Mérito | No Volátil | Privado (W2E) |
| **$VBOX** (Volátil) | Unidad de Inversión y Gobernanza | Volátil | Público (DEX/CEX) |

### **Flujo de Valor Unidireccional**
```
Trabajo (W2E) → $PBOX (Utilidad) → Puente de Redención → $VBOX (Inversión) → DEX/CEX
```

---

## 🛠️ **1. Implementación: Token Volátil ($VBOX)**

### **VBOXToken.sol - Contrato del Token Público**

```solidity
contract VBOXToken is ERC20, AccessControl {
    // ========== CONFIGURACIÓN ==========

    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");
    bytes32 public constant GOVERNOR_ROLE = keccak256("GOVERNOR_ROLE");

    /// @notice Suministro máximo fijo (escasez)
    uint256 public constant MAX_SUPPLY = 10_000_000 * 10**18; // 10M VBOX

    /// @notice Dirección del puente de redención (único minter)
    address public redemptionBridge;

    // ========== CONSTRUCTOR ==========

    constructor(address _redemptionBridge, address admin)
        ERC20("Pandora's Value BOX", "VBOX")
    {
        redemptionBridge = _redemptionBridge;

        _grantRole(DEFAULT_ADMIN_ROLE, admin);
        _grantRole(GOVERNOR_ROLE, admin);
        _grantRole(MINTER_ROLE, _redemptionBridge); // Solo puente puede mint
    }

    // ========== FUNCIONES DE MINT (SOLO PUENTE) ==========

    function mint(address to, uint256 amount) external onlyRole(MINTER_ROLE) {
        require(totalSupply() + amount <= MAX_SUPPLY, "VBOX: Max supply exceeded");
        _mint(to, amount);
    }

    // ========== GOBERNANZA ==========

    /**
     * @notice Derechos de voto en Tesorería Root
     * @param account Dirección del votante
     * @return Peso de voto basado en balance VBOX
     */
    function getVotes(address account) external view returns (uint256) {
        return balanceOf(account);
    }

    /**
     * @notice Delegación de votos
     */
    function delegate(address delegatee) external {
        // Implementar ERC20Votes para gobernanza
    }
}
```

### **Características Clave de $VBOX**
- ✅ **Suministro Fijo**: 10M tokens máximo (escasez)
- ✅ **ERC-20 Estándar**: Compatible con DEX y wallets
- ✅ **Gobernanza**: Derechos de voto en Tesorería Root
- ✅ **Mint Controlado**: Solo vía Puente de Redención

---

## 🌉 **2. Puente de Redención (Redemption Bridge)**

### **PBOXRedemptionBridge.sol - El Corazón del Escalamiento**

```solidity
contract PBOXRedemptionBridge is Ownable, ReentrancyGuard {
    // ========== DEPENDENCIAS ==========

    PBOXToken public pboxToken;
    VBOXToken public vboxToken;
    PandoraRootTreasury public rootTreasury;

    // ========== CONFIGURACIÓN DE CONVERSIÓN ==========

    /// @notice Tasa base de conversión (1 PBOX = X VBOX)
    uint256 public conversionRate = 1; // 1:1 inicialmente

    /// @notice Fee de conversión (en basis points)
    uint256 public conversionFeeBps = 50; // 0.5%

    /// @notice Mínimo para conversión
    uint256 public minRedemptionAmount = 100 * 10**18; // 100 PBOX

    // ========== ORÁCULO DE PRECIOS ==========

    /// @notice Dirección del oráculo de precios (Chainlink)
    address public priceOracle;

    /// @notice Último precio actualizado
    uint256 public lastPriceUpdate;

    // ========== CONSTRUCTOR ==========

    constructor(
        address _pboxToken,
        address _vboxToken,
        address _rootTreasury,
        address _priceOracle,
        address admin
    ) Ownable() {
        pboxToken = PBOXToken(_pboxToken);
        vboxToken = VBOXToken(_vboxToken);
        rootTreasury = PandoraRootTreasury(_rootTreasury);
        priceOracle = _priceOracle;

        transferOwnership(admin);
    }

    // ========== FUNCIÓN PRINCIPAL DE REDENCIÓN ==========

    /**
     * @notice Redime PBOX por VBOX
     * @param pboxAmount Cantidad de PBOX a redimir
     */
    function redeem(uint256 pboxAmount) external nonReentrant {
        require(pboxAmount >= minRedemptionAmount, "Bridge: Below minimum");

        // Calcular fee
        uint256 fee = (pboxAmount * conversionFeeBps) / 10000;
        uint256 netPboxAmount = pboxAmount - fee;

        // Calcular VBOX a recibir (con tasa dinámica)
        uint256 vboxAmount = calculateVBoxAmount(netPboxAmount);

        // Verificar balance del usuario
        require(pboxToken.balanceOf(msg.sender) >= pboxAmount, "Bridge: Insufficient PBOX");

        // Transferir PBOX al puente
        require(pboxToken.transferFrom(msg.sender, address(this), pboxAmount), "Bridge: Transfer failed");

        // Quemar PBOX (sale de circulación W2E)
        pboxToken.burnFromAuthorized(address(this), pboxAmount, "redemption");

        // Acuñar VBOX para el usuario
        vboxToken.mint(msg.sender, vboxAmount);

        // Fee va a Tesorería Root
        if (fee > 0) {
            pboxToken.transferFrom(address(this), address(rootTreasury), fee);
        }

        emit RedemptionExecuted(msg.sender, pboxAmount, vboxAmount, fee);
    }

    // ========== CÁLCULO DE TASAS ==========

    /**
     * @notice Calcula cantidad de VBOX basado en liquidez de Tesorería
     * @param pboxAmount Cantidad de PBOX
     * @return vboxAmount Cantidad de VBOX equivalente
     */
    function calculateVBoxAmount(uint256 pboxAmount) public view returns (uint256) {
        // Tasa base
        uint256 baseRate = conversionRate;

        // Ajuste basado en liquidez de Tesorería Root
        uint256 treasuryLiquidity = address(rootTreasury).balance;
        uint256 liquidityBonus = treasuryLiquidity / 1000; // 0.1% por cada 1000 ETH

        // Ajuste por precio (oráculo)
        uint256 priceAdjustment = getPriceAdjustment();

        // Tasa final
        uint256 finalRate = baseRate + liquidityBonus + priceAdjustment;

        return pboxAmount * finalRate / 10**18; // Ajustar decimales
    }

    /**
     * @notice Obtiene ajuste de precio desde oráculo
     */
    function getPriceAdjustment() internal view returns (uint256) {
        // Implementar consulta a Chainlink
        // Retorna ajuste basado en precio PBOX/VBOX
        return 0; // Placeholder
    }

    // ========== ADMINISTRACIÓN ==========

    /**
     * @notice Actualiza tasa de conversión
     */
    function updateConversionRate(uint256 newRate) external onlyOwner {
        require(newRate > 0, "Bridge: Invalid rate");
        conversionRate = newRate;
        emit ConversionRateUpdated(newRate);
    }

    /**
     * @notice Actualiza fee de conversión
     */
    function updateConversionFee(uint256 newFeeBps) external onlyOwner {
        require(newFeeBps <= 500, "Bridge: Fee too high"); // Máximo 5%
        conversionFeeBps = newFeeBps;
        emit ConversionFeeUpdated(newFeeBps);
    }

    // ========== EVENTOS ==========

    event RedemptionExecuted(
        address indexed user,
        uint256 pboxAmount,
        uint256 vboxAmount,
        uint256 fee
    );

    event ConversionRateUpdated(uint256 newRate);
    event ConversionFeeUpdated(uint256 newFee);
}
```

### **Mecanismos del Puente**
- ✅ **Tasa Dinámica**: Ajustada por liquidez y precio
- ✅ **Quema de PBOX**: Sale permanentemente de circulación W2E
- ✅ **Mint de VBOX**: Crea tokens volátiles para DEX
- ✅ **Fee a Tesorería**: Comisiones van a Root Treasury

---

## 🔄 **3. Modificaciones a Contratos Existentes**

### **A. PBOXToken.sol - Nueva Función de Conversión**

```solidity
// AÑADIR al contrato PBOXToken:

address public redemptionBridge;

/// @notice Establece dirección del puente
function setRedemptionBridge(address _bridge) external onlyAdmin {
    redemptionBridge = _bridge;
}

/// @notice Nueva función: Iniciar conversión vía puente
function initiateRedemption(uint256 amount) external nonReentrant {
    require(redemptionBridge != address(0), "PBOX: Bridge not set");
    require(amount >= minConversionAmount, "PBOX: Below minimum");

    // Verificar límites diarios
    // ... (lógica existente)

    // Transferir a puente (usuario debe aprobar primero)
    require(transfer(redemptionBridge, amount), "PBOX: Transfer to bridge failed");

    emit RedemptionInitiated(msg.sender, amount, redemptionBridge);
}
```

### **B. Tesorería Root - Respaldo de $VBOX**

```solidity
// EN PandoraRootTreasury.sol:

/// @notice Balance de respaldo para VBOX
function getVboxBackingValue() external view returns (uint256) {
    return address(this).balance; // ETH acumulado de fees
}

/// @notice Derechos de voto VBOX
function getVboxVotingPower(address voter) external view returns (uint256) {
    // VBOX balance del voter * multiplier
    return vboxToken.balanceOf(voter) * VOTING_MULTIPLIER;
}
```

---

## 📊 **4. Flujo Completo de Escalabilidad**

### **Fase 1: Trabajo (W2E)**
```mermaid
Usuario → Valida Tarea → Loom.mintReward() → Usuario recibe $PBOX
```

### **Fase 2: Decisión de Salida**
```mermaid
Usuario → Aprueba Puente → Llama initiateRedemption() → $PBOX va a puente
```

### **Fase 3: Conversión**
```mermaid
Puente → Quema $PBOX → Calcula tasa → Mints $VBOX → Usuario recibe $VBOX
```

### **Fase 4: Liquidez Pública**
```mermaid
Usuario → Lleva $VBOX a DEX → Vende por ETH/USDC → Inversión realizada
```

---

## 🛡️ **5. Consideraciones de Seguridad**

### **Riesgos Mitigados**
- ✅ **Inflación Controlada**: Suministro VBOX fijo
- ✅ **Valor Estable**: PBOX respaldado por trabajo real
- ✅ **Gobernanza Segura**: VBOX da derechos de voto
- ✅ **Liquidez Gradual**: Conversión controlada por puente

### **Auditorías Requeridas**
- 🔐 **Contrato Puente**: Auditoría crítica (lógica de conversión)
- 🔐 **Token VBOX**: Auditoría estándar ERC-20
- 🔐 **Integración**: Testing exhaustivo de flujos

---

## 📈 **6. Métricas de Éxito**

### **Adopción W2E**
- **Usuarios Activos**: >10K en primer mes
- **Volumen PBOX**: >1M tokens en circulación
- **Conversiones**: >50% de usuarios convierten a VBOX

### **Liquidez Pública**
- **TVL VBOX**: >$1M en DEX
- **Precio VBOX**: Estable >$0.10
- **Gobernanza**: >1000 holders votando

### **Económico**
- **Fee Collection**: >$10K/mes en Tesorería Root
- **ROI Creadores**: >300% retorno promedio
- **Valor Total**: >$5M TVL ecosistema

---

## 🚀 **Implementación Roadmap**

### **Fase 1: Preparación (Mes 1)**
- ✅ Diseño contratos VBOX y Bridge
- ✅ Testing interno
- ✅ Auditoría externa

### **Fase 2: Lanzamiento (Mes 2)**
- ✅ Deploy VBOX token
- ✅ Deploy Puente de Redención
- ✅ Integración con PBOX existente

### **Fase 3: Escalamiento (Mes 3+)**
- ✅ Marketing y adopción
- ✅ Listado en DEX
- ✅ Gobernanza activa

Esta estrategia permite **escalar infinitamente** manteniendo la **integridad económica** del sistema W2E mientras se abre a **inversión pública** de manera controlada.
