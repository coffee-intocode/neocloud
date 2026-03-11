import { useQuery } from '@tanstack/react-query'
import { ArrowRightIcon, CircleCheckBigIcon, DatabaseIcon, Layers2Icon, WalletCardsIcon } from 'lucide-react'
import { Link } from 'react-router-dom'

import { getOverview } from '@/brokkr/api'
import { StatusBadge } from '@/components/status-badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { PageHeader } from '@/components/page-header'
import { formatCurrency, formatDateTime } from '@/lib/formatters'

export function OverviewPage() {
  const overviewQuery = useQuery({
    queryKey: ['brokkr', 'overview'],
    queryFn: getOverview,
  })

  if (overviewQuery.isLoading) {
    return (
      <div className="space-y-6">
        <PageHeader
          eyebrow="Brokkr"
          title="Overview"
          description="Live control-plane context for your active Brokkr organization."
        />
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <Skeleton key={index} className="h-36 rounded-2xl" />
          ))}
        </div>
      </div>
    )
  }

  if (overviewQuery.isError) {
    return (
      <Card className="border-destructive/40">
        <CardHeader>
          <CardTitle>Unable to load Brokkr overview</CardTitle>
          <CardDescription>{overviewQuery.error.message}</CardDescription>
        </CardHeader>
        <CardContent>
          <Button
            onClick={() => {
              overviewQuery.refetch().catch((error: unknown) => {
                console.error('Failed to refetch overview', error)
              })
            }}
          >
            Retry
          </Button>
        </CardContent>
      </Card>
    )
  }

  const overview = overviewQuery.data
  if (!overview) {
    return null
  }

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Brokkr"
        title="Overview"
        description="A thin read-only control plane over your Brokkr account, focused on inventory discovery and fleet visibility."
        actions={
          <Button asChild>
            <Link to="/inventory">
              Explore inventory
              <ArrowRightIcon />
            </Link>
          </Button>
        }
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card className="border-primary/15 bg-gradient-to-br from-primary/10 via-card to-card">
          <CardHeader>
            <CardDescription>Connection</CardDescription>
            <CardTitle className="flex items-center gap-2 text-2xl">
              <CircleCheckBigIcon className="size-5 text-primary" />
              API connected
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-muted-foreground">
            <StatusBadge value={overview.connection.connected ? 'Connected' : 'Offline'} />
            <p>{overview.connection.baseUrl}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardDescription>Active organization</CardDescription>
            <CardTitle className="text-2xl">{overview.organization.name}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-muted-foreground">
            <p>{overview.organization.tenantType ?? 'Organization'}</p>
            <p>Created {formatDateTime(overview.organization.createdAt)}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardDescription>Fleet state</CardDescription>
            <CardTitle className="text-2xl">{overview.deploymentCount}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-muted-foreground">
            <p>Active deployments in the current org.</p>
            <Button asChild variant="ghost" className="px-0">
              <Link to="/deployments">Open deployments</Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardDescription>Market coverage</CardDescription>
            <CardTitle className="text-2xl">{overview.inventoryRegionCount}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-muted-foreground">
            <p>Regions currently surfaced by Brokkr inventory metadata.</p>
            <Button asChild variant="ghost" className="px-0">
              <Link to="/inventory">Browse listings</Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.15fr_0.85fr]">
        <Card>
          <CardHeader>
            <CardDescription>Pricing signal</CardDescription>
            <CardTitle>GPU categories with current starting prices</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {overview.categoryPrices.slice(0, 8).map((entry) => (
              <div
                key={entry.category}
                className="flex items-center justify-between rounded-xl border border-border/70 px-4 py-3"
              >
                <div className="space-y-1">
                  <p className="font-medium capitalize">{entry.category}</p>
                  <p className="text-xs text-muted-foreground">Current lowest observed starting price</p>
                </div>
                <div className="text-right">
                  <p className="text-lg font-semibold">{formatCurrency(entry.startPrice)}</p>
                  <p className="text-xs text-muted-foreground">per hour</p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardDescription>Current operator</CardDescription>
              <CardTitle>{overview.user?.name ?? overview.user?.email ?? 'Unavailable'}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-muted-foreground">
              <p>{overview.user?.email ?? 'No email returned by Brokkr.'}</p>
              <p>Role: {overview.user?.membershipRole ?? overview.user?.role ?? 'Unavailable'}</p>
              <p>User source: {overview.connection.userSource ?? 'Unavailable'}</p>
            </CardContent>
          </Card>

          <Card className="border-primary/20 bg-primary/5">
            <CardHeader>
              <CardDescription>Scope guardrail</CardDescription>
              <CardTitle>This version is intentionally read-only</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-muted-foreground">
              <p>Provisioning is omitted so the demo can stay clear of ambiguous infrastructure spend.</p>
              <div className="flex flex-wrap gap-2">
                <StatusBadge value="Connected" />
                <StatusBadge value="On demand" />
                <StatusBadge value="Reserve" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardDescription>Demo posture</CardDescription>
              <CardTitle>Thin cloud console</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-muted-foreground">
              <div className="flex items-center gap-3 rounded-xl border border-border/70 p-3">
                <DatabaseIcon className="size-4 text-primary" />
                <span>No database, no persisted app-owned state.</span>
              </div>
              <div className="flex items-center gap-3 rounded-xl border border-border/70 p-3">
                <WalletCardsIcon className="size-4 text-primary" />
                <span>Inventory and org data come live from Brokkr.</span>
              </div>
              <div className="flex items-center gap-3 rounded-xl border border-border/70 p-3">
                <Layers2Icon className="size-4 text-primary" />
                <span>The architecture is ready for fleet controls once billing is clarified.</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
