import { useEffect, useState } from 'react'

import type { CreateOperatorInstanceInput, OperatorInstance, UpdateOperatorInstanceInput } from '@/operator/types'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'

const MARKET_STATUS_OPTIONS = [
  { value: 'draft', label: 'Draft' },
  { value: 'listed', label: 'Listed' },
  { value: 'paused', label: 'Paused' },
] as const

interface InstanceDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  mode: 'create' | 'edit'
  title: string
  description: string
  submitLabel: string
  deviceId: string
  datacenterId: string | null
  initialInstance?: OperatorInstance
  onSubmit: (payload: CreateOperatorInstanceInput | UpdateOperatorInstanceInput) => Promise<void>
}

export function InstanceDialog({
  open,
  onOpenChange,
  mode,
  title,
  description,
  submitLabel,
  deviceId,
  datacenterId,
  initialInstance,
  onSubmit,
}: InstanceDialogProps) {
  const [displayName, setDisplayName] = useState(initialInstance?.displayName ?? '')
  const [hourlyRateUsd, setHourlyRateUsd] = useState(initialInstance?.hourlyRateUsd.toString() ?? '')
  const [marketStatus, setMarketStatus] = useState(initialInstance?.marketStatus ?? 'draft')
  const [isVisible, setIsVisible] = useState(initialInstance?.isVisible ?? true)
  const [notes, setNotes] = useState(initialInstance?.notes ?? '')
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (!open) {
      return
    }

    setDisplayName(initialInstance?.displayName ?? '')
    setHourlyRateUsd(initialInstance?.hourlyRateUsd.toString() ?? '')
    setMarketStatus(initialInstance?.marketStatus ?? 'draft')
    setIsVisible(initialInstance?.isVisible ?? true)
    setNotes(initialInstance?.notes ?? '')
  }, [initialInstance, open])

  async function handleSubmit() {
    setIsSubmitting(true)

    try {
      const numericRate = Number(hourlyRateUsd)
      if (mode === 'create') {
        await onSubmit({
          brokkrDeviceId: deviceId,
          brokkrDatacenterId: datacenterId,
          displayName,
          hourlyRateUsd: numericRate,
          marketStatus,
          isVisible,
          notes: notes.trim() || null,
        })
      } else {
        await onSubmit({
          displayName,
          hourlyRateUsd: numericRate,
          marketStatus,
          isVisible,
          notes: notes.trim() || null,
        })
      }
      onOpenChange(false)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        <div className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="instance-name">Sellable name</Label>
            <Input
              id="instance-name"
              value={displayName}
              onChange={(event) => {
                setDisplayName(event.target.value)
              }}
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="grid gap-2">
              <Label htmlFor="hourly-rate">Hourly rate (USD)</Label>
              <Input
                id="hourly-rate"
                type="number"
                min="0"
                step="0.01"
                value={hourlyRateUsd}
                onChange={(event) => {
                  setHourlyRateUsd(event.target.value)
                }}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="market-status">Market status</Label>
              <Select value={marketStatus} onValueChange={setMarketStatus}>
                <SelectTrigger id="market-status" className="w-full">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  {MARKET_STATUS_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="instance-visibility">Visibility</Label>
            <Select
              value={isVisible ? 'visible' : 'hidden'}
              onValueChange={(value) => {
                setIsVisible(value === 'visible')
              }}
            >
              <SelectTrigger id="instance-visibility" className="w-full">
                <SelectValue placeholder="Select visibility" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="visible">Visible</SelectItem>
                <SelectItem value="hidden">Hidden</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="instance-notes">Operator notes</Label>
            <Textarea
              id="instance-notes"
              value={notes}
              onChange={(event) => {
                setNotes(event.target.value)
              }}
              placeholder="Pricing posture, customer context, or deployment notes."
            />
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => {
              onOpenChange(false)
            }}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            onClick={() => {
              handleSubmit().catch((error: unknown) => {
                console.error('Failed to submit instance form', error)
              })
            }}
            disabled={isSubmitting || displayName.trim().length === 0 || Number(hourlyRateUsd) <= 0}
          >
            {submitLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
