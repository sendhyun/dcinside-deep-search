export const DEFAULT_REQUEST_DELAY_MS = 300;

export function createDelay() {
  return (ms = DEFAULT_REQUEST_DELAY_MS, signal) => new Promise((resolve, reject) => {
    if (signal?.aborted) {
      const error = new Error('aborted');
      error.name = 'AbortError';
      reject(error);
      return;
    }
    const timer = setTimeout(resolve, Math.max(0, Number(ms) || 0));
    signal?.addEventListener('abort', () => {
      clearTimeout(timer);
      const error = new Error('aborted');
      error.name = 'AbortError';
      reject(error);
    }, { once: true });
  });
}
