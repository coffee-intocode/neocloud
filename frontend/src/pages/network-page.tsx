import { useQuery } from '@tanstack/react-query'

import { getNetworkSummary } from '@/operator/api'
import { PageHeader } from '@/components/page-header'
import { StatusBadge } from '@/components/status-badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'

function MetricCard({ label, value }: { label: string; value: number }) {
  return (
    <Card>
      <CardHeader>
        <CardDescription>{label}</CardDescription>
        <CardTitle className="text-3xl">{value}</CardTitle>
      </CardHeader>
    </Card>
  )
}

export function NetworkPage() {
  const networkQuery = useQuery({
    queryKey: ['operator', 'network'],
    queryFn: getNetworkSummary,
  })

  if (networkQuery.isLoading) {
    return <Skeleton className="h-[70vh] rounded-3xl" />
  }

  if (networkQuery.isError || !networkQuery.data) {
    return (
      <Card className="border-destructive/40">
        <CardHeader>
          <CardTitle>Unable to load network summary</CardTitle>
          <CardDescription>{networkQuery.error?.message ?? 'The network request failed.'}</CardDescription>
        </CardHeader>
      </Card>
    )
  }

  const network = networkQuery.data

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Network"
        title="Bridge readiness"
        description="Track bridge deployment, prefix configuration, and the requests blocking facilities from earning."
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-6">
        <MetricCard label="Bridges" value={network.bridgeCount} />
        <MetricCard label="Pending requests" value={network.pendingBridgeRequestCount} />
        <MetricCard label="Approved requests" value={network.approvedBridgeRequestCount} />
        <MetricCard label="Rejected requests" value={network.rejectedBridgeRequestCount} />
        <MetricCard label="Private prefixes" value={network.privatePrefixCount} />
        <MetricCard label="Public prefixes" value={network.publicPrefixCount} />
      </div>

      <div className="grid gap-4 xl:grid-cols-[1fr_1fr]">
        <Card>
          <CardHeader>
            <CardDescription>Bridge requests</CardDescription>
            <CardTitle>Readiness blockers</CardTitle>
          </CardHeader>
          <CardContent>
            {network.bridgeRequests.length === 0 ? (
              <p className="text-sm text-muted-foreground">No bridge requests have been submitted yet.</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Datacenter</TableHead>
                    <TableHead>Zone</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Count</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {network.bridgeRequests.map((request) => (
                    <TableRow key={request.id}>
                      <TableCell className="font-medium">{request.datacenterName}</TableCell>
                      <TableCell>{request.zoneName}</TableCell>
                      <TableCell>
                        <StatusBadge value={request.status} />
                      </TableCell>
                      <TableCell>{request.bridgeType ?? 'Unavailable'}</TableCell>
                      <TableCell>{request.bridgeCount ?? 'Unavailable'}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardDescription>Bridges</CardDescription>
            <CardTitle>Live network assets</CardTitle>
          </CardHeader>
          <CardContent>
            {network.bridges.length === 0 ? (
              <p className="text-sm text-muted-foreground">No bridges are active yet for this organization.</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Bridge</TableHead>
                    <TableHead>Datacenter</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Interfaces</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {network.bridges.map((bridge) => (
                    <TableRow key={bridge.id}>
                      <TableCell className="font-medium">{bridge.name}</TableCell>
                      <TableCell>{bridge.datacenterName}</TableCell>
                      <TableCell>
                        <StatusBadge value={bridge.status} />
                      </TableCell>
                      <TableCell>{bridge.interfaceCount}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
