import { useQuery } from '@tanstack/react-query'
import { ArrowRightIcon, TriangleAlertIcon } from 'lucide-react'
import { Link } from 'react-router-dom'

import { getOperatorDashboard } from '@/operator/api'
import { PageHeader } from '@/components/page-header'
import { StatusBadge } from '@/components/status-badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { formatCurrency, formatDateTime } from '@/lib/formatters'

function MetricCard({ label, value, description }: { label: string; value: string; description: string }) {
  return (
    <Card className="h-full border-border/70 bg-card/90">
      <CardHeader>
        <CardDescription>{label}</CardDescription>
        <CardTitle className="text-3xl">{value}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">{description}</p>
      </CardContent>
    </Card>
  )
}

export function DashboardPage() {
  const dashboardQuery = useQuery({
    queryKey: ['operator', 'dashboard'],
    queryFn: getOperatorDashboard,
  })

  if (dashboardQuery.isLoading) {
    return (
      <div className="space-y-8">
        <PageHeader eyebrow="Operator" title="Dashboard" description="Revenue and readiness across your supply." />
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-12">
          {Array.from({ length: 4 }).map((_, index) => (
            <Skeleton key={index} className="h-36 rounded-2xl xl:col-span-3" />
          ))}
        </div>
        <Skeleton className="h-96 rounded-3xl" />
      </div>
    )
  }

  if (dashboardQuery.isError || !dashboardQuery.data) {
    return (
      <Card className="border-destructive/40">
        <CardHeader>
          <CardTitle>Unable to load operator dashboard</CardTitle>
          <CardDescription>{dashboardQuery.error?.message ?? 'The dashboard request failed.'}</CardDescription>
        </CardHeader>
        <CardContent>
          <Button
            onClick={() => {
              dashboardQuery.refetch().catch((error: unknown) => {
                console.error('Failed to refetch operator dashboard', error)
              })
            }}
          >
            Retry
          </Button>
        </CardContent>
      </Card>
    )
  }

  const dashboard = dashboardQuery.data

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Operator"
        title="Dashboard"
        description="Track current revenue, idle opportunity, facility readiness, and the supply issues costing you money."
        actions={
          <Button asChild>
            <Link to="/devices">
              Open devices
              <ArrowRightIcon />
            </Link>
          </Button>
        }
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-12">
        <div className="xl:col-span-3">
          <MetricCard
            label="Current hourly revenue"
            value={formatCurrency(dashboard.revenue.currentHourlyRevenueUsd)}
            description="Run-rate from active earning instances."
          />
        </div>
        <div className="xl:col-span-3">
          <MetricCard
            label="Idle hourly opportunity"
            value={formatCurrency(dashboard.revenue.idleHourlyOpportunityUsd)}
            description="Visible capacity that could be earning right now."
          />
        </div>
        <div className="xl:col-span-3">
          <MetricCard
            label="Online earning capacity"
            value={String(dashboard.revenue.onlineCapacityCount)}
            description="Mapped instances currently online."
          />
        </div>
        <div className="xl:col-span-3">
          <MetricCard
            label="Attention queue"
            value={String(dashboard.revenue.attentionCount)}
            description="Instances blocked from earning."
          />
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-12">
        <Card className="xl:col-span-8">
          <CardHeader>
            <CardDescription>Attention queue</CardDescription>
            <CardTitle>Fix these first to protect revenue</CardTitle>
          </CardHeader>
          <CardContent>
            {dashboard.attentionItems.length === 0 ? (
              <div className="rounded-xl border border-dashed border-border/70 p-6 text-sm text-muted-foreground">
                No earning blockers detected yet. As you map devices to commercial instances, issues will surface here.
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Instance</TableHead>
                    <TableHead>Datacenter</TableHead>
                    <TableHead>Reason</TableHead>
                    <TableHead className="text-right">Blocked / hr</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {dashboard.attentionItems.map((item) => (
                    <TableRow key={item.operatorInstanceId ?? item.brokkrDeviceId ?? item.title}>
                      <TableCell className="font-medium">{item.title}</TableCell>
                      <TableCell>{item.datacenterName ?? 'Unassigned'}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <TriangleAlertIcon className="size-4 text-amber-500" />
                          <span className="text-muted-foreground">{item.reason}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">{formatCurrency(item.blockedHourlyRevenueUsd)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        <Card className="xl:col-span-4">
          <CardHeader>
            <CardDescription>Datacenter portfolio</CardDescription>
            <CardTitle>Where earning capacity sits</CardTitle>
          </CardHeader>
          <CardContent>
            {dashboard.datacenters.length === 0 ? (
              <div className="rounded-xl border border-dashed border-border/70 p-6 text-sm text-muted-foreground">
                No datacenters exist yet in the active Brokkr organization.
              </div>
            ) : (
              <div className="space-y-3">
                {dashboard.datacenters.map((datacenter) => (
                  <div key={datacenter.id} className="rounded-xl border border-border/70 p-4">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="font-medium">{datacenter.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {datacenter.region ?? datacenter.facility ?? 'Region unavailable'}
                        </p>
                      </div>
                      <StatusBadge value={datacenter.readinessLabel} />
                    </div>
                    <div className="mt-4 grid gap-2 text-sm text-muted-foreground md:grid-cols-2">
                      <p>Revenue: {formatCurrency(datacenter.hourlyRevenueUsd)}</p>
                      <p>Opportunity: {formatCurrency(datacenter.idleHourlyOpportunityUsd)}</p>
                      <p>Devices: {datacenter.deviceCount}</p>
                      <p>Zones: {datacenter.zoneCount}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 xl:grid-cols-12">
        <Card className="xl:col-span-4">
          <CardHeader>
            <CardDescription>Top idle instances</CardDescription>
            <CardTitle>Fastest path to more revenue</CardTitle>
          </CardHeader>
          <CardContent>
            {dashboard.topIdleInstances.length === 0 ? (
              <p className="text-sm text-muted-foreground">No idle instances are ready to monetize yet.</p>
            ) : (
              <div className="space-y-3">
                {dashboard.topIdleInstances.map((item) => (
                  <div key={item.operatorInstanceId} className="rounded-xl border border-border/70 p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-medium">{item.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {item.datacenterName ?? 'Unassigned datacenter'}
                        </p>
                      </div>
                      <p className="font-semibold text-primary">{formatCurrency(item.hourlyRateUsd)}</p>
                    </div>
                    <p className="mt-2 text-sm text-muted-foreground">{item.reason}</p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="xl:col-span-4">
          <CardHeader>
            <CardDescription>Reservation pipeline</CardDescription>
            <CardTitle>Buyer activity snapshot</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            <div className="rounded-xl border border-border/70 p-4">
              <p className="font-medium text-foreground">Pending invites</p>
              <p className="mt-2 text-3xl font-semibold text-foreground">
                {dashboard.reservationPipeline.pendingCount}
              </p>
            </div>
            <div className="rounded-xl border border-border/70 p-4">
              <p className="font-medium text-foreground">Accepted</p>
              <p className="mt-2 text-3xl font-semibold text-foreground">
                {dashboard.reservationPipeline.acceptedCount}
              </p>
            </div>
            <div className="rounded-xl border border-border/70 p-4">
              <p className="font-medium text-foreground">Expired</p>
              <p className="mt-2 text-3xl font-semibold text-foreground">
                {dashboard.reservationPipeline.expiredCount}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="xl:col-span-4">
          <CardHeader>
            <CardDescription>Deployment snapshot</CardDescription>
            <CardTitle>Live operating load</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            <div className="rounded-xl border border-border/70 p-4">
              <p className="font-medium text-foreground">Deployments</p>
              <p className="mt-2 text-3xl font-semibold text-foreground">{dashboard.deployments.totalCount}</p>
            </div>
            <div className="rounded-xl border border-border/70 p-4">
              <p className="font-medium text-foreground">Interruptible</p>
              <p className="mt-2 text-3xl font-semibold text-foreground">{dashboard.deployments.interruptibleCount}</p>
            </div>
            <div className="rounded-xl border border-border/70 p-4">
              <p className="font-medium text-foreground">Locked</p>
              <p className="mt-2 text-3xl font-semibold text-foreground">{dashboard.deployments.lockedCount}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <p className="text-xs text-muted-foreground">
        Revenue is shown as hourly run rate and opportunity. Datacenter timestamps, where present, are normalized from
        Brokkr using the active organization context as of {formatDateTime(new Date().toISOString())}.
      </p>
    </div>
  )
}
