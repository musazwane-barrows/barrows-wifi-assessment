
import { Button, Input, Label } from '../../components/ui'
import type { CampaignDraft, DraftErrors } from './campaignDraft'

interface Props {
  draft: CampaignDraft
  errors: DraftErrors
  onChange: (values: Partial<CampaignDraft>) => void
  onNext: () => void
}

export function StepDetails({ draft, errors, onChange, onNext }: Props) {
  return (
    <div className="space-y-4">
      <div>
        <Label htmlFor="name">Campaign name</Label>
        <Input
          id="name"
          value={draft.name}
          onChange={e => onChange({ name: e.target.value })}
          placeholder="e.g. Festive Teaser"
          aria-invalid={!!errors.name}
          aria-describedby={errors.name ? 'name-error' : undefined}
        />
        {errors.name && <p id="name-error" className="mt-1 text-sm text-red-600">{errors.name}</p>}
      </div>

      <div>
        <Label htmlFor="objective">Objective</Label>
        <textarea
          id="objective"
          className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
          rows={3}
          value={draft.objective}
          onChange={e => onChange({ objective: e.target.value })}
          placeholder="What should this campaign achieve?"
        />
      </div>

      <div className="flex justify-end">
        <Button type="button" onClick={onNext}>Next</Button>
      </div>
    </div>
  )
}
