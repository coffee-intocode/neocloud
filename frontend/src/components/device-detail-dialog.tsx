import { Link } from 'react-router-dom'

import type { DeviceRow } from '@/operator/types'
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
import { formatGigabytes, formatHourlyPrice, titleCase } from '@/lib/formatters'

interface DeviceDetailDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  device: DeviceRow
  onCreateInstance: () => void
}

function DetailBlock({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-1 rounded-xl border border-border/70 bg-background/40 p-3">
      <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">{label}</p>
      <p className="text-sm font-medium text-foreground">{value}</p>
    </div>
  )
}

export function DeviceDetailDialog({ open, onOpenChange, device, onCreateInstance }: DeviceDetailDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-4xl">
        <DialogHeader>
          <DialogTitle>{device.name}</DialogTitle>
          <DialogDescription>
            {device.datacenterName ?? 'Unassigned facility'}
            {device.zoneName ? ` • ${device.zoneName}` : ''}
            {device.location ? ` • ${device.location}` : ''}
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-6">
          <div className="grid gap-4 md:grid-cols-4">
            <DetailBlock label="GPU" value={`${device.gpuModel ?? 'Unknown GPU'} • ${device.gpuCount ?? 0} GPU`} />
            <DetailBlock label="Memory" value={formatGigabytes(device.memoryTotalGb)} />
            <DetailBlock label="CPU" value={device.cpuModel ?? 'Unavailable'} />
            <DetailBlock label="Market price" value={formatHourlyPrice(device.onDemandPriceUsd)} />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="flex flex-col gap-4 rounded-2xl border border-border/70 p-4">
              <div className="flex flex-col gap-1">
                <p className="text-sm font-medium">Commercial state</p>
                <p className="text-sm text-muted-foreground">
                  The minimum operating view needed to decide whether this device can earn.
                </p>
              </div>

              <div className="flex flex-wrap gap-2">
                <StatusBadge value={device.status.label} />
                <StatusBadge value={device.powerStatus.label} />
                <StatusBadge value={device.listingActive ? 'Listed' : 'Draft'} />
                {device.interruptibleOnly ? <StatusBadge value="Reserve" /> : <StatusBadge value="On Demand" />}
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <DetailBlock label="Mapped instance" value={device.instanceName ?? 'No local instance yet'} />
                <DetailBlock label="Attention" value={device.attentionReason ?? 'Healthy'} />
                <DetailBlock label="Reservation type" value={titleCase(device.reservationType)} />
                <DetailBlock label="Device role" value={titleCase(device.role)} />
              </div>
            </div>

            <div className="flex flex-col gap-4 rounded-2xl border border-border/70 p-4">
              <div className="flex flex-col gap-1">
                <p className="text-sm font-medium">Infrastructure detail</p>
                <p className="text-sm text-muted-foreground">
                  Extra operating context that does not need to live in the table row.
                </p>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <DetailBlock label="Facility" value={device.datacenterName ?? 'Unassigned'} />
                <DetailBlock label="Zone" value={device.zoneName ?? 'Unavailable'} />
                <DetailBlock label="Location" value={device.location ?? 'Unavailable'} />
                <DetailBlock label="Eco mode" value={device.ecoMode ? 'Enabled' : 'Disabled'} />
                <DetailBlock label="TEE capable" value={device.isTeeCapable ? 'Yes' : 'No'} />
                <DetailBlock label="Interruptible only" value={device.interruptibleOnly ? 'Yes' : 'No'} />
              </div>
            </div>
          </div>
        </div>

        <DialogFooter showCloseButton>
          {device.instanceId ? (
            <Button asChild variant="outline">
              <Link to="/instances">Open instance</Link>
            </Button>
          ) : (
            <Button
              onClick={() => {
                onOpenChange(false)
                onCreateInstance()
              }}
            >
              Create instance
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
