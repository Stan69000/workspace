// src/lib/logger.ts
// SEC-014 : logs structurés pour traçabilité des événements de sécurité

type LogLevel = 'info' | 'warn' | 'error'

export function log(level: LogLevel, message: string, meta?: Record<string, unknown>): void {
  const entry = {
    level,
    ts: new Date().toISOString(),
    message,
    ...meta,
  }
  if (level === 'error') {
    console.error(JSON.stringify(entry))
  } else {
    console.log(JSON.stringify(entry))
  }
}

export const logger = {
  info:  (message: string, meta?: Record<string, unknown>) => log('info',  message, meta),
  warn:  (message: string, meta?: Record<string, unknown>) => log('warn',  message, meta),
  error: (message: string, meta?: Record<string, unknown>) => log('error', message, meta),
}
