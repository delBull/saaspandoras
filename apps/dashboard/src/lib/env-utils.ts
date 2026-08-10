export function requireEnvUrl(envVarValue: string | undefined, envVarName: string, defaultLocalUrl: string): string {
  if (envVarValue) {
    return envVarValue;
  }
  if (process.env.NODE_ENV === 'production') {
    throw new Error(`CRITICAL: Environment variable ${envVarName} is not set in production. Refusing to fallback to localhost.`);
  }
  return defaultLocalUrl;
}
