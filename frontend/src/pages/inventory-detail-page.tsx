import { useQuery } from '@tanstack/react-query'
import { ArrowLeftIcon, ExternalLinkIcon } from 'lucide-react'
import { Link, useParams } from 'react-router-dom'

import { getInventoryItem } from '@/brokkr/api'
import { StatusBadge } from '@/components/status-badge'
import { PageHeader } from '@/components/page-header'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { formatDateTime, formatGigabytes, formatHourlyPrice } from '@/lib/formatters'

function DetailValue({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-border/70 p-4">
      <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">{label}</p>
      <p className="mt-2 text-sm font-medium">{value}</p>
    </div>
  )
}

export function InventoryDetailPage() {
  const { inventoryId = '' } = useParams()

  const inventoryQuery = useQuery({
    queryKey: ['brokkr', 'inventory', 'item', inventoryId],
    queryFn: () => getInventoryItem(inventoryId),
    enabled: Boolean(inventoryId),
  })

  if (inventoryQuery.isLoading) {
    return <Skeleton className="h-[70vh] rounded-3xl" />
  }

  if (inventoryQuery.isError || !inventoryQuery.data) {
    return (
      <Card className="border-destructive/40">
        <CardHeader>
          <CardTitle>Unable to load inventory detail</CardTitle>
          <CardDescription>{inventoryQuery.error?.message ?? 'The listing could not be found.'}</CardDescription>
        </CardHeader>
        <CardContent>
          <Button asChild variant="outline">
            <Link to="/inventory">Back to inventory</Link>
          </Button>
        </CardContent>
      </Card>
    )
  }

  const item = inventoryQuery.data

  return (
    <div className="space-y-8">
      <Button asChild variant="ghost" className="px-0">
        <Link to="/inventory">
          <ArrowLeftIcon />
          Back to inventory
        </Link>
      </Button>

      <PageHeader
        eyebrow="Inventory detail"
        title={item.specs.gpuModel ?? item.name}
        description="Machine-level listing details normalized from Brokkr inventory. Provisioning is intentionally omitted from this version."
        actions={<StatusBadge value={item.stockStatus ?? 'Unavailable'} />}
      />

      <div className="grid gap-4 xl:grid-cols-[1.05fr_0.95fr]">
        <Card>
          <CardHeader>
            <CardDescription>Hardware profile</CardDescription>
            <CardTitle>{item.name}</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3 sm:grid-cols-2">
            <DetailValue label="Location" value={item.location ?? 'Unavailable'} />
            <DetailValue label="Role" value={item.role ?? 'Unavailable'} />
            <DetailValue label="GPU" value={item.specs.gpuModel ?? 'Unavailable'} />
            <DetailValue label="GPU count" value={item.specs.gpuCount?.toString() ?? 'Unavailable'} />
            <DetailValue label="CPU model" value={item.specs.cpuModel ?? 'Unavailable'} />
            <DetailValue label="CPU threads" value={item.specs.cpuTotalThreads?.toString() ?? 'Unavailable'} />
            <DetailValue label="Memory" value={formatGigabytes(item.specs.memoryTotalGb)} />
            <DetailValue label="Storage" value={formatGigabytes(item.specs.storageTotalGb)} />
            <DetailValue label="Starting price" value={formatHourlyPrice(item.startingPrice)} />
            <DetailValue label="Available at" value={formatDateTime(item.availableAt)} />
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardDescription>Networking</CardDescription>
              <CardTitle>Interface summary</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-3 sm:grid-cols-2">
              <DetailValue label="IPv4" value={item.networking.ipv4 ?? 'Unavailable'} />
              <DetailValue label="IPv6" value={item.networking.ipv6 ?? 'Unavailable'} />
              <DetailValue label="Network type" value={item.networking.networkType ?? 'Unavailable'} />
              <DetailValue
                label="VPC capable"
                value={item.networking.vpcCapable == null ? 'Unavailable' : item.networking.vpcCapable ? 'Yes' : 'No'}
              />
            </CardContent>
          </Card>

          <Card className="border-primary/20 bg-primary/5">
            <CardHeader>
              <CardDescription>Scope guardrail</CardDescription>
              <CardTitle>Read-only listing detail</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-muted-foreground">
              <p>
                This screen is here to demonstrate discovery and inspection only. Provisioning is intentionally
                excluded.
              </p>
              {item.supplierPolicyUrl ? (
                <Button asChild variant="outline">
                  <a href={item.supplierPolicyUrl} target="_blank" rel="noreferrer">
                    Supplier policy
                    <ExternalLinkIcon />
                  </a>
                </Button>
              ) : null}
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-[1fr_1fr]">
        <Card>
          <CardHeader>
            <CardDescription>Supported operating systems</CardDescription>
            <CardTitle>Provisioning-ready image set</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {item.availableOperatingSystems.length === 0 ? (
              <p className="text-sm text-muted-foreground">No operating systems were returned for this listing.</p>
            ) : (
              item.availableOperatingSystems.map((operatingSystem) => (
                <div
                  key={`${operatingSystem.slug ?? operatingSystem.name}`}
                  className="rounded-xl border border-border/70 p-4"
                >
                  <p className="font-medium">{operatingSystem.name ?? 'Unknown image'}</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {[operatingSystem.distribution, operatingSystem.version].filter(Boolean).join(' • ') ||
                      operatingSystem.slug}
                  </p>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardDescription>Storage capabilities</CardDescription>
            <CardTitle>Layouts surfaced by Brokkr</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {item.storageLayouts.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No storage layout metadata was returned for this listing.
              </p>
            ) : (
              item.storageLayouts.map((layout) => (
                <div key={layout.name} className="rounded-xl border border-border/70 p-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="font-medium">{layout.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {[layout.diskType, layout.sizePerDiskGb ? formatGigabytes(layout.sizePerDiskGb) : null]
                        .filter(Boolean)
                        .join(' • ')}
                    </p>
                  </div>
                  <p className="mt-2 text-sm text-muted-foreground">
                    Capabilities: {layout.capabilities.join(', ') || 'Unavailable'}
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Filesystems: {layout.fileSystems.join(', ') || 'Unavailable'}
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Disks: {layout.diskNames.join(', ') || 'Unavailable'}
                  </p>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardDescription>Default disk layouts</CardDescription>
          <CardTitle>Preset mounting scheme</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-2">
          {item.defaultDiskLayouts.length === 0 ? (
            <p className="text-sm text-muted-foreground">No default disk layout was returned for this listing.</p>
          ) : (
            item.defaultDiskLayouts.map((layout, index) => (
              <div key={`${layout.mountpoint}-${index}`} className="rounded-xl border border-border/70 p-4">
                <p className="font-medium">{layout.mountpoint}</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {[layout.config, layout.format, layout.diskType].filter(Boolean).join(' • ')}
                </p>
                <p className="mt-2 text-sm text-muted-foreground">Disks: {layout.disks.join(', ') || 'Unavailable'}</p>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  )
}
