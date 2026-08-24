'use client';

/**
 * LiveActivityFeed — Phase 6.2
 * 
 * Visually communicates that Hermes is alive.
 * Shows recent events from the Event Spine projection.
 */

import React from 'react';
import type { ActivityEventView } from '@/lib/portal/portal-types';
import { Activity, MessageSquare, BookOpen, Send, CheckCircle, AlertTriangle } from 'lucide-react';

interface LiveActivityFeedProps {
  activity: ActivityEventView[];
}

export function LiveActivityFeed({ activity }: LiveActivityFeedProps) {
  if (activity.length === 0) {
    return (
      <div className="flex flex-col h-full p-6 rounded-2xl bg-[#0C0C12] border border-white/[0.04]">
        <div className="flex items-center gap-2 mb-4">
          <Activity size={16} className="text-white/30" />
          <h3 className="text-white/50 text-xs font-semibold tracking-wider uppercase">Live Activity</h3>
        </div>
        
        <div className="flex-1 flex flex-col items-center justify-center py-8 text-center">
          <h4 className="text-white/70 font-medium mb-2">No activity yet</h4>
          <p className="text-white/40 text-sm max-w-sm">
            Hermes hasn't performed any operations yet.<br />
            Once conversations begin, your operational history will appear here.
          </p>
        </div>
      </div>
    );
  }

  const getEventIcon = (type: string) => {
    switch (type) {
      case 'MESSAGE_RECEIVED':
      case 'MESSAGE_SENT':
        return <MessageSquare size={14} className="text-blue-400" />;
      case 'KNOWLEDGE_UPDATED':
        return <BookOpen size={14} className="text-emerald-400" />;
      case 'EXECUTION_COMPLETED':
        return <CheckCircle size={14} className="text-indigo-400" />;
      case 'EXECUTION_FAILED':
        return <AlertTriangle size={14} className="text-red-400" />;
      default:
        return <Activity size={14} className="text-white/40" />;
    }
  };

  return (
    <div className="flex flex-col p-4 sm:p-6 rounded-2xl bg-[#0C0C12] border border-white/[0.04]">
      <div className="flex items-center gap-2 mb-4 sm:mb-6">
        <Activity size={16} className="text-white/30" />
        <h3 className="text-white/50 text-xs font-semibold tracking-wider uppercase">Live Activity</h3>
      </div>
      
      <div className="space-y-0 relative before:absolute before:inset-0 before:ml-[5px] before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-white/[0.04] before:to-transparent">
        {activity.map((event, index) => (
          <div key={event.id} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
            {/* Timeline dot */}
            <div className="flex items-center justify-center w-3 h-3 rounded-full border border-white/10 bg-[#0C0C12] group-hover:border-indigo-500/50 group-hover:bg-indigo-500/10 text-white/50 shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 shadow transition-colors z-10">
              <div className="w-1 h-1 bg-white/20 rounded-full group-hover:bg-indigo-400 transition-colors" />
            </div>
            
            {/* Event Content */}
            <div className="w-[calc(100%-2rem)] md:w-[calc(50%-1.5rem)] p-4 rounded-xl border border-transparent hover:border-white/[0.04] hover:bg-white/[0.01] transition-colors cursor-default">
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  {getEventIcon(event.type)}
                  <span className="text-white/70 text-sm font-medium">{event.type.replace(/_/g, ' ')}</span>
                </div>
                <time className="text-white/30 text-xs font-mono">{typeof event.timestamp === 'string' ? event.timestamp : new Date(event.timestamp).toLocaleTimeString()}</time>
              </div>
              <p className="text-white/50 text-sm">{event.description}</p>
              
              {(event.channel || event.journey) && (
                <div className="flex gap-2 mt-2">
                  {event.channel && <span className="text-xs px-2 py-0.5 rounded bg-white/[0.03] text-white/40">{event.channel}</span>}
                  {event.journey && <span className="text-xs px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-300/70">{event.journey}</span>}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
