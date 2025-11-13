# 🏗️ **SCaaS - Sistema Completo: Esquema y Flujo**

## 📋 **Índice Ejecutivo**

- [Arquitectura General](#arquitectura-general)
- [Flujo de Operaciones](#flujo-de-operaciones)
- [Componentes Core](#componentes-core)
- [Flujo de Capital](#flujo-de-capital)
- [Gobernanza y DAO](#gobernanza-y-dao)
- [Sistema de Recompensas](#sistema-de-recompensas)

---

## 🏛️ **Arquitectura General**

### **Infraestructura Dual**

```
┌─────────────────────────────────────────────────────────────────┐
│                    INFRAESTRUCTURA SCaaS                         │
├─────────────────────────────────────────────────────────────────┤
│  ┌─────────────────┐    ┌─────────────────┐    ┌─────────────┐  │
│  │   FRONTEND      │    │   BACKEND       │    │  SMART      │  │
│  │   DASHBOARD     │◄──►│   ORACLE        │◄──►│ CONTRACTS   │  │
│  │                 │    │   SYSTEM        │    │             │  │
│  └─────────────────┘    └─────────────────┘    └─────────────┘  │
├─────────────────────────────────────────────────────────────────┤
│  ┌─────────────────┐    ┌─────────────────┐    ┌─────────────┐  │
│  │   MODULAR       │    │   HYBRID        │    │  UTILITY    │  │
│  │   FACTORY       │    │   TREASURIES    │    │  TOKENS     │  │
│  └─────────────────┘    └─────────────────┘    └─────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

### **Stack Tecnológico**

- **Frontend**: Next.js + TypeScript + TailwindCSS
- **Backend**: Node.js + Thirdweb SDK + Oracle System
- **Blockchain**: Solidity ^0.8.20 + OpenZeppelin v4.9.0
- **Testing**: Foundry + Hardhat + Anvil
- **Deployment**: Thirdweb Engine + Modular Factory

---

## 🔄 **Flujo de Operaciones**

### **1. Creación de Protocolo (Deployment)**

```
Usuario → Dashboard → ModularFactory.deployProtocolStack()
                                      ↓
                         ┌─────────────────────────────┐
                         │  DEPLOYMENT ATÓMICO         │
                         │  (1 Transacción)            │
                         └─────────────────────────────┘
                                      ↓
                    ┌─────────┬─────────┬─────────┐
                    │Treasury │ Loom    │Governor │
                    │(PBOX)   │ (W2E)   │ (DAO)   │
                    └─────────┴─────────┴─────────┘
```

### **2. Flujo de Trabajo W2E**

```
Licencia NFT → Tarea Validación → Votación DAO → Recompensa PHI
     ↓              ↓                    ↓              ↓
  Acceso W2E    Loom Engine        Gobernanza       Mint Tokens
  (ERC-721A)   (Validación)       (Quórum)        (Staking/APY)
```

### **3. Flujo de Capital**

```
Venta Licencias → Tesorería Protocolo → Pool Recompensas → Staking
       ↓                ↓                        ↓            ↓
   ETH/USDC       80% Tesorería            20% PHI       5% APY
   (Revenue)      20% Plataforma           (W2E)         (Anual)
```

---

## 🧩 **Componentes Core**

### **🎯 ModularFactory - Fábrica de Protocolos**

**Función**: Orquestador que despliega stacks completos de protocolos W2E

**Componentes que Despliega**:
- `PBOXProtocolTreasury` - Tesorería específica del protocolo
- `W2ELoom` - Motor lógico W2E
- `W2EGovernor` - Gobernanza DAO
- `W2ELicense` - NFTs de acceso
- `W2EUtility` - Token de recompensas PHI

**Parámetros de Configuración**:
```solidity
struct DeploymentConfig {
    string slug;                    // Identificador único
    string name;                    // Nombre del protocolo
    uint256 targetAmount;           // Meta de recaudación
    uint256 creatorPayoutPct;       // % para creador (0-50%)
    uint256 quorumPercentage;       // Quórum votación (10-100%)
    uint256 votingPeriodHours;      // Periodo votación
    address[] treasurySigners;      // Signatarios tesorería
    uint256 initialCapital;         // Capital inicial
}
```

### **🏦 Tesorerías Híbridas**

#### **PandoraRootTreasury - Tesorería Principal**
- **Tipo**: Multi-Sig (3+ signatarios)
- **Función**: Fondos operativos de Pandora
- **Controles**: Timelock para retiros grandes
- **Gastos**: Marketing, desarrollo, operaciones

#### **PBOXProtocolTreasury - Tesorería de Protocolo**
- **Tipo**: Híbrido (Pandora + DAO)
- **Función**: Fondos específicos de cada protocolo
- **Controles**: Aprobación dual (Oracle + Gobernanza)
- **Distribución**: 80% tesorería, 20% recompensas

### **🎮 W2ELoom - Motor Lógico W2E**

**Funciones Principales**:
1. **Gestión de Tareas**: Crear, votar, ejecutar tareas W2E
2. **Distribución de Recompensas**: Mint PHI tokens por trabajo
3. **Staking**: Sistema de participación con APY
4. **Gobernanza**: Propuestas de liberación de fondos

**Estados de Tarea**:
```
Pending → Approved/Rejected → Executed
   ↓          ↓
Votación   Resultado
(DAO)     (Recompensa)
```

### **🎭 W2EGovernor - Gobernanza DAO**

**Mecanismos**:
- **Propuestas**: Cualquier holder de licencia puede proponer
- **Votación**: 1 licencia = 1 voto
- **Quórum**: Configurable (10-100%)
- **Ejecución**: Automática después de periodo de votación

**Tipos de Propuestas**:
- **General**: Cambios de parámetros
- **Funding**: Liberación de fondos
- **Parameter**: Ajustes de configuración
- **Emergency**: Acciones de contingencia

### **🎨 W2ELicense - NFTs de Acceso**

**Características**:
- **Estándar**: ERC-721A (gas eficiente)
- **Fases**: 1-3 (basado en actividad)
- **Derechos**: Votación, staking, recompensas
- **Upgrades**: Automáticos por uso

**Fases por Actividad**:
- **Fase 1**: Nueva (0-49 usos)
- **Fase 2**: Activa (50-99 usos)
- **Fase 3**: Muy Activa (100+ usos)

### **💎 W2EUtility (PHI) - Token de Recompensas**

**Mecanismos**:
- **Staking**: 5% APY fijo
- **Fees**: 0.5% por transacción
- **Burn**: Mecanismos deflacionarios
- **Rewards**: Recompensas W2E

**Economía**:
- **Supply**: Controlado por ModularFactory
- **Burn**: Quemado por slashing/penalizaciones
- **Staking**: Recompensas automáticas

---

## 💰 **Flujo de Capital**

### **Entrada de Capital**

```
┌─────────────────────────────────────────────────────────────┐
│                    ENTRADAS DE CAPITAL                       │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────────┐    ┌─────────────────┐                 │
│  │  VENTA          │    │  REVENUE        │                 │
│  │  LICENCIAS      │    │  OPERATIVO      │                 │
│  │  (ETH/USDC)     │    │  (ETH/USDC)     │                 │
│  └─────────────────┘    └─────────────────┘                 │
│           ↓                      ↓                          │
│  ┌─────────────────┐    ┌─────────────────┐                 │
│  │  TESORERÍA      │    │  POOL           │                 │
│  │  PROTOCOLO      │    │  RECOMPENSAS    │                 │
│  │  (80%)          │    │  (20%)          │                 │
│  └─────────────────┘    └─────────────────┘                 │
└─────────────────────────────────────────────────────────────┘
```

### **Distribución Interna**

```
TESORERÍA PROTOCOLO (80%)
├── 60% → Fondos operativos (DAO control)
├── 20% → Reserva de contingencia
└── 20% → Desarrollo y mantenimiento

POOL RECOMPENSAS (20%)
├── 70% → Recompensas W2E (PHI tokens)
├── 20% → Staking rewards
└── 10% → Platform fees
```

### **Salidas de Capital**

```
┌─────────────────────────────────────────────────────────────┐
│                    SALIDAS DE CAPITAL                        │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────────┐    ┌─────────────────┐    ┌─────────┐  │
│  │  CREADOR        │    │  RECOMPENSAS    │    │ EMERGE. │  │
│  │  (Hasta 50%)    │    │  W2E (PHI)      │    │ FUNDS   │  │
│  └─────────────────┘    └─────────────────┘    └─────────┘  │
│  ┌─────────────────┐    ┌─────────────────┐                 │
│  │  OPERATIVOS     │    │  STAKING        │                 │
│  │  (Multi-Sig)    │    │  (5% APY)       │                 │
│  └─────────────────┘    └─────────────────┘                 │
└─────────────────────────────────────────────────────────────┘
```

---

## 🏛️ **Gobernanza y DAO**

### **Estructura de Gobernanza**

```
┌─────────────────────────────────────────────────────────────┐
│                    GOBERNANZA DAO                           │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────────┐    ┌─────────────────┐    ┌─────────┐  │
│  │  LICENCIA       │    │  PROPUESTA      │    │ VOTO    │  │
│  │  NFT (1=1)      │    │  (Cualquiera)   │    │ (1:1)   │  │
│  └─────────────────┘    └─────────────────┘    └─────────┘  │
│           ↓                      ↓                  ↓        │
│  ┌─────────────────┐    ┌─────────────────┐    ┌─────────┐  │
│  │  QUÓRUM         │    │  EJECUCIÓN      │    │ RESULT.  │  │
│  │  (10-100%)      │    │  AUTOMÁTICA     │    │ (A/R)   │  │
│  └─────────────────┘    └─────────────────┘    └─────────┘  │
└─────────────────────────────────────────────────────────────┘
```

### **Tipos de Decisiones**

#### **Propuestas de Funding**
- Liberación de fondos de tesorería
- Payouts a creadores
- Inversiones estratégicas

#### **Propuestas de Parámetros**
- Ajuste de quórum
- Cambio de periodos de votación
- Modificación de fees

#### **Propuestas de Emergencia**
- Activación de fondos de contingencia
- Pausa temporal de operaciones
- Cambios críticos de seguridad

---

## 🎁 **Sistema de Recompensas**

### **Recompensas W2E**

```
TAREA COMPLETADA
        ↓
VALIDACIÓN DAO (Quórum)
        ↓
APROBACIÓN (Mayoría)
        ↓
MINT PHI TOKENS
        ↓
DISTRIBUCIÓN PROPORCIONAL
```

### **Staking y APY**

```
STAKE PHI TOKENS
        ↓
LOCK PERIODO (1 día - ∞)
        ↓
ACUMULACIÓN RECOMPENSAS
        ↓
5% APY FIJO
        ↓
CLAIM AUTOMÁTICO
```

### **Mecanismos Deflacionarios**

```
┌─────────────────────────────────────────────────────────────┐
│                MECANISMOS DEFLACIONARIOS                   │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────────┐    ┌─────────────────┐    ┌─────────┐  │
│  │  TRANSACTION    │    │  SLASHING       │    │ BURN    │  │
│  │  FEES (0.5%)    │    │  (PENALIZACIÓN) │    │ (QUEMA) │  │
│  └─────────────────┘    └─────────────────┘    └─────────┘  │
│  ┌─────────────────┐    ┌─────────────────┐                 │
│  │  CONVERSION     │    │  EMERGENCY      │                 │
│  │  TO LIQUIDITY   │    │  BURN           │                 │
│  └─────────────────┘    └─────────────────┘                 │
└─────────────────────────────────────────────────────────────┘
```

---

## 🔐 **Seguridad y Controles**

### **Multi-Sig Controls**

- **PandoraRootTreasury**: 3+ signatarios para retiros grandes
- **Timelock**: 48h para retiros > threshold
- **Emergency Pause**: Pausa inmediata por seguridad

### **DAO Controls**

- **Quórum Mínimo**: 10% participación requerida
- **Periodo de Votación**: 7 días por defecto
- **Ejecución Automática**: Después de periodo + quórum

### **Technical Controls**

- **ReentrancyGuard**: Protección contra reentrancy
- **AccessControl**: Roles granulares
- **Pausable**: Pausa de emergencia
- **NonReentrant**: Protección de funciones críticas

---

## 📊 **Métricas y KPIs**

### **Métricas de Protocolo**

- **TVL**: Total Value Locked en tesorerías
- **Active Users**: Usuarios con licencias activas
- **Task Completion**: Tareas W2E completadas
- **Governance Participation**: % participación en votaciones

### **Métricas Financieras**

- **Revenue**: Ingresos totales
- **Treasury Balance**: Balance de tesorerías
- **Token Distribution**: Distribución PHI tokens
- **Staking Ratio**: % tokens en staking

### **Métricas de Seguridad**

- **Failed Transactions**: Transacciones fallidas
- **Emergency Triggers**: Activaciones de emergencia
- **Audit Status**: Estado de auditorías
- **Bug Bounty**: Recompensas por bugs encontrados

---

## 🚀 **Escalamiento y Evolución**

### **Fase 1: MVP (Actual)**

- Sistema modular básico
- Gobernanza DAO simple
- Token único (PHI)
- Tesorerías híbridas

### **Fase 2: Dual Token**

- Introducción token público (PBOX)
- Mercado secundario
- Staking avanzado
- Gobernanza compleja

### **Fase 3: Ecosystem**

- Multi-chain deployment
- Interoperabilidad
- DAO avanzado
- DeFi integrations

---

*Documento generado automáticamente - SCaaS System Architecture Schema v1.0*
