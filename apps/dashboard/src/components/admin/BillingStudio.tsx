'use client';

/**
 * BillingStudio — Organization Operations Center: Studio #6
 *
 * Separated from Business Studio (v4.1) into its own focused responsibility.
 *
 * Manages:
 *  - Current subscription plan & tier
 *  - AI cost metering (tokens consumed, cost per capability)
 *  - SPEI / Crypto payment history
 *  - Invoice management & downloads
 */

import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  CreditCard, Zap, FileText, TrendingUp,
  Download, CheckCircle2, AlertCircle, Cpu
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface BillingStudioProps {
  tenantId?: string;
  tier?: 'STARTER' | 'PROFESSIONAL' | 'ENTERPRISE' | 'CUSTOM';
}

const TIER_DETAILS = {
  STARTER: {
    label: 'Starter',
    price: '$500 USD',
    period: 'Pago único de activación',
    color: 'text-zinc-300',
    badge: 'bg-zinc-800 text-zinc-300 border-zinc-700',
    features: ['3 canales activos', '5,000 mensajes/mes', 'Telegram + Web Widget', 'Knowledge: 5 documentos', 'Soporte vía email'],
  },
  PROFESSIONAL: {
    label: 'Professional',
    price: '$1,500 USD/mes',
    period: 'Mensual, cancela cuando quieras',
    color: 'text-indigo-300',
    badge: 'bg-indigo-500/10 text-indigo-300 border-indigo-500/30',
    features: ['Canales ilimitados', '50,000 mensajes/mes', 'WhatsApp + Voice + Email', 'Knowledge: ilimitado', 'Soporte prioritario + Onboarding'],
  },
  ENTERPRISE: {
    label: 'Enterprise',
    price: 'Cotización personalizada',
    period: 'Contrato anual con SLA garantizado',
    color: 'text-amber-300',
    badge: 'bg-amber-500/10 text-amber-300 border-amber-500/30',
    features: ['Multi-agentes ilimitados', 'Mensajes ilimitados', 'SLA 99.9%', 'Dedicated infrastructure', 'White-label completo'],
  },
  CUSTOM: {
    label: 'Custom',
    price: 'A convenir',
    period: 'Pack a medida',
    color: 'text-purple-300',
    badge: 'bg-purple-500/10 text-purple-300 border-purple-500/30',
    features: ['Configuración a la medida', 'Soporte técnico dedicado'],
  },
};

// Mock AI cost data — in production, fetched from /api/v1/tenant/billing/ai-costs
const AI_COSTS_MOCK = [
  { capability: 'AI Agents (Chat)', tokens: 128400, cost: '$2.14', icon: <Cpu className="w-4 h-4 text-indigo-400" /> },
  { capability: 'Knowledge RAG', tokens: 45200, cost: '$0.75', icon: <Zap className="w-4 h-4 text-amber-400" /> },
  { capability: 'Voice AI', tokens: 12000, cost: '$1.20', icon: <Zap className="w-4 h-4 text-purple-400" /> },
];

const INVOICES_MOCK = [
  { id: 'INV-2025-08', date: 'Aug 2025', amount: '$500.00 USD', status: 'paid', method: 'SPEI' },
  { id: 'INV-2025-07', date: 'Jul 2025', amount: '$500.00 USD', status: 'paid', method: 'USDC' },
];

type BillingTab = 'subscription' | 'ai_costs' | 'invoices';

