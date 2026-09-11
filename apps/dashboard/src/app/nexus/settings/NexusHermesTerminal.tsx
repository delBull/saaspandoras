'use client';

/**
 * 🤖 NEXUS HERMES TERMINAL (with Whisper Voice Input)
 * apps/dashboard/src/app/nexus/settings/NexusHermesTerminal.tsx
 *
 * Real conversational terminal for the Operations Hub.
 * Features:
 *   - sudo wake_up_hermes boot sequence (calls real API)
 *   - Whisper: Web Speech API microphone input with live transcription
 *   - Real contextual responses via /api/nexus/hermes-chat
 *   - Command history (ArrowUp/ArrowDown)
 *   - Markdown-style formatted output
 */

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Terminal,
  Bot,
  Mic,
  MicOff,
  Send,
  RotateCcw,
  ChevronRight,
  Loader2,
  Volume2,
} from 'lucide-react';

interface TerminalLine {
  id: string;
  type: 'input' | 'output' | 'system' | 'error';
  content: string;
  timestamp: string;
}

import type { OperatorContext } from './SettingsClient';

interface NexusHermesTerminalProps {
  role?: string;
  operatorContext?: OperatorContext | null;
  /** Despierta a Hermes automáticamente al montar (sin escribir sudo wake_up_hermes) */
  autoBoot?: boolean;
}

// Web Speech API — minimal typings (not in default TS lib, works cross-browser)
interface ISpeechRecognition extends EventTarget {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  start(): void;
  stop(): void;
  onstart: (() => void) | null;
  onend: (() => void) | null;
  onerror: ((e: { error: string }) => void) | null;
  onresult: ((e: {
    resultIndex: number;
    results: { [i: number]: { [j: number]: { transcript: string }; isFinal: boolean }; length: number };
  }) => void) | null;
}

declare global {
  interface Window {
    SpeechRecognition: new () => ISpeechRecognition;
    webkitSpeechRecognition: new () => ISpeechRecognition;
  }
}

const LINE_COLORS: Record<TerminalLine['type'], string> = {
  input: 'text-amber-300',
  output: 'text-zinc-200',
  system: 'text-emerald-400',
  error: 'text-red-400',
};

const ts = () =>
  new Date().toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit', second: '2-digit' });

const uid = () => Math.random().toString(36).slice(2, 9);

