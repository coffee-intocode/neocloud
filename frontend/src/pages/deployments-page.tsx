import { useQuery } from '@tanstack/react-query'
import { Link, useSearchParams } from 'react-router-dom'

import { getDeployments } from '@/brokkr/api'
import { StatusBadge } from '@/components/status-badge'
import { PageHeader } from '@/components/page-header'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { titleCase } from '@/lib/formatters'

const PAGE_SIZE = 20

export function DeploymentsPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const search = searchParams.get('search') ?? ''
  const page = Math.max(Number(searchParams.get('page') ?? '1'), 1)

  const deploymentsQuery = useQuery({
    queryKey: ['brokkr', 'deployments', { search, page }],
    queryFn: () => getDeployments({ page, pageSize: PAGE_SIZE, search }),
  })

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Fleet"
        title="Deployments"
        description="Read-only fleet visibility for the active Brokkr organization. This view is ready for machine controls once a deployment exists."
      />

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Fleet search</CardTitle>
          <CardDescription>
            Search by deployment name or any upstream deployment search field Brokkr supports.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Input
            placeholder="Search deployments"
            value={search}
            onChange={(event) => {
              const next = new URLSearchParams(searchParams)
              if (event.target.value) {
                next.set('search', event.target.value)
              } else {
                next.delete('search')
              }
              next.set('page', '1')
              setSearchParams(next)
            }}
          />
        </CardContent>
      </Card>

      {deploymentsQuery.isLoading ? (
        <div className="grid gap-4 lg:grid-cols-2">
          {Array.from({ length: 4 }).map((_, index) => (
            <Skeleton key={index} className="h-48 rounded-2xl" />
          ))}
        </div>
      ) : deploymentsQuery.isError ? (
        <Card className="border-destructive/40">
          <CardHeader>
            <CardTitle>Unable to load deployments</CardTitle>
            <CardDescription>{deploymentsQuery.error.message}</CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              onClick={() => {
                deploymentsQuery.refetch().catch((error: unknown) => {
                  console.error('Failed to refetch deployments', error)
                })
              }}
            >
              Retry
            </Button>
          </CardContent>
        </Card>
      ) : !deploymentsQuery.data ? null : deploymentsQuery.data.data.length === 0 ? (
        <Card className="border-primary/20 bg-primary/5">
          <CardHeader>
            <CardDescription>Empty fleet</CardDescription>
            <CardTitle>No active deployments in this organization</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            <p>
              That is expected for this version. Provisioning is intentionally excluded, but the console is ready to
              surface deployment status, power state, IPs, and lifecycle metadata once a machine exists.
            </p>
            <Button asChild variant="outline">
              <Link to="/inventory">Browse inventory instead</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="grid gap-4 lg:grid-cols-2">
            {deploymentsQuery.data.data.map((deployment) => (
              <Card key={deployment.id}>
                <CardHeader className="space-y-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <CardTitle className="text-xl">{deployment.name}</CardTitle>
                      <CardDescription>{deployment.location ?? 'Location unavailable'}</CardDescription>
                    </div>
                    <StatusBadge value={deployment.powerStatus.label} />
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <StatusBadge value={deployment.status.label} />
                    {deployment.contractType ? <StatusBadge value={titleCase(deployment.contractType)} /> : null}
                    {deployment.isInterruptible ? <StatusBadge value="Interruptible" /> : null}
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="rounded-xl border border-border/70 p-3">
                      <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">GPU</p>
                      <p className="mt-2 font-medium">{deployment.gpuModel ?? 'Unavailable'}</p>
                    </div>
                    <div className="rounded-xl border border-border/70 p-3">
                      <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">IP address</p>
                      <p className="mt-2 font-medium">{deployment.ipv4 ?? 'Unavailable'}</p>
                    </div>
                    <div className="rounded-xl border border-border/70 p-3">
                      <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Project</p>
                      <p className="mt-2 font-medium">{deployment.projectName ?? 'Unassigned'}</p>
                    </div>
                    <div className="rounded-xl border border-border/70 p-3">
                      <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Contract</p>
                      <p className="mt-2 font-medium">
                        {deployment.contractType ? titleCase(deployment.contractType) : 'Unavailable'}
                      </p>
                    </div>
                  </div>
                  <Button asChild>
                    <Link to={`/deployments/${deployment.id}`}>Inspect deployment</Link>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="flex flex-col gap-3 rounded-2xl border border-border/70 bg-card/80 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-muted-foreground">
              Page {deploymentsQuery.data.meta.page} of {Math.max(deploymentsQuery.data.meta.totalPages, 1)} with{' '}
              {deploymentsQuery.data.meta.totalItems} deployments.
            </p>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                disabled={page <= 1}
                onClick={() => {
                  const next = new URLSearchParams(searchParams)
                  next.set('page', String(page - 1))
                  setSearchParams(next)
                }}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                disabled={page >= deploymentsQuery.data.meta.totalPages}
                onClick={() => {
                  const next = new URLSearchParams(searchParams)
                  next.set('page', String(page + 1))
                  setSearchParams(next)
                }}
              >
                Next
              </Button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
