'use client'
import dynamic from 'next/dynamic'

export const CommentVenirDynamic = dynamic(
  () => import('./CommentVenir').then(m => m.CommentVenir),
  { ssr: false },
)
