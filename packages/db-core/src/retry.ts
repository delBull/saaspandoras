export async function withRetry<T>(operation: () => Promise<T>, maxRetries = 3): Promise<T> {
  let retries = 0;
  while (true) {
    try {
      return await operation();
    } catch (err: any) {
      if (retries >= maxRetries) throw err;
      retries++;
      await new Promise(r => setTimeout(r, 100 * Math.pow(2, retries)));
    }
  }
}

export async function withDeadlockRetry<T>(operation: () => Promise<T>, maxRetries = 3): Promise<T> {
  let retries = 0;
  while (true) {
    try {
      return await operation();
    } catch (err: any) {
      // Postgres deadlock error code is 40P01
      if (err?.code !== '40P01' || retries >= maxRetries) throw err;
      retries++;
      await new Promise(r => setTimeout(r, 100 * Math.pow(2, retries) + Math.random() * 50));
    }
  }
}
