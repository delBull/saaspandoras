# @saaspandoras/protocol-deployer

Smart Contracts as a Service (SCaaS) deployment system for Work-to-Earn (W2E) protocols on Pandora's platform.

## Overview

This package provides automated deployment of complete W2E protocol stacks consisting of:
- **Licencia VHORA** (ERC-721A): Access NFTs with voting rights
- **Artefacto PHI** (ERC-20): Utility token with deflationary mechanisms
- **VHLoom** (Logic Contract): Core W2E engine connecting work to rewards
- **W2EGovernor** (DAO): Governance system with quorum-based decision making

## Features

- ✅ **Multi-Network Support**: Deploy to Sepolia (testnet) and Base (mainnet)
- ✅ **Thirdweb Integration**: Full compatibility with Thirdweb CLI and Dashboard
- ✅ **Automated Deployment**: One-click deployment of complete protocol stacks
- ✅ **Type Safety**: Full TypeScript support with comprehensive type definitions
- ✅ **Gas Optimization**: Contracts optimized for gas efficiency
- ✅ **Security**: Built on OpenZeppelin v4.9.0 with battle-tested patterns

## Installation

```bash
# From monorepo root
pnpm install
cd packages/protocol-deployer
pnpm build
```

## Configuration

1. Copy environment variables:
```bash
cp .env.example .env
```

2. Configure your environment:
```env
# Required: Oracle wallet for deployments
PANDORA_ORACLE_PRIVATE_KEY=your_private_key
PANDORA_ORACLE_ADDRESS=0xYourAddress

# Required: RPC endpoints
SEPOLIA_RPC_URL=https://rpc.sepolia.org
BASE_RPC_URL=https://mainnet.base.org

# Optional: For contract verification
ETHERSCAN_API_KEY=your_key
BASESCAN_API_KEY=your_key
```

## Usage

### Programmatic Deployment

```typescript
import { deployW2EProtocol } from '@saaspandoras/protocol-deployer';

const result = await deployW2EProtocol(
  'my-project-slug',
  {
    quorumPercentage: 10,
    votingPeriodHours: 168,
    platformFeePercentage: 0.01,
    maxLicenses: 1000,
    treasurySigners: ['0xSigner1', '0xSigner2']
  },
  'sepolia' // or 'base'
);

console.log('Contracts deployed:', result);
```

### CLI Deployment

```bash
# Compile contracts
pnpm compile

# Deploy to Sepolia
pnpm deploy:sepolia

# Deploy to Base
pnpm deploy:base

# Verify contracts
pnpm verify:sepolia
pnpm verify:base
```

## API Reference

### `deployW2EProtocol(projectSlug, config, network?)`

Deploys a complete W2E protocol stack.

**Parameters:**
- `projectSlug` (string): Unique identifier for the project
- `config` (W2EConfig): Protocol configuration
- `network` ('sepolia' | 'base'): Target network (default: 'sepolia')

**Returns:** Promise<W2EDeploymentResult>

**W2EConfig:**
```typescript
interface W2EConfig {
  quorumPercentage: number;        // Minimum quorum for proposals (0-100)
  votingPeriodHours: number;       // Voting period in hours
  platformFeePercentage: number;   // Platform fee (0-1)
  maxLicenses: number;            // Maximum license supply
  treasurySigners: string[];      // Multi-sig signers
}
```

**W2EDeploymentResult:**
```typescript
interface W2EDeploymentResult {
  licenseAddress: string;     // VHORA contract address
  phiAddress: string;         // PHI token contract address
  loomAddress: string;        // VHLoom logic contract address
  governorAddress: string;    // DAO Governor contract address
  timelockAddress: string;    // Timelock contract address
  deploymentTxHash: string;   // Deployment transaction hash
  network: string;           // Target network
  chainId: number;           // Chain ID
}
```

## Contract Architecture

### 1. Licencia VHORA (ERC-721A)
- **Purpose**: Access control and voting rights
- **Features**: Gas-optimized minting, onlyOracle modifier
- **Integration**: Compatible with Thirdweb NFT tools

### 2. Artefacto PHI (ERC-20)
- **Purpose**: Utility token for rewards and staking
- **Features**: Deflationary mechanisms, controlled minting
- **Integration**: Standard ERC-20 with extended functionality

### 3. VHLoom (Logic Contract)
- **Purpose**: Core W2E engine
- **Features**: Work certification, reward distribution, DAO integration
- **Integration**: Central hub connecting all protocol components

### 4. W2EGovernor (DAO)
- **Purpose**: Decentralized governance
- **Features**: Quorum-based voting, timelock execution
- **Integration**: OpenZeppelin Governor with custom extensions

## Development

### Building
```bash
pnpm build
```

### Testing
```bash
pnpm test
```

### Linting
```bash
pnpm lint
```

## Security Considerations

- **Oracle Wallet**: Keep private key secure and never commit to version control
- **Multi-Sig**: Use hardware wallets for treasury signers
- **Audits**: All contracts are based on audited OpenZeppelin patterns
- **Network Selection**: Always test on Sepolia before mainnet deployment

## Integration with Dashboard

This package is designed to work seamlessly with the Pandora's dashboard:

1. **API Integration**: Dashboard calls deployment endpoints
2. **Database Sync**: Contract addresses automatically stored
3. **UI Updates**: Real-time status updates during deployment
4. **Error Handling**: Comprehensive error reporting and recovery

## License

MIT - See LICENSE file for details.
