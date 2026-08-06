'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';

export interface TerminalTask {
  id: string;
  week: string;
  title: string;
  category: string;
  priority: 'HIGH' | 'MEDIUM' | 'LOW';
  completed: boolean;
  dueDate: string;
  detail: string;
  requester: string;
}

interface LogLine {
  kind: 'cmd' | 'out' | 'ok' | 'err';
  text: string;
}

const CATEGORIES = [
  'Tech & Data Room',
  'IP & Trademarks',
  'Legal & Corporate',
  'Operaciones',
  'Marketing & Media',
  'Finanzas',
];

function suggestPriority(text: string): 'HIGH' | 'MEDIUM' | 'LOW' {
  const t = text.toLowerCase();
  if (/(urgente|urge|critic|inmediato|hoy|ya mismo|bloquea|alto)/.test(t)) return 'HIGH';
  if (/(baja|cuando se pueda|sin prisa|despu[ée]s)/.test(t)) return 'LOW';
  return 'MEDIUM';
}

function suggestCategory(text: string): string {
  const t = text.toLowerCase();
  if (/(tech|tecnolog|sistema|api|web|app|bug|integrac|automatiz|base de datos|deploy|kernel|script)/.test(t)) return 'Tech & Data Room';
  if (/(marca|impi|patente|marcanet|trademark|registro|constitucion|libro)/.test(t)) return 'IP & Trademarks';
  if (/(legal|contrato|licencia|asamblea|corporate|sociedad|holding|ndas?|due.?diligence)/.test(t)) return 'Legal & Corporate';
  if (/(finanza|pago|factura|inversor|cash|treasury|token|rwa)/.test(t)) return 'Finanzas';
  if (/(market|media|redes|contenido|campa[ñn]a|video|instagram|linkedin|tiktok|youtube)/.test(t)) return 'Marketing & Media';
  return 'Operaciones';
}

function makeTaskId(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let out = '';
  for (let i = 0; i < 5; i++) out += chars[Math.floor(Math.random() * chars.length)];
  return `NX-${out}`;
}

function futureDate(days: number): string {
  return new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString().split('T')[0] ?? '';
}

function normalizePriority(v: string): 'HIGH' | 'MEDIUM' | 'LOW' {
  const t = v.trim().toLowerCase();
  if (/alta|high|urgente|crit/.test(t)) return 'HIGH';
  if (/baja|low/.test(t)) return 'LOW';
  return 'MEDIUM';
}

