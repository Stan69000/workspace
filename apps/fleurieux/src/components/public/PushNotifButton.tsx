'use client'
import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/Button'

export function PushNotifButton() {
  const [state, setState] = useState<'idle' | 'subscribed' | 'unsupported' | 'loading'>('idle')

  useEffect(() => {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      setState('unsupported')
      return
    }
    navigator.serviceWorker.ready.then(reg =>
      reg.pushManager.getSubscription()
    ).then(sub => {
      if (sub) setState('subscribed')
    }).catch(() => {})
  }, [])

  async function subscribe() {
    setState('loading')
    try {
      const res = await fetch('/api/push/vapid-key')
      const { publicKey } = await res.json() as { publicKey: string }

      const reg = await navigator.serviceWorker.ready
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: publicKey,
      })

      await fetch('/api/push/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(sub.toJSON()),
      })
      setState('subscribed')
    } catch {
      setState('idle')
    }
  }

  async function unsubscribe() {
    setState('loading')
    try {
      const reg = await navigator.serviceWorker.ready
      const sub = await reg.pushManager.getSubscription()
      if (sub) {
        await sub.unsubscribe()
        await fetch('/api/push/subscribe', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ endpoint: sub.endpoint }),
        })
      }
      setState('idle')
    } catch {
      setState('subscribed')
    }
  }

  if (state === 'unsupported') return null

  return (
    <Button
      variant="secondary"
      size="sm"
      onClick={state === 'subscribed' ? unsubscribe : subscribe}
      disabled={state === 'loading'}
    >
      {state === 'subscribed' ? '🔔 Notifications activées' : '🔕 Activer les notifications'}
    </Button>
  )
}
