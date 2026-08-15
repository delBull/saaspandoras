'use client';

import React, { useState } from 'react';
import { MessageSquare, Search, Filter, ShieldAlert, Zap, Clock, User, ArrowRight } from 'lucide-react';
import { format } from 'date-fns';

export interface ConversationView {
  id: string;
  conversationId: string;
  updatedAt: Date;
  messageCount: number;
  preview: string;
}

export interface MessageView {
  id: string;
  role: 'USER' | 'ASSISTANT' | 'ACTIVITY' | 'SYSTEM';
  content: string;
  createdAt: Date;
}

interface ConversationsDashboardProps {
  conversations: ConversationView[];
  organizationSlug: string;
  onSelectConversation?: (id: string) => Promise<MessageView[]>;
}

export function ConversationsDashboard({ conversations, organizationSlug, onSelectConversation }: ConversationsDashboardProps) {
  const [activeConvId, setActiveConvId] = useState<string | null>(null);
  const [messages, setMessages] = useState<MessageView[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const filteredConversations = conversations.filter(c => 
    c.conversationId.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSelect = async (id: string) => {
    setActiveConvId(id);
    if (onSelectConversation) {
      setIsLoading(true);
      try {
        const msgs = await onSelectConversation(id);
        setMessages(msgs);
      } catch (e) {
        console.error("Failed to load messages", e);
      } finally {
        setIsLoading(false);
      }
    }
  };

  return (
    <div className="flex h-[calc(100vh-3rem)] w-full overflow-hidden bg-[#0A0A10]">
      
      {/* Sidebar: Conversation List */}
      <div className="w-[320px] md:w-[380px] shrink-0 border-r border-white/[0.06] flex flex-col bg-[#0C0C12]">
        
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-white/[0.06] shrink-0">
          <h2 className="text-white font-medium flex items-center gap-2 mb-4">
            <MessageSquare size={18} className="text-indigo-400" />
            Conversational Memory
          </h2>
          
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
            <input 
              type="text"
              placeholder="Search by Wallet or Session ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#12121A] border border-white/10 rounded-xl pl-9 pr-4 py-2 text-sm text-white placeholder-white/30 focus:outline-none focus:border-indigo-500/50 transition-colors"
            />
          </div>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {filteredConversations.length === 0 ? (
            <div className="text-center p-6 text-white/30 text-sm mt-10">
              <MessageSquare className="w-8 h-8 mx-auto mb-3 opacity-20" />
              <p>No conversations found</p>
            </div>
          ) : (
            filteredConversations.map(conv => (
              <button
                key={conv.id}
                onClick={() => handleSelect(conv.conversationId)}
                className={`w-full text-left p-4 rounded-xl transition-all border ${
                  activeConvId === conv.conversationId 
                    ? 'bg-indigo-500/10 border-indigo-500/30' 
                    : 'bg-transparent border-transparent hover:bg-white/[0.02] hover:border-white/[0.05]'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-mono text-white/50 truncate flex-1">
                    {conv.conversationId.split('-')[0]}...
                  </span>
                  <span className="text-[10px] text-white/30 shrink-0 ml-2">
                    {format(new Date(conv.updatedAt), 'MMM d, HH:mm')}
                  </span>
                </div>
                <div className="text-sm text-white/90 font-medium truncate mb-2">
                  Session {conv.conversationId.slice(0, 8)}
                </div>
                <div className="text-xs text-white/50 line-clamp-2 leading-relaxed">
                  {conv.preview || 'No preview available'}
                </div>
              </button>
            ))
          )}
        </div>
      </div>

      {/* Main Area: Chat Viewer */}
      <div className="flex-1 flex flex-col bg-[#0A0A10] relative">
        {activeConvId ? (
          <>
            {/* Header */}
            <div className="h-16 px-6 border-b border-white/[0.06] flex items-center justify-between bg-[#0C0C12] shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center border border-white/10">
                  <User size={14} className="text-white/60" />
                </div>
                <div>
                  <div className="text-sm font-medium text-white/90">Session: {activeConvId}</div>
                  <div className="text-[10px] font-mono text-emerald-400/80 uppercase tracking-wider flex items-center gap-1.5 mt-0.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    Active Connection
                  </div>
                </div>
              </div>
              
              <div className="flex gap-2">
                <button 
                  disabled
                  title="Coming Soon - Requires Human-in-the-Loop contract"
                  className="flex items-center gap-2 px-3 py-1.5 bg-white/5 text-white/40 border border-white/10 rounded-lg text-xs font-medium cursor-not-allowed"
                >
                  <ShieldAlert size={14} />
                  Takeover (Coming Soon)
                </button>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {isLoading ? (
                <div className="flex justify-center mt-20">
                  <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                </div>
              ) : messages.length === 0 ? (
                <div className="text-center p-6 text-white/30 text-sm mt-20">
                  No messages in this session yet.
                </div>
              ) : (
                messages.map(msg => (
                  <div key={msg.id} className={`flex ${msg.role === 'USER' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[80%] rounded-2xl px-5 py-3.5 text-[15px] leading-relaxed shadow-sm ${
                      msg.role === 'USER' 
                        ? 'bg-indigo-600 text-white shadow-indigo-600/10' 
                        : msg.role === 'ACTIVITY' || msg.role === 'SYSTEM'
                          ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-200'
                          : 'bg-[#16161D] border border-white/5 text-white/90'
                    }`}>
                      {msg.role === 'ACTIVITY' || msg.role === 'SYSTEM' ? (
                        <>
                          <div className="text-[10px] font-bold tracking-widest text-emerald-400/80 uppercase mb-2">RUNTIME ACTIVITY</div>
                          <div className="text-sm font-mono opacity-80">{msg.content}</div>
                        </>
                      ) : (
                        msg.content
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
            
            {/* Read Only Footer */}
            <div className="p-4 bg-[#0C0C12] border-t border-white/[0.06] text-center text-xs text-white/30 font-mono flex items-center justify-center gap-2">
              <Zap size={12} className="text-indigo-400/50" />
              Hermes is autonomously managing this session. Takeover required to intervene.
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-white/20 p-8">
            <MessageSquare size={48} className="mb-4 opacity-20" />
            <h3 className="text-xl font-medium text-white/40 mb-2">Select a Conversation</h3>
            <p className="text-sm text-center max-w-sm leading-relaxed">
              Choose a session from the sidebar to inspect the memory and real-time interaction between Hermes and the prospect.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
