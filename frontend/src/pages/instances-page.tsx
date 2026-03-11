import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { getInstances, updateInstance } from '@/operator/api'
import type { OperatorInstance, UpdateOperatorInstanceInput } from '@/operator/types'
import { InstanceDialog } from '@/components/instance-dialog'
import { PageHeader } from '@/components/page-header'
import { StatusBadge } from '@/components/status-badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { formatCurrency, formatDateTime, formatHourlyPrice } from '@/lib/formatters'

export function InstancesPage() {
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
          {instancesQuery.data.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border/70 p-6 text-sm text-muted-foreground">
              No local instances exist yet. Create them from the Devices page to connect pricing and revenue logic to
              real devices.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Instance</TableHead>
                  <TableHead>Device</TableHead>
                  <TableHead>Market</TableHead>
                  <TableHead>Revenue / hr</TableHead>
                  <TableHead>Opportunity / hr</TableHead>
                  <TableHead>Attention</TableHead>
                  <TableHead>Updated</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {instancesQuery.data.map((instance) => (
                  <TableRow key={instance.id}>
                    <TableCell>
                      <p className="font-medium">{instance.displayName}</p>
                      <p className="text-xs text-muted-foreground">
                        {instance.gpuModel ?? 'Unknown GPU'} • {instance.datacenterName ?? 'Unassigned datacenter'}
                      </p>
                    </TableCell>
                    <TableCell>
                      <p>{instance.deviceName ?? instance.brokkrDeviceId}</p>
                      <p className="text-xs text-muted-foreground">{instance.brokkrDeviceId}</p>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <StatusBadge value={instance.marketStatus} />
                        <p className="text-xs text-muted-foreground">
                          {instance.isVisible ? 'Visible to market' : 'Hidden from market'}
                        </p>
                        <p className="text-xs text-primary">{formatHourlyPrice(instance.hourlyRateUsd)}</p>
                      </div>
                    </TableCell>
                    <TableCell>{formatCurrency(instance.currentHourlyRevenueUsd)}</TableCell>
                    <TableCell>{formatCurrency(instance.idleHourlyOpportunityUsd)}</TableCell>
                    <TableCell>
                      {instance.attentionReason ? (
                        <p className="max-w-xs text-sm text-muted-foreground">{instance.attentionReason}</p>
                      ) : (
                        <StatusBadge value="Healthy" />
                      )}
                    </TableCell>
                    <TableCell>{formatDateTime(instance.updatedAt)}</TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="outline"
                        onClick={() => {
                          setEditingInstance(instance)
                        }}
                      >
                        Edit
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

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