export default function TaskTerminal({ onTaskCreated }: { onTaskCreated: (task: TerminalTask) => void }) {
  const [log, setLog] = useState<LogLine[]>([]);
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastId, setLastId] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const bodyRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const boot: LogLine[] = [
      { kind: 'cmd', text: '$ nexus ops --new-task' },
      { kind: 'out', text: 'Nexus Operations Hub · registrador de tareas pendientes' },
      { kind: 'out', text: 'Canal: #pandoras-security · fuente: dash.pandoras.finance/nexus' },
      { kind: 'out', text: '— responde las preguntas en orden. Sugerencias automáticas incluidas.' },
    ];
    setLog(boot);
  }, []);

  useEffect(() => {
    inputRef.current?.focus();
  }, [step]);

  useEffect(() => {
    if (bodyRef.current) bodyRef.current.scrollTop = bodyRef.current.scrollHeight;
  }, [log, step, busy]);

  const contextText = `${answers.task || ''} ${answers.details || ''}`;
  const suggestedPrio = suggestPriority(contextText);
  const suggestedCat = suggestCategory(contextText);
  const dueDate = futureDate(7);

  const advance = (raw: string) => {
    const value = raw.trim();
    const append = [...log];

    switch (step) {
      case 0: {
        append.push({ kind: 'cmd', text: `$ ${value || 'nexus ops --start'}` });
        append.push({ kind: 'out', text: '> whoami ▸ ¿Quién solicita esta tarea?' });
        setLog(append);
        setStep(1);
        setInput('');
        return;
      }
      case 1: {
        if (!value) { setInput(''); return; }
        append.push({ kind: 'out', text: `  → solicitante: ${value}` });
        append.push({ kind: 'out', text: '> task ▸ ¿Qué hay que hacer?' });
        setAnswers((a) => ({ ...a, requester: value }));
        setLog(append);
        setStep(2);
        setInput('');
        return;
      }
      case 2: {
        if (!value) { setInput(''); return; }
        append.push({ kind: 'out', text: `  → tarea: ${value}` });
        append.push({ kind: 'out', text: '> detail ▸ Describe el contexto / detalles' });
        setAnswers((a) => ({ ...a, task: value }));
        setLog(append);
        setStep(3);
        setInput('');
        return;
      }
      case 3: {
        append.push({ kind: 'out', text: `  → detalle: ${value || '(sin detalle)'}` });
        append.push({ kind: 'out', text: `> prio ▸ Prioridad [ALTA|MEDIA|BAJA]  · sugerido: ${suggestedPrio}` });
        setAnswers((a) => ({ ...a, details: value }));
        setLog(append);
        setStep(4);
        setInput('');
        return;
      }
      case 4: {
        const prio = value ? normalizePriority(value) : suggestedPrio;
        append.push({ kind: 'out', text: `  → prioridad: ${prio}` });
        append.push({ kind: 'out', text: `> cat ▸ Categoría ${CATEGORIES.join(' | ')} · sugerido: ${suggestedCat}` });
        setAnswers((a) => ({ ...a, priority: prio }));
        setLog(append);
        setStep(5);
        setInput('');
        return;
      }
      case 5: {
        const catValue = value || suggestedCat;
        const cat = CATEGORIES.find((c) => c.toLowerCase().startsWith(catValue.trim().toLowerCase())) || catValue;
        append.push({ kind: 'out', text: `  → categoría: ${cat}` });
        const id = makeTaskId();
        setLastId(id);
        append.push({ kind: 'cmd', text: '─'.repeat(46) });
        append.push({ kind: 'ok', text: `  SOLICITANTE : ${answers.requester}` });
        append.push({ kind: 'ok', text: `  TAREA       : ${answers.task}` });
        append.push({ kind: 'ok', text: `  DETALLES    : ${answers.details || '(sin detalle)'}` });
        append.push({ kind: 'ok', text: `  PRIORIDAD   : ${answers.priority}` });
        append.push({ kind: 'ok', text: `  CATEGORÍA   : ${cat}` });
        append.push({ kind: 'ok', text: `  ID          : ${id}` });
        append.push({ kind: 'ok', text: `  FECHA       : ${dueDate}` });
        append.push({ kind: 'cmd', text: '─'.repeat(46) });
        append.push({ kind: 'cmd', text: '> run ▸ [y] enviar a #pandoras-security · [n] cancelar' });
        setAnswers((a) => ({ ...a, category: cat }));
        setLog(append);
        setStep(6);
        setInput('');
        return;
      }
      case 6: {
        const v = value.toLowerCase();
        if (v === 'y' || v === 'yes' || v === 'sí' || v === 'si' || v === '1') {
          void submitTask();
          return;
        }
        if (v === 'n' || v === 'no' || v === '0') {
          setLog((l) => [...l, { kind: 'out', text: '→ cancelado. sin cambios.' }]);
          resetFlow();
          return;
        }
        setInput('');
        return;
      }
    }
  };

  const resetFlow = () => {
    setAnswers({});
    setInput('');
    setDone(false);
    setError(null);
    setStep(0);
    setLog([{ kind: 'cmd', text: '$ nexus ops --new-task' }]);
  };

  const submitTask = async () => {
    if (busy) return;
    setBusy(true);
    setError(null);
    const id = lastId || makeTaskId();
    try {
      const res = await fetch('/api/nexus/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          kind: 'task',
          requester: answers.requester,
          task: answers.task,
          details: answers.details,
          priority: answers.priority,
          category: answers.category,
          dueDate,
          taskId: id,
        }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        setLog((l) => [
          ...l,
          { kind: 'err', text: `⚠ Discord no disponible (${data?.error || res.status}), la tarea se guardó localmente` },
        ]);
      } else {
        setLog((l) => [
          ...l,
          { kind: 'ok', text: `✓ tarea ${id} registrada y enviada a #pandoras-security` },
        ]);
      }
      setLog((l) => [...l, { kind: 'out', text: '→ aparecerá en la pestaña TAREAS como pendiente.' }]);
      onTaskCreated({
        id,
        week: 'Pendientes',
        title: answers.task || 'Tarea sin título',
        category: answers.category || 'Operaciones',
        priority: (answers.priority as 'HIGH' | 'MEDIUM' | 'LOW') || 'MEDIUM',
        completed: false,
        dueDate,
        detail: answers.details || '',
        requester: answers.requester || '',
      });
      setDone(true);
    } catch (e: any) {
      setError(e.message || 'Error de red');
      setLog((l) => [...l, { kind: 'err', text: `✗ ${e.message || 'error desconocido'}` }]);
    } finally {
      setBusy(false);
    }
  };

  const promptForStep = (s: number): string => {
    switch (s) {
      case 0: return '$ Enter para iniciar el registro';
      case 1: return 'whoami ▸ ¿Quién solicita esta tarea?';
      case 2: return 'task ▸ ¿Qué hay que hacer?';
      case 3: return 'detail ▸ Describe el contexto / detalles';
      case 4: return `prio ▸ [ALTA|MEDIA|BAJA] · sugerido: ${suggestedPrio}`;
      case 5: return `cat ▸ sugerido: ${suggestedCat}`;
      case 6: return 'run ▸ [y] enviar a #pandoras-security · [n] cancelar';
      default: return '';
    }
  };

  const renderPrompt = () => {
    if (done) return null;
    return (
      <div className="flex items-center gap-2">
        <span className="text-purple-300 select-none">{'>'}</span>
        <input
          ref={inputRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              advance(input);
            }
          }}
          disabled={busy}
          placeholder={promptForStep(step)}
          className="flex-1 bg-transparent text-zinc-200 font-mono text-[12px] outline-none placeholder:text-zinc-600"
          autoFocus
        />
        {busy && <span className="text-purple-300 animate-pulse">…</span>}
      </div>
    );
  };

  return (
    <div className="rounded-2xl border border-white/10 bg-[#0C0C10] overflow-hidden shadow-[0_0_30px_rgba(168,85,247,0.08)]">
      <div className="flex items-center gap-2 px-4 py-2.5 border-b border-white/10 bg-black/40">
        <span className="w-3 h-3 rounded-full bg-[#ff5f57]" />
        <span className="w-3 h-3 rounded-full bg-[#febc2e]" />
        <span className="w-3 h-3 rounded-full bg-[#28c840]" />
        <span className="ml-3 font-mono text-[10px] text-zinc-500 tracking-wider">nexus-ops — zsh — 80×24</span>
        <span className="ml-auto hidden sm:flex items-center gap-1.5 font-mono text-[10px] text-purple-300/80">
          <span className="relative flex h-1.5 w-1.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-purple-400 opacity-60" />
            <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-purple-500" />
          </span>
          #pandoras-security
        </span>
      </div>

      <div ref={bodyRef} className="bg-[#070709] p-4 h-[320px] overflow-y-auto font-mono text-[12px] leading-relaxed space-y-1">
        {log.map((line, i) => (
          <div key={i} className={`whitespace-pre-wrap break-words ${
            line.kind === 'cmd' ? 'text-purple-300' :
            line.kind === 'ok' ? 'text-emerald-400' :
            line.kind === 'err' ? 'text-rose-400' :
            'text-zinc-400'
          }`}>
            {line.text}
          </div>
        ))}

        {!done && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="pt-1">
            {renderPrompt()}
            {error && <div className="text-rose-400 mt-1">✗ {error}</div>}
          </motion.div>
        )}

        {done && (
          <div className="flex gap-3 pt-2">
            <button
              onClick={resetFlow}
              className="px-3 py-1.5 rounded-lg border border-purple-500/30 bg-purple-500/10 text-purple-300 font-mono text-[11px] hover:bg-purple-500/20 transition-colors"
            >
              ↻ nueva tarea
            </button>
            <span className="text-zinc-500 font-mono text-[11px] self-center">la tarea {lastId} quedó pendiente en la pestaña TAREAS</span>
          </div>
        )}
      </div>

      <div className="px-4 py-2 border-t border-white/10 bg-black/40 flex items-center justify-between font-mono text-[10px] text-zinc-600">
        <span>NERUS OPS v1.0 · REGISTRO DE TAREAS PENDIENTES</span>
        <span className="hidden sm:block text-zinc-500">sugerencias: prioridad · categoría · fecha (+7d)</span>
      </div>
    </div>
  );
}
