export function logDebug(...args: unknown[]) {
  if (import.meta.env.DEV) {
    console.debug(...args);
  }
}

export function logInfo(...args: unknown[]) {
  if (import.meta.env.DEV) {
    console.info(...args);
  }
}

export function logWarn(...args: unknown[]) {
  console.warn(...args);
}

export function logError(...args: unknown[]) {
  console.error(...args);
}
