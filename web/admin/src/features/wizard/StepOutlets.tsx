
import { useEffect, useState } from 'react'
import { api, type Outlet, type Paged } from '../../lib/api'
import { Button, Input } from '../../components/ui'

interface Props {
  selected: number[]
  error?: string
  onChange: (ids: number[]) => void
  onNext: () => void
  onBack: () => void
}

export function StepOutlets({
  selected,
  error,
  onChange,
  onNext,
  onBack,
}: Props) {
  const [outlets, setOutlets] = useState<Outlet[]>([])
  const [filter, setFilter] = useState('')
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(false)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [retry, setRetry] = useState(0)
  const pageSize = 25

  useEffect(() => {
    const timer = window.setTimeout(() => setSearch(filter.trim()), 250)
    return () => window.clearTimeout(timer)
  }, [filter])

  useEffect(() => {
    let active = true
    const controller = new AbortController()

    async function loadOutlets() {
      setLoading(true)
      setLoadError(null)

      try {
        const result = await api<Paged<Outlet>>(
          `/api/outlets?search=${encodeURIComponent(search)}&page=${page}&pageSize=${pageSize}`,
          { signal: controller.signal },
        )

        if (active) {
          setOutlets(result.items)
          setTotal(result.total)
        }
      } catch {
        if (active && !controller.signal.aborted) {
          setLoadError('Could not load outlets. Please try again.')
        }
      } finally {
        if (active) setLoading(false)
      }
    }

    loadOutlets()

    return () => {
      active = false
      controller.abort()
    }
  }, [search, page, retry])

  function toggle(id: number) {
    onChange(
      selected.includes(id)
        ? selected.filter(item => item !== id)
        : [...selected, id],
    )
  }

  function selectPage() {
    const ids = new Set([...selected, ...outlets.map(outlet => outlet.id)])
    onChange([...ids])
  }

  const totalPages = Math.max(1, Math.ceil(total / pageSize))

  return (
    <div className="space-y-4">
      <div>
        <Input
          placeholder="Search outlet, STP number or province"
          value={filter}
          aria-label="Search outlet, STP number or province"
          onChange={e => {
            setFilter(e.target.value)
            setPage(1)
          }}
        />
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm text-slate-600">
          {selected.length} selected · {total} matching outlets
        </p>
        <Button
          type="button"
          variant="secondary"
          onClick={selectPage}
          disabled={loading || outlets.length === 0}
        >
          Select this page
        </Button>
      </div>

      {error && <p role="alert" className="text-sm text-red-600">{error}</p>}
      {loadError && (
        <div role="alert" className="flex flex-wrap items-center gap-2 text-sm text-red-600">
          <span>{loadError}</span>
          <Button type="button" variant="ghost" onClick={() => setRetry(value => value + 1)}>
            Retry
          </Button>
        </div>
      )}

      <div className="overflow-hidden rounded-md border border-slate-200" aria-live="polite">
        {loading ? (
          <p className="p-4 text-sm text-slate-500">Loading outlets...</p>
        ) : outlets.length === 0 ? (
          <p className="p-4 text-sm text-slate-500">No outlets found.</p>
        ) : (
          <ul className="divide-y divide-slate-100">
            {outlets.map(outlet => (
              <li key={outlet.id} className="flex items-start gap-3 p-3">
                <input
                  type="checkbox"
                  className="mt-1"
                  checked={selected.includes(outlet.id)}
                  onChange={() => toggle(outlet.id)}
                  aria-label={`Select ${outlet.name}`}
                />
                <div className="min-w-0 flex-1 text-sm">
                  <p className="break-words font-medium">{outlet.name}</p>
                  <p className="text-slate-500">
                    STP {outlet.stpNumber} · {outlet.province}
                  </p>
                  <p className="text-xs text-slate-500">
                    Access point: {outlet.apStatus}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="flex items-center justify-between gap-3">
        <Button
          type="button"
          variant="secondary"
          aria-label="Previous outlet page"
          onClick={() => setPage(current => Math.max(1, current - 1))}
          disabled={page <= 1 || loading}
        >
          Previous
        </Button>
        <span className="text-xs text-slate-600">
          Page {page} of {totalPages}
        </span>
        <Button
          type="button"
          variant="secondary"
          aria-label="Next outlet page"
          onClick={() => setPage(current => Math.min(totalPages, current + 1))}
          disabled={page >= totalPages || loading}
        >
          Next
        </Button>
      </div>

      <div className="flex justify-between gap-3">
        <Button type="button" variant="secondary" onClick={onBack}>Back</Button>
        <Button type="button" onClick={onNext}>Next</Button>
      </div>
    </div>
  )
}
