import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { createInstance, getDevices } from '@/operator/api'
import type { CreateOperatorInstanceInput, DeviceRow } from '@/operator/types'
import { DeviceDetailDialog } from '@/components/device-detail-dialog'
import { InstanceDialog } from '@/components/instance-dialog'
import { PageHeader } from '@/components/page-header'
import { StatusBadge } from '@/components/status-badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { formatHourlyPrice } from '@/lib/formatters'

export function DevicesPage() {
  const [search, setSearch] = useState('')
  const [selectedDevice, setSelectedDevice] = useState<DeviceRow | null>(null)
  const [creatingDevice, setCreatingDevice] = useState<DeviceRow | null>(null)
  const queryClient = useQueryClient()

  const devicesQuery = useQuery({
    queryKey: ['operator', 'devices'],
    queryFn: getDevices,
  })

  const createInstanceMutation = useMutation({
    mutationFn: (payload: CreateOperatorInstanceInput) => createInstance(payload),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['operator', 'devices'] }),
        queryClient.invalidateQueries({ queryKey: ['operator', 'instances'] }),
        queryClient.invalidateQueries({ queryKey: ['operator', 'dashboard'] }),
        queryClient.invalidateQueries({ queryKey: ['operator', 'datacenters'] }),
      ])
    },
  })

  const filteredDevices = useMemo(() => {
    if (!devicesQuery.data) {
      return []
    }

    const normalized = search.trim().toLowerCase()
    const matchingDevices: DeviceRow[] =
      normalized.length === 0
        ? devicesQuery.data
        : devicesQuery.data.filter((device) =>
            [device.name, device.gpuModel, device.cpuModel, device.datacenterName, device.zoneName, device.location]
              .filter(Boolean)
              .some((value) => String(value).toLowerCase().includes(normalized)),
          )

    return [...matchingDevices].sort((left, right) => {
      const leftNeedsAttention = left.attentionReason ? 1 : 0
      const rightNeedsAttention = right.attentionReason ? 1 : 0

      if (leftNeedsAttention !== rightNeedsAttention) {
        return rightNeedsAttention - leftNeedsAttention
      }

      const leftPrice = left.onDemandPriceUsd ?? 0
      const rightPrice = right.onDemandPriceUsd ?? 0
      if (leftPrice !== rightPrice) {
        return rightPrice - leftPrice
      }

      return left.name.localeCompare(right.name)
    })
  }, [devicesQuery.data, search])

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Supply"
        title="Devices"
        description="Operate the hardware you can monetize. When Brokkr devices are empty, this view falls back to marketplace inventory for demo purposes."
      />

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Device search</CardTitle>
          <CardDescription>Filter by hardware profile, facility, or location.</CardDescription>
        </CardHeader>
        <CardContent>
          <Input
            placeholder="Search devices"
            value={search}
            onChange={(event) => {
              setSearch(event.target.value)
            }}
          />
        </CardContent>
      </Card>

      {devicesQuery.isLoading ? (
        <Skeleton className="h-[70vh] rounded-3xl" />
      ) : devicesQuery.isError ? (
        <Card className="border-destructive/40">
          <CardHeader>
            <CardTitle>Unable to load devices</CardTitle>
            <CardDescription>{devicesQuery.error.message}</CardDescription>
          </CardHeader>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardDescription>Hardware inventory</CardDescription>
            <CardTitle>Devices that can become products</CardTitle>
          </CardHeader>
          <CardContent>
            {filteredDevices.length === 0 ? (
              <div className="rounded-xl border border-dashed border-border/70 p-6 text-sm text-muted-foreground">
                No devices matched the current search. If Brokkr is still empty, this will populate once hardware is
                onboarded.
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Device</TableHead>
                    <TableHead>Facility</TableHead>
                    <TableHead>Market</TableHead>
                    <TableHead>Instance</TableHead>
                    <TableHead>Attention</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredDevices.map((device) => (
                    <TableRow
                      key={device.id}
                      className="cursor-pointer"
                      tabIndex={0}
                      onClick={() => {
                        setSelectedDevice(device)
                      }}
                      onKeyDown={(event) => {
                        if (event.key === 'Enter' || event.key === ' ') {
                          event.preventDefault()
                          setSelectedDevice(device)
                        }
                      }}
                    >
                      <TableCell>
                        <p className="font-medium">{device.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {device.gpuModel ?? 'Unknown GPU'} • {device.gpuCount ?? 0} GPU
                        </p>
                      </TableCell>
                      <TableCell>
                        <p>{device.datacenterName ?? 'Unassigned'}</p>
                        <p className="text-xs text-muted-foreground">
                          {device.zoneName ?? device.location ?? 'Zone unavailable'}
                        </p>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-1">
                          <div className="flex flex-wrap gap-2">
                            <StatusBadge value={device.status.label} />
                            <StatusBadge value={device.listingActive ? 'Listed' : 'Draft'} />
                          </div>
                          <p className="text-xs text-muted-foreground">
                            {device.onDemandPriceUsd ? formatHourlyPrice(device.onDemandPriceUsd) : 'No Brokkr price'}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-1">
                          <p className="font-medium">{device.instanceName ?? 'Unmapped'}</p>
                          <p className="text-xs text-muted-foreground">
                            {device.instanceId ? 'Device-backed instance' : 'Ready for commercial setup'}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        {device.attentionReason ? (
                          <div className="flex flex-col gap-1">
                            <StatusBadge value="Attention" className="w-fit" />
                            <p className="max-w-xs text-xs text-muted-foreground">{device.attentionReason}</p>
                          </div>
                        ) : (
                          <StatusBadge value="Healthy" />
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      )}

      {selectedDevice ? (
        <DeviceDetailDialog
          open
          onOpenChange={(open) => {
            if (!open) {
              setSelectedDevice(null)
            }
          }}
          device={selectedDevice}
          onCreateInstance={() => {
            setCreatingDevice(selectedDevice)
          }}
        />
      ) : null}

      {creatingDevice ? (
        <InstanceDialog
          open
          onOpenChange={(open) => {
            if (!open) {
              setCreatingDevice(null)
            }
          }}
          mode="create"
          title={`Create instance for ${creatingDevice.name}`}
          description="Define the commercial product layered on top of this live Brokkr device."
          submitLabel={createInstanceMutation.isPending ? 'Creating...' : 'Create instance'}
          deviceId={creatingDevice.id}
          datacenterId={null}
          onSubmit={async (payload) => {
            await createInstanceMutation.mutateAsync(payload as CreateOperatorInstanceInput)
          }}
        />
      ) : null}
    </div>
  )
}
