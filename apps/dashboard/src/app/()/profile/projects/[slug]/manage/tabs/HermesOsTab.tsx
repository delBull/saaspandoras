import React from 'react';
import { HermesWorkbench } from '@pandoras/hermes-console';
import TelegramBotConfigCard from './TelegramBotConfigCard';
import HermesGovernanceSection from '../components/HermesGovernanceSection';

interface HermesOsTabProps {
    project: any;
    config?: any;
}

export default function HermesOsTab({ project }: HermesOsTabProps) {
    // Render the Hermes Workbench specifically for this tenant
    return (
        <div className="w-full space-y-6">
            <TelegramBotConfigCard project={project} />
            <HermesGovernanceSection organizationId={`org_${project.slug}`} />
            <HermesWorkbench tenantId={project.id} />
        </div>
    );
}
