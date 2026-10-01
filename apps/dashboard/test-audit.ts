import { PlatformAuditLedgerService } from '@/lib/admin/platform-audit-ledger.service';
async function run() {
  try {
    const intentId = 'intent_123';
    await PlatformAuditLedgerService.recordEntry({
      actorId: '0x123',
      actorWallet: '0x123',
      actorRole: 'SUPER_ADMIN',
      actorType: 'ADMIN',
      action: 'TENANT_PROVISIONING_INTENT_CREATED',
      targetResource: 'project',
      resourceId: 'snarai',
      capability: 'admin.full_access_provision',
      governance: { isDiscord2faVerified: false, auditReason: 'Super Admin' },
      stateTransition: { previousState: null, newState: { intentId, status: 'executed' } },
      result: 'SUCCESS',
    } as any);
    console.log("Success");
  } catch (e) {
    console.error("Error:", e);
  }
  process.exit(0);
}
run();
