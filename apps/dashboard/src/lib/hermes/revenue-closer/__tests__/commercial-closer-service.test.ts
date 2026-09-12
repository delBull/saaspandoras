import { describe, it, expect } from 'vitest';
import { CommercialCloserService } from '../commercial-closer-service';
import { HermesSoulRegistry } from '../../soul/snarai-soul';

describe('CommercialCloserService — Production Wiring Certification', () => {
  it('detects buy intent and provides official S\'Narai checkout URL', async () => {
    const result = await CommercialCloserService.evaluateInbound({
      tenantSlug: 'snarai',
      leadId: '+523312345678',
      messageText: 'Hola, me interesa comprar 2 títulos de inversión en S\'Narai. ¿Cuál es el precio y cómo aparto?',
      channel: 'whatsapp',
      leadName: 'Inversionista Guadalajara',
    });

    expect(result.qualification.newStage).toBe('HIGH_INTENT');
    expect(result.recommendedCallToAction).toBeDefined();
    expect(result.recommendedCallToAction?.type).toBe('CHECKOUT');
    expect(result.recommendedCallToAction?.url).toBe('https://dash.pandoras.finance/pay/snarai/fundador');
  });

  it('detects booking intent and triggers executive handoff with canonical calendar URL', async () => {
    const result = await CommercialCloserService.evaluateInbound({
      tenantSlug: 'snarai',
      leadId: '+525587654321',
      messageText: 'Quiero agendar una reunión o llamada por Zoom con los fundadores para revisar el proyecto',
      channel: 'telegram',
      leadName: 'Dr. Roberto Mendoza',
    });

    expect(result.qualification.newStage).toBe('READY_TO_BOOK');
    expect(result.nextBestAction.action).toBe('PROPOSE_MEETING');
    expect(result.recommendedCallToAction?.type).toBe('MEETING');
    expect(result.recommendedCallToAction?.url).toBe('https://dash.pandoras.finance/events/snarai/1');
    expect(result.executiveHandoff).toBeDefined();
    expect(result.executiveHandoff?.contactIdentifier).toBe('+525587654321');
    expect(result.executiveHandoff?.primaryChannel).toBe('telegram');
  });

  it('detects real estate legal objection and resolves doctrine with Safe Harbor prefix', async () => {
    const result = await CommercialCloserService.evaluateInbound({
      tenantSlug: 'snarai',
      leadId: 'tg_user_9921',
      messageText: '¿Qué certeza legal tengo? ¿Hay fideicomiso o escritura pública para respaldar mi inversión?',
      channel: 'telegram',
    });

    expect(result.doctrinalGuidance).toBeDefined();
    expect(result.doctrinalGuidance?.category).toBe('LEGAL_CERTAINTY');
    expect(result.doctrinalGuidance?.responseStrategy).toContain('Con base en la documentación oficial y expedientes aprobados');
    expect(result.doctrinalGuidance?.responseStrategy).toContain('Aztecas Hub');
  });

  it('preserves HermesSoulRegistry canonical URLs without hallucinating domains', () => {
    const soul = HermesSoulRegistry.getSoul('snarai');
    expect(soul).toBeDefined();
    expect(soul?.canonicalUrls.calendar).toBe('https://dash.pandoras.finance/events/snarai/1');
    expect(soul?.canonicalUrls.checkout).toBe('https://dash.pandoras.finance/pay/snarai/fundador');
    expect(soul?.agentName).toBe('Hermes Patrimonial');
  });
});
