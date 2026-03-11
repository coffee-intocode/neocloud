import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'

import { getDeployments } from '@/operator/api'
import { PageHeader } from '@/components/page-header'
import { StatusBadge } from '@/components/status-badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { titleCase } from '@/lib/formatters'

export function DeploymentsPage() {
  const deploymentsQuery = useQuery({
    queryKey: ['operator', 'deployments'],
    queryFn: getDeployments,
  })

  if (deploymentsQuery.isLoading) {
    return <Skeleton className="h-[70vh] rounded-3xl" />
  }

  if (deploymentsQuery.isError || !deploymentsQuery.data) {
    return (
      <Card className="border-destructive/40">
        <CardHeader>
          <CardTitle>Unable to load deployments</CardTitle>
          <CardDescription>{deploymentsQuery.error?.message ?? 'The deployment request failed.'}</CardDescription>
        </CardHeader>
      </Card>
    )
  }

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Operations"
        title="Deployments"
        description="Track live customer load and machine state without exposing mutating controls in this version."
      />

      <Card>
        <CardHeader>
          <CardDescription>Live deployments</CardDescription>
          <CardTitle>Current operating load</CardTitle>
        </CardHeader>
        <CardContent>
          {deploymentsQuery.data.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border/70 p-6 text-sm text-muted-foreground">
              No deployments are active for this organization yet.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Deployment</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Contract</TableHead>
                  <TableHead>IP</TableHead>
                  <TableHead>GPU</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {deploymentsQuery.data.map((deployment) => (
                  <TableRow key={deployment.id}>
                    <TableCell>
                      <Link to={`/deployments/${deployment.id}`} className="font-medium text-primary hover:underline">
                        {deployment.name}
                      </Link>
                      <p className="text-xs text-muted-foreground">{deployment.projectName ?? 'No project'}</p>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-2">
                        <StatusBadge value={deployment.status.label} />
                        <StatusBadge value={deployment.powerStatus.label} />
                      </div>
                    </TableCell>
                    <TableCell>{deployment.location ?? 'Unavailable'}</TableCell>
                    <TableCell>{titleCase(deployment.contractType)}</TableCell>
                    <TableCell>{deployment.ipv4 ?? 'Unavailable'}</TableCell>
                    <TableCell>
                      {deployment.gpuModel ?? 'Unknown GPU'}
                      <p className="text-xs text-muted-foreground">{deployment.gpuCount ?? 0} GPU</p>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
