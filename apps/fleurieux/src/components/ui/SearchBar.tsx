'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'

interface SearchBarProps {
  placeholder?: string
  className?: string
  onSearch?: (query: string) => void
  globalSearch?: boolean
}

export function SearchBar({ placeholder = 'Rechercher...', className, onSearch, globalSearch = false }: SearchBarProps) {
  const [query, setQuery] = useState('')
  const router = useRouter()

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!query.trim()) return
    if (globalSearch) {
      router.push(`/recherche?q=${encodeURIComponent(query.trim())}`)
    } else {
      onSearch?.(query.trim())
    }
  }

  return (
    <form onSubmit={handleSubmit} className={cn('relative flex items-center', className)}>
      <span className="pointer-events-none absolute left-3 text-gray-400">
        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
      </span>
      <input
        type="search"
        value={query}
        onChange={e => setQuery(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-lg border border-gray-300 bg-white py-2 pl-10 pr-4 text-sm focus:border-village-500 focus:outline-none focus:ring-1 focus:ring-village-500 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
      />
    </form>
  )
}
