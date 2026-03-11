import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { getInstances, updateInstance } from '@/operator/api'
import type { OperatorInstance, UpdateOperatorInstanceInput } from '@/operator/types'
import { InstanceDetailDialog } from '@/components/instance-detail-dialog'
import { InstanceDialog } from '@/components/instance-dialog'
import { PageHeader } from '@/components/page-header'
import { StatusBadge } from '@/components/status-badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { formatCurrency, formatHourlyPrice } from '@/lib/formatters'

export function InstancesPage() {
  const [selectedInstance, setSelectedInstance] = useState<OperatorInstance | null>(null)
  const [editingInstance, setEditingInstance] = useState<OperatorInstance | null>(null)
  const queryClient = useQueryClient()

  const instancesQuery = useQuery({
    queryKey: ['operator', 'instances'],
    queryFn: getInstances,
  })

  const updateInstanceMutation = useMutation({
    mutationFn: ({ instanceId, payload }: { instanceId: string; payload: UpdateOperatorInstanceInput }) =>
      updateInstance(instanceId, payload),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['operator', 'instances'] }),
        queryClient.invalidateQueries({ queryKey: ['operator', 'devices'] }),
        queryClient.invalidateQueries({ queryKey: ['operator', 'dashboard'] }),
        queryClient.invalidateQueries({ queryKey: ['operator', 'datacenters'] }),
      ])
    },
  })

  const sortedInstances = useMemo(() => {
    if (!instancesQuery.data) {
      return []
    }

    const instances: OperatorInstance[] = instancesQuery.data

    return [...instances].sort((left, right) => {
      const leftNeedsAttention = left.attentionReason ? 1 : 0
      const rightNeedsAttention = right.attentionReason ? 1 : 0

      if (leftNeedsAttention !== rightNeedsAttention) {
        return rightNeedsAttention - leftNeedsAttention
      }

      const leftCommercialImpact = left.currentHourlyRevenueUsd + left.idleHourlyOpportunityUsd + left.hourlyRateUsd
      const rightCommercialImpact =
        right.currentHourlyRevenueUsd + right.idleHourlyOpportunityUsd + right.hourlyRateUsd
      if (leftCommercialImpact !== rightCommercialImpact) {
        return rightCommercialImpact - leftCommercialImpact
      }

      return left.displayName.localeCompare(right.displayName)
    })
  }, [instancesQuery.data])

  if (instancesQuery.isLoading) {
    return <Skeleton className="h-[70vh] rounded-3xl" />
  }

  if (instancesQuery.isError || !instancesQuery.data) {
    return (
      <Card className="border-destructive/40">
        <CardHeader>
          <CardTitle>Unable to load instances</CardTitle>
          <CardDescription>{instancesQuery.error?.message ?? 'The instance request failed.'}</CardDescription>
        </CardHeader>
      </Card>
    )
  }

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Commercial layer"
        title="Instances"
        description="Manage the sellable units backed by real hardware, along with run-rate revenue and idle upside."
      />

      <Card>
        <CardHeader>
          <CardDescription>Commercial units</CardDescription>
          <CardTitle>Device-backed products</CardTitle>
        </CardHeader>
        <CardContent>
          {sortedInstances.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border/70 p-6 text-sm text-muted-foreground">
              No local instances exist yet. Create them from the Devices page to connect pricing and revenue logic to
              real devices.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Instance</TableHead>
                  <TableHead>Facility</TableHead>
                  <TableHead>Market</TableHead>
                  <TableHead>Revenue / hr</TableHead>
                  <TableHead>Attention</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedInstances.map((instance) => (
                  <TableRow
                    key={instance.id}
                    className="cursor-pointer"
                    tabIndex={0}
                    onClick={() => {
                      setSelectedInstance(instance)
                    }}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter' || event.key === ' ') {
                        event.preventDefault()
                        setSelectedInstance(instance)
                      }
                    }}
                  >
                    <TableCell>
                      <p className="font-medium">{instance.displayName}</p>
                      <p className="text-xs text-muted-foreground">
                        {instance.gpuModel ?? 'Unknown GPU'} • {instance.deviceName ?? 'Device unavailable'}
                      </p>
                    </TableCell>
                    <TableCell>
                      <p>{instance.datacenterName ?? 'Unassigned datacenter'}</p>
                      <p className="text-xs text-muted-foreground">{instance.online ? 'Online' : 'Offline'}</p>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-1">
                        <StatusBadge value={instance.marketStatus} />
                        <p className="text-xs text-primary">{formatHourlyPrice(instance.hourlyRateUsd)}</p>
                      </div>
                    </TableCell>
                    <TableCell>{formatCurrency(instance.currentHourlyRevenueUsd)}</TableCell>
                    <TableCell>
                      {instance.attentionReason ? (
                        <div className="flex flex-col gap-1">
                          <StatusBadge value="Attention" className="w-fit" />
                          <p className="max-w-xs text-xs text-muted-foreground">{instance.attentionReason}</p>
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

      {selectedInstance ? (
        <InstanceDetailDialog
          open
          onOpenChange={(open) => {
            if (!open) {
              setSelectedInstance(null)
            }
          }}
          instance={selectedInstance}
          onEdit={() => {
            setEditingInstance(selectedInstance)
          }}
        />
      ) : null}

      {editingInstance ? (
        <InstanceDialog
          open
          onOpenChange={(open) => {
            if (!open) {
              setEditingInstance(null)
            }
          }}
          mode="edit"
          title={`Edit ${editingInstance.displayName}`}
          description="Adjust commercial settings without changing the live Brokkr device metadata."
          submitLabel={updateInstanceMutation.isPending ? 'Saving...' : 'Save changes'}
          deviceId={editingInstance.brokkrDeviceId}
          datacenterId={editingInstance.brokkrDatacenterId}
          initialInstance={editingInstance}
          onSubmit={async (payload) => {
            await updateInstanceMutation.mutateAsync({
              instanceId: editingInstance.id,
              payload: payload as UpdateOperatorInstanceInput,
            })
          }}
        />
      ) : null}
    </div>
  )
}
