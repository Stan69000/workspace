'use client'
import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/Button'
import { PUSH_TOPICS, ALL_TOPIC_KEYS } from '@/lib/push-topics'

type State = 'loading' | 'idle' | 'subscribed' | 'unsupported'

export function NotificationPreferences() {
  const [state, setState] = useState<State>('loading')
  const [topics, setTopics] = useState<string[]>(ALL_TOPIC_KEYS)

  useEffect(() => {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) { setState('unsupported'); return }
    navigator.serviceWorker.ready
      .then(reg => reg.pushManager.getSubscription())
      .then(async sub => {
        if (!sub) { setState('idle'); return }
        try {
          const res = await fetch(`/api/push/preferences?endpoint=${encodeURIComponent(sub.endpoint)}`)
          const data = await res.json()
          if (data.subscribed && Array.isArray(data.topics) && data.topics.length) setTopics(data.topics)
        } catch { /* garde le défaut */ }
        setState('subscribed')
      })
      .catch(() => setState('idle'))
  }, [])

  async function save(sub: PushSubscription, nextTopics: string[]) {
    await fetch('/api/push/subscribe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...sub.toJSON(), topics: nextTopics }),
    })
  }

  async function subscribe() {
    setState('loading')
    try {
      const { publicKey } = await fetch('/api/push/vapid-key').then(r => r.json()) as { publicKey: string }
      const reg = await navigator.serviceWorker.ready
      const sub = await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: publicKey })
      await save(sub, topics)
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
        await fetch('/api/push/subscribe', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ endpoint: sub.endpoint }) })
      }
      setState('idle')
    } catch {
      setState('subscribed')
    }
  }

  async function toggle(key: string, checked: boolean) {
    const next = checked ? [...new Set([...topics, key])] : topics.filter(t => t !== key)
    setTopics(next)
    try {
      const reg = await navigator.serviceWorker.ready
      const sub = await reg.pushManager.getSubscription()
      if (sub) await save(sub, next)
    } catch { /* ignore */ }
  }

  if (state === 'loading') {
    return <p className="text-sm text-gray-400 dark:text-gray-500">Chargement…</p>
  }

  if (state === 'unsupported') {
    return <p className="text-sm text-gray-500 dark:text-gray-400">Les notifications ne sont pas disponibles sur cet appareil ou ce navigateur.</p>
  }

  if (state === 'idle') {
    return (
      <div className="space-y-2">
        <p className="text-sm text-gray-600 dark:text-gray-400">Soyez prévenu des alertes du village et des rappels de collecte.</p>
        <Button onClick={subscribe}>Activer les notifications</Button>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <fieldset className="space-y-2">
        <legend className="text-sm font-medium text-gray-700 dark:text-gray-300">Je veux être notifié pour :</legend>
        {PUSH_TOPICS.map(t => (
          <label key={t.key} className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
            <input type="checkbox" checked={topics.includes(t.key)} onChange={e => toggle(t.key, e.target.checked)} className="h-4 w-4 rounded border-gray-300" />
            {t.label}
          </label>
        ))}
      </fieldset>
      <button onClick={unsubscribe} className="text-sm text-gray-500 hover:underline dark:text-gray-400">
        Désactiver les notifications
      </button>
    </div>
  )
}
