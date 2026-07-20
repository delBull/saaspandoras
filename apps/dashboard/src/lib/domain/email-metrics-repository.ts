import { db } from '@/db';
import { emailMetrics } from '@/db/schema';

export class EmailMetricsRepository {
  static async upsertDelivery(emailId: string, type: string, recipient: string, subject: string, metadata: any) {
    await db.insert(emailMetrics)
      .values({
        emailId,
        type,
        status: 'delivered',
        recipient,
        emailSubject: subject,
        deliveredAt: new Date(),
        metadata
      })
      .onConflictDoUpdate({
        target: emailMetrics.emailId,
        set: { status: 'delivered', deliveredAt: new Date(), updatedAt: new Date() }
      });
  }

  static async upsertOpen(emailId: string, type: string, recipient: string, userAgent: string | undefined, ip: string | undefined, metadata: any) {
    await db.insert(emailMetrics)
      .values({
        emailId,
        type,
        status: 'opened',
        recipient,
        openedAt: new Date(),
        userAgent,
        ipAddress: ip,
        metadata
      })
      .onConflictDoUpdate({
        target: emailMetrics.emailId,
        set: { status: 'opened', openedAt: new Date(), updatedAt: new Date() }
      });
  }

  static async upsertClick(emailId: string, recipient: string, clickedUrl: string, metadata: any) {
    await db.insert(emailMetrics)
      .values({
        emailId,
        status: 'clicked',
        recipient,
        clickedUrl,
        clickedAt: new Date(),
        metadata
      })
      .onConflictDoUpdate({
        target: emailMetrics.emailId,
        set: { clickedUrl, clickedAt: new Date(), updatedAt: new Date() }
      });
  }

  static async upsertBounce(emailId: string, recipient: string, metadata: any) {
    await db.insert(emailMetrics)
      .values({
        emailId,
        status: 'bounced',
        recipient,
        bouncedAt: new Date(),
        metadata
      })
      .onConflictDoUpdate({
        target: emailMetrics.emailId,
        set: { status: 'bounced', bouncedAt: new Date(), updatedAt: new Date() }
      });
  }

  static async upsertComplaint(emailId: string, recipient: string, metadata: any) {
    await db.insert(emailMetrics)
      .values({
        emailId,
        status: 'complained',
        recipient,
        complaintAt: new Date(),
        metadata
      })
      .onConflictDoUpdate({
        target: emailMetrics.emailId,
        set: { status: 'complained', complaintAt: new Date(), updatedAt: new Date() }
      });
  }

  static async upsertSpam(emailId: string, recipient: string, metadata: any) {
    await db.insert(emailMetrics)
      .values({
        emailId,
        status: 'spam',
        recipient,
        complaintAt: new Date(),
        metadata
      })
      .onConflictDoUpdate({
        target: emailMetrics.emailId,
        set: { status: 'spam', complaintAt: new Date(), updatedAt: new Date() }
      });
  }
}
