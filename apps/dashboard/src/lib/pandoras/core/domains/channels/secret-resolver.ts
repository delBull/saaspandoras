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
