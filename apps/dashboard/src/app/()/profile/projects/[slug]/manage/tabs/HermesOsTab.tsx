import React from 'react';
import { HermesWorkbench } from '@pandoras/hermes-console';

interface HermesOsTabProps {
    project: any;
    config?: any;
}

export default function HermesOsTab({ project }: HermesOsTabProps) {
    // Render the Hermes Workbench specifically for this tenant
    return (
        <div className="w-full">
            <HermesWorkbench tenantId={project.id} />
        </div>
    );
}
