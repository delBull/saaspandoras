"use server";

import { ControlPlaneContextFactory } from "@saasfly/hermes-core";
import { KnowledgeService } from "@saasfly/hermes-core";
import { KnowledgeStatus, KnowledgeDimension, KnowledgeVisibility, KnowledgeSource } from "@saasfly/hermes-core";

/**
 * Server Action Frontier for Hermes Knowledge Governance Console
 */

export async function discoverKnowledgeAction(
  tenantId: string, 
  payload: { dimension: KnowledgeDimension, key: string, content: string, visibility: KnowledgeVisibility, source: KnowledgeSource, sourceReference?: string }
) {
  const context = await ControlPlaneContextFactory.fromSession(tenantId);
  return await KnowledgeService.discover(context, payload);
}

export async function approveKnowledgeAction(
  tenantId: string, 
  knowledgeId: string, 
  expectedVersion: number
) {
  const context = await ControlPlaneContextFactory.fromSession(tenantId);
  return await KnowledgeService.approveKnowledge(context, knowledgeId, expectedVersion);
}

export async function rejectKnowledgeAction(
  tenantId: string, 
  knowledgeId: string, 
  reason: string
) {
  const context = await ControlPlaneContextFactory.fromSession(tenantId);
  return await KnowledgeService.rejectKnowledge(context, knowledgeId, reason);
}

export async function editKnowledgeAction(
  tenantId: string, 
  activeKnowledgeId: string, 
  newContent: string
) {
  const context = await ControlPlaneContextFactory.fromSession(tenantId);
  return await KnowledgeService.editKnowledge(context, activeKnowledgeId, newContent);
}

// --- Query Actions ---

export async function getKnowledgeByStatusAction(tenantId: string, status: KnowledgeStatus) {
  const context = await ControlPlaneContextFactory.fromSession(tenantId);
  return await KnowledgeService.getKnowledgeByStatus(context.organizationId, status);
}

export async function getAuditTrailAction(tenantId: string) {
  const context = await ControlPlaneContextFactory.fromSession(tenantId);
  return await KnowledgeService.getAuditTrail(context.organizationId);
}

export async function getExclusionRegisterAction(tenantId: string) {
  const context = await ControlPlaneContextFactory.fromSession(tenantId);
  return await KnowledgeService.getExclusionRegister(context.organizationId);
}

// --- Add-On Marketplace Actions ---

import { AddOnRegistryService } from "@saasfly/hermes-core";
import { AddOnInstallationManager } from "@saasfly/hermes-core";
import { AddOnGovernanceService } from "@saasfly/hermes-core";

export async function getMarketplaceAddOnsAction(tenantId: string) {
  const context = await ControlPlaneContextFactory.fromSession(tenantId);
  
  const allAddOns = await AddOnRegistryService.getAvailableAddOns();
  const marketplaceData = [];

  for (const addon of allAddOns) {
    const installation = await AddOnInstallationManager.getInstallation(context.organizationId, addon.id);
    marketplaceData.push({
      manifest: addon,
      installation: installation || null
    });
  }

  return marketplaceData;
}

export async function requestAddOnInstallationAction(tenantId: string, addonId: string) {
  const context = await ControlPlaneContextFactory.fromSession(tenantId);
  
  // 1. Request Installation (creates INSTALLING status)
  const installation = await AddOnGovernanceService.requestInstallation(addonId, context);
  
  // 2. Mock Configuration for MVP
  await AddOnGovernanceService.configureAddOn(installation.id, {}, context);
  
  // 3. Submit for Approval (moves to PENDING_APPROVAL or ACTIVE if no human approval required)
  return await AddOnGovernanceService.submitForApproval(installation.id, context);
}

export async function approveAddOnInstallationAction(tenantId: string, installationId: string) {
  const context = await ControlPlaneContextFactory.fromSession(tenantId);
  return await AddOnGovernanceService.approveInstallation(installationId, context);
}

export async function rejectAddOnInstallationAction(tenantId: string, installationId: string) {
  const context = await ControlPlaneContextFactory.fromSession(tenantId);
  return await AddOnGovernanceService.rejectInstallation(installationId, context);
}

export async function suspendAddOnAction(tenantId: string, installationId: string) {
  const context = await ControlPlaneContextFactory.fromSession(tenantId);
  return await AddOnGovernanceService.suspendAddOn(installationId, context);
}

// --- Runtime Context Probe Action ---

import { CognitiveContextBuilder } from "@saasfly/hermes-core";

export async function getEffectiveContextAction(tenantId: string) {
  const context = await ControlPlaneContextFactory.fromSession(tenantId);
  return await CognitiveContextBuilder.buildEffectiveContext(context.organizationId, 'console');
}
