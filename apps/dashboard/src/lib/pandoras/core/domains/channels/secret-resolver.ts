export interface SecretResolver {
  resolve(credentialsRef: string): Promise<string>;
}

export class EnvironmentSecretResolver implements SecretResolver {
  private customSecrets = new Map<string, string>();

  constructor(initialSecrets?: Record<string, string>) {
    if (initialSecrets) {
      Object.entries(initialSecrets).forEach(([k, v]) => this.customSecrets.set(k, v));
    }
  }

  setSecret(ref: string, secretValue: string): void {
    this.customSecrets.set(ref, secretValue);
  }

  async resolve(credentialsRef: string): Promise<string> {
    if (!credentialsRef || typeof credentialsRef !== 'string') {
      throw new Error('Invalid credentialsRef provided to SecretResolver');
    }

    // 1. Check custom in-memory secrets store
    if (this.customSecrets.has(credentialsRef)) {
      return this.customSecrets.get(credentialsRef)!;
    }

    // 2. Resolve env var prefix: "env:TELEGRAM_BOT_TOKEN" or direct ENV key
    const envKey = credentialsRef.startsWith('env:')
      ? credentialsRef.substring(4)
      : credentialsRef;

    const envValue = process.env[envKey];
    if (envValue) {
      return envValue;
    }

    // 3. Fallback placeholder for dev/staging when ref format is vault:telegram:<bindingId>
    if (credentialsRef.startsWith('vault:telegram:')) {
      const devToken = process.env.TELEGRAM_BOT_TOKEN;
      if (devToken) {
        return devToken;
      }
    }

    throw new Error(`SecretResolver failed to resolve secret for reference: '${credentialsRef}'`);
  }
}

export class DatabaseSecretResolver implements SecretResolver {
  private fallbackResolver = new EnvironmentSecretResolver();

  async resolve(credentialsRef: string): Promise<string> {
    if (!credentialsRef || typeof credentialsRef !== 'string') {
      throw new Error('Invalid credentialsRef provided to SecretResolver');
    }

    if (credentialsRef.startsWith('vault:telegram:')) {
      const organizationId = credentialsRef.substring('vault:telegram:'.length);
      
      try {
        const { db } = await import('@/db');
        const { projects } = await import('@/db/schema');
        const { eq } = await import('drizzle-orm');
        
        const rows = await db.select().from(projects).where(eq(projects.slug, organizationId)).limit(1);
        const project = rows[0];
        
        if (project) {
          const config = project.tenantRuntimeConfig as any;
          if (config?.secrets?.telegramBotToken) {
            return config.secrets.telegramBotToken;
          }
        }
      } catch (err) {
        console.warn(`[DatabaseSecretResolver] DB lookup failed for ${credentialsRef}`, err);
      }
    }

    if (credentialsRef.startsWith('vault:channel:')) {
      const organizationId = credentialsRef.substring('vault:channel:'.length);
      
      try {
        const { db } = await import('@/db');
        const { projects } = await import('@/db/schema');
        const { eq } = await import('drizzle-orm');
        
        const rows = await db.select().from(projects).where(eq(projects.slug, organizationId)).limit(1);
        const project = rows[0];
        
        if (project) {
          const config = project.tenantRuntimeConfig as any;
          if (config?.secrets?.whatsappToken && config?.secrets?.whatsappPhoneId) {
            // WhatsAppAdapter expects token|phoneNumberId
            return `${config.secrets.whatsappToken}|${config.secrets.whatsappPhoneId}`;
          }
        }
      } catch (err) {
        console.warn(`[DatabaseSecretResolver] DB lookup failed for ${credentialsRef}`, err);
      }
    }

    // Fallback to environment for global bots (like injected S'Narai dev tokens)
    return this.fallbackResolver.resolve(credentialsRef);
  }
}
