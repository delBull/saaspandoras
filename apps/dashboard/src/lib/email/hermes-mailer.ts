export async function sendSubscriptionExpiringSoon(email: string, name: string) {
    console.log(`[Email] Hermes Subscription Expiring Soon -> ${email}`);
    // Integración de Resend (mockeada para este entorno)
    // await resend.emails.send({ ... })
    return true;
}

export async function sendGracePeriodStarted(email: string, name: string) {
    console.log(`[Email] Hermes Grace Period Started -> ${email}`);
    return true;
}

export async function sendSubscriptionSuspended(email: string, name: string) {
    console.log(`[Email] Hermes Subscription Suspended -> ${email}`);
    return true;
}

export async function sendReferralJoined(email: string, referralName: string) {
    console.log(`[Email] Hermes Referral Joined -> ${email}`);
    return true;
}

export async function sendReferralPaid(email: string, referralName: string, freeDays: number, repPoints: number) {
    console.log(`[Email] Hermes Referral Paid -> ${email} (Days: ${freeDays}, RP: ${repPoints})`);
    return true;
}
