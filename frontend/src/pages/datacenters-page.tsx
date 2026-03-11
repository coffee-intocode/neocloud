import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'

import { getDatacenters } from '@/operator/api'
import { PageHeader } from '@/components/page-header'
import { StatusBadge } from '@/components/status-badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { formatCurrency, formatDateTime } from '@/lib/formatters'

export function DatacentersPage() {
  const datacentersQuery = useQuery({
    queryKey: ['operator', 'datacenters'],
    queryFn: getDatacenters,
  })

  if (datacentersQuery.isLoading) {
    return <Skeleton className="h-[70vh] rounded-3xl" />
  }

  if (datacentersQuery.isError || !datacentersQuery.data) {
    return (
      <Card className="border-destructive/40">
        <CardHeader>
          <CardTitle>Unable to load datacenters</CardTitle>
          <CardDescription>
            {datacentersQuery.error?.message ?? 'The datacenter portfolio request failed.'}
          </CardDescription>
        </CardHeader>
      </Card>
    )
  }

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Facilities"
        title="Datacenters"
        description="Manage the facility portfolio and drill into zones, contacts, bridge coverage, and earning readiness."
      />

      <Card>
        <CardHeader>
          <CardDescription>Portfolio</CardDescription>
          <CardTitle>All active datacenters</CardTitle>
        </CardHeader>
        <CardContent>
          {datacentersQuery.data.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border/70 p-6 text-sm text-muted-foreground">
              No datacenters exist yet for this organization. Once you add facilities in Brokkr, this portfolio view
              will roll up zones, bridges, devices, and current earning capacity.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Datacenter</TableHead>
                  <TableHead>Region</TableHead>
                  <TableHead>Readiness</TableHead>
                  <TableHead>Devices</TableHead>
                  <TableHead>Instances</TableHead>
                  <TableHead>Revenue / hr</TableHead>
                  <TableHead>Created</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {datacentersQuery.data.map((datacenter) => (
                  <TableRow key={datacenter.id}>
                    <TableCell>
                      <Link to={`/datacenters/${datacenter.id}`} className="font-medium text-primary hover:underline">
                        {datacenter.name}
                      </Link>
                      <p className="text-xs text-muted-foreground">
                        {datacenter.facility ?? datacenter.physicalAddress ?? 'Facility unavailable'}
                      </p>
                    </TableCell>
                    <TableCell>{datacenter.region ?? 'Unavailable'}</TableCell>
                    <TableCell>
                      <StatusBadge value={datacenter.readinessLabel} />
                    </TableCell>
                    <TableCell>{datacenter.deviceCount}</TableCell>
                    <TableCell>
                      {datacenter.listedInstanceCount} listed / {datacenter.activeInstanceCount} earning
                    </TableCell>
                    <TableCell>{formatCurrency(datacenter.hourlyRevenueUsd)}</TableCell>
                    <TableCell>{formatDateTime(datacenter.createdAt)}</TableCell>
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
