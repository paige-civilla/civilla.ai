/**
 * Simple concurrency limiter (CJS-compatible replacement for p-limit)
 */
export function createLimiter(concurrency: number) {
  let active = 0;
  const queue: Array<() => void> = [];

  const next = () => {
    if (queue.length > 0 && active < concurrency) {
      active++;
      const run = queue.shift()!;
      run();
    }
  };

  return <T>(fn: () => Promise<T>): Promise<T> => {
    return new Promise((resolve, reject) => {
      const run = async () => {
        try {
          const result = await fn();
          resolve(result);
        } catch (err) {
          reject(err);
        } finally {
          active--;
          next();
        }
      };

      queue.push(run);
      next();
    });
  };
}

/**
 * Simple retry with exponential backoff (CJS-compatible replacement for p-retry)
 */
export interface RetryOptions {
  retries?: number;
  minTimeout?: number;
  maxTimeout?: number;
  factor?: number;
  shouldRetry?: (error: unknown) => boolean;
  onFailedAttempt?: (error: unknown, attempt: number) => void;
}

export class AbortError extends Error {
  constructor(messageOrError: string | Error) {
    super(messageOrError instanceof Error ? messageOrError.message : messageOrError);
    this.name = 'AbortError';
    if (messageOrError instanceof Error && messageOrError.stack) {
      this.stack = messageOrError.stack;
    }
  }
}

export async function retry<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const {
    retries = 3,
    minTimeout = 1000,
    maxTimeout = 30000,
    factor = 2,
    shouldRetry = () => true,
    onFailedAttempt,
  } = options;

  let lastError: unknown;
  
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      
      if (error instanceof AbortError) {
        throw error;
      }
      
      if (attempt >= retries || !shouldRetry(error)) {
        throw error;
      }
      
      onFailedAttempt?.(error, attempt + 1);
      
      // Exponential backoff with jitter (±25% randomization)
      const baseDelay = Math.min(minTimeout * Math.pow(factor, attempt), maxTimeout);
      const jitter = baseDelay * 0.25 * (Math.random() * 2 - 1); // -25% to +25%
      const delay = Math.max(minTimeout, baseDelay + jitter);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  throw lastError;
}
