"use server";

import { ControlPlaneContextFactory } from "@/lib/pandoras/core/domains/hermes/knowledge/context-factory";
import { KnowledgeGovernanceService } from "@/lib/pandoras/core/domains/hermes/knowledge/service";
import { KnowledgeStatus, KnowledgeDimension, KnowledgeVisibility, KnowledgeSource } from "@/lib/pandoras/core/domains/hermes/knowledge/types";

/**
 * Server Action Frontier for Hermes Knowledge Governance Console
 */

export async function discoverKnowledgeAction(
  tenantId: string, 
  payload: { dimension: KnowledgeDimension, key: string, content: string, visibility: KnowledgeVisibility, source: KnowledgeSource, sourceReference?: string }
) {
  const context = await ControlPlaneContextFactory.fromSession(tenantId);
  return await KnowledgeGovernanceService.discover(context, payload);
}

export async function approveKnowledgeAction(
  tenantId: string, 
  knowledgeId: string, 
  expectedVersion: number
) {
  const context = await ControlPlaneContextFactory.fromSession(tenantId);
  return await KnowledgeGovernanceService.approveKnowledge(context, knowledgeId, expectedVersion);
}

export async function rejectKnowledgeAction(
  tenantId: string, 
  knowledgeId: string, 
  reason: string
) {
  const context = await ControlPlaneContextFactory.fromSession(tenantId);
  return await KnowledgeGovernanceService.rejectKnowledge(context, knowledgeId, reason);
}

export async function editKnowledgeAction(
  tenantId: string, 
  activeKnowledgeId: string, 
  newContent: string
) {
  const context = await ControlPlaneContextFactory.fromSession(tenantId);
  return await KnowledgeGovernanceService.editKnowledge(context, activeKnowledgeId, newContent);
}

// --- Query Actions ---

export async function getKnowledgeByStatusAction(tenantId: string, status: KnowledgeStatus) {
  const context = await ControlPlaneContextFactory.fromSession(tenantId);
  return await KnowledgeGovernanceService.getKnowledgeByStatus(context.organizationId, status);
}

export async function getAuditTrailAction(tenantId: string) {
  const context = await ControlPlaneContextFactory.fromSession(tenantId);
  return await KnowledgeGovernanceService.getAuditTrail(context.organizationId);
}

export async function getExclusionRegisterAction(tenantId: string) {
  const context = await ControlPlaneContextFactory.fromSession(tenantId);
  return await KnowledgeGovernanceService.getExclusionRegister(context.organizationId);
}

// --- Add-On Marketplace Actions ---

import { AddOnRegistryService } from "@/lib/pandoras/core/domains/hermes/addons/registry";
import { AddOnInstallationManager } from "@/lib/pandoras/core/domains/hermes/addons/installation-manager";
import { AddOnGovernanceService } from "@/lib/pandoras/core/domains/hermes/addons/governance";

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
