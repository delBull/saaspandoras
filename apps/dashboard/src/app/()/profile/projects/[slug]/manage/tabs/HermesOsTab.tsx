import React from 'react';
import { ExternalLink, Bot } from 'lucide-react';
import TelegramBotConfigCard from '@/components/shared/tabs/TelegramBotConfigCard';
import HermesGovernanceSection from '../components/HermesGovernanceSection';
import { Button } from '@/components/ui/button';

interface HermesOsTabProps {
    project: any;
    config?: any;
}

export default function HermesOsTab({ project }: HermesOsTabProps) {
    return (
        <div className="w-full space-y-6">
            <TelegramBotConfigCard project={project} />
            <HermesGovernanceSection organizationId={`org_${project.slug}`} />
            
            <div className="bg-zinc-900/60 border border-zinc-800 rounded-2xl p-6 text-center space-y-4">
                <div className="mx-auto w-12 h-12 bg-purple-500/10 border border-purple-500/20 rounded-2xl flex items-center justify-center">
                    <Bot className="w-6 h-6 text-purple-400" />
                </div>
                <div>
                    <h3 className="text-white font-bold text-lg">Hermes OS is Active</h3>
                    <p className="text-zinc-400 text-sm max-w-md mx-auto mt-1">
                        Tu agente inteligente está operando en la plataforma. Accede a tu portal dedicado para configurar conocimiento, reglas y canales.
                    </p>
                </div>
                <a href={`/portal/${project.slug}`} target="_blank" rel="noreferrer" className="inline-block">
                    <Button className="bg-purple-600 hover:bg-purple-700 text-white gap-2 mt-2">
                        Abrir Hermes Portal
                        <ExternalLink className="w-4 h-4" />
                    </Button>
                </a>
            </div>
        </div>
    );
}
