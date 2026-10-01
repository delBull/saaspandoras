import { sendEmail } from "./client";

export async function sendSubscriptionExpiringSoon(email: string, name: string) {
    console.log(`[Email] Hermes Subscription Expiring Soon -> ${email}`);
    const subject = `Your Hermes Subscription is Expiring Soon`;
    const html = `
        <div style="font-family: sans-serif; padding: 20px;">
            <h2>Action Required: Hermes Subscription Expiring</h2>
            <p>Hello ${name},</p>
            <p>Your Hermes subscription is set to expire soon. Please renew your subscription to continue using Hermes.</p>
        </div>
    `;
    return sendEmail({ to: email, subject, html });
}

export async function sendGracePeriodStarted(email: string, name: string) {
    console.log(`[Email] Hermes Grace Period Started -> ${email}`);
    const subject = `Hermes Subscription - Grace Period Started`;
    const html = `
        <div style="font-family: sans-serif; padding: 20px;">
            <h2>Grace Period Started</h2>
            <p>Hello ${name},</p>
            <p>Your Hermes subscription has entered the grace period. Please update your payment method to avoid suspension.</p>
        </div>
    `;
    return sendEmail({ to: email, subject, html });
}

export async function sendSubscriptionSuspended(email: string, name: string) {
    console.log(`[Email] Hermes Subscription Suspended -> ${email}`);
    const subject = `Hermes Subscription Suspended`;
    const html = `
        <div style="font-family: sans-serif; padding: 20px;">
            <h2>Subscription Suspended</h2>
            <p>Hello ${name},</p>
            <p>Your Hermes subscription has been suspended due to expired access. You can reactivate it at any time from your dashboard.</p>
        </div>
    `;
    return sendEmail({ to: email, subject, html });
}

export async function sendReferralPaid(email: string, referralName: string, freeDays: number, repPoints: number) {
    console.log(`[Email] Hermes Referral Paid -> ${email} (Days: ${freeDays}, RP: ${repPoints})`);
    const subject = `You earned rewards from a referral!`;
    const html = `
        <div style="font-family: sans-serif; padding: 20px;">
            <h2>Referral Successful</h2>
            <p>Hello,</p>
            <p>Your referral <strong>${referralName}</strong> has made a purchase!</p>
            <p>You have earned <strong>${freeDays} free days</strong> and <strong>${repPoints} Reputation Points</strong>.</p>
        </div>
    `;
    return sendEmail({ to: email, subject, html });
}
