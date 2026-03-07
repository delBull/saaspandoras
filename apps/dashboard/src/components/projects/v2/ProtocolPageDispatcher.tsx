'use client';

import type { ProjectData } from '@/app/()/projects/types';
import type { ArtifactType } from '@/app/()/projects/types';
import dynamic from 'next/dynamic';

const AccessProtocolPage = dynamic(() => import('./layouts/AccessProtocolPage'));
const IdentityProtocolPage = dynamic(() => import('./layouts/IdentityProtocolPage'));
const MembershipProtocolPage = dynamic(() => import('./layouts/MembershipProtocolPage'));
const CouponProtocolPage = dynamic(() => import('./layouts/CouponProtocolPage'));
const ReputationProtocolPage = dynamic(() => import('./layouts/ReputationProtocolPage'));
const YieldProtocolPage = dynamic(() => import('./layouts/YieldProtocolPage'));

interface Props { project: ProjectData; currentSlug: string; }

// Re-exported alias kept for backwards compat with existing layout imports
export type ProtocolLayoutType = ArtifactType;

// ── Capability detection ──────────────────────────────────────────────────────
// Checks what a project has available without making layout decisions.
function hasV2Capabilities(project: ProjectData) {
    const hasArtifacts = Array.isArray(project.artifacts) && project.artifacts.length > 0;
    return {
        hasArtifacts,
        hasPrimaryArtifact: hasArtifacts && project.artifacts!.some(a => a.isPrimary),
        // At least one contract address is resolvable (V1 compat included)
        hasResolvedContract:
            !!project.licenseContractAddress ||
            !!project.w2eConfig?.licenseToken?.address ||
            !!(project as any).contractAddress ||
            !!project.utilityContractAddress,
        hasLayoutHint:
            !!project.pageLayoutType ||
            !!project.w2eConfig?.pageLayoutType,
    };
}

export interface V2ValidationResult {
    isValid: boolean;
    layoutType: ProtocolLayoutType;
    errors: string[];
    warnings: string[];
}

// ── V2 Protocol Validator ─────────────────────────────────────────────────────
// Returns errors + warnings so callers can decide whether to fallback or show banners.
export function validateProtocolForV2(project: ProjectData): V2ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];
    const caps = hasV2Capabilities(project);

    // Guard: contract
    if (!caps.hasResolvedContract) {
        warnings.push('No resolvable contract address — access card will be disabled');
    }

    // Guard: artifacts
    if (!caps.hasArtifacts) {
        errors.push('No artifacts defined (V2 requires at least one)');
        return { isValid: false, layoutType: 'Access', errors, warnings };
    }

    const primary = project.artifacts!.find(a => a.isPrimary) ?? project.artifacts![0];

    if (!primary?.type) {
        errors.push('Primary artifact has no type');
    }

    if (!primary?.address && !project.licenseContractAddress) {
        warnings.push('Primary artifact has no explicit contractAddress');
    }

    if (!project.registryContractAddress) {
        warnings.push('registryContractAddress missing (V2 transparency incomplete)');
    }

    // Layout resolution
    const layoutType = (
        project.pageLayoutType ??
        project.w2eConfig?.pageLayoutType ??
        primary?.type ??
        'Access'
    ) as ProtocolLayoutType;

    return {
        isValid: errors.length === 0,
        layoutType,
        errors,
        warnings,
    };
}

// ── Layout Detector ───────────────────────────────────────────────────────────
function detectLayoutType(project: ProjectData): ProtocolLayoutType {
    const caps = hasV2Capabilities(project);

    // Hard guard: if no contract, force Access (least destructive)
    if (!caps.hasResolvedContract) {
        return 'Access';
    }

    // 1. Explicit pageLayoutType stored in w2eConfig or on project
    const explicit = project.pageLayoutType ?? project.w2eConfig?.pageLayoutType;
    if (explicit) return explicit as ProtocolLayoutType;

    // 2. Primary artifact type from V2 artifacts array (only if artifacts are real)
    if (caps.hasArtifacts) {
        const primaryArtifact = project.artifacts?.find(a => a.isPrimary) ?? project.artifacts?.[0];
        if (primaryArtifact?.type) return primaryArtifact.type;
    }

    // 3. Fallback to Access (most common / legacy default)
    return 'Access';
}

// ── Dispatcher ────────────────────────────────────────────────────────────────
export default function ProtocolPageDispatcher({ project, currentSlug }: Props) {
    const validation = validateProtocolForV2(project);
    const layoutType = validation.isValid
        ? validation.layoutType
        : detectLayoutType(project); // graceful degradation if not fully V2

    if (process.env.NODE_ENV === 'development') {
        console.table({
            slug: currentSlug,
            protocol_version: project.protocol_version,
            layoutType,
            artifacts: project.artifacts?.length ?? 0,
            hasResolvedContract: hasV2Capabilities(project).hasResolvedContract,
            validationErrors: validation.errors.join(' | ') || '✅ none',
            validationWarnings: validation.warnings.join(' | ') || '✅ none',
        });
    }

    const sharedProps = { project, currentSlug };

    switch (layoutType) {
        case 'Identity': return <IdentityProtocolPage    {...sharedProps} />;
        case 'Membership': return <MembershipProtocolPage  {...sharedProps} />;
        case 'Coupon': return <CouponProtocolPage      {...sharedProps} />;
        case 'Reputation': return <ReputationProtocolPage  {...sharedProps} />;
        case 'Yield': return <YieldProtocolPage       {...sharedProps} />;
        case 'Access':
        default: return <AccessProtocolPage      {...sharedProps} />;
    }
}
