// Exportar funciones principales
export { deployW2EProtocol, default as deployW2EProtocolDefault } from './deploy';

// Exportar configuraciones
export { PANDORA_ORACLE_CONFIG, getPandoraOracleWallet } from './config/oracle';

import { getPandoraOracleWallet } from './config/oracle';
import type { Account } from 'thirdweb/wallets';

// Deprecated: Accessing this triggers side effects. Use getPandoraOracleWallet() instead.
export const pandoraOracleWallet = new Proxy({}, {
  get: (_target, prop) => (getPandoraOracleWallet() as any)[prop]
}) as Account;

// Exportar cliente Thirdweb
export { client } from './thirdweb-client';

// Exportar Artifacts (ABIs)
import W2ELicenseArtifact from "./artifacts/W2ELicense.json";
import W2EUtilityArtifact from "./artifacts/W2EUtility.json";
import W2EGovernorArtifact from "./artifacts/W2EGovernor.json";
import W2ELoomArtifact from "./artifacts/W2ELoom.json";
import PBOXProtocolTreasuryArtifact from "./artifacts/PBOXProtocolTreasury.json";

export const Artifacts = {
  W2ELicense: W2ELicenseArtifact,
  W2EUtility: W2EUtilityArtifact,
  W2EGovernor: W2EGovernorArtifact,
  W2ELoom: W2ELoomArtifact,
  PBOXProtocolTreasury: PBOXProtocolTreasuryArtifact
};

// Exportar tipos
export type {
  NetworkType,
  W2EConfig,
  W2EDeploymentResult,
  ContractDeployment,
  DeploymentConfig,
  OracleConfig,
  W2EMetrics,
  ContractHealth,
  HealthCheckResult,
  W2EEvent,
  AuditLogEntry,
  ContractConfig,
  ValidationResult,
  DeploymentValidation
} from './types';
