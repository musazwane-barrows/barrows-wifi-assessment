
import { zar } from '../../lib/format'
import type { CampaignDraft } from './campaignDraft'

export function StepReview({ draft }: { draft: CampaignDraft }) {
  return (
    <dl className="grid grid-cols-[100px_minmax(0,1fr)] gap-x-3 gap-y-3 text-sm sm:grid-cols-[140px_minmax(0,1fr)]">
      <dt className="text-slate-500">Name</dt>
      <dd className="break-words">{draft.name || '—'}</dd>

      <dt className="text-slate-500">Objective</dt>
      <dd className="break-words">{draft.objective || '—'}</dd>

      <dt className="text-slate-500">Flight</dt>
      <dd>{draft.startDate || '—'} to {draft.endDate || '—'}</dd>

      <dt className="text-slate-500">Budget</dt>
      <dd>
        {draft.budget
          ? zar.format(Number(draft.budget.replace(/\s/g, '')))
          : '—'}
      </dd>

      <dt className="text-slate-500">Outlets</dt>
      <dd>{draft.outletIds.length}</dd>
    </dl>
  )
}
