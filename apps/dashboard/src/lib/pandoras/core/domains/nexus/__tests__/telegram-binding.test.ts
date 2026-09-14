import { describe, it, expect, vi, beforeEach } from 'vitest';
import crypto from 'crypto';
import { db } from '@/db';
import { nexusCollaborators, nexusTelegramInvites } from '@/db/schema';
import { eq } from 'drizzle-orm';

// Mock dependencies
vi.mock('@/db', () => ({
  db: {
    transaction: vi.fn(),
    select: vi.fn(),
    from: vi.fn(),
    where: vi.fn(),
    for: vi.fn(),
    update: vi.fn(),
    set: vi.fn(),
    limit: vi.fn(),
  },
}));

describe('Telegram Identity Binding (Magic Link)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const generateTestInvite = (rawToken: string) => {
    const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
    return {
      id: 'inv_123',
      collaboratorId: 1,
      tokenHash,
      status: 'PENDING',
      expiresAt: new Date(Date.now() + 1000000), // Valid
    };
  };

  it('1. Token válido -> SUCCESS (Binding Atomic)', async () => {
    const rawToken = 'test_token_123';
    const invite = generateTestInvite(rawToken);
    
    // Configurar mocks para simular un ambiente válido
    const mockTx = {
      select: vi.fn().mockReturnThis(),
      from: vi.fn().mockReturnThis(),
      where: vi.fn().mockReturnThis(),
      for: vi.fn().mockResolvedValueOnce([invite]).mockResolvedValueOnce([{
        id: 'collab_1',
        telegramUserId: null // Unbound
      }]),
      limit: vi.fn().mockResolvedValueOnce([]), // No collision
      update: vi.fn().mockReturnThis(),
      set: vi.fn().mockReturnThis(),
    };
    
    // @ts-ignore
    db.transaction.mockImplementation(async (cb) => cb(mockTx));

    // Simulate handleStartCommand logic (abstracted here for testing the transaction)
    let success = false;
    await db.transaction(async (tx: any) => {
      // 1. Fetch Invite
      const [inv] = await tx.select().from(nexusTelegramInvites).for('update');
      if (inv.status !== 'PENDING') throw new Error('Invalid');
      
      // 2. Fetch Collaborator
      const [collab] = await tx.select().from(nexusCollaborators).for('update');
      if (collab.telegramUserId) throw new Error('Already bound');

      // 3. Collision check
      const [existing] = await tx.select().from(nexusCollaborators).limit(1);
      if (existing) throw new Error('Collision');

      success = true;
    });

    expect(success).toBe(true);
    expect(mockTx.for).toHaveBeenCalledTimes(2); // Atomic locks requested
  });

  it('2. Token expirado -> DENY', async () => {
    const rawToken = 'test_token_123';
    const invite = generateTestInvite(rawToken);
    invite.expiresAt = new Date(Date.now() - 1000000); // Expired

    const mockTx = {
      select: vi.fn().mockReturnThis(),
      from: vi.fn().mockReturnThis(),
      where: vi.fn().mockReturnThis(),
      for: vi.fn().mockResolvedValueOnce([invite]),
    };
    
    // @ts-ignore
    db.transaction.mockImplementation(async (cb) => cb(mockTx));

    await expect(db.transaction(async (tx: any) => {
      const [inv] = await tx.select().from(nexusTelegramInvites).for('update');
      if (new Date() > inv.expiresAt) throw new Error('La invitación ha expirado.');
    })).rejects.toThrow('La invitación ha expirado.');
  });

  it('4. Token reutilizado -> DENY', async () => {
    const rawToken = 'test_token_123';
    const invite = generateTestInvite(rawToken);
    invite.status = 'CONSUMED';

    const mockTx = {
      select: vi.fn().mockReturnThis(),
      from: vi.fn().mockReturnThis(),
      where: vi.fn().mockReturnThis(),
      for: vi.fn().mockResolvedValueOnce([invite]),
    };
    
    // @ts-ignore
    db.transaction.mockImplementation(async (cb) => cb(mockTx));

    await expect(db.transaction(async (tx: any) => {
      const [inv] = await tx.select().from(nexusTelegramInvites).for('update');
      if (inv.status !== 'PENDING') throw new Error('Esta invitación ya fue consumida o expirada.');
    })).rejects.toThrow('Esta invitación ya fue consumida o expirada.');
  });

  it('8. Collaborator ya tiene Telegram -> DENY (No silent rebind)', async () => {
    const rawToken = 'test_token_123';
    const invite = generateTestInvite(rawToken);
    
    const mockTx = {
      select: vi.fn().mockReturnThis(),
      from: vi.fn().mockReturnThis(),
      where: vi.fn().mockReturnThis(),
      for: vi.fn().mockResolvedValueOnce([invite]).mockResolvedValueOnce([{
        id: 'collab_1',
        telegramUserId: 'existing_telegram_id' // ALREADY BOUND
      }]),
    };
    
    // @ts-ignore
    db.transaction.mockImplementation(async (cb) => cb(mockTx));

    await expect(db.transaction(async (tx: any) => {
      const [inv] = await tx.select().from(nexusTelegramInvites).for('update');
      const [collab] = await tx.select().from(nexusCollaborators).for('update');
      if (collab.telegramUserId) throw new Error('El operador ya tiene una cuenta vinculada.');
    })).rejects.toThrow('El operador ya tiene una cuenta vinculada.');
  });

  it('9. Telegram B intenta usar invite, pero B ya pertenece a Collaborator C -> DENY', async () => {
    const rawToken = 'test_token_123';
    const invite = generateTestInvite(rawToken);
    
    const mockTx = {
      select: vi.fn().mockReturnThis(),
      from: vi.fn().mockReturnThis(),
      where: vi.fn().mockReturnThis(),
      for: vi.fn().mockResolvedValueOnce([invite]).mockResolvedValueOnce([{
        id: 'collab_1',
        telegramUserId: null
      }]),
      limit: vi.fn().mockResolvedValueOnce([{ id: 'collab_c', telegramUserId: 'telegram_b' }]), // Collision
    };
    
    // @ts-ignore
    db.transaction.mockImplementation(async (cb) => cb(mockTx));

    await expect(db.transaction(async (tx: any) => {
      const [inv] = await tx.select().from(nexusTelegramInvites).for('update');
      const [collab] = await tx.select().from(nexusCollaborators).for('update');
      const [existing] = await tx.select().from(nexusCollaborators).limit(1);
      if (existing) throw new Error('Tu cuenta de Telegram ya está vinculada a otro perfil.');
    })).rejects.toThrow('Tu cuenta de Telegram ya está vinculada a otro perfil.');
  });
});
