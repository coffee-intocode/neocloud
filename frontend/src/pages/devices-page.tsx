import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Link } from 'react-router-dom'

import { createInstance, getDevices } from '@/operator/api'
import type { CreateOperatorInstanceInput, DeviceRow } from '@/operator/types'
import { InstanceDialog } from '@/components/instance-dialog'
import { PageHeader } from '@/components/page-header'
import { StatusBadge } from '@/components/status-badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { formatGigabytes, formatHourlyPrice } from '@/lib/formatters'

export function DevicesPage() {
  const [search, setSearch] = useState('')
  const [selectedDevice, setSelectedDevice] = useState<DeviceRow | null>(null)
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
    if (normalized.length === 0) {
      return devicesQuery.data
    }

    return devicesQuery.data.filter((device) =>
      [device.name, device.gpuModel, device.cpuModel, device.datacenterName, device.zoneName, device.location]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(normalized)),
    )
  }, [devicesQuery.data, search])

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Supply"
        title="Devices"
        description="Operate the hardware you can monetize. Map live Brokkr devices to commercial instances directly from this table."
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
                    <TableHead>Health</TableHead>
                    <TableHead>Listing</TableHead>
                    <TableHead>Mapped instance</TableHead>
                    <TableHead>Attention</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredDevices.map((device) => (
                    <TableRow key={device.id}>
                      <TableCell>
                        <p className="font-medium">{device.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {device.gpuModel ?? 'Unknown GPU'} • {device.gpuCount ?? 0} GPU •{' '}
                          {formatGigabytes(device.memoryTotalGb)}
                        </p>
                      </TableCell>
                      <TableCell>
                        <p>{device.datacenterName ?? 'Unassigned'}</p>
                        <p className="text-xs text-muted-foreground">
                          {device.zoneName ?? device.location ?? 'Zone unavailable'}
                        </p>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-2">
                          <StatusBadge value={device.status.label} />
                          <StatusBadge value={device.powerStatus.label} />
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <StatusBadge value={device.listingActive ? 'Listed' : 'Draft'} />
                          <p className="text-xs text-muted-foreground">
                            {device.onDemandPriceUsd ? formatHourlyPrice(device.onDemandPriceUsd) : 'No Brokkr price'}
                          </p>
                          {device.interruptibleOnly ? (
                            <p className="text-xs text-muted-foreground">Interruptible only</p>
                          ) : null}
                        </div>
                      </TableCell>
                      <TableCell>
                        {device.instanceId ? (
                          <div className="space-y-1">
                            <Link to={`/instances`} className="font-medium text-primary hover:underline">
                              {device.instanceName}
                            </Link>
                            <p className="text-xs text-muted-foreground">Device-backed instance</p>
                          </div>
                        ) : (
                          <p className="text-sm text-muted-foreground">No local instance yet</p>
                        )}
                      </TableCell>
                      <TableCell>
                        {device.attentionReason ? (
                          <p className="max-w-xs text-sm text-muted-foreground">{device.attentionReason}</p>
                        ) : (
                          <StatusBadge value="Healthy" />
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        {device.instanceId ? (
                          <Button asChild variant="outline">
                            <Link to="/instances">View instance</Link>
                          </Button>
                        ) : (
                          <Button
                            onClick={() => {
                              setSelectedDevice(device)
                            }}
                          >
                            Create instance
                          </Button>
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
        <InstanceDialog
          open
          onOpenChange={(open) => {
            if (!open) {
              setSelectedDevice(null)
            }
          }}
          mode="create"
          title={`Create instance for ${selectedDevice.name}`}
          description="Define the commercial product layered on top of this live Brokkr device."
          submitLabel={createInstanceMutation.isPending ? 'Creating...' : 'Create instance'}
          deviceId={selectedDevice.id}
          datacenterId={null}
          onSubmit={async (payload) => {
            await createInstanceMutation.mutateAsync(payload as CreateOperatorInstanceInput)
          }}
        />
      ) : null}
    </div>
  )
}
