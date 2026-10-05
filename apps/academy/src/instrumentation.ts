import { AcademyAuditSubscriber } from "@saasfly/academy-sdk";

export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    AcademyAuditSubscriber.initialize();
    console.log('✅ [Academy] Instrumentation registered EventSpine subscribers');
  }
}
