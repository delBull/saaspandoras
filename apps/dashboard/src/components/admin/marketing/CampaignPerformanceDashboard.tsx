'use server';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  BarChart3, 
  TrendingUp, 
  MousePointer2, 
  Users, 
  ShoppingBag, 
  DollarSign,
  Zap,
  Target,
  Flame,
  Search,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react';
import { getCampaignPerformance } from "@/actions/campaigns";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "../../ui/skeleton";
import { cn } from "@/lib/utils";

interface PerformanceData {
  id: string;
  name: string;
  platform: string;
  source: string;
  status: string;
  // DNA
  hook: string | null;
  angle: string | null;
  emotion: string | null;
  mechanism: string | null;
  // Stats
  impressions: number;
  clicks: number;
  leads: number;
  purchases: number;
  revenue: string;
  score: string;
}

export function CampaignPerformanceDashboard({ projectId }: { projectId: number }) {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<PerformanceData[]>([]);
  const [searchTerm, setSearchTerm] = useState('');

  const fetchPerformance = async () => {
    setLoading(true);
    const res = await getCampaignPerformance(projectId);
    if (res.success) {
      setData(res.performance as PerformanceData[]);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchPerformance();
  }, [projectId]);

  const filteredData = data.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.angle?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const stats = {
    totalRevenue: data.reduce((acc, curr) => acc + parseFloat(curr.revenue), 0),
    totalLeads: data.reduce((acc, curr) => acc + curr.leads, 0),
    avgConvRate: data.length > 0 
      ? (data.reduce((acc, curr) => acc + (curr.clicks > 0 ? (curr.leads / curr.clicks) : 0), 0) / data.length) * 100 
      : 0
  };

  if (loading) return <PerformanceSkeleton />;

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      {/* --- KPI GRID --- */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <KpiCard 
          label="Total Revenue" 
          value={`$${stats.totalRevenue.toLocaleString()}`} 
          icon={<DollarSign className="text-emerald-500" />}
          trend="+12.5%"
          isPositive={true}
        />
        <KpiCard 
          label="Total Leads" 
          value={stats.totalLeads.toString()} 
          icon={<Users className="text-purple-500" />}
          trend="+8.2%"
          isPositive={true}
        />
        <KpiCard 
          label="Avg. Conv Rate" 
          value={`${stats.avgConvRate.toFixed(1)}%`} 
          icon={<TrendingUp className="text-blue-500" />}
          trend="-2.1%"
          isPositive={false}
        />
      </div>

      {/* --- MAIN TABLE --- */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-[2.5rem] overflow-hidden shadow-2xl">
        <div className="p-8 border-b border-zinc-800 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h3 className="text-xl font-black text-white flex items-center gap-3">
              <BarChart3 className="text-purple-500" />
              Campaign Performance
            </h3>
            <p className="text-[10px] text-zinc-500 uppercase font-black tracking-widest mt-1">Real-time ROI Tracking</p>
          </div>
          
          <div className="relative w-full md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600" />
            <input 
              type="text" 
              placeholder="Search DNA or Name..."
              className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl py-2 pl-10 pr-4 text-xs text-white focus:outline-none focus:ring-2 focus:ring-purple-600 transition-all"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-zinc-950/50 text-[10px] font-black uppercase tracking-widest text-zinc-500">
                <th className="px-8 py-4">Campaign / DNA</th>
                <th className="px-8 py-4">Status</th>
                <th className="px-8 py-4">Engagement</th>
                <th className="px-8 py-4">Conversion</th>
                <th className="px-8 py-4">Revenue</th>
                <th className="px-8 py-4 text-right">Score</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800">
              {filteredData.map((campaign) => (
                <tr key={campaign.id} className="hover:bg-white/[0.02] transition-colors group">
                  <td className="px-8 py-6">
                    <div className="space-y-1">
                      <p className="text-sm font-bold text-white group-hover:text-purple-400 transition-colors uppercase tracking-tight">{campaign.name}</p>
                      <div className="flex flex-wrap gap-2">
                        <Badge variant="outline" className="text-[9px] bg-zinc-800/50 border-zinc-700 text-purple-400 font-mono">
                          Angle: {campaign.angle || 'Direct'}
                        </Badge>
                        <Badge variant="outline" className="text-[9px] bg-zinc-800/50 border-zinc-700 text-emerald-400 font-mono">
                          Emotion: {campaign.emotion || 'Neutral'}
                        </Badge>
                        <Badge variant="outline" className="text-[9px] bg-zinc-800/50 border-zinc-700 text-blue-400 font-mono">
                          Mechanism: {campaign.mechanism || 'Manual'}
                        </Badge>
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-2">
                      <div className={cn("w-1.5 h-1.5 rounded-full", 
                        campaign.status === 'active' ? "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" : "bg-zinc-600"
                      )} />
                      <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400">{campaign.status}</span>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <div className="space-y-1">
                      <p className="text-xs text-white font-bold">{campaign.clicks} <span className="text-[10px] text-zinc-500 font-medium">Clicks</span></p>
                      <div className="w-24 h-1 bg-zinc-800 rounded-full overflow-hidden">
                        <div className="h-full bg-blue-500" style={{ width: `${Math.min((campaign.clicks / Math.max(campaign.impressions, 1)) * 100 * 5, 100)}%` }} />
                      </div>
                      <p className="text-[9px] text-zinc-500 font-black tracking-widest uppercase">
                        {campaign.impressions > 0 ? ((campaign.clicks / campaign.impressions) * 100).toFixed(2) : 0}% CTR
                      </p>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <div className="space-y-1">
                      <p className="text-xs text-white font-bold">{campaign.leads} <span className="text-[10px] text-zinc-500 font-medium">Leads</span></p>
                      <p className="text-[10px] text-emerald-500 font-black tracking-widest">
                        {campaign.clicks > 0 ? ((campaign.leads / campaign.clicks) * 100).toFixed(1) : 0}% CR
                      </p>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <p className="text-sm text-white font-black italic tracking-tighter">${parseFloat(campaign.revenue).toLocaleString()}</p>
                  </td>
                  <td className="px-8 py-6 text-right">
                    <div className="inline-flex flex-col items-end">
                      <div className={cn("text-lg font-black italic leading-none drop-shadow-lg", 
                        parseFloat(campaign.score) > 80 ? "text-emerald-500" : 
                        parseFloat(campaign.score) > 50 ? "text-orange-500" : "text-zinc-500"
                      )}>
                        {parseFloat(campaign.score).toFixed(1)}
                      </div>
                      <span className="text-[8px] font-black text-zinc-500 uppercase tracking-widest">Perf. Score</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filteredData.length === 0 && (
            <div className="p-20 text-center">
              <Target className="w-12 h-12 text-zinc-800 mx-auto mb-4" />
              <p className="text-zinc-500 text-sm font-bold italic">No campaign data found with this DNA.</p>
            </div>
          )}
        </div>
      </div>

      {/* --- STRATEGIC WINNING PATTERNS --- */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="bg-zinc-900 border border-zinc-800 rounded-[2.5rem] p-8">
          <h4 className="text-lg font-black text-white flex items-center gap-3 mb-6">
            <Flame className="text-orange-500" />
            Winning Angles
          </h4>
          <div className="space-y-4">
            {calculateWinningPatterns(data).map((pattern, idx) => (
              <div key={idx} className="flex items-center gap-4 bg-zinc-950/50 p-4 rounded-3xl border border-zinc-800/50">
                <div className="w-10 h-10 rounded-2xl bg-orange-500/10 flex items-center justify-center text-orange-500 font-black italic">
                  #{idx + 1}
                </div>
                <div className="flex-1">
                  <p className="text-xs font-black text-white uppercase tracking-widest">{pattern.angle}</p>
                  <p className="text-[10px] text-zinc-500 font-bold">{pattern.campaigns} Campaigns • {pattern.avgConvRate.toFixed(1)}% Conversion</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-black text-emerald-500 italic">${pattern.totalRevenue.toLocaleString()}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-zinc-900 border border-zinc-800 rounded-[2.5rem] p-8 flex flex-col justify-center items-center text-center">
          <Zap className="w-12 h-12 text-purple-500 mb-4 animate-pulse" />
          <h4 className="text-lg font-black text-white italic">Self-Learning Engine</h4>
          <p className="text-xs text-zinc-500 mt-2 max-w-[280px]">
            The system is analyzing <span className="text-white font-bold">{data.length} campaigns</span> to automatically optimize your next launch DNA.
          </p>
          <Badge className="mt-6 bg-purple-500/10 text-purple-400 border-purple-500/20 font-black">AI OPTIMIZATION: ACTIVE</Badge>
        </div>
      </div>
    </div>
  );
}

function KpiCard({ label, value, icon, trend, isPositive }: { label: string, value: string, icon: React.ReactNode, trend: string, isPositive: boolean }) {
  return (
    <motion.div 
      whileHover={{ y: -5 }}
      className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 relative overflow-hidden group"
    >
      <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:opacity-20 transition-opacity">
        {React.cloneElement(icon as React.ReactElement, { size: 48 })}
      </div>
      <div className="flex flex-col gap-1">
        <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest flex items-center gap-2">
          {icon}
          {label}
        </p>
        <h4 className="text-3xl font-black text-white italic tracking-tighter mt-2">{value}</h4>
        <div className="flex items-center gap-1.5 mt-2">
          <div className={cn("p-0.5 rounded-md", isPositive ? "bg-emerald-500/10 text-emerald-500" : "bg-red-500/10 text-red-500")}>
            {isPositive ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
          </div>
          <span className={cn("text-[10px] font-black", isPositive ? "text-emerald-500" : "text-red-500")}>{trend}</span>
          <span className="text-[10px] text-zinc-600 font-bold uppercase tracking-widest ml-auto">vs last mo.</span>
        </div>
      </div>
    </motion.div>
  );
}

function calculateWinningPatterns(data: PerformanceData[]) {
  const patterns: Record<string, { angle: string, campaigns: number, totalRevenue: number, totalLeads: number, totalClicks: number }> = {};
  
  data.forEach(c => {
    const angle = c.angle || 'Direct';
    if (!patterns[angle]) {
      patterns[angle] = { angle, campaigns: 0, totalRevenue: 0, totalLeads: 0, totalClicks: 0 };
    }
    patterns[angle].campaigns++;
    patterns[angle].totalRevenue += parseFloat(c.revenue);
    patterns[angle].totalLeads += c.leads;
    patterns[angle].totalClicks += c.clicks;
  });

  return Object.values(patterns)
    .map(p => ({
      ...p,
      avgConvRate: p.totalClicks > 0 ? (p.totalLeads / p.totalClicks) * 100 : 0
    }))
    .sort((a, b) => b.totalRevenue - a.totalRevenue)
    .slice(0, 3);
}

function PerformanceSkeleton() {
  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[1, 2, 3].map(i => <Skeleton key={i} className="h-32 rounded-3xl bg-zinc-900" />)}
      </div>
      <Skeleton className="h-[400px] w-full rounded-[2.5rem] bg-zinc-900" />
    </div>
  );
}
