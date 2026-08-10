export function requireEnvUrl(envVarValue: string | undefined, envVarName: string, defaultLocalUrl: string): string {
  if (envVarValue) {
    return envVarValue;
  }
  if (process.env.NODE_ENV === 'production') {
    console.warn(`CRITICAL WARNING: Environment variable ${envVarName} is not set in production. Falling back to localhost to prevent build crash, but this will fail at runtime.`);
  }
  return defaultLocalUrl;
}
