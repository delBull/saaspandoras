"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Filter, MousePointerClick, MessageCircle } from "lucide-react";

export function MarketingAnalytics({ leads }: { leads: any[] }) {
    // Process lead metadata for attribution
    let telegramCount = 0;
    let organicCount = 0;
    let webCount = 0;
    let totalUniqueVisitors = new Set();
    
    leads.forEach((lead) => {
        let meta: any = {};
        if (typeof lead.metadata === 'string') {
            try { meta = JSON.parse(lead.metadata); } catch(e) {}
        } else if (lead.metadata) {
            meta = lead.metadata;
        }

        if (meta.visitorId) {
            totalUniqueVisitors.add(meta.visitorId);
        } else if (lead.email) {
            totalUniqueVisitors.add(lead.email); // fallback
        }

        const source = meta.source || lead.origin || '';
        if (source.toLowerCase().includes('telegram') || source.toLowerCase().includes('tg')) {
            telegramCount++;
        } else if (source.toLowerCase().includes('web') || source.toLowerCase().includes('direct')) {
            webCount++;
        } else {
            organicCount++;
        }
    });

    const totalConversions = leads.length;

    return (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
            <Card className="bg-zinc-900 border-zinc-800">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-zinc-400">Unique Visitors (Tracked)</CardTitle>
                    <Users className="h-4 w-4 text-emerald-400" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold text-white">{totalUniqueVisitors.size}</div>
                    <p className="text-xs text-zinc-500 mt-1">Based on Identity Layer</p>
                </CardContent>
            </Card>

            <Card className="bg-zinc-900 border-zinc-800">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-zinc-400">Total Conversions (Leads)</CardTitle>
                    <Filter className="h-4 w-4 text-blue-400" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold text-white">{totalConversions}</div>
                    <p className="text-xs text-zinc-500 mt-1">Registered leads</p>
                </CardContent>
            </Card>

            <Card className="bg-zinc-900 border-zinc-800">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-zinc-400">Telegram Traffic</CardTitle>
                    <MessageCircle className="h-4 w-4 text-sky-400" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold text-white">{telegramCount}</div>
                    <p className="text-xs text-zinc-500 mt-1">Conversions from TMA/Bots</p>
                </CardContent>
            </Card>

            <Card className="bg-zinc-900 border-zinc-800">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-zinc-400">Organic / Direct Web</CardTitle>
                    <MousePointerClick className="h-4 w-4 text-amber-400" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold text-white">{organicCount + webCount}</div>
                    <p className="text-xs text-zinc-500 mt-1">From search & direct links</p>
                </CardContent>
            </Card>
        </div>
    );
}
