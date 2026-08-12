'use client';

/**
 * StrategicActivityCard — Phase 6.2
 * 
 * Answers: "What is Hermes doing right now?"
 * Shows active mission, phase, and progress.
 */

import React from 'react';
import { Target, ArrowRight } from 'lucide-react';

interface StrategicActivityProps {
  activity: {
    active: boolean;
    title?: string;
    stage?: string;
    progress?: number;
  };
}

export function StrategicActivityCard({ activity }: StrategicActivityProps) {
  if (!activity.active) {
    return (
      <div className="flex flex-col h-full p-6 rounded-2xl bg-[#0C0C12] border border-white/[0.04]">
        <div className="flex items-center gap-2 mb-4">
          <Target size={16} className="text-white/30" />
          <h3 className="text-white/50 text-xs font-semibold tracking-wider uppercase">Current Strategic Activity</h3>
        </div>
        
        <div className="flex-1 flex flex-col justify-center py-6">
          <h4 className="text-white/70 font-medium mb-2">No Active Strategic Activity</h4>
          <p className="text-white/40 text-sm leading-relaxed">
            Hermes is standing by.<br />
            When a Journey becomes active, its current objective will appear here.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full p-6 rounded-2xl bg-[#0C0C12] border border-white/[0.04] relative overflow-hidden group">
      <div className="absolute top-0 left-0 w-full h-1 bg-white/[0.02]">
        <div 
          className="h-full bg-indigo-500 transition-all duration-1000 ease-out" 
          style={{ width: `${activity.progress || 0}%` }}
        />
      </div>

      <div className="flex items-center justify-between mb-8 mt-2">
        <div className="flex items-center gap-2">
          <Target size={16} className="text-indigo-400" />
          <h3 className="text-white/50 text-xs font-semibold tracking-wider uppercase">Current Mission</h3>
        </div>
        
        <span className="text-indigo-400 text-xs font-medium bg-indigo-500/10 px-2.5 py-1 rounded-md">
          ACTIVE
        </span>
      </div>

      <div className="flex-1 flex flex-col justify-center">
        <h4 className="text-2xl text-white font-semibold mb-2">{activity.title}</h4>
        
        {activity.stage && (
          <div className="flex items-center gap-2 mb-6">
            <span className="text-white/40 text-xs uppercase tracking-wider font-medium">{activity.stage}</span>
          </div>
        )}

        <div className="space-y-2 mt-auto">
          <div className="flex items-center justify-between text-xs">
            <span className="text-white/50">Progress</span>
            <span className="text-white">{activity.progress}%</span>
          </div>
          
          <div className="w-full h-1.5 bg-white/[0.06] rounded-full overflow-hidden">
            <div 
              className="h-full bg-indigo-500 rounded-full transition-all duration-1000 ease-out"
              style={{ width: `${activity.progress}%` }}
            />
          </div>
        </div>
      </div>
      
      {/* Interactive hover overlay */}
      <div className="absolute inset-0 bg-white/[0.02] opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer pointer-events-none">
        <div className="flex items-center gap-2 bg-[#12121A] text-white px-4 py-2 rounded-lg border border-white/10 shadow-xl pointer-events-auto">
          <span className="text-sm font-medium">View Journey</span>
          <ArrowRight size={16} className="text-indigo-400" />
        </div>
      </div>
    </div>
  );
}
