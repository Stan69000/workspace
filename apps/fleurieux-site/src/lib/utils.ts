// src/lib/utils.ts

import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { fr } from 'date-fns/locale'
import { format, isToday, isTomorrow } from 'date-fns'

// ── Fusion classes Tailwind
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// ── Slugify (français)
export function slugify(str: string): string {
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
}

// ── Formater une date en français
export function formatDate(date: Date | string, formatStr = 'd MMMM yyyy'): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return format(d, formatStr, { locale: fr })
}

// ── Date relative (aujourd'hui, demain, sinon date)
export function formatDateRelative(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date
  if (isToday(d)) return "Aujourd'hui"
  if (isTomorrow(d)) return 'Demain'
  return format(d, 'EEEE d MMMM', { locale: fr })
}

// ── Jour Prisma → label français
export const JOURS_FR: Record<string, string> = {
  LUNDI: 'Lundi',
  MARDI: 'Mardi',
  MERCREDI: 'Mercredi',
  JEUDI: 'Jeudi',
  VENDREDI: 'Vendredi',
  SAMEDI: 'Samedi',
  DIMANCHE: 'Dimanche',
}

// ── Jour courant en format Prisma
export function jourCourant(): string {
  const jours = ['DIMANCHE','LUNDI','MARDI','MERCREDI','JEUDI','VENDREDI','SAMEDI']
  return jours[new Date().getDay()]
}

// ── Tronquer un texte
export function truncate(str: string, maxLength: number): string {
  if (str.length <= maxLength) return str
  return str.slice(0, maxLength).trim() + '…'
}
