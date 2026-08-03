'use client';

import React, { useState } from 'react';

interface WizardProps {
  onComplete: (data: {
    companyName: string;
    industry: string;
    description: string;
    schedule: string;
    phone: string;
    email: string;
    services: string[];
    faqs: { question: string; answer: string }[];
  }) => void;
}

export function StarterKnowledgeWizard({ onComplete }: WizardProps) {
  const [step, setStep] = useState(1);
  const [companyName, setCompanyName] = useState('');
  const [industry, setIndustry] = useState('Real Estate');
  const [description, setDescription] = useState('');
  const [schedule, setSchedule] = useState('Lun-Vie 9:00 a 18:00 hrs');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [services, setServices] = useState<string[]>(['', '']);
  const [faqs, setFaqs] = useState<{ question: string; answer: string }[]>([
    { question: '¿Cuáles son los métodos de pago aceptados?', answer: 'Aceptamos transferencias bancarias, tarjetas de crédito y SPEI.' },
    { question: '¿Cómo puedo solicitar una cotización?', answer: 'Puedes dejar tus datos aquí o escribirnos directamente.' },
  ]);

  const handleServiceChange = (idx: number, val: string) => {
    const next = [...services];
    next[idx] = val;
    setServices(next);
  };

  const addService = () => setServices([...services, '']);

  const handleFaqChange = (idx: number, field: 'question' | 'answer', val: string) => {
    const next = [...faqs];
    if (next[idx]) {
      next[idx][field] = val;
      setFaqs(next);
    }
  };

  const addFaq = () => setFaqs([...faqs, { question: '', answer: '' }]);

  const submit = () => {
    onComplete({
      companyName,
      industry,
      description,
      schedule,
      phone,
      email,
      services: services.filter(Boolean),
      faqs: faqs.filter(f => f.question && f.answer),
    });
  };

  return (
    <div style={{ background: '#0F0F18', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 16, padding: 32, maxWidth: 640, margin: '0 auto', color: '#fff' }}>
      {/* Wizard Progress Bar */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 28 }}>
        {[1, 2, 3, 4].map(s => (
          <div key={s} style={{ flex: 1, height: 4, borderRadius: 2, background: s <= step ? 'linear-gradient(135deg,#7c3aed,#4f46e5)' : 'rgba(255,255,255,0.1)' }} />
        ))}
      </div>

      {step === 1 && (
        <div>
          <h2 style={{ fontSize: 20, margin: '0 0 8px' }}>Paso 1: Información Básica</h2>
          <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 13, margin: '0 0 20px' }}>Cuéntale a Hermes sobre tu empresa para calibrar sus respuestas.</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div>
              <label style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)', display: 'block', marginBottom: 6 }}>Nombre de la Empresa</label>
              <input value={companyName} onChange={e => setCompanyName(e.target.value)} placeholder="Ej. Patrimonial Real Estate" style={inputStyle} />
            </div>
            <div>
              <label style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)', display: 'block', marginBottom: 6 }}>Industria</label>
              <select value={industry} onChange={e => setIndustry(e.target.value)} style={inputStyle}>
                <option value="Real Estate">Real Estate / Inmobiliaria</option>
                <option value="Automotriz">Automotriz</option>
                <option value="Legal">Servicios Legales / Consultoría</option>
                <option value="SaaS">Tecnología / SaaS</option>
                <option value="Salud">Salud / Clínicas</option>
                <option value="Otro">Otro</option>
              </select>
            </div>
            <div>
              <label style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)', display: 'block', marginBottom: 6 }}>Descripción Corta</label>
              <textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="¿Qué hace tu empresa y cuál es su valor principal?" rows={3} style={{ ...inputStyle, resize: 'none' }} />
            </div>
          </div>
        </div>
      )}

      {step === 2 && (
        <div>
          <h2 style={{ fontSize: 20, margin: '0 0 8px' }}>Paso 2: Horarios y Contacto</h2>
          <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 13, margin: '0 0 20px' }}>Hermes ofrecerá estos datos cuando los clientes pregunten por atención.</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div>
              <label style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)', display: 'block', marginBottom: 6 }}>Horario de Atención</label>
              <input value={schedule} onChange={e => setSchedule(e.target.value)} placeholder="Ej. Lunes a Viernes de 9 a 18 hrs" style={inputStyle} />
            </div>
            <div>
              <label style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)', display: 'block', marginBottom: 6 }}>Teléfono / WhatsApp de Soporte</label>
              <input value={phone} onChange={e => setPhone(e.target.value)} placeholder="+52 55 1234 5678" style={inputStyle} />
            </div>
            <div>
              <label style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)', display: 'block', marginBottom: 6 }}>Email Corporativo</label>
              <input value={email} onChange={e => setEmail(e.target.value)} placeholder="contacto@empresa.com" style={inputStyle} />
            </div>
          </div>
        </div>
      )}

      {step === 3 && (
        <div>
          <h2 style={{ fontSize: 20, margin: '0 0 8px' }}>Paso 3: Servicios o Productos Principales</h2>
          <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 13, margin: '0 0 20px' }}>Menciona los servicios o productos clave que Hermes debe promover.</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {services.map((serv, i) => (
              <input key={i} value={serv} onChange={e => handleServiceChange(i, e.target.value)} placeholder={`Servicio ${i + 1}`} style={inputStyle} />
            ))}
            <button onClick={addService} type="button" style={{ background: 'transparent', border: '1px dashed rgba(255,255,255,0.2)', color: '#a78bfa', padding: '8px 12px', borderRadius: 8, cursor: 'pointer', fontSize: 12 }}>+ Agregar otro servicio</button>
          </div>
        </div>
      )}

      {step === 4 && (
        <div>
          <h2 style={{ fontSize: 20, margin: '0 0 8px' }}>Paso 4: Preguntas Frecuentes (FAQs)</h2>
          <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 13, margin: '0 0 20px' }}>Preguntas comunes de tus clientes y las respuestas exactas de Hermes.</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {faqs.map((faq, i) => (
              <div key={i} style={{ background: 'rgba(255,255,255,0.02)', padding: 12, borderRadius: 8, border: '1px solid rgba(255,255,255,0.06)' }}>
                <input value={faq.question} onChange={e => handleFaqChange(i, 'question', e.target.value)} placeholder="Pregunta" style={{ ...inputStyle, marginBottom: 8 }} />
                <textarea value={faq.answer} onChange={e => handleFaqChange(i, 'answer', e.target.value)} placeholder="Respuesta" rows={2} style={{ ...inputStyle, resize: 'none' }} />
              </div>
            ))}
            <button onClick={addFaq} type="button" style={{ background: 'transparent', border: '1px dashed rgba(255,255,255,0.2)', color: '#a78bfa', padding: '8px 12px', borderRadius: 8, cursor: 'pointer', fontSize: 12 }}>+ Agregar FAQ</button>
          </div>
        </div>
      )}

      {/* Buttons */}
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 28 }}>
        {step > 1 ? (
          <button onClick={() => setStep(step - 1)} style={{ background: 'rgba(255,255,255,0.05)', color: '#fff', border: '1px solid rgba(255,255,255,0.1)', padding: '10px 20px', borderRadius: 8, cursor: 'pointer', fontSize: 13 }}>Anterior</button>
        ) : <div />}

        {step < 4 ? (
          <button onClick={() => setStep(step + 1)} style={{ background: 'linear-gradient(135deg,#7c3aed,#4f46e5)', color: '#fff', border: 'none', padding: '10px 24px', borderRadius: 8, cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>Siguiente →</button>
        ) : (
          <button onClick={submit} style={{ background: 'linear-gradient(135deg,#10b981,#059669)', color: '#fff', border: 'none', padding: '10px 24px', borderRadius: 8, cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>Finalizar Configuración ✨</button>
        )}
      </div>
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  width: '100%',
  boxSizing: 'border-box',
  background: 'rgba(255,255,255,0.04)',
  border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: 8,
  padding: '10px 12px',
  color: '#fff',
  fontSize: 13,
  outline: 'none',
};
