import { useQuery } from '@tanstack/react-query'
import { SearchIcon } from 'lucide-react'
import { Link, useSearchParams } from 'react-router-dom'

import { getInventory, getInventoryMetadata } from '@/brokkr/api'
import { StatusBadge } from '@/components/status-badge'
import { PageHeader } from '@/components/page-header'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { formatCount, formatDateTime, formatGigabytes, formatHourlyPrice, titleCase } from '@/lib/formatters'

const PAGE_SIZE = 24

function updateSearchParam(searchParams: URLSearchParams, key: string, value: string) {
  const next = new URLSearchParams(searchParams)

  if (value) {
    next.set(key, value)
  } else {
    next.delete(key)
  }

  next.set('page', '1')
  return next
}

export function InventoryPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const search = searchParams.get('search') ?? ''
  const region = searchParams.get('region') ?? ''
  const availability = searchParams.get('availability') ?? ''
  const page = Math.max(Number(searchParams.get('page') ?? '1'), 1)

  const metadataQuery = useQuery({
    queryKey: ['brokkr', 'inventory', 'metadata'],
    queryFn: getInventoryMetadata,
  })

  const inventoryQuery = useQuery({
    queryKey: ['brokkr', 'inventory', { page, search, region, availability }],
    queryFn: () =>
      getInventory({
        page,
        pageSize: PAGE_SIZE,
        search,
        region,
        availability,
      }),
  })

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Market"
        title="Inventory"
        description="Browse current GPU listings across Brokkr’s visible regions, filter the catalog, and inspect machine-level detail without provisioning."
      />

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Filters</CardTitle>
          <CardDescription>Search locally across the live inventory snapshot returned by Brokkr.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-[minmax(0,1.2fr)_minmax(220px,0.6fr)_minmax(220px,0.5fr)]">
          <div className="relative">
            <SearchIcon className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              className="pl-9"
              placeholder="Search by GPU, CPU, or location"
              value={search}
              onChange={(event) => {
                setSearchParams(updateSearchParam(searchParams, 'search', event.target.value))
              }}
            />
          </div>
          <Select
            value={region || '__all__'}
            onValueChange={(value) => {
              setSearchParams(updateSearchParam(searchParams, 'region', value === '__all__' ? '' : value))
            }}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="All regions" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__all__">All regions</SelectItem>
              {metadataQuery.data?.regions.map((entry) => (
                <SelectItem key={entry} value={entry}>
                  {entry}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select
            value={availability || '__all__'}
            onValueChange={(value) => {
              setSearchParams(updateSearchParam(searchParams, 'availability', value === '__all__' ? '' : value))
            }}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="All availability" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__all__">All availability</SelectItem>
              {metadataQuery.data?.availabilityOptions.map((entry) => (
                <SelectItem key={entry} value={entry}>
                  {titleCase(entry)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {inventoryQuery.isLoading ? (
        <div className="grid gap-4 lg:grid-cols-2 2xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <Skeleton key={index} className="h-72 rounded-2xl" />
          ))}
        </div>
      ) : inventoryQuery.isError ? (
        <Card className="border-destructive/40">
          <CardHeader>
            <CardTitle>Unable to load inventory</CardTitle>
            <CardDescription>{inventoryQuery.error.message}</CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              onClick={() => {
                inventoryQuery.refetch().catch((error: unknown) => {
                  console.error('Failed to refetch inventory', error)
                })
              }}
            >
              Retry
            </Button>
          </CardContent>
        </Card>
      ) : !inventoryQuery.data ? null : inventoryQuery.data.data.length === 0 ? (
        <Card className="border-dashed">
          <CardHeader>
            <CardTitle>No listings matched those filters</CardTitle>
            <CardDescription>
              Adjust the region, availability, or search term to widen the live catalog.
            </CardDescription>
          </CardHeader>
        </Card>
      ) : (
        <>
          <div className="grid gap-4 lg:grid-cols-2 2xl:grid-cols-3">
            {inventoryQuery.data.data.map((item) => (
              <Card key={item.id} className="flex h-full flex-col border-border/70 bg-card/90">
                <CardHeader className="space-y-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1">
                      <CardTitle className="text-xl">{item.gpuModel ?? item.name}</CardTitle>
                      <CardDescription>{item.name}</CardDescription>
                    </div>
                    <StatusBadge value={item.stockStatus ?? 'Unavailable'} />
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {item.isInterruptibleDeployment ? <StatusBadge value="Interruptible" /> : null}
                    {item.location ? <StatusBadge value={item.location} className="capitalize" /> : null}
                  </div>
                </CardHeader>
                <CardContent className="flex flex-1 flex-col justify-between gap-5">
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="rounded-xl border border-border/70 p-3">
                      <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">GPU</p>
                      <p className="mt-2 font-medium">{formatCount(item.gpuCount, 'GPU')}</p>
                    </div>
                    <div className="rounded-xl border border-border/70 p-3">
                      <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Memory</p>
                      <p className="mt-2 font-medium">{formatGigabytes(item.memoryTotal)}</p>
                    </div>
                    <div className="rounded-xl border border-border/70 p-3">
                      <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">CPU</p>
                      <p className="mt-2 font-medium">
                        {item.cpuThreads ? `${item.cpuThreads} threads` : 'Unavailable'}
                      </p>
                    </div>
                    <div className="rounded-xl border border-border/70 p-3">
                      <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Starting price</p>
                      <p className="mt-2 font-medium text-primary">{formatHourlyPrice(item.startingPrice)}</p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="rounded-xl border border-border/70 p-3">
                      <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Operating systems</p>
                      <p className="mt-2 text-sm text-muted-foreground">
                        {item.availableOperatingSystems.length > 0
                          ? `${item.availableOperatingSystems.slice(0, 2).join(', ')}${item.availableOperatingSystems.length > 2 ? ' +' : ''}`
                          : 'Operating systems not surfaced.'}
                      </p>
                    </div>
                    <div className="flex items-center justify-between">
                      <p className="text-xs text-muted-foreground">
                        {item.availableAt
                          ? `Available at ${formatDateTime(item.availableAt)}`
                          : 'Live listing snapshot'}
                      </p>
                      <Button asChild>
                        <Link to={`/inventory/${item.id}`}>Inspect</Link>
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="flex flex-col gap-3 rounded-2xl border border-border/70 bg-card/80 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-muted-foreground">
              Page {inventoryQuery.data.meta.page} of {Math.max(inventoryQuery.data.meta.totalPages, 1)} with{' '}
              {inventoryQuery.data.meta.totalItems} matching listings.
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
                disabled={page >= inventoryQuery.data.meta.totalPages}
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
