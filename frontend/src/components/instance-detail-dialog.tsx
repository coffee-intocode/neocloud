import type { OperatorInstance } from '@/operator/types'
import { StatusBadge } from '@/components/status-badge'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { formatCurrency, formatDateTime, formatHourlyPrice, titleCase } from '@/lib/formatters'

interface InstanceDetailDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  instance: OperatorInstance
  onEdit: () => void
}

function DetailBlock({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-1 rounded-xl border border-border/70 bg-background/40 p-3">
      <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">{label}</p>
      <p className="text-sm font-medium text-foreground">{value}</p>
    </div>
  )
}

export function InstanceDetailDialog({ open, onOpenChange, instance, onEdit }: InstanceDetailDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-4xl">
        <DialogHeader>
          <DialogTitle>{instance.displayName}</DialogTitle>
          <DialogDescription>
            {instance.gpuModel ?? 'Unknown GPU'}
            {instance.datacenterName ? ` • ${instance.datacenterName}` : ''}
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-6">
          <div className="grid gap-4 md:grid-cols-4">
            <DetailBlock label="Rate" value={formatHourlyPrice(instance.hourlyRateUsd)} />
            <DetailBlock label="Revenue / hr" value={formatCurrency(instance.currentHourlyRevenueUsd)} />
            <DetailBlock label="Opportunity / hr" value={formatCurrency(instance.idleHourlyOpportunityUsd)} />
            <DetailBlock label="Market" value={titleCase(instance.marketStatus)} />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="flex flex-col gap-4 rounded-2xl border border-border/70 p-4">
              <div className="flex flex-col gap-1">
                <p className="text-sm font-medium">Commercial detail</p>
                <p className="text-sm text-muted-foreground">
                  Revenue posture, sellability, and the current risk blocking monetization.
                </p>
              </div>

              <div className="flex flex-wrap gap-2">
                <StatusBadge value={instance.marketStatus} />
                <StatusBadge value={instance.isVisible ? 'Listed' : 'Hidden'} />
                <StatusBadge value={instance.online ? 'Online' : 'Offline'} />
                {instance.attentionReason ? <StatusBadge value="Attention" /> : <StatusBadge value="Healthy" />}
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <DetailBlock label="Device" value={instance.deviceName ?? instance.brokkrDeviceId} />
                <DetailBlock label="Facility" value={instance.datacenterName ?? 'Unassigned'} />
                <DetailBlock label="Created" value={formatDateTime(instance.createdAt)} />
                <DetailBlock label="Updated" value={formatDateTime(instance.updatedAt)} />
                <DetailBlock label="Visibility" value={instance.isVisible ? 'Visible to market' : 'Hidden'} />
                <DetailBlock label="Attention" value={instance.attentionReason ?? 'Healthy'} />
              </div>
            </div>

            <div className="flex flex-col gap-4 rounded-2xl border border-border/70 p-4">
              <div className="flex flex-col gap-1">
                <p className="text-sm font-medium">Operator detail</p>
                <p className="text-sm text-muted-foreground">
                  App-owned commercial data layered on top of the live Brokkr device mapping.
                </p>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <DetailBlock label="Instance ID" value={instance.id} />
                <DetailBlock label="Device ID" value={instance.brokkrDeviceId} />
                <DetailBlock label="Datacenter ID" value={instance.brokkrDatacenterId ?? 'Unavailable'} />
                <DetailBlock label="Created by" value={instance.createdByUserId} />
              </div>

              <div className="flex flex-col gap-2 rounded-xl border border-border/70 bg-background/40 p-3">
                <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Notes</p>
                <p className="text-sm text-foreground">
                  {instance.notes && instance.notes.trim().length > 0 ? instance.notes : 'No operator notes yet.'}
                </p>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter showCloseButton>
          <Button
            onClick={() => {
              onOpenChange(false)
              onEdit()
            }}
          >
            Edit commercial settings
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
