'use client';

import type { ProjectData } from '@/app/()/projects/types';
import dynamic from 'next/dynamic';

const AccessProtocolPage = dynamic(() => import('./layouts/AccessProtocolPage'));
const IdentityProtocolPage = dynamic(() => import('./layouts/IdentityProtocolPage'));
const MembershipProtocolPage = dynamic(() => import('./layouts/MembershipProtocolPage'));
const CouponProtocolPage = dynamic(() => import('./layouts/CouponProtocolPage'));
const ReputationProtocolPage = dynamic(() => import('./layouts/ReputationProtocolPage'));
const YieldProtocolPage = dynamic(() => import('./layouts/YieldProtocolPage'));

interface Props { project: ProjectData; currentSlug: string; }

export type ProtocolLayoutType = 'Access' | 'Identity' | 'Membership' | 'Coupon' | 'Reputation' | 'Yield';

function detectLayoutType(project: ProjectData): ProtocolLayoutType {
    // 1. Explicit pageLayoutType stored in w2eConfig or on project
    const explicit = project.pageLayoutType ?? project.w2eConfig?.pageLayoutType;
    if (explicit) return explicit as ProtocolLayoutType;

    // 2. Primary artifact type from V2 artifacts array
    const primaryArtifact = project.artifacts?.find(a => a.isPrimary) ?? project.artifacts?.[0];
    if (primaryArtifact?.type) return primaryArtifact.type;

    // 3. Fallback to Access (most common / legacy default)
    return 'Access';
}

export default function ProtocolPageDispatcher({ project, currentSlug }: Props) {
    const layoutType = detectLayoutType(project);

    const sharedProps = { project, currentSlug };

    switch (layoutType) {
        case 'Identity': return <IdentityProtocolPage   {...sharedProps} />;
        case 'Membership': return <MembershipProtocolPage {...sharedProps} />;
        case 'Coupon': return <CouponProtocolPage     {...sharedProps} />;
        case 'Reputation': return <ReputationProtocolPage {...sharedProps} />;
        case 'Yield': return <YieldProtocolPage      {...sharedProps} />;
        case 'Access':
        default: return <AccessProtocolPage     {...sharedProps} />;
    }
}
