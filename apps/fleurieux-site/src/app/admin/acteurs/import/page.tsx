'use client'
import { useState, useRef } from 'react'
import Papa from 'papaparse'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'

type CsvRow = Record<string, string>

type ImportResult = {
  created: number
  updated: number
  errors: number
  results: { slug: string; action: string; error?: string }[]
}

const REQUIRED_COLUMNS = ['nom', 'slug', 'categorieSlug']
const ALL_COLUMNS = [
  'nom', 'slug', 'categorieSlug', 'description', 'adresse',
  'codePostal', 'ville', 'telephone', 'email', 'siteWeb', 'instagram', 'statut',
]

export default function ImportActeursPage() {
  const [rows, setRows] = useState<CsvRow[]>([])
  const [parseError, setParseError] = useState<string | null>(null)
  const [importing, setImporting] = useState(false)
  const [result, setResult] = useState<ImportResult | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  function handleFile(file: File) {
    setParseError(null)
    setResult(null)
    setRows([])

    Papa.parse<CsvRow>(file, {
      header: true,
      skipEmptyLines: true,
      complete(parsed) {
        const missing = REQUIRED_COLUMNS.filter(col => !parsed.meta.fields?.includes(col))
        if (missing.length > 0) {
          setParseError(`Colonnes manquantes : ${missing.join(', ')}`)
          return
        }
        setRows(parsed.data.slice(0, 200))
      },
      error(err) {
        setParseError(err.message)
      },
    })
  }

  async function handleImport() {
    if (rows.length === 0) return
    setImporting(true)
    setResult(null)
    try {
      const res = await fetch('/api/acteurs/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rows }),
      })
      const data = await res.json() as ImportResult
      setResult(data)
    } catch {
      setParseError('Erreur lors de l\'import')
    } finally {
      setImporting(false)
    }
  }

  function reset() {
    setRows([])
    setResult(null)
    setParseError(null)
    if (fileRef.current) fileRef.current.value = ''
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Importer des acteurs</h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Fichier CSV avec les colonnes : {ALL_COLUMNS.join(', ')}
        </p>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Colonnes obligatoires : {REQUIRED_COLUMNS.join(', ')}. Maximum 200 lignes.
        </p>
      </div>

      <Card>
        <div className="space-y-4">
          <input
            ref={fileRef}
            type="file"
            accept=".csv,text/csv"
            className="block w-full text-sm text-gray-700 dark:text-gray-300 file:mr-4 file:rounded-lg file:border-0 file:bg-village-50 file:px-4 file:py-2 file:text-sm file:font-medium file:text-village-700 hover:file:bg-village-100 dark:file:bg-village-900/20 dark:file:text-village-400"
            onChange={e => { if (e.target.files?.[0]) handleFile(e.target.files[0]) }}
          />

          {parseError && (
            <p className="text-sm text-red-600 dark:text-red-400">{parseError}</p>
          )}

          {rows.length > 0 && (
            <p className="text-sm text-gray-600 dark:text-gray-400">{rows.length} ligne{rows.length > 1 ? 's' : ''} détectée{rows.length > 1 ? 's' : ''}</p>
          )}
        </div>
      </Card>

      {rows.length > 0 && !result && (
        <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-700">
          <table className="min-w-full divide-y divide-gray-200 text-sm dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-800">
              <tr>
                {Object.keys(rows[0]).map(col => (
                  <th key={col} className="px-3 py-2 text-left font-medium text-gray-700 dark:text-gray-300">{col}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {rows.slice(0, 10).map((row, i) => (
                <tr key={i}>
                  {Object.values(row).map((val, j) => (
                    <td key={j} className="max-w-[200px] truncate px-3 py-2 text-gray-600 dark:text-gray-400">{val}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
          {rows.length > 10 && (
            <p className="px-3 py-2 text-xs text-gray-400">+ {rows.length - 10} lignes non affichées</p>
          )}
        </div>
      )}

      {result && (
        <Card>
          <div className="space-y-3">
            <div className="flex gap-6 text-sm">
              <span className="font-medium text-green-600">{result.created} créé{result.created > 1 ? 's' : ''}</span>
              <span className="font-medium text-blue-600">{result.updated} mis à jour</span>
              {result.errors > 0 && (
                <span className="font-medium text-red-600">{result.errors} erreur{result.errors > 1 ? 's' : ''}</span>
              )}
            </div>
            {result.results.filter(r => r.action === 'error').map(r => (
              <p key={r.slug} className="text-xs text-red-600 dark:text-red-400">
                {r.slug} : {r.error}
              </p>
            ))}
          </div>
        </Card>
      )}

      <div className="flex gap-3">
        {rows.length > 0 && !result && (
          <Button onClick={handleImport} disabled={importing}>
            {importing ? 'Import en cours...' : `Importer ${rows.length} ligne${rows.length > 1 ? 's' : ''}`}
          </Button>
        )}
        {(rows.length > 0 || result) && (
          <Button variant="secondary" onClick={reset}>Réinitialiser</Button>
        )}
      </div>
    </div>
  )
}
