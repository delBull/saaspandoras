import { describe, it, expect, vi, beforeEach } from 'vitest';
import { EscalationService } from '../escalation-service';
import { db } from '@/db';

vi.mock('@/db', () => {
  const mockInsert = vi.fn();
  const mockUpdate = vi.fn();
  const mockSelect = vi.fn();

  return {
    db: {
      insert: mockInsert,
      update: mockUpdate,
      select: mockSelect,
    },
  };
});

describe('Hermes OS Sprint 1 — Human-in-the-Loop Operator Inbox Service', () => {
  const tenantId = 'snarai';
  const conversationId = 'conv_telegram_123';

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('E01: should trigger escalation, pause conversation to PAUSED_HUMAN and insert escalation record', async () => {
    const mockEscalation = {
      id: 'esc-uuid-1',
      organizationId: tenantId,
      conversationId,
      actorId: 'lead_0xabc',
      channel: 'TELEGRAM',
      reason: 'USER_REQUEST',
      status: 'PENDING',
      createdAt: new Date(),
    };

    const updateSet = vi.fn().mockReturnValue({
      where: vi.fn().mockResolvedValue([{ count: 1 }]),
    });
    (db.update as any).mockReturnValue({ set: updateSet });

    const insertValues = vi.fn().mockReturnValue({
      returning: vi.fn().mockResolvedValue([mockEscalation]),
    });
    (db.insert as any).mockReturnValue({ values: insertValues });

    const res = await EscalationService.triggerEscalation({
      organizationId: tenantId,
      conversationId,
      actorId: 'lead_0xabc',
      channel: 'TELEGRAM',
      reason: 'USER_REQUEST',
      notes: 'Prospecto pidió hablar con un humano.',
    });

    expect(db.update).toHaveBeenCalled();
    expect(updateSet).toHaveBeenCalledWith(
      expect.objectContaining({
        status: 'PAUSED_HUMAN',
        escalationReason: 'USER_REQUEST',
      })
    );
    expect(res).toEqual(mockEscalation);
  });

  it('E02: should allow human operator to reply with role OPERATOR and advance status to IN_PROGRESS', async () => {
    const mockEscalation = {
      id: 'esc-uuid-1',
      organizationId: tenantId,
      conversationId,
      status: 'PENDING',
    };

    const mockMessage = {
      id: 'msg-uuid-operator',
      organizationId: tenantId,
      conversationId,
      role: 'OPERATOR',
      content: 'Hola, soy el director comercial de S\'Narai. ¿En qué te puedo ayudar?',
      sequence: 3,
    };

    // Mock select escalation
    (db.select as any).mockReturnValueOnce({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockResolvedValue([mockEscalation]),
      }),
    });

    // Mock select existing sequence
    (db.select as any).mockReturnValueOnce({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          orderBy: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([{ sequence: 2 }]),
          }),
        }),
      }),
    });

    // Mock insert message
    const insertValues = vi.fn().mockReturnValue({
      returning: vi.fn().mockResolvedValue([mockMessage]),
    });
    (db.insert as any).mockReturnValue({ values: insertValues });

    // Mock update escalation status to IN_PROGRESS
    const updateSet = vi.fn().mockReturnValue({
      where: vi.fn().mockResolvedValue([{ count: 1 }]),
    });
    (db.update as any).mockReturnValue({ set: updateSet });

    const res = await EscalationService.replyAsHuman({
      organizationId: tenantId,
      escalationId: 'esc-uuid-1',
      content: 'Hola, soy el director comercial de S\'Narai. ¿En qué te puedo ayudar?',
      operatorId: 'operator_marco',
    });

    expect(res!.role).toBe('OPERATOR');
    expect(res!.content).toContain('director comercial');
    expect(insertValues).toHaveBeenCalledWith(
      expect.objectContaining({
        role: 'OPERATOR',
        sequence: 3,
      })
    );
  });

  it('E03: should resume Hermes control, set conversation to ACTIVE, and mark escalation RESOLVED', async () => {
    const mockEscalation = {
      id: 'esc-uuid-1',
      organizationId: tenantId,
      conversationId,
      status: 'IN_PROGRESS',
      notes: 'Lead atendido.',
    };

    // Mock select escalation
    (db.select as any).mockReturnValueOnce({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockResolvedValue([mockEscalation]),
      }),
    });

    // Mock update conversation to ACTIVE
    const updateConvSet = vi.fn().mockReturnValue({
      where: vi.fn().mockResolvedValue([{ count: 1 }]),
    });
    (db.update as any).mockReturnValueOnce({ set: updateConvSet });

    // Mock update escalation to RESOLVED
    const updateEscSet = vi.fn().mockReturnValue({
      where: vi.fn().mockReturnValue({
        returning: vi.fn().mockResolvedValue([
          { ...mockEscalation, status: 'RESOLVED', resolvedBy: 'operator_marco' },
        ]),
      }),
    });
    (db.update as any).mockReturnValueOnce({ set: updateEscSet });

    // Mock select last sequence for system message
    (db.select as any).mockReturnValueOnce({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          orderBy: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([{ sequence: 3 }]),
          }),
        }),
      }),
    });

    // Mock insert system message
    (db.insert as any).mockReturnValue({
      values: vi.fn().mockResolvedValue([{ id: 'sys-msg-1' }]),
    });

    const res = await EscalationService.resumeHermes({
      organizationId: tenantId,
      escalationId: 'esc-uuid-1',
      operatorId: 'operator_marco',
      notes: 'Duda sobre el contrato resuelta satisfactoriamente.',
    });

    expect(updateConvSet).toHaveBeenCalledWith(
      expect.objectContaining({
        status: 'ACTIVE',
        escalationReason: null,
      })
    );
    expect(res!.status).toBe('RESOLVED');
  });
});
