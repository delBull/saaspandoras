import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Play, Pause, CheckCircle } from "lucide-react";

interface StatsProps {
    total: number;
    active: number;
    paused: number;
    completed: number;
}

export function MarketingStats({ total, active, paused, completed }: StatsProps) {
    return (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card className="bg-zinc-900 border-zinc-800">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-zinc-400">Total Ejecuciones</CardTitle>
                    <Users className="h-4 w-4 text-zinc-500" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold text-white">{total}</div>
                </CardContent>
            </Card>
            <Card className="bg-zinc-900 border-zinc-800">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-green-400">Activas</CardTitle>
                    <Play className="h-4 w-4 text-green-500" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold text-green-500">{active}</div>
                </CardContent>
            </Card>
            <Card className="bg-zinc-900 border-zinc-800">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-yellow-400">Pausadas</CardTitle>
                    <Pause className="h-4 w-4 text-yellow-500" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold text-yellow-500">{paused}</div>
                </CardContent>
            </Card>
            <Card className="bg-zinc-900 border-zinc-800">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-blue-400">Completadas</CardTitle>
                    <CheckCircle className="h-4 w-4 text-blue-500" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold text-blue-500">{completed}</div>
                </CardContent>
            </Card>
        </div>
    );
}
