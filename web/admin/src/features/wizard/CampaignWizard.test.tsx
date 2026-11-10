import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import { CampaignWizard } from './CampaignWizard'

const { apiMock, navigateMock } = vi.hoisted(() => ({
  apiMock: vi.fn(),
  navigateMock: vi.fn(),
}))

vi.mock('../../lib/api', () => ({ api: apiMock }))
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom')
  return { ...actual, useNavigate: () => navigateMock }
})

describe('CampaignWizard', () => {
  beforeEach(() => {
    sessionStorage.clear()
    sessionStorage.setItem('bw_campaign_wizard_request_key', 'stable-request-key')
    apiMock.mockImplementation((path: string) => {
      if (path.startsWith('/api/outlets')) {
        const page = new URLSearchParams(path.split('?')[1]).get('page')
        const id = page === '2' ? 8 : 7
        return Promise.resolve({
          items: [{
            id,
            stpNumber: id === 7 ? '663600' : '663601',
            name: id === 7 ? 'Gugu Spaza' : 'Gugu Spaza Two',
            province: 'Gauteng',
            apStatus: 'Online',
            isActive: true,
            latitude: null,
            longitude: null,
          }],
          page: Number(page),
          pageSize: 25,
          total: 30,
        })
      }

      return Promise.resolve({ id: 42 })
    })
  })

  afterEach(() => {
    cleanup()
    vi.clearAllMocks()
  })

  it('retains values across steps, shows validation in place, and submits once', async () => {
    render(
      <MemoryRouter>
        <CampaignWizard />
      </MemoryRouter>,
    )
    expect(screen.getByRole('list').className).toContain('grid-cols-2')

    fireEvent.click(screen.getByRole('button', { name: 'Next' }))
    expect(screen.getByText('Campaign name is required.')).toBeTruthy()
    expect(screen.getByRole('listitem', { current: 'step' }).textContent).toContain('Details')

    fireEvent.change(screen.getByLabelText('Campaign name'), {
      target: { value: 'Summer Launch' },
    })
    fireEvent.change(screen.getByLabelText('Objective'), {
      target: { value: 'Promote the new flavour' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Next' }))

    fireEvent.click(screen.getByRole('button', { name: 'Next' }))
    expect(screen.getByText('Start date is required.')).toBeTruthy()
    expect(screen.getByText('Enter a budget greater than zero.')).toBeTruthy()

    fireEvent.change(screen.getByLabelText('First day'), {
      target: { value: '2026-11-01' },
    })
    fireEvent.change(screen.getByLabelText('Last day'), {
      target: { value: '2026-11-30' },
    })
    fireEvent.change(screen.getByLabelText('Budget (ZAR)'), {
      target: { value: '50000' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Next' }))

    const outlet = await screen.findByLabelText('Select Gugu Spaza')
    fireEvent.click(outlet)
    fireEvent.click(screen.getByRole('button', { name: 'Next outlet page' }))
    const secondOutlet = await screen.findByLabelText('Select Gugu Spaza Two')
    fireEvent.click(secondOutlet)
    expect(apiMock).toHaveBeenCalledWith(
      '/api/outlets?search=&page=2&pageSize=25',
      expect.objectContaining({ signal: expect.any(AbortSignal) }),
    )
    fireEvent.click(screen.getByRole('button', { name: 'Next' }))
    expect(screen.getByText('Summer Launch')).toBeTruthy()

    fireEvent.click(screen.getByRole('button', { name: 'Back' }))
    await screen.findByLabelText('Select Gugu Spaza')
    expect((screen.getByLabelText('Select Gugu Spaza') as HTMLInputElement).checked).toBe(true)
    expect(screen.getByText('2 selected · 30 matching outlets')).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: 'Back' }))
    expect((screen.getByLabelText('Budget (ZAR)') as HTMLInputElement).value).toBe('50000')
    fireEvent.click(screen.getByRole('button', { name: 'Back' }))
    expect((screen.getByLabelText('Campaign name') as HTMLInputElement).value).toBe('Summer Launch')
    expect((screen.getByLabelText('Objective') as HTMLTextAreaElement).value).toBe('Promote the new flavour')

    fireEvent.click(screen.getByRole('button', { name: 'Next' }))
    fireEvent.click(screen.getByRole('button', { name: 'Next' }))
    fireEvent.click(screen.getByRole('button', { name: 'Next' }))
    const createButton = screen.getByRole('button', { name: 'Create campaign' })
    fireEvent.click(createButton)
    fireEvent.click(createButton)

    await waitFor(() => expect(navigateMock).toHaveBeenCalledWith('/campaigns/42'))
    const createCalls = apiMock.mock.calls.filter(([path]) => path === '/api/campaigns')
    expect(createCalls).toHaveLength(1)
    expect(createCalls[0][1].headers['Idempotency-Key']).toBe('stable-request-key')
    expect(JSON.parse(createCalls[0][1].body)).toMatchObject({
      startsAt: '2026-10-31T22:00:00.000Z',
      endsAt: '2026-11-30T22:00:00.000Z',
      outletIds: [7, 8],
    })
    expect(sessionStorage.getItem('bw_campaign_wizard_request_key')).toBeNull()
  })
})
