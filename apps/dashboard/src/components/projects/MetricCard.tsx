'use client';

interface MetricCardProps {
    label: string;
    value: string;
    icon?: React.ReactNode;
}

export function MetricCard({ label, value, icon }: MetricCardProps) {
    return (
        <div className="bg-zinc-800/50 p-4 rounded-lg text-center">
            <p className="text-xs text-gray-400 font-mono">{label}</p>
            <p className="text-xl md:text-2xl font-bold text-white mt-1 flex items-center justify-center gap-2">
                {icon}{value}
            </p>
        </div>
    );
}