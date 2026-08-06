import React from 'react';
import { HermesWorkbench } from '@pandoras/hermes-console';
import TelegramBotConfigCard from './TelegramBotConfigCard';

interface HermesOsTabProps {
    project: any;
    config?: any;
}

export default function HermesOsTab({ project }: HermesOsTabProps) {
    // Render the Hermes Workbench specifically for this tenant
    return (
        <div className="w-full space-y-6">
            <TelegramBotConfigCard project={project} />
            <HermesWorkbench tenantId={project.id} />
        </div>
    );
}
