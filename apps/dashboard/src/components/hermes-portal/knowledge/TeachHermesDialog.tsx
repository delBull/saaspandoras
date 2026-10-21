import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FileText, 
  Globe, 
  MessageCircle, 
  Building2, 
  ShieldAlert, 
  ArrowLeft, 
  Terminal, 
  LayoutGrid, 
  Send, 
  Paperclip, 
  UploadCloud, 
  CheckCircle2, 
  Sparkles, 
  Plus, 
  Trash2, 
  HelpCircle
} from 'lucide-react';
import type { KnowledgeSourceView } from '@saasfly/shared';

export interface TeachPayload {
  type: KnowledgeSourceView['type'];
  title: string;
  content: string;
}

interface TeachHermesDialogProps {
  onClose: () => void;
  onSelect: (payload: TeachPayload) => Promise<unknown> | void;
}

interface StandardOption {
  type: KnowledgeSourceView['type'];
  icon: React.ReactElement;
  title: string;
  desc: string;
}

interface FaqPair {
  id: string;
  question: string;
  answer: string;
}

export function TeachHermesDialog({ onClose, onSelect }: TeachHermesDialogProps) {
  const [mode, setMode] = useState<'SELECT_MODE' | 'STANDARD' | 'TERMINAL'>('SELECT_MODE');
  const [selectedType, setSelectedType] = useState<KnowledgeSourceView['type'] | null>(null);

  // Global Ingestion Processing State with Rich Animation
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStep, setProcessingStep] = useState<string>('');
  const [successInfo, setSuccessInfo] = useState<{ title: string; type: string } | null>(null);

  const standardOptions: StandardOption[] = [
    { type: 'DOCUMENT', icon: <FileText className="w-5 h-5" />, title: 'Documento / Archivo', desc: 'Sube PDF, TXT, MD, CSV, JSON o arrastra directamente' },
    { type: 'URL', icon: <Globe className="w-5 h-5" />, title: 'Página Web / URL', desc: 'Hermes analiza y extrae conocimiento desde enlaces' },
    { type: 'FAQ', icon: <MessageCircle className="w-5 h-5" />, title: 'Teach FAQ (Preguntas y Respuestas)', desc: 'Estructura preguntas frecuentes y respuestas o copia y pega' },
    { type: 'BUSINESS_INFO', icon: <Building2 className="w-5 h-5" />, title: 'Información del Negocio', desc: 'Describe tu modelo comercial, catálogo, precios y servicios' },
    { type: 'BUSINESS_RULE', icon: <ShieldAlert className="w-5 h-5" />, title: 'Reglas de Operación', desc: 'Políticas de reembolso, escalamiento, límites y excepciones' }
  ];

  const handleExecuteIngestion = async (payload: TeachPayload) => {
    setIsProcessing(true);
    setSuccessInfo(null);
    setProcessingStep('Hermes analizando conocimiento...');

    const timer1 = setTimeout(() => {
      setProcessingStep('Extrayendo entidades semánticas y clasificando...');
    }, 700);

    const timer2 = setTimeout(() => {
      setProcessingStep('Anclando datos en el Sovereign Knowledge Vault (K25)...');
    }, 1400);

    try {
      await onSelect(payload);
      clearTimeout(timer1);
      clearTimeout(timer2);
      setProcessingStep('¡Conocimiento integrado exitosamente!');
      setSuccessInfo({ title: payload.title, type: payload.type });

      // Keep success state briefly so user sees the confirmation animation
      setTimeout(() => {
        setIsProcessing(false);
        onClose();
      }, 1400);
    } catch (err) {
      clearTimeout(timer1);
      clearTimeout(timer2);
      setIsProcessing(false);
      console.error('Error al inyectar conocimiento a Hermes:', err);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={() => { if (!isProcessing) onClose(); }}
        className="absolute inset-0 bg-black/75 backdrop-blur-md"
      />
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="relative w-full max-w-2xl bg-[#09090E] border border-white/10 rounded-2xl shadow-[0_0_50px_rgba(0,0,0,0.8)] overflow-hidden flex flex-col max-h-[90vh]"
      >
        {/* Processing Overlay Animation */}
        <AnimatePresence>
          {isProcessing && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 z-50 bg-[#09090E]/95 backdrop-blur-md flex flex-col items-center justify-center p-8 text-center"
            >
              <div className="relative mb-6">
                <div className="w-20 h-20 rounded-full border-2 border-purple-500/30 border-t-purple-400 animate-spin" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <Sparkles className="w-8 h-8 text-purple-400 animate-pulse" />
                </div>
              </div>
              
              <h3 className="text-xl font-medium text-white mb-2">
                {successInfo ? 'Conocimiento Recibido' : 'Hermes Ingesting Knowledge'}
              </h3>
              
              <p className="text-sm text-purple-300 font-mono animate-pulse max-w-md">
                {processingStep}
              </p>

              {successInfo && (
                <motion.div 
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="mt-4 flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-mono"
                >
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>{successInfo.title}</span>
                </motion.div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence mode="wait">
          {mode === 'SELECT_MODE' && (
            <motion.div
              key="select-mode"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <div className="p-6 border-b border-white/5 flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-light text-white mb-1">Teach Hermes</h2>
                  <p className="text-white/60 text-sm">Elige la modalidad de entrada para alimentar la memoria del agente.</p>
                </div>
                <div className="p-3 rounded-xl bg-purple-500/10 border border-purple-500/20">
                  <Terminal className="w-6 h-6 text-purple-400" />
                </div>
              </div>
              
              <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={() => setMode('TERMINAL')}
                  className="flex flex-col items-center justify-center gap-4 p-8 rounded-xl border border-white/5 bg-white/[0.02] hover:bg-white/[0.06] hover:border-purple-500/30 transition-all text-center group cursor-pointer"
                >
                  <div className="p-4 rounded-full bg-black/50 text-white/60 group-hover:text-purple-400 group-hover:bg-purple-500/10 border border-white/5 transition-colors">
                    <Terminal className="w-8 h-8" />
                  </div>
                  <div>
                    <div className="text-white/90 font-medium mb-1">Nexus Terminal</div>
                    <div className="text-sm text-white/50 px-4">CLI conversacional interactivo para subir archivos, pegar enlaces o dictar conocimiento.</div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setMode('STANDARD')}
                  className="flex flex-col items-center justify-center gap-4 p-8 rounded-xl border border-white/5 bg-white/[0.02] hover:bg-white/[0.06] hover:border-emerald-500/30 transition-all text-center group cursor-pointer"
                >
                  <div className="p-4 rounded-full bg-black/50 text-white/60 group-hover:text-emerald-400 group-hover:bg-emerald-500/10 border border-white/5 transition-colors">
                    <LayoutGrid className="w-8 h-8" />
                  </div>
                  <div>
                    <div className="text-white/90 font-medium mb-1">Interfaz Estándar</div>
                    <div className="text-sm text-white/50 px-4">Formularios guiados y estructurados para subir documentos, FAQs, URLs y reglas.</div>
                  </div>
                </button>
              </div>
              
              <div className="p-4 border-t border-white/5 bg-white/[0.01] flex justify-end">
                <button 
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-white/60 hover:text-white transition-colors cursor-pointer text-sm"
                >
                  Cancelar
                </button>
              </div>
            </motion.div>
          )}

          {mode === 'STANDARD' && !selectedType && (
            <motion.div
              key="standard-selection"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <div className="p-6 border-b border-white/5 flex items-center gap-4">
                <button 
                  type="button"
                  onClick={() => setMode('SELECT_MODE')} 
                  className="p-2 -ml-2 rounded-lg text-white/40 hover:text-white/90 hover:bg-white/5 transition-all cursor-pointer"
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>
                <div>
                  <h2 className="text-xl font-light text-white mb-0.5">Entrada Estándar</h2>
                  <p className="text-xs text-white/60">Selecciona el tipo de conocimiento que deseas inyectar a Hermes.</p>
                </div>
              </div>
              
              <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-3.5 max-h-[60vh] overflow-y-auto">
                {standardOptions.map(opt => (
                  <button
                    key={opt.type}
                    type="button"
                    onClick={() => setSelectedType(opt.type)}
                    className="flex items-start gap-4 p-4 rounded-xl border border-white/5 bg-white/[0.02] hover:bg-white/[0.06] hover:border-emerald-500/30 transition-all text-left group cursor-pointer"
                  >
                    <div className="p-3 rounded-lg bg-black/50 text-white/60 group-hover:text-emerald-400 border border-white/5 transition-colors shrink-0">
                      {opt.icon}
                    </div>
                    <div>
                      <div className="text-white/90 font-medium text-sm mb-1">{opt.title}</div>
                      <div className="text-xs text-white/50 leading-relaxed">{opt.desc}</div>
                    </div>
                  </button>
                ))}
              </div>
            </motion.div>
          )}

          {mode === 'STANDARD' && selectedType && (
            <motion.div
              key="standard-form"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="flex flex-col h-full overflow-hidden"
            >
              <TeachForm 
                type={selectedType} 
                onBack={() => setSelectedType(null)} 
                onSubmit={handleExecuteIngestion}
              />
            </motion.div>
          )}

          {mode === 'TERMINAL' && (
             <motion.div
              key="terminal-mode"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="flex flex-col h-[600px] max-h-[85vh]"
            >
              <TeachTerminal onBack={() => setMode('SELECT_MODE')} onSubmit={handleExecuteIngestion} />
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}

// --------------------------------------------------------------------------
// Standard Form Component with URL styling, FAQ Q&A builder, and File Drop
// --------------------------------------------------------------------------

function TeachForm({ 
  type, 
  onBack, 
  onSubmit 
}: { 
  type: KnowledgeSourceView['type']; 
  onBack: () => void; 
  onSubmit: (payload: TeachPayload) => void;
}) {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  
  // Specific states for File upload
  const [fileName, setFileName] = useState<string | null>(null);
  const [fileSize, setFileSize] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Specific state for FAQ builder
  const [faqMode, setFaqMode] = useState<'structured' | 'freeform'>('structured');
  const [faqPairs, setFaqPairs] = useState<FaqPair[]>([
    { id: '1', question: '', answer: '' },
  ]);

  const handleFile = (file: File) => {
    setFileName(file.name);
    setFileSize(`${(file.size / 1024).toFixed(1)} KB`);
    if (!title.trim()) {
      setTitle(file.name.replace(/\.[^/.]+$/, ''));
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = (e.target?.result as string) || '';
      setContent(text);
    };
    reader.readAsText(file);
  };

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const onDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    const droppedFile = e.dataTransfer.files?.[0];
    if (droppedFile) {
      handleFile(droppedFile);
    }
  };

  // FAQ item helpers
  const addFaqPair = () => {
    setFaqPairs(prev => [...prev, { id: String(Date.now()), question: '', answer: '' }]);
  };

  const removeFaqPair = (id: string) => {
    if (faqPairs.length <= 1) return;
    setFaqPairs(prev => prev.filter(p => p.id !== id));
  };

  const updateFaqQuestion = (id: string, q: string) => {
    setFaqPairs(prev => prev.map(p => p.id === id ? { ...p, question: q } : p));
  };

  const updateFaqAnswer = (id: string, a: string) => {
    setFaqPairs(prev => prev.map(p => p.id === id ? { ...p, answer: a } : p));
  };

  const getFormTitle = () => {
    switch (type) {
      case 'DOCUMENT': return 'Cargar Documento';
      case 'URL': return 'Aprender desde URL';
      case 'FAQ': return 'Enseñar Preguntas Frecuentes (FAQ)';
      case 'BUSINESS_INFO': return 'Información del Negocio';
      case 'BUSINESS_RULE': return 'Reglas y Políticas';
      default: return 'Enseñar a Hermes';
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    let finalContent = content;
    if (type === 'FAQ' && faqMode === 'structured') {
      const compiled = faqPairs
        .filter(p => p.question.trim() || p.answer.trim())
        .map((p, idx) => `[Q${idx + 1}]: ${p.question.trim()}\n[A${idx + 1}]: ${p.answer.trim()}`)
        .join('\n\n');
      finalContent = compiled;
    }

    if (title.trim() && finalContent.trim()) {
      onSubmit({ type, title: title.trim(), content: finalContent.trim() });
    }
  };

  const isFormValid = () => {
    if (!title.trim()) return false;
    if (type === 'FAQ' && faqMode === 'structured') {
      return faqPairs.some(p => p.question.trim() && p.answer.trim());
    }
    return Boolean(content.trim());
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col h-full overflow-hidden">
      {/* Hidden file input */}
      <input 
        id="standard-file-input"
        ref={fileInputRef} 
        type="file" 
        className="hidden" 
        accept=".txt,.md,.markdown,.csv,.json,.pdf,.html"
        onChange={(e) => {
          const pickedFile = e.target.files?.[0];
          if (pickedFile) {
            handleFile(pickedFile);
          }
        }}
      />

      <div className="p-6 border-b border-white/5 flex items-center gap-4 shrink-0">
        <button 
          type="button"
          onClick={onBack}
          className="p-2 -ml-2 rounded-lg text-white/40 hover:text-white/90 hover:bg-white/5 transition-all cursor-pointer"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h2 className="text-xl font-medium text-white">{getFormTitle()}</h2>
          <p className="text-xs text-white/50">
            {type === 'URL' && 'Ingresa una URL pública o documentación de referencia.'}
            {type === 'DOCUMENT' && 'Carga archivos de texto, Markdown, JSON o arrástralos directamente.'}
            {type === 'FAQ' && 'Organiza preguntas y respuestas directas que Hermes responderá con precisión.'}
            {type === 'BUSINESS_INFO' && 'Describe tu catálogo, precios, horarios y propuesta de valor.'}
            {type === 'BUSINESS_RULE' && 'Define qué puede o no puede autorizar Hermes.'}
          </p>
        </div>
      </div>
      
      <div className="p-6 flex flex-col gap-5 overflow-y-auto max-h-[60vh]">
        {/* Title / Classification field */}
        <div className="space-y-1.5">
          <label htmlFor="knowledge-title-input" className="text-xs font-mono uppercase tracking-wider text-white/70">
            {type === 'FAQ' ? 'Título / Clasificación de la FAQ' : 'Título o Categoría'}
          </label>
          <input 
            id="knowledge-title-input"
            type="text" 
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-white/30 focus:outline-none focus:border-purple-500/50 transition-colors"
            placeholder={
              type === 'FAQ' 
                ? 'Ej. Preguntas Frecuentes de Inversión y Precios' 
                : type === 'URL'
                ? 'Ej. Documentación Oficial de API / Landing Page'
                : 'Ej. Resumen General del Negocio'
            }
          />
        </div>

        {/* URL SPECIFIC INPUT */}
        {type === 'URL' && (
          <div className="space-y-2">
            <label htmlFor="knowledge-url-input" className="text-xs font-mono uppercase tracking-wider text-white/70">
              URL de la fuente (Web / Landing / Documentación)
            </label>
            <div className="flex items-center gap-3 bg-black/60 border border-white/10 rounded-xl px-4 py-3 focus-within:border-emerald-500/50 focus-within:ring-1 focus-within:ring-emerald-500/30 transition-all">
              <Globe className="w-5 h-5 text-emerald-400 shrink-0" />
              <input 
                id="knowledge-url-input"
                type="url"
                required
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="https://ejemplo.com/precios-o-faq"
                className="w-full bg-transparent text-sm text-white placeholder-white/30 focus:outline-none font-mono"
              />
            </div>
            <p className="text-[11px] text-white/40">
              Hermes visitará la página, extraerá el contenido relevante y construirá el grafo de memoria para responder a clientes.
            </p>
          </div>
        )}

        {/* DOCUMENT SPECIFIC INPUT */}
        {type === 'DOCUMENT' && (
          <div className="space-y-2">
            <label htmlFor="standard-file-input" className="text-xs font-mono uppercase tracking-wider text-white/70">
              Archivo o Documento
            </label>
            <button 
              type="button"
              onClick={() => fileInputRef.current?.click()}
              onDragOver={onDragOver}
              onDragLeave={onDragLeave}
              onDrop={onDrop}
              className={`w-full min-h-[160px] p-6 rounded-xl border-2 border-dashed flex flex-col items-center justify-center text-center cursor-pointer transition-all ${
                isDragging 
                  ? 'border-purple-500 bg-purple-500/10' 
                  : 'border-white/10 bg-black/40 hover:bg-white/[0.03] hover:border-purple-500/40'
              }`}
            >
              <UploadCloud className="w-10 h-10 mb-2 text-purple-400/80 animate-bounce" />
              <div className="text-sm font-medium text-white/90">
                {fileName ? `Archivo seleccionado: ${fileName} (${fileSize})` : 'Haz clic para seleccionar o arrastra el documento aquí'}
              </div>
              <div className="text-xs text-white/40 mt-1">
                Formatos soportados: TXT, Markdown (.md), PDF, CSV, JSON, HTML
              </div>
              {fileName && (
                <div className="mt-3 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Contenido leído y listo para inyectar</span>
                </div>
              )}
            </button>

            {/* Optional manual fallback text preview */}
            <details className="mt-2 text-xs text-white/50">
              <summary className="cursor-pointer hover:text-white/80 transition-colors">
                Ver / editar contenido extraído en texto ({content.length} caracteres)
              </summary>
              <textarea 
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="w-full h-32 mt-2 bg-black/60 border border-white/10 rounded-xl p-3 text-white font-mono text-xs focus:outline-none focus:border-purple-500/50 resize-none"
                placeholder="Pega texto alternativo directamente si lo prefieres..."
              />
            </details>
          </div>
        )}

        {/* FAQ SPECIFIC BUILDER */}
        {type === 'FAQ' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-white/5 pb-2">
              <span className="text-xs font-mono uppercase tracking-wider text-white/70">
                Modalidad de Entrada FAQ
              </span>
              <div className="flex rounded-lg bg-black/50 p-1 border border-white/10 text-xs">
                <button
                  type="button"
                  onClick={() => setFaqMode('structured')}
                  className={`px-3 py-1 rounded-md transition-all cursor-pointer ${
                    faqMode === 'structured' 
                      ? 'bg-purple-600/30 text-purple-300 font-medium' 
                      : 'text-white/50 hover:text-white'
                  }`}
                >
                  Bloques Q&A
                </button>
                <button
                  type="button"
                  onClick={() => setFaqMode('freeform')}
                  className={`px-3 py-1 rounded-md transition-all cursor-pointer ${
                    faqMode === 'freeform' 
                      ? 'bg-purple-600/30 text-purple-300 font-medium' 
                      : 'text-white/50 hover:text-white'
                  }`}
                >
                  Copiar y Pegar Libre
                </button>
              </div>
            </div>

            {faqMode === 'structured' ? (
              <div className="space-y-3.5">
                {faqPairs.map((pair, index) => (
                  <div 
                    key={pair.id} 
                    className="p-4 rounded-xl border border-white/5 bg-white/[0.02] space-y-3 relative group"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-mono text-purple-400 font-semibold flex items-center gap-1.5">
                        <MessageCircle className="w-3.5 h-3.5" />
                        PREGUNTA #{index + 1}
                      </span>
                      {faqPairs.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeFaqPair(pair.id)}
                          className="text-white/30 hover:text-red-400 transition-colors p-1 cursor-pointer"
                          title="Eliminar este bloque Q&A"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>

                    <div className="space-y-1">
                      <label htmlFor={`faq-q-${pair.id}`} className="text-[11px] text-white/50 font-mono block">
                        Q (Pregunta):
                      </label>
                      <input 
                        id={`faq-q-${pair.id}`}
                        type="text"
                        value={pair.question}
                        onChange={(e) => updateFaqQuestion(pair.id, e.target.value)}
                        placeholder="Ej. ¿Cuál es la inversión mínima para participar?"
                        className="w-full bg-black/50 border border-white/10 rounded-lg px-3 py-2 text-xs text-white placeholder-white/30 focus:outline-none focus:border-purple-500/50"
                      />
                    </div>

                    <div className="space-y-1">
                      <label htmlFor={`faq-a-${pair.id}`} className="text-[11px] text-white/50 font-mono block">
                        A (Respuesta):
                      </label>
                      <textarea 
                        id={`faq-a-${pair.id}`}
                        value={pair.answer}
                        onChange={(e) => updateFaqAnswer(pair.id, e.target.value)}
                        placeholder="Ej. La inversión mínima es de 10,000 USD y se liquida en cuotas de USDC."
                        className="w-full h-16 bg-black/50 border border-white/10 rounded-lg px-3 py-2 text-xs text-white placeholder-white/30 focus:outline-none focus:border-purple-500/50 resize-none leading-relaxed"
                      />
                    </div>
                  </div>
                ))}

                <button
                  type="button"
                  onClick={addFaqPair}
                  className="w-full py-2.5 rounded-xl border border-dashed border-white/10 text-white/60 hover:text-white hover:border-purple-500/40 hover:bg-white/[0.02] text-xs font-mono flex items-center justify-center gap-2 transition-all cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Añadir otra Pregunta y Respuesta</span>
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="p-3 rounded-lg bg-purple-500/10 border border-purple-500/20 text-xs text-purple-300">
                  <div className="font-semibold mb-1 flex items-center gap-1.5">
                    <HelpCircle className="w-4 h-4" />
                    Formato recomendado para que Hermes lo entienda:
                  </div>
                  <pre className="font-mono text-[11px] text-white/80 bg-black/40 p-2 rounded mt-1 overflow-x-auto">
{`Q: ¿Cuál es el horario de atención?
A: De lunes a viernes de 9:00 a 18:00 hrs.

Q: ¿Hacen envíos a todo México?
A: Sí, contamos con cobertura nacional.`}
                  </pre>
                </div>

                <label htmlFor="faq-freeform-textarea" className="sr-only">
                  Preguntas y Respuestas en texto libre
                </label>
                <textarea 
                  id="faq-freeform-textarea"
                  required
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  className="w-full h-44 bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/30 focus:outline-none focus:border-purple-500/50 resize-none font-mono text-xs leading-relaxed"
                  placeholder="Pega aquí tus preguntas y respuestas en cualquier formato legible..."
                />
              </div>
            )}
          </div>
        )}

        {/* BUSINESS_INFO & BUSINESS_RULE INPUT */}
        {(type === 'BUSINESS_INFO' || type === 'BUSINESS_RULE') && (
          <div className="space-y-2 flex-grow">
            <label htmlFor="knowledge-detailed-content" className="text-xs font-mono uppercase tracking-wider text-white/70">
              Contenido Detallado
            </label>
            <textarea 
              id="knowledge-detailed-content"
              required
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="w-full h-44 bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/30 focus:outline-none focus:border-purple-500/50 resize-none font-mono text-xs leading-relaxed"
              placeholder={
                type === 'BUSINESS_INFO'
                  ? 'Describe a qué se dedica tu empresa, qué productos o fracciones ofrece, precios aproximados y valores de marca...'
                  : 'Describe reglas explícitas de operación: Ej. "Si un cliente solicita reembolso después de 30 días, remitir con soporte humano", etc.'
              }
            />
          </div>
        )}
      </div>
      
      {/* Footer CTA */}
      <div className="p-4 border-t border-white/5 bg-white/[0.01] flex justify-end gap-3 mt-auto shrink-0">
        <button 
          type="button"
          onClick={onBack}
          className="px-4 py-2 text-white/60 hover:text-white transition-colors cursor-pointer text-sm"
        >
          Atrás
        </button>
        <button 
          type="submit"
          disabled={!isFormValid()}
          className="px-6 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 disabled:opacity-40 disabled:pointer-events-none text-white rounded-xl font-medium transition-all shadow-lg text-sm flex items-center gap-2 cursor-pointer"
        >
          <Sparkles className="w-4 h-4" />
          <span>Inyectar a Hermes</span>
        </button>
      </div>
    </form>
  );
}

// --------------------------------------------------------------------------
// Teach Terminal Component with Native File Picker & Drag-and-Drop
// --------------------------------------------------------------------------

function TeachTerminal({ 
  onBack, 
  onSubmit 
}: { 
  onBack: () => void; 
  onSubmit: (payload: TeachPayload) => void;
}) {
  const [messages, setMessages] = useState<{role: 'system' | 'user', text: string}[]>([
    { role: 'system', text: 'Hermes Nexus Terminal v1.1.0-sovereign' },
    { role: 'system', text: 'Arrastra archivos a esta ventana, haz clic en el clip 📎 para examinar documentos, o escribe conocimiento libre.' },
  ]);
  const [input, setInput] = useState('');
  const [isTerminalDragging, setIsTerminalDragging] = useState(false);
  const terminalFileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = () => {
    if (!input.trim()) return;
    
    const currentInput = input;
    setMessages(prev => [...prev, { role: 'user', text: currentInput }]);
    setInput('');

    setMessages(prev => [...prev, { role: 'system', text: `Analizando entrada y clasificando semántica...` }]);
    
    setTimeout(() => {
      let type: KnowledgeSourceView['type'] = 'BUSINESS_INFO';
      if (currentInput.startsWith('http://') || currentInput.startsWith('https://')) type = 'URL';
      else if (currentInput.includes('?') || currentInput.toLowerCase().includes('faq')) type = 'FAQ';
      else if (currentInput.length > 200) type = 'DOCUMENT';

      onSubmit({
        type,
        title: `Terminal Ingest (${type}) - ${new Date().toLocaleTimeString()}`,
        content: currentInput
      });
    }, 600);
  };

  const handleTerminalFile = (file: File) => {
    setMessages(prev => [
      ...prev, 
      { role: 'user', text: `[Archivo cargado: ${file.name} (${(file.size / 1024).toFixed(1)} KB)]` }
    ]);
    
    setMessages(prev => [
      ...prev, 
      { role: 'system', text: `Extrayendo texto de ${file.name} y procesando para Hermes...` }
    ]);

    const reader = new FileReader();
    reader.onload = (e) => {
      const text = (e.target?.result as string) || '';
      setTimeout(() => {
        onSubmit({
          type: 'DOCUMENT',
          title: `Documento: ${file.name}`,
          content: text.trim() || `Contenido de archivo ${file.name}`
        });
      }, 600);
    };
    reader.readAsText(file);
  };

  return (
    <div 
      className="flex flex-col h-full bg-[#0C0C12] relative overflow-hidden"
      onDragOver={(e) => {
        e.preventDefault();
        setIsTerminalDragging(true);
      }}
      onDragLeave={(e) => {
        e.preventDefault();
        setIsTerminalDragging(false);
      }}
      onDrop={(e) => {
        e.preventDefault();
        setIsTerminalDragging(false);
        const droppedTerminalFile = e.dataTransfer.files?.[0];
        if (droppedTerminalFile) {
          handleTerminalFile(droppedTerminalFile);
        }
      }}
    >
      {/* Hidden file input for Terminal Paperclip */}
      <input 
        id="terminal-file-input"
        ref={terminalFileInputRef} 
        type="file" 
        className="hidden" 
        accept=".txt,.md,.markdown,.csv,.json,.pdf,.html"
        onChange={(e) => {
          const pickedTerminalFile = e.target.files?.[0];
          if (pickedTerminalFile) {
            handleTerminalFile(pickedTerminalFile);
          }
        }}
      />

      {/* Drag Over Overlay */}
      {isTerminalDragging && (
        <div className="absolute inset-0 z-30 bg-purple-950/80 backdrop-blur-sm border-2 border-dashed border-purple-400 flex flex-col items-center justify-center pointer-events-none">
          <UploadCloud className="w-12 h-12 text-purple-300 animate-bounce mb-2" />
          <div className="text-white font-mono text-sm font-semibold">Suelta el archivo aquí para inyectarlo en Hermes</div>
        </div>
      )}

      {/* Header */}
      <div className="p-4 border-b border-white/5 flex items-center justify-between bg-black/30 shrink-0">
        <div className="flex items-center gap-3">
          <button 
            type="button"
            onClick={onBack}
            className="p-1.5 -ml-1 rounded-lg text-white/40 hover:text-white/90 hover:bg-white/5 transition-all cursor-pointer"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2">
            <Terminal className="w-4 h-4 text-purple-400" />
            <span className="text-sm font-mono text-white/90">nexus@hermes:~/knowledge</span>
          </div>
        </div>
        <div className="text-[11px] font-mono text-white/40 hidden sm:block">
          Presiona Enter para enviar
        </div>
      </div>

      {/* Console output */}
      <div className="flex-1 overflow-y-auto p-6 font-mono text-xs sm:text-sm space-y-4">
        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[85%] rounded-xl px-4 py-3 leading-relaxed ${
              msg.role === 'user' 
                ? 'bg-purple-600/20 text-purple-100 border border-purple-500/30' 
                : 'bg-white/5 text-emerald-300/90 border border-white/10'
            }`}>
              {msg.role === 'system' && <span className="text-emerald-500 mr-2 font-bold">❯</span>}
              {msg.text}
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input row */}
      <div className="p-4 border-t border-white/5 bg-black/40 shrink-0">
        <div className="flex items-center gap-2 bg-black/60 border border-white/10 rounded-xl p-2 focus-within:border-purple-500/50 transition-colors">
          <button 
            type="button"
            onClick={() => terminalFileInputRef.current?.click()}
            title="Subir archivo o documento (PDF, TXT, MD, CSV, JSON)"
            className="p-2 text-white/50 hover:text-purple-300 hover:bg-white/5 rounded-lg transition-colors cursor-pointer"
          >
            <Paperclip className="w-4 h-4" />
          </button>
          <label htmlFor="terminal-chat-input" className="sr-only">
            Escribe conocimiento o pega una URL
          </label>
          <input
            id="terminal-chat-input"
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Escribe conocimiento, pega una URL o sube un documento..."
            className="flex-1 bg-transparent text-white placeholder-white/30 focus:outline-none text-xs sm:text-sm font-mono"
          />
          <button 
            type="button"
            onClick={handleSend}
            disabled={!input.trim()}
            className="p-2 text-white hover:text-purple-400 disabled:opacity-40 disabled:hover:text-white transition-colors bg-purple-600/20 hover:bg-purple-600/30 border border-purple-500/30 rounded-lg cursor-pointer"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
