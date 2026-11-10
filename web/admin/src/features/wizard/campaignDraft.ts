
import type { SaveCampaignRequest } from '../../lib/api'

export interface CampaignDraft {
  name: string
  objective: string
  startDate: string
  endDate: string
  budget: string
  outletIds: number[]
}

export const emptyDraft: CampaignDraft = {
  name: '',
  objective: '',
  startDate: '',
  endDate: '',
  budget: '',
  outletIds: [],
}

export type DraftErrors = Partial<Record<keyof CampaignDraft, string>>

export function validateStep(
  step: number,
  draft: CampaignDraft,
): DraftErrors {
  const errors: DraftErrors = {}

  if (step === 0 && !draft.name.trim()) {
    errors.name = 'Campaign name is required.'
  }

  if (step === 1) {
    if (!draft.startDate) errors.startDate = 'Start date is required.'
    if (!draft.endDate) errors.endDate = 'End date is required.'

    if (
      draft.startDate &&
      draft.endDate &&
      draft.endDate < draft.startDate
    ) {
      errors.endDate = 'Last day must be on or after the first day.'
    }

    const budget = Number(draft.budget.replace(/\s/g, ''))
    if (!draft.budget.trim() || !Number.isFinite(budget) || budget <= 0) {
      errors.budget = 'Enter a budget greater than zero.'
    }
  }

  if (step === 2 && draft.outletIds.length === 0) {
    errors.outletIds = 'Select at least one outlet.'
  }

  return errors
}

// Date inputs are calendar dates in South Africa (SAST, UTC+2).
// startsAt is inclusive at local midnight.
// endsAt is exclusive at midnight after the selected last day.
export function toRequest(draft: CampaignDraft): SaveCampaignRequest {
  const [startYear, startMonth, startDay] = draft.startDate.split('-').map(Number)
  const [endYear, endMonth, endDay] = draft.endDate.split('-').map(Number)

  const start = new Date(Date.UTC(startYear, startMonth - 1, startDay, -2))
  const endExclusive = new Date(Date.UTC(endYear, endMonth - 1, endDay + 1, -2))

  return {
    name: draft.name.trim(),
    startsAt: start.toISOString(),
    endsAt: endExclusive.toISOString(),
    budgetZar: Number(draft.budget.replace(/\s/g, '')),
    outletIds: [...draft.outletIds],
  }
}
