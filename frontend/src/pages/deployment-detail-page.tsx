import { useQuery } from '@tanstack/react-query'
import { ArrowLeftIcon, LockIcon } from 'lucide-react'
import { Link, useParams } from 'react-router-dom'

import { getDeployment } from '@/operator/api'
import { StatusBadge } from '@/components/status-badge'
import { PageHeader } from '@/components/page-header'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { formatDateTime, formatGigabytes, titleCase } from '@/lib/formatters'

function DetailValue({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-border/70 p-4">
      <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">{label}</p>
      <p className="mt-2 text-sm font-medium">{value}</p>
    </div>
  )
}

export function DeploymentDetailPage() {
  const { deploymentId = '' } = useParams()

  const deploymentQuery = useQuery({
    queryKey: ['brokkr', 'deployments', 'item', deploymentId],
    queryFn: () => getDeployment(deploymentId),
    enabled: Boolean(deploymentId),
  })

  if (deploymentQuery.isLoading) {
    return <Skeleton className="h-[70vh] rounded-3xl" />
  }

  if (deploymentQuery.isError || !deploymentQuery.data) {
    return (
      <Card className="border-destructive/40">
        <CardHeader>
          <CardTitle>Unable to load deployment detail</CardTitle>
          <CardDescription>{deploymentQuery.error?.message ?? 'The deployment could not be found.'}</CardDescription>
        </CardHeader>
        <CardContent>
          <Button asChild variant="outline">
            <Link to="/deployments">Back to deployments</Link>
          </Button>
        </CardContent>
      </Card>
    )
  }

  const deployment = deploymentQuery.data

  return (
    <div className="space-y-8">
      <Button asChild variant="ghost" className="px-0">
        <Link to="/deployments">
          <ArrowLeftIcon />
          Back to deployments
        </Link>
      </Button>

      <PageHeader
        eyebrow="Deployment detail"
        title={deployment.name}
        description="Live deployment metadata surfaced through the operator API. Mutating controls are intentionally withheld in this version."
        actions={
          <div className="flex flex-wrap gap-2">
            <StatusBadge value={deployment.status.label} />
            <StatusBadge value={deployment.powerStatus.label} />
          </div>
        }
      />

      <div className="grid gap-4 xl:grid-cols-[1fr_1fr]">
        <Card>
          <CardHeader>
            <CardDescription>Machine state</CardDescription>
            <CardTitle>{deployment.gpuModel ?? 'Deployment overview'}</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3 sm:grid-cols-2">
            <DetailValue label="Location" value={deployment.location ?? 'Unavailable'} />
            <DetailValue label="Project" value={deployment.projectName ?? 'Unassigned'} />
            <DetailValue
              label="Contract type"
              value={deployment.contractType ? titleCase(deployment.contractType) : 'Unavailable'}
            />
            <DetailValue label="Interruptible" value={deployment.isInterruptible ? 'Yes' : 'No'} />
            <DetailValue label="GPU count" value={deployment.gpuCount?.toString() ?? 'Unavailable'} />
            <DetailValue label="CPU model" value={deployment.cpuModel ?? 'Unavailable'} />
            <DetailValue label="CPU cores" value={deployment.cpuTotalCores?.toString() ?? 'Unavailable'} />
            <DetailValue label="CPU threads" value={deployment.cpuTotalThreads?.toString() ?? 'Unavailable'} />
            <DetailValue label="Memory" value={formatGigabytes(deployment.memoryTotalGb)} />
            <DetailValue label="Storage" value={formatGigabytes(deployment.storageTotalGb)} />
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardDescription>Network</CardDescription>
              <CardTitle>Reachability snapshot</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-3 sm:grid-cols-2">
              <DetailValue label="IPv4" value={deployment.ipv4 ?? 'Unavailable'} />
              <DetailValue label="IPv6" value={deployment.ipv6 ?? 'Unavailable'} />
              <DetailValue label="MAC" value={deployment.mac ?? 'Unavailable'} />
              <DetailValue
                label="Scheduled interruption"
                value={formatDateTime(deployment.scheduledInterruptionTime)}
              />
            </CardContent>
          </Card>

          <Card className="border-primary/20 bg-primary/5">
            <CardHeader>
              <CardDescription>Scope guardrail</CardDescription>
              <CardTitle>Controls intentionally withheld</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-muted-foreground">
              <div className="flex items-center gap-3 rounded-xl border border-primary/15 bg-background/70 p-3">
                <LockIcon className="size-4 text-primary" />
                <span>This screen proves the operating view without performing power or provisioning actions.</span>
              </div>
              <p>
                Later phases can add power control, reboot, metrics, and SSH workflows once that operational scope is
                approved.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-[1fr_1fr]">
        <Card>
          <CardHeader>
            <CardDescription>Access context</CardDescription>
            <CardTitle>Operating systems and SSH</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="rounded-xl border border-border/70 p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Operating systems</p>
              <p className="mt-2 text-sm text-muted-foreground">
                {deployment.availableOperatingSystems.join(', ') || 'Unavailable'}
              </p>
            </div>
            <div className="rounded-xl border border-border/70 p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">SSH keys</p>
              <p className="mt-2 text-sm text-muted-foreground">
                {deployment.sshKeys.length > 0 ? deployment.sshKeys.join('\n') : 'No SSH key metadata returned.'}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardDescription>Lifecycle metadata</CardDescription>
            <CardTitle>Tags and actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="rounded-xl border border-border/70 p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Lock state</p>
              <p className="mt-2 text-sm text-muted-foreground">{deployment.isLocked ? 'Locked' : 'Unlocked'}</p>
            </div>
            <div className="rounded-xl border border-border/70 p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Lifecycle actions</p>
              <p className="mt-2 text-sm text-muted-foreground">
                {deployment.lifecycleActions.join(', ') || 'Unavailable'}
              </p>
            </div>
            <div className="rounded-xl border border-border/70 p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Tags</p>
              <p className="mt-2 text-sm text-muted-foreground">{deployment.tags.join(', ') || 'Unavailable'}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
