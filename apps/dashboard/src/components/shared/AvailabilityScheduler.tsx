import React from 'react';
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export interface DayConfig {
    enabled: boolean;
    start: string; // "09:00"
    end: string;   // "17:00"
}

export interface AvailabilityConfig {
    monday: DayConfig;
    tuesday: DayConfig;
    wednesday: DayConfig;
    thursday: DayConfig;
    friday: DayConfig;
    saturday: DayConfig;
    sunday: DayConfig;
    timezone?: string;
    googleCalendarUrl?: string;
    notionCalendarUrl?: string;
}

export const defaultAvailability: AvailabilityConfig = {
    monday: { enabled: true, start: "09:00", end: "17:00" },
    tuesday: { enabled: true, start: "09:00", end: "17:00" },
    wednesday: { enabled: true, start: "09:00", end: "17:00" },
    thursday: { enabled: true, start: "09:00", end: "17:00" },
    friday: { enabled: true, start: "09:00", end: "17:00" },
    saturday: { enabled: false, start: "10:00", end: "14:00" },
    sunday: { enabled: false, start: "10:00", end: "14:00" },
    timezone: "America/Mexico_City"
};

interface AvailabilitySchedulerProps {
    config: AvailabilityConfig;
    onChange: (newConfig: AvailabilityConfig) => void;
}

export function AvailabilityScheduler({ config, onChange }: AvailabilitySchedulerProps) {
    const days = [
        { key: 'monday', label: 'Lunes' },
        { key: 'tuesday', label: 'Martes' },
        { key: 'wednesday', label: 'Miércoles' },
        { key: 'thursday', label: 'Jueves' },
        { key: 'friday', label: 'Viernes' },
        { key: 'saturday', label: 'Sábado' },
        { key: 'sunday', label: 'Domingo' }
    ] as const;

    return (
        <div className="space-y-3">
            {days.map((day) => {
                const dayConfig = config[day.key] as DayConfig;
                if (!dayConfig) return null;

                return (
                    <div key={day.key} className="flex flex-col sm:flex-row sm:items-center justify-between p-3 rounded-lg bg-zinc-900/50 hover:bg-zinc-800/50 transition-colors border border-zinc-800/50">
                        <div className="flex items-center gap-3 mb-2 sm:mb-0">
                            <input
                                type="checkbox"
                                checked={dayConfig.enabled}
                                onChange={(e) => onChange({
                                    ...config,
                                    [day.key]: { ...dayConfig, enabled: e.target.checked }
                                })}
                                className="w-4 h-4 rounded border-zinc-700 bg-zinc-900 text-[#D4A853] focus:ring-[#D4A853]/20"
                            />
                            <Label className={`w-20 ${dayConfig.enabled ? 'text-white' : 'text-zinc-500'}`}>
                                {day.label}
                            </Label>
                        </div>

                        {dayConfig.enabled ? (
                            <div className="flex items-center gap-2">
                                <Input
                                    type="time"
                                    value={dayConfig.start}
                                    onChange={(e) => onChange({
                                        ...config,
                                        [day.key]: { ...dayConfig, start: e.target.value }
                                    })}
                                    className="h-8 w-28 px-2 bg-black border-zinc-800 text-xs text-white"
                                />
                                <span className="text-zinc-500">-</span>
                                <Input
                                    type="time"
                                    value={dayConfig.end}
                                    onChange={(e) => onChange({
                                        ...config,
                                        [day.key]: { ...dayConfig, end: e.target.value }
                                    })}
                                    className="h-8 w-28 px-2 bg-black border-zinc-800 text-xs text-white"
                                />
                            </div>
                        ) : (
                            <span className="text-xs text-zinc-600 block sm:w-[200px] sm:text-right italic">No disponible</span>
                        )}
                    </div>
                );
            })}
        </div>
    );
}
