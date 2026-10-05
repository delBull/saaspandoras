export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    const { AcademyAuditSubscriber } = await import("@saasfly/academy-sdk");
    AcademyAuditSubscriber.initialize();
    console.log('✅ [Academy] Instrumentation registered EventSpine subscribers');
  }
}
