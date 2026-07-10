// helpers/courier-throttle.ts
export const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));

export class RateLimiter {
  private last = 0;
  constructor(private readonly minIntervalMs: number) {}
  async wait() {
    const now = Date.now();
    const waitMs = Math.max(0, this.last + this.minIntervalMs - now);
    if (waitMs > 0) await sleep(waitMs);
    this.last = Date.now();
  }
}

export async function withRetry<T>(
  fn: () => Promise<T>,
  attempts = 3,
  baseDelayMs = 1000
): Promise<T> {
  let lastErr: any;
  for (let i = 0; i < attempts; i++) {
    try {
      return await fn();
    } catch (err: any) {
      lastErr = err;
      const status = err?.response?.status ?? err?.status;
      // Only retry on transient errors
      if (status === 429 || (status >= 500 && status < 600) || !status) {
        const delay = baseDelayMs * Math.pow(2, i);
        await sleep(delay);
        continue;
      }
      break; // 4xx other => don't retry
    }
  }
  throw lastErr;
}
