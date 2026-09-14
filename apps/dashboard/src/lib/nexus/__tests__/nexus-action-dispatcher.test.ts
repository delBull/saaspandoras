import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NexusActionDispatcher } from '../nexus-action-dispatcher';
import { db } from '@/db';
import { nexusActionRequests, nexusCollaborators } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { resolveEffectivePermissions } from '../nexus-rbac';

vi.mock('@/db', () => ({
  db: {
    insert: vi.fn().mockReturnValue({ values: vi.fn() }),
    update: vi.fn().mockReturnValue({ set: vi.fn().mockReturnValue({ where: vi.fn().mockReturnValue({ returning: vi.fn().mockResolvedValue([{ id: 1 }]) }) }) }),
    query: {
      nexusCollaborators: { findFirst: vi.fn() },
      nexusActionRequests: { findFirst: vi.fn() },
    },
  },
}));

const mockTransport = {
  sendMessage: vi.fn(),
  answerCallbackQuery: vi.fn(),
  registerWebhook: vi.fn(),
};

describe('NexusActionDispatcher Adversarial Gate', () => {
  let dispatcher: NexusActionDispatcher;

  beforeEach(() => {
    vi.clearAllMocks();
    dispatcher = new NexusActionDispatcher(mockTransport as any);
  });

  it('fails if token is tampered/missing', async () => {
    (db.query.nexusCollaborators.findFirst as any).mockResolvedValueOnce({
      id: 1, telegramUserId: '123', status: 'ACTIVE', role: 'ADMIN'
    } as any);
    
    (db.query.nexusActionRequests.findFirst as any).mockResolvedValueOnce(undefined);

    await dispatcher.executeAction('wrong_token', '123', 'query1');

    expect(mockTransport.answerCallbackQuery).toHaveBeenCalledWith(
      expect.objectContaining({ text: expect.stringContaining('Acción no encontrada') })
    );
  });

  it('fails if action is expired', async () => {
    (db.query.nexusCollaborators.findFirst as any).mockResolvedValueOnce({
      id: 1, telegramUserId: '123', status: 'ACTIVE', role: 'ADMIN'
    } as any);

    (db.query.nexusActionRequests.findFirst as any).mockResolvedValueOnce({
      id: 1,
      actionToken: 'expired_token',
      status: 'PENDING',
      expiresAt: new Date(Date.now() - 10000), // Expired
      actorIdentityId: 1,
    } as any);

    await dispatcher.executeAction('expired_token', '123', 'query1');

    expect(mockTransport.answerCallbackQuery).toHaveBeenCalledWith(
      expect.objectContaining({ text: expect.stringContaining('expirado') })
    );
  });

  it('fails if actor tries to consume another actor token (binding mismatch)', async () => {
    (db.query.nexusCollaborators.findFirst as any).mockResolvedValueOnce({
      id: 2, // Different ID!
      telegramUserId: '456', status: 'ACTIVE', role: 'ADMIN'
    } as any);

    (db.query.nexusActionRequests.findFirst as any).mockResolvedValueOnce({
      id: 1,
      actionToken: 'valid_token',
      status: 'PENDING',
      expiresAt: new Date(Date.now() + 10000), 
      actorIdentityId: 1, // Assigned to 1
    } as any);

    await dispatcher.executeAction('valid_token', '456', 'query1');

    expect(mockTransport.answerCallbackQuery).toHaveBeenCalledWith(
      expect.objectContaining({ text: expect.stringContaining('otro operador') })
    );
  });

  it('fails capability authorization even if role is ADMIN (Role ≠ Authority)', async () => {
    (db.query.nexusCollaborators.findFirst as any).mockResolvedValueOnce({
      id: 1, telegramUserId: '123', status: 'ACTIVE', role: 'ADMIN',
      permissions: { 'finance.manage': false } // Explicitly revoked!
    } as any);

    (db.query.nexusActionRequests.findFirst as any).mockResolvedValueOnce({
      id: 1,
      actionToken: 'valid_token',
      status: 'PENDING',
      expiresAt: new Date(Date.now() + 10000), 
      actorIdentityId: 1,
      requiredCapability: 'finance.manage',
      actionType: 'DEPOSIT_APPROVE'
    } as any);

    await dispatcher.executeAction('valid_token', '123', 'query1');

    expect(mockTransport.answerCallbackQuery).toHaveBeenCalledWith(
      expect.objectContaining({ text: expect.stringContaining('No tienes el capability') })
    );
  });

  it('prevents double execution (replay attack)', async () => {
    (db.query.nexusCollaborators.findFirst as any).mockResolvedValueOnce({
      id: 1, telegramUserId: '123', status: 'ACTIVE', role: 'SUPER_ADMIN'
    } as any);

    (db.query.nexusActionRequests.findFirst as any).mockResolvedValueOnce({
      id: 1,
      actionToken: 'valid_token',
      status: 'COMPLETED', // Already completed
      expiresAt: new Date(Date.now() + 10000), 
      actorIdentityId: 1,
    } as any);

    await dispatcher.executeAction('valid_token', '123', 'query1');

    expect(mockTransport.answerCallbackQuery).toHaveBeenCalledWith(
      expect.objectContaining({ text: expect.stringContaining('procesada (COMPLETED)') })
    );
  });
});
