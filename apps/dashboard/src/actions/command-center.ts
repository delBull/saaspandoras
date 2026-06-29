'use server';

import { db } from "@/db";
import { marketingLeads, marketingLeadEvents } from "@/db/schema";
import { eq, and, gte, desc, sql, inArray } from "drizzle-orm";

export interface CommandCenterStats {
  northStar: {
    totalLeads: number;
    meetings: number;
    participants: number;
    committedCapital: number;
  };
  mission: {
    meetingsToday: number;
    followUpsToday: number;
    newLeadsToday: number;
    whitepapersSent: number;
    scheduledMeetings: number;
    potentialCapital: number;
  };
  momentum30d: {
    meetings: number;
    interested: number;
    dueDiligence: number;
    participations: number;
  };
  pipeline: { name: string; count: number }[];
  leads: { id: string; name: string; status: string; date: string }[];
  activities: { type: string; description: string; isToday: boolean }[];
  insights: string[];
}

export async function getCommandCenterStats(projectId: number): Promise<CommandCenterStats> {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const thirtyDaysAgo = new Date(today);
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const projectFilter = eq(marketingLeads.projectId, projectId);
    const notDeleted = eq(marketingLeads.isDeleted, false);

    const allLeads = await db.select()
      .from(marketingLeads)
      .where(and(projectFilter, notDeleted));

    const convertedLeads = allLeads.filter(l => l.status === 'converted');
    const activeLeads = allLeads.filter(l => l.status === 'active' || l.status === 'whitelisted');
    const nurturingLeads = allLeads.filter(l => l.status === 'nurturing');
    const newLeads = allLeads.filter(l => l.status === 'new');
    const newTodayLeads = newLeads.filter(l => l.createdAt && new Date(l.createdAt) >= today);

    const totalCapitalConverted = convertedLeads.reduce((sum, l) => sum + (Number(l.conversionValue) || 0), 0);
    const potentialCapital = allLeads
      .filter(l => l.status !== 'converted' && l.score > 0)
      .reduce((sum, l) => sum + (Number(l.conversionValue) || 0), 0);

    const pipelineMap: Record<string, number> = {};
    for (const l of allLeads) {
      pipelineMap[l.status] = (pipelineMap[l.status] || 0) + 1;
    }

    const leadIds = allLeads.map(l => l.id);

    let recentEvents: typeof marketingLeadEvents.$inferSelect[] = [];
    let meetingEventsToday: typeof marketingLeadEvents.$inferSelect[] = [];
    let followUpEventsToday: typeof marketingLeadEvents.$inferSelect[] = [];
    let whitepaperEvents: typeof marketingLeadEvents.$inferSelect[] = [];
    let meetingEvents30d: typeof marketingLeadEvents.$inferSelect[] = [];

    if (leadIds.length > 0) {
      recentEvents = await db.select()
        .from(marketingLeadEvents)
        .where(inArray(marketingLeadEvents.leadId, leadIds))
        .orderBy(desc(marketingLeadEvents.createdAt))
        .limit(20);

      meetingEventsToday = recentEvents.filter(e => {
        const isMeeting = e.type.toLowerCase().includes('meeting') || e.type.toLowerCase().includes('call') || e.type.toLowerCase().includes('reunión');
        return isMeeting && e.createdAt && new Date(e.createdAt) >= today;
      });

      followUpEventsToday = recentEvents.filter(e => {
        const isFollowUp = e.type.toLowerCase().includes('follow') || e.type.toLowerCase().includes('seguimiento');
        return isFollowUp && e.createdAt && new Date(e.createdAt) >= today;
      });

      whitepaperEvents = recentEvents.filter(e => {
        const isWP = e.type.toLowerCase().includes('whitepaper') || e.type.toLowerCase().includes('pitch') || (e.payload as any)?.type === 'whitepaper';
        return isWP;
      });

      meetingEvents30d = recentEvents.filter(e => {
        const isMeeting = e.type.toLowerCase().includes('meeting') || e.type.toLowerCase().includes('call') || e.type.toLowerCase().includes('reunión');
        return isMeeting && e.createdAt && new Date(e.createdAt) >= thirtyDaysAgo;
      });
    }

    const leadMap = new Map(allLeads.map(l => [l.id, l]));

    const activities = recentEvents.slice(0, 10).map(e => {
      const lead = leadMap.get(e.leadId);
      const isToday = e.createdAt ? new Date(e.createdAt) >= today : false;
      const name = lead?.name || lead?.email || 'Unknown';
      const typeLabel = e.type.replace(/_/g, ' ');
      return {
        type: e.type,
        description: `${typeLabel} — ${name}`,
        isToday,
      };
    });

    const statusPriority: Record<string, number> = {
      new: 0,
      active: 1,
      whitelisted: 1,
      nurturing: 2,
      converted: 3,
    };

    const activeContactLeads = allLeads
      .filter(l => l.status !== 'converted' && l.status !== 'archived' && l.status !== 'bounced' && l.status !== 'unsubscribed')
      .sort((a, b) => (statusPriority[a.status] ?? 99) - (statusPriority[b.status] ?? 99));

    const leads = activeContactLeads.slice(0, 10).map(l => ({
      id: l.id,
      name: l.name || l.email || 'Sin nombre',
      status: l.status,
      date: l.lastEngagementAt
        ? timeAgo(new Date(l.lastEngagementAt))
        : l.createdAt
          ? timeAgo(new Date(l.createdAt))
          : 'Desconocido',
    }));

    const pipelineStages = [
      { name: 'Nuevo', statuses: ['new'] },
      { name: 'Interesado', statuses: ['active', 'whitelisted'] },
      { name: 'Due Diligence', statuses: ['nurturing'] },
      { name: 'Participación', statuses: ['converted'] },
    ];

    const pipeline = pipelineStages.map(s => ({
      name: s.name,
      count: allLeads.filter(l => s.statuses.includes(l.status)).length,
    }));

    const total30dMeetings = meetingEvents30d.length + activeLeads.filter(l => {
      return l.lastEngagementAt && new Date(l.lastEngagementAt) >= thirtyDaysAgo;
    }).length;

    return {
      northStar: {
        totalLeads: allLeads.length,
        meetings: meetingEvents30d.length || 0,
        participants: convertedLeads.length,
        committedCapital: totalCapitalConverted,
      },
      mission: {
        meetingsToday: meetingEventsToday.length,
        followUpsToday: followUpEventsToday.length,
        newLeadsToday: newTodayLeads.length,
        whitepapersSent: whitepaperEvents.length,
        scheduledMeetings: activeLeads.filter(l => l.lastAction === 'scheduled' || (l.metadata as any)?.scheduled).length,
        potentialCapital,
      },
      momentum30d: {
        meetings: total30dMeetings,
        interested: activeLeads.length,
        dueDiligence: nurturingLeads.length,
        participations: convertedLeads.length,
      },
      pipeline,
      leads,
      activities,
      insights: [],
    };
  } catch (error) {
    console.error('[CommandCenterStats] Error fetching stats:', error);
    return {
      northStar: { totalLeads: 0, meetings: 0, participants: 0, committedCapital: 0 },
      mission: { meetingsToday: 0, followUpsToday: 0, newLeadsToday: 0, whitepapersSent: 0, scheduledMeetings: 0, potentialCapital: 0 },
      momentum30d: { meetings: 0, interested: 0, dueDiligence: 0, participations: 0 },
      pipeline: [],
      leads: [],
      activities: [],
      insights: [],
    };
  }
}

function timeAgo(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Ahora';
  if (diffMins < 60) return `Hace ${diffMins} min`;
  if (diffHours < 24) return `Hace ${diffHours} horas`;
  if (diffDays === 1) return 'Ayer';
  return `Hace ${diffDays} días`;
}
