import { TelegramCredentialProvider } from '../../../core/domains/execution/ports/telegram-credentials';
import { db } from '~/db';
import { projects } from '~/db/schema';
import { eq } from 'drizzle-orm';

export class DatabaseTelegramCredentialProvider implements TelegramCredentialProvider {
  async getBotToken(organizationId: string): Promise<string | null> {
    let project;
    
    if (organizationId.startsWith('org_')) {
      const slug = organizationId.slice(4);
      project = await db.query.projects.findFirst({
        where: eq(projects.slug, slug),
      });
    } else {
      const orgIdNum = parseInt(organizationId, 10);
      if (!isNaN(orgIdNum)) {
        project = await db.query.projects.findFirst({
          where: eq(projects.id, orgIdNum),
        });
      }
    }

    if (!project || !project.w2eConfig) {
      return null;
    }

    const config = project.w2eConfig as Record<string, any>;
    if (config?.botConfig?.telegramToken) {
      return config.botConfig.telegramToken as string;
    }

    return null;
  }
}
