import { describe, expect, it } from 'vitest'
import { emptyDraft, toRequest, validateStep } from './campaignDraft'

describe('validateStep', () => {
  it('reports details errors on the details step', () => {
    expect(validateStep(0, emptyDraft)).toEqual({
      name: 'Campaign name is required.',
    })
  })

  it('reports schedule errors on the schedule step', () => {
    expect(validateStep(1, emptyDraft)).toEqual({
      startDate: 'Start date is required.',
      endDate: 'End date is required.',
      budget: 'Enter a budget greater than zero.',
    })
  })
})

describe('toRequest', () => {
  it('passes selected outlets through', () => {
    const req = toRequest({
      ...emptyDraft,
      name: 'Test',
      startDate: '2026-11-01',
      endDate: '2026-11-30',
      budget: '50000',
      outletIds: [3, 7],
    })
    expect(req.outletIds).toEqual([3, 7])
    expect(req.name).toBe('Test')
  })

  it('uses SAST midnight and an exclusive end at the midnight after the last day', () => {
    const req = toRequest({
      ...emptyDraft,
      name: ' Test ',
      startDate: '2026-11-01',
      endDate: '2026-11-30',
      budget: '50 000',
      outletIds: [3],
    })

    expect(req.startsAt).toBe('2026-10-31T22:00:00.000Z')
    expect(req.endsAt).toBe('2026-11-30T22:00:00.000Z')
    expect(req.budgetZar).toBe(50000)
    expect(req.name).toBe('Test')
  })
})
