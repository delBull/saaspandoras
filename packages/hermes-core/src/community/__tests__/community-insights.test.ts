import { describe, it, expect } from 'vitest';
import {
  analyzeModeration,
  buildCommunityHealth,
  type CommunityMessage,
} from '../community-insights';

function message(overrides: Partial<CommunityMessage> & { id: string }): CommunityMessage {
  return {
    id: overrides.id,
    channel: overrides.channel ?? 's-narai-preguntas',
    authorId: overrides.authorId ?? 'u1',
    authorName: overrides.authorName ?? 'Marco',
    content: overrides.content ?? '',
    createdAt: overrides.createdAt ?? '2026-11-20T10:00:00.000Z',
    isBot: overrides.isBot ?? false,
  };
}

describe('Community insights · moderación', () => {
  it('marca invitaciones a otros servidores y promesas prohibidas', () => {
    const findings = analyzeModeration([
      message({ id: '1', content: 'entra a discord.gg/otro-servidor' }),
      message({ id: '2', content: 'duplica tu capital en 7 días' }),
      message({ id: '3', content: 'te doy rendimiento garantizado' }),
    ]);

    const reasons = findings.map((f) => f.reason);
    expect(reasons).toContain('Invita a otro servidor de Discord');
    expect(reasons).toContain('Promesa de duplicar capital');
    expect(reasons).toContain('Garantía de rendimiento (prohibida)');
    expect(findings.every((f) => f.severity === 'HIGH')).toBe(true);
  });

  it('marca enlaces externos como LOW y no marca los propios', () => {
    const findings = analyzeModeration([
      message({ id: '1', content: 'mira https://snarai.aztecaz.xyz/planes' }),
      message({ id: '2', content: 'mira https://sitio-desconocido.example/x' }),
    ]);

    expect(findings).toHaveLength(1);
    expect(findings[0]!.severity).toBe('LOW');
    expect(findings[0]!.reason).toContain('sitio-desconocido.example');
  });

  it('detecta el mismo mensaje repetido tres veces, una sola vez', () => {
    const spam = 'Tenemos una oportunidad increíble para ti hoy mismo';
    const findings = analyzeModeration([
      message({ id: '1', content: spam }),
      message({ id: '2', content: spam }),
      message({ id: '3', content: spam }),
      message({ id: '4', content: spam }),
    ]);

    const repeated = findings.filter((f) => f.reason.includes('repetido'));
    expect(repeated).toHaveLength(1);
    expect(repeated[0]!.severity).toBe('MEDIUM');
  });

  it('ignora mensajes de bots', () => {
    const findings = analyzeModeration([
      message({ id: '1', content: 'discord.gg/scam', isBot: true }),
    ]);
    expect(findings).toHaveLength(0);
  });
});

describe('Community insights · salud', () => {
  it('cuenta preguntas sin respuesta de otro autor', () => {
    const health = buildCommunityHealth(
      [
        message({ id: '1', authorId: 'u1', content: '¿Cuántas estancias incluye?', createdAt: '2026-11-20T10:00:00.000Z' }),
        message({ id: '2', authorId: 'u1', content: '¿Y el título es transferible?', createdAt: '2026-11-20T11:00:00.000Z' }),
      ],
      Date.parse('2026-11-20T13:00:00.000Z'),
    );

    expect(health.questions).toBe(2);
    expect(health.unansweredQuestions).toBe(2);
    expect(health.oldestUnansweredHours).toBe(3);
    expect(health.authors).toBe(1);
  });

  it('no cuenta como sin respuesta si contesta otra persona', () => {
    const health = buildCommunityHealth(
      [
        message({ id: '1', authorId: 'u1', content: '¿Cómo funciona?', createdAt: '2026-11-20T10:00:00.000Z' }),
        message({ id: '2', authorId: 'u2', content: 'Te explico por aquí', createdAt: '2026-11-20T11:00:00.000Z' }),
      ],
      Date.parse('2026-11-20T13:00:00.000Z'),
    );

    expect(health.questions).toBe(1);
    expect(health.unansweredQuestions).toBe(0);
    expect(health.oldestUnansweredHours).toBeNull();
  });

  it('excluye bots del conteo de mensajes y autores', () => {
    const health = buildCommunityHealth(
      [
        message({ id: '1', authorId: 'u1' }),
        message({ id: '2', authorId: 'bot1', isBot: true }),
      ],
      Date.parse('2026-11-20T13:00:00.000Z'),
    );

    expect(health.messages).toBe(1);
    expect(health.authors).toBe(1);
  });
});
