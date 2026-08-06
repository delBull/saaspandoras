import { CompiledRuntimeManifest } from './pack-types';
import { CompiledDiscoveryManifest } from './discovery-types';

/**
 * The full OS state for the current turn.
 * Passed through the execution pipeline (Conversation -> UI -> Media -> Action)
 */
export interface CompiledExecutionManifest {
  sessionId: string;
  tenantId: number;
  userId?: string;

  // Global OS Context loaded for this tenant
  runtimeConfig: CompiledRuntimeManifest; // Deprecated by configGraph, keeping for backward compatibility
  configGraph?: any; // The new CompiledRuntimeConfiguration
  meshGraph?: any;   // The new CompiledMeshManifest
  discoveryGraph: CompiledDiscoveryManifest;
  contentGraph?: any; 

  // Turn-specific Context
  currentJourneyId?: string;
  currentStageId?: string;
  relevantKnowledge: any[];
  
  // Pipeline State (mutated by the pipeline runtimes)
  ui: any[];
  media: any[];
  actions: any[];
  navigation: any[];
  permissions: string[];
  connectors: string[];
  events: any[];
  analytics: any[];

  generatedAt: Date;
}

/**
 * The final output of the Hermes OS.
 * Not just text — a full application experience.
 */
export interface ExecutionResult {
  messages: any[];
  ui: any[];          // Components to render (e.g. ['InvestorCard', 'RiskBanner'])
  media: any[];       // Assets to show (e.g. ['founder_video.mp4'])
  actions: any[];     // Authorized actions (e.g. ['schedule_call', 'sign_transaction'])
  navigation: any[];  // Routes to push (e.g. ['/investment/checkout'])
  events: any[];      // OS events emitted during the turn
}

/**
 * Base interface for a pipeline runtime.
 * Each runtime consumes the execution manifest and modifies it.
 */
export interface IPipelineRuntime {
  /**
   * Processes the manifest and optionally returns messages or other results directly.
   * Modifies the manifest's pipeline state (ui, media, actions) in-place.
   */
  process(manifest: CompiledExecutionManifest, input: string): Promise<void>;
}