export function NexusHermesTerminal({ role = 'OPERATOR', operatorContext = null, autoBoot = false }: NexusHermesTerminalProps) {
  const [lines, setLines] = useState<TerminalLine[]>([
    {
      id: uid(),
      type: 'system',
      content: autoBoot
        ? 'Nexus Operations Hub · Terminal\nDespertando a Hermes...'
        : 'Nexus Operations Hub · Terminal\nEscribe "sudo wake_up_hermes" para despertar al asistente.',
      timestamp: ts(),
    },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isBooted, setIsBooted] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(false);
  const [history, setHistory] = useState<string[]>([]);
  const [historyIdx, setHistoryIdx] = useState(-1);
  const [interim, setInterim] = useState('');

  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<ISpeechRecognition | null>(null);

  // Check speech API support
  useEffect(() => {
    const SpeechAPI = window.SpeechRecognition || window.webkitSpeechRecognition;
    setSpeechSupported(!!SpeechAPI);
  }, []);

  // Auto-scroll
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [lines, interim]);

  const addLine = useCallback((type: TerminalLine['type'], content: string) => {
    setLines((prev) => [...prev, { id: uid(), type, content, timestamp: ts() }]);
  }, []);

  const callHermesAPI = useCallback(
    async (message: string, isBootSequence = false) => {
      setIsLoading(true);
      try {
        const token = typeof window !== 'undefined' 
          ? (localStorage.getItem('pandoras_nexus_token') || localStorage.getItem('nexus_token')) 
          : null;

        const res = await fetch('/api/nexus/hermes-chat', {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            ...(token ? { 'x-nexus-token': token, 'Authorization': `Bearer ${token}` } : {})
          },
          body: JSON.stringify({ message, role, isBootSequence, operatorContext }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Error desconocido');
        addLine('output', `Hermes: ${data.reply}`);
        if (isBootSequence) setIsBooted(true);
      } catch (err: any) {
        addLine('error', `Error: ${err.message}`);
      } finally {
        setIsLoading(false);
      }
    },
    [role, operatorContext, addLine]
  );

  // Auto-boot: despierta a Hermes sin requerir "sudo wake_up_hermes" manual
  const autoBootedRef = useRef(false);
  useEffect(() => {
    if (!autoBoot || autoBootedRef.current) return;
    autoBootedRef.current = true;
    void callHermesAPI('', true);
  }, [autoBoot, callHermesAPI]);

  const handleCommand = useCallback(
    async (cmd: string) => {
      const trimmed = cmd.trim();
      if (!trimmed) return;

      addLine('input', `$ ${trimmed}`);
      setHistory((prev) => [trimmed, ...prev.slice(0, 49)]);
      setHistoryIdx(-1);
      setInput('');

      const lower = trimmed.toLowerCase();

      // Boot sequence
      if (lower === 'sudo wake_up_hermes' || lower === 'wake_up_hermes') {
        await callHermesAPI('', true);
        return;
      }

      // Built-in commands
      if (lower === 'clear' || lower === 'cls') {
        setLines([{ id: uid(), type: 'system', content: 'Terminal limpiada.', timestamp: ts() }]);
        return;
      }
      if (lower === 'help') {
        addLine(
          'output',
          `Comandos disponibles:
  sudo wake_up_hermes  — Despertar a Hermes (autenticación y contexto)
  clear / cls          — Limpiar terminal
  help                 — Mostrar esta ayuda
  
Una vez Hermes esté activo, escribe en lenguaje natural. Ejemplos:
  "¿cómo funciona el WhatsApp?"
  "¿se puede integrar con Telegram?"
  "explícame los deal rooms"
  "¿cuál es el estado del sistema?"`
        );
        return;
      }

      // If not booted, nudge the user
      if (!isBooted) {
        addLine(
          'system',
          'Hermes no está activo. Escribe "sudo wake_up_hermes" para comenzar.'
        );
        return;
      }

      // Send to Hermes API
      await callHermesAPI(trimmed);
    },
    [addLine, callHermesAPI, isBooted]
  );

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleCommand(input);
      return;
    }
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      const newIdx = Math.min(historyIdx + 1, history.length - 1);
      setHistoryIdx(newIdx);
      setInput(history[newIdx] ?? '');
      return;
    }
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      const newIdx = Math.max(historyIdx - 1, -1);
      setHistoryIdx(newIdx);
      setInput(newIdx === -1 ? '' : (history[newIdx] ?? ''));
    }
  };

  // ── WHISPER: Web Speech API ───────────────────────────────────────────────
  const startListening = useCallback(() => {
    if (!speechSupported) return;
    const SpeechAPI = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechAPI();
    recognition.lang = 'es-MX';
    recognition.continuous = false;
    recognition.interimResults = true;

    recognition.onstart = () => setIsListening(true);
    recognition.onend = () => {
      setIsListening(false);
      setInterim('');
    };
    recognition.onresult = (event: {
      resultIndex: number;
      results: { [i: number]: { [j: number]: { transcript: string }; isFinal: boolean }; length: number };
    }) => {
      let finalTranscript = '';
      let interimTranscript = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i]!;
        const t = result[0]!.transcript;
        if (result.isFinal) finalTranscript += t;
        else interimTranscript += t;
      }
      setInterim(interimTranscript);
      if (finalTranscript) {
        setInput((prev) => (prev + ' ' + finalTranscript).trim());
        setInterim('');
        // Auto-submit after a short pause
        setTimeout(() => inputRef.current?.focus(), 100);
      }
    };
    recognition.onerror = (e: { error: string }) => {
      const MIC_HINTS: Record<string, string> = {
        'not-allowed': 'Permiso de micrófono denegado. Habilítalo para este sitio (ícono 🔒 en la barra de direcciones) y reintenta — o escribe tu consulta.',
        'service-not-allowed': 'El servicio de voz no está disponible en este navegador. Escribe tu consulta.',
        'no-speech': 'No se detectó voz. Habla más cerca del micrófono e intenta de nuevo.',
        'audio-capture': 'No se detectó micrófono. Conecta uno y reintenta.',
        'network': 'Error de red con el servicio de voz. Escribe tu consulta.',
      };
      addLine('error', MIC_HINTS[e.error] ?? `Whisper: Error de micrófono — ${e.error}`);
      setIsListening(false);
    };

    recognitionRef.current = recognition;
    recognition.start();
  }, [speechSupported, addLine]);

  const stopListening = useCallback(() => {
    recognitionRef.current?.stop();
    setIsListening(false);
  }, []);

  const toggleWhisper = useCallback(() => {
    if (isListening) stopListening();
    else startListening();
  }, [isListening, startListening, stopListening]);

  return (
    <div className="flex flex-col h-full bg-[#040406] rounded-2xl border border-white/10 overflow-hidden font-mono text-xs">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-white/10 bg-[#08080A]">
        <div className="flex items-center gap-2">
          <div className="flex gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-red-500/70" />
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500/70" />
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/70" />
          </div>
          <div className="flex items-center gap-1.5 ml-2">
            <Terminal className="w-3.5 h-3.5 text-amber-400" />
            <span className="text-zinc-400 text-[10px] tracking-widest uppercase">
              Hermes OS Terminal
            </span>
            {isBooted && (
              <span className="flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[9px] font-bold">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                ONLINE
              </span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          {speechSupported && (
            <span className="text-[9px] text-zinc-600 uppercase tracking-wider flex items-center gap-1">
              <Volume2 className="w-3 h-3" />
              WHISPER
            </span>
          )}
          <button
            onClick={() => {
              setLines([{ id: uid(), type: 'system', content: 'Terminal limpiada.', timestamp: ts() }]);
              setIsBooted(false);
            }}
            className="p-1 rounded-lg hover:bg-white/5 text-zinc-600 hover:text-zinc-300 transition-colors"
            title="Reiniciar terminal"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Output area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-2 select-text min-h-0">
        {lines.map((line) => (
          <motion.div
            key={line.id}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.15 }}
            className="leading-relaxed"
          >
            {line.type === 'input' ? (
              <span className={LINE_COLORS[line.type]}>{line.content}</span>
            ) : (
              <pre
                className={`whitespace-pre-wrap font-mono leading-relaxed ${LINE_COLORS[line.type]}`}
              >
                {line.content}
              </pre>
            )}
          </motion.div>
        ))}

        {/* Interim speech transcript */}
        {interim && (
          <div className="text-amber-400/60 italic flex items-center gap-1.5">
            <Mic className="w-3 h-3 animate-pulse" />
            <span>{interim}</span>
            <span className="animate-pulse">_</span>
          </div>
        )}

        {/* Loading indicator */}
        {isLoading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex items-center gap-2 text-amber-400/60"
          >
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
            <span>Hermes está procesando...</span>
          </motion.div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input row */}
      <div className="border-t border-white/10 bg-[#08080A] p-3">
        <div className="flex items-center gap-2">
          <ChevronRight className="w-3.5 h-3.5 text-amber-400 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={isBooted ? 'Escribe tu consulta a Hermes...' : 'sudo wake_up_hermes'}
            disabled={isLoading}
            className="flex-1 bg-transparent outline-none text-zinc-200 placeholder:text-zinc-600 text-xs caret-amber-400 disabled:opacity-50"
            autoComplete="off"
            spellCheck={false}
          />

          {/* Whisper button */}
          {speechSupported && (
            <button
              onClick={toggleWhisper}
              disabled={isLoading}
              className={`p-1.5 rounded-lg transition-all ${
                isListening
                  ? 'bg-red-500/20 border border-red-500/50 text-red-400 animate-pulse'
                  : 'bg-white/5 border border-white/10 text-zinc-400 hover:text-amber-400 hover:border-amber-500/30'
              } disabled:opacity-30`}
              title={isListening ? 'Detener micrófono (Whisper)' : 'Hablar a Hermes (Whisper)'}
            >
              {isListening ? <MicOff className="w-3.5 h-3.5" /> : <Mic className="w-3.5 h-3.5" />}
            </button>
          )}

          {/* Send button */}
          <button
            onClick={() => handleCommand(input)}
            disabled={isLoading || !input.trim()}
            className="p-1.5 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-400 hover:bg-amber-500/20 transition-all disabled:opacity-30"
            title="Enviar"
          >
            <Send className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Whisper status bar */}
        {isListening && (
          <div className="mt-1.5 flex items-center gap-1.5 text-[10px] text-red-400">
            <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse" />
            <span>Whisper activo — hablando...</span>
          </div>
        )}
      </div>
    </div>
  );
}