export default function BillingStudio({ tenantId = 'default', tier = 'STARTER' }: BillingStudioProps) {
  const [activeTab, setActiveTab] = useState<BillingTab>('subscription');
  const tierDetails = TIER_DETAILS[tier];

  const tabs: { id: BillingTab; label: string; icon: React.ReactNode }[] = [
    { id: 'subscription', label: 'Suscripción', icon: <CreditCard className="w-4 h-4" /> },
    { id: 'ai_costs', label: 'Consumo de IA', icon: <TrendingUp className="w-4 h-4" /> },
    { id: 'invoices', label: 'Facturas', icon: <FileText className="w-4 h-4" /> },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-3">
            <div className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
              <CreditCard className="w-5 h-5 text-emerald-400" />
            </div>
            Billing Studio
          </h2>
          <p className="text-sm text-zinc-400 mt-1 font-light">
            Suscripción, consumo de IA y facturación de tu organización.
          </p>
        </div>
        <Badge className={`text-xs font-mono ${tierDetails.badge}`}>
          {tierDetails.label}
        </Badge>
      </div>

      {/* Tabs */}
      <div className="flex gap-2">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-medium transition-all border ${
              activeTab === tab.id
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                : 'border-zinc-800 text-zinc-500 hover:text-zinc-300 hover:border-zinc-700'
            }`}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      <motion.div
        key={activeTab}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}
      >
        {/* ─── Subscription ─── */}
        {activeTab === 'subscription' && (
          <div className="space-y-4">
            <div className={`border rounded-2xl p-6 ${tier === 'ENTERPRISE' ? 'border-amber-500/30 bg-amber-500/5' : 'border-emerald-500/30 bg-emerald-500/5'}`}>
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className={`text-xl font-bold ${tierDetails.color}`}>{tierDetails.label}</h3>
                  <p className="text-xs text-zinc-400 mt-0.5">{tierDetails.period}</p>
                </div>
                <div className="text-right">
                  <p className={`text-2xl font-bold ${tierDetails.color}`}>{tierDetails.price}</p>
                </div>
              </div>
              <div className="space-y-2">
                {tierDetails.features.map((f, i) => (
                  <div key={i} className="flex items-center gap-2 text-xs text-zinc-300">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                    {f}
                  </div>
                ))}
              </div>
            </div>

            {/* Upgrade prompt for Starter */}
            {tier === 'STARTER' && (
              <div className="border border-indigo-500/20 rounded-2xl p-5 bg-indigo-500/5">
                <p className="text-xs text-indigo-300 font-medium mb-1">¿Listo para escalar?</p>
                <p className="text-xs text-zinc-400 font-light mb-3">
                  Actualiza a Professional para desbloquear WhatsApp, Voice AI y mensajes ilimitados.
                </p>
                <button className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium transition-colors">
                  Solicitar Upgrade
                </button>
              </div>
            )}
          </div>
        )}

        {/* ─── AI Costs ─── */}
        {activeTab === 'ai_costs' && (
          <div className="space-y-4">
            <div className="border border-zinc-800 rounded-2xl bg-zinc-900/30 p-5">
              <div className="flex items-center justify-between mb-4 border-b border-zinc-800 pb-3">
                <span className="text-xs font-mono text-zinc-400 uppercase tracking-widest">Consumo Agosto 2025</span>
                <span className="text-sm font-bold text-white">$4.09 USD Total</span>
              </div>
              <div className="space-y-3">
                {AI_COSTS_MOCK.map((item, i) => (
                  <div key={i} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {item.icon}
                      <div>
                        <p className="text-xs text-white font-medium">{item.capability}</p>
                        <p className="text-[10px] text-zinc-500">{item.tokens.toLocaleString()} tokens</p>
                      </div>
                    </div>
                    <span className="text-xs font-mono text-zinc-300">{item.cost}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="flex items-center gap-2 text-xs text-zinc-500">
              <AlertCircle className="w-3.5 h-3.5" />
              Consumo calculado en base a Ollama Local. Sin costo por token en modelo dedicado.
            </div>
          </div>
        )}

        {/* ─── Invoices ─── */}
        {activeTab === 'invoices' && (
          <div className="space-y-3">
            {INVOICES_MOCK.map((inv) => (
              <div key={inv.id} className="border border-zinc-800 rounded-2xl bg-zinc-900/30 p-4 flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-white">{inv.id}</p>
                  <p className="text-[10px] text-zinc-500">{inv.date} · Método: {inv.method}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm font-mono text-white">{inv.amount}</span>
                  <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/30 text-[9px]">
                    Pagado
                  </Badge>
                  <button className="p-1.5 rounded-lg border border-zinc-800 hover:border-zinc-600 text-zinc-500 hover:text-zinc-300 transition-colors">
                    <Download className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
            <p className="text-[10px] text-zinc-600 text-center pt-2">
              Para facturas fiscales (CFDI 4.0) contáctanos en billing@pandoras.finance
            </p>
          </div>
        )}
      </motion.div>
    </div>
  );
}
