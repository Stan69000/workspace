// src/lib/push-topics.ts
// Sujets de notification (partagé client/serveur).
export const PUSH_TOPICS = [
  { key: 'ALERTES', label: 'Alertes & infos du village' },
  { key: 'DECHETS', label: 'Rappels de collecte des déchets' },
  { key: 'AGENDA', label: 'Nouveaux événements' },
  { key: 'ACTUS', label: 'Actualités' },
] as const

export type PushTopic = typeof PUSH_TOPICS[number]['key']

export const ALL_TOPIC_KEYS: PushTopic[] = PUSH_TOPICS.map(t => t.key)
