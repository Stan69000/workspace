// src/lib/cron.ts
// Auth des routes cron via CRON_SECRET (header Authorization: Bearer ... ou ?secret=).
export function cronAuthorized(req: Request): { ok: boolean; configured: boolean } {
  const secret = process.env.CRON_SECRET
  if (!secret) return { ok: false, configured: false }
  const provided = req.headers.get('authorization')?.replace(/^Bearer\s+/i, '')
    ?? new URL(req.url).searchParams.get('secret')
  return { ok: provided === secret, configured: true }
}
