import { useQuery } from '@tanstack/react-query'
import { ArrowLeftIcon } from 'lucide-react'
import { Link, useParams } from 'react-router-dom'

import { getDatacenterDetail } from '@/operator/api'
import { PageHeader } from '@/components/page-header'
import { StatusBadge } from '@/components/status-badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { formatCurrency, formatDateTime } from '@/lib/formatters'

export function DatacenterDetailPage() {
  const { datacenterId = '' } = useParams()
  const datacenterQuery = useQuery({
    queryKey: ['operator', 'datacenter', datacenterId],
    queryFn: () => getDatacenterDetail(datacenterId),
    enabled: Boolean(datacenterId),
  })

  if (datacenterQuery.isLoading) {
    return <Skeleton className="h-[70vh] rounded-3xl" />
  }

  if (datacenterQuery.isError || !datacenterQuery.data) {
    return (
      <Card className="border-destructive/40">
        <CardHeader>
          <CardTitle>Unable to load datacenter detail</CardTitle>
          <CardDescription>
            {datacenterQuery.error?.message ?? 'The datacenter detail request failed.'}
          </CardDescription>
        </CardHeader>
      </Card>
    )
  }

  const { datacenter, zones, contacts, bridges, bridgeRequests } = datacenterQuery.data

  return (
    <div className="space-y-8">
      <Button asChild variant="ghost" className="px-0">
        <Link to="/datacenters">
          <ArrowLeftIcon />
          Back to datacenters
        </Link>
      </Button>

      <PageHeader
        eyebrow="Facility detail"
        title={datacenter.name}
        description="Inspect zones, contacts, and network readiness for this earning location."
        actions={<StatusBadge value={datacenter.readinessLabel} />}
      />

      <div className="grid gap-4 xl:grid-cols-4">
        <Card>
          <CardHeader>
            <CardDescription>Revenue / hr</CardDescription>
            <CardTitle>{formatCurrency(datacenter.hourlyRevenueUsd)}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardDescription>Idle opportunity / hr</CardDescription>
            <CardTitle>{formatCurrency(datacenter.idleHourlyOpportunityUsd)}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardDescription>Devices</CardDescription>
            <CardTitle>{datacenter.deviceCount}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardDescription>Zones</CardDescription>
            <CardTitle>{datacenter.zoneCount}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="zones">Zones</TabsTrigger>
          <TabsTrigger value="contacts">Contacts</TabsTrigger>
          <TabsTrigger value="network">Network readiness</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <Card>
            <CardHeader>
              <CardDescription>Facility summary</CardDescription>
              <CardTitle>Commercial readiness</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-3 md:grid-cols-2">
              <div className="rounded-xl border border-border/70 p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Region</p>
                <p className="mt-2 font-medium">{datacenter.region ?? 'Unavailable'}</p>
              </div>
              <div className="rounded-xl border border-border/70 p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Facility</p>
                <p className="mt-2 font-medium">{datacenter.facility ?? 'Unavailable'}</p>
              </div>
              <div className="rounded-xl border border-border/70 p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Physical address</p>
                <p className="mt-2 font-medium">{datacenter.physicalAddress ?? 'Unavailable'}</p>
              </div>
              <div className="rounded-xl border border-border/70 p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Shipping address</p>
                <p className="mt-2 font-medium">{datacenter.shippingAddress ?? 'Unavailable'}</p>
              </div>
              <div className="rounded-xl border border-border/70 p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Listed instances</p>
                <p className="mt-2 font-medium">{datacenter.listedInstanceCount}</p>
              </div>
              <div className="rounded-xl border border-border/70 p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Created</p>
                <p className="mt-2 font-medium">{formatDateTime(datacenter.createdAt)}</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="zones">
          <Card>
            <CardHeader>
              <CardDescription>Zones</CardDescription>
              <CardTitle>Logical subdivisions</CardTitle>
            </CardHeader>
            <CardContent>
              {zones.length === 0 ? (
                <p className="text-sm text-muted-foreground">No zones have been created for this datacenter yet.</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Site</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {zones.map((zone) => (
                      <TableRow key={zone.id}>
                        <TableCell className="font-medium">{zone.name}</TableCell>
                        <TableCell>{zone.siteName ?? zone.siteId ?? 'Unavailable'}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="contacts">
          <Card>
            <CardHeader>
              <CardDescription>Contacts</CardDescription>
              <CardTitle>Facility stakeholders</CardTitle>
            </CardHeader>
            <CardContent>
              {contacts.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No datacenter contacts are stored for this facility yet.
                </p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Phone</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {contacts.map((contact) => (
                      <TableRow key={contact.id}>
                        <TableCell className="font-medium">{contact.name}</TableCell>
                        <TableCell>{contact.role ?? 'Unavailable'}</TableCell>
                        <TableCell>{contact.email ?? 'Unavailable'}</TableCell>
                        <TableCell>{contact.phone ?? 'Unavailable'}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="network">
          <div className="grid gap-4 xl:grid-cols-[1fr_1fr]">
            <Card>
              <CardHeader>
                <CardDescription>Active bridges</CardDescription>
                <CardTitle>Network presence</CardTitle>
              </CardHeader>
              <CardContent>
                {bridges.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No bridges are active in this datacenter yet.</p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Zone</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {bridges.map((bridge) => (
                        <TableRow key={bridge.id}>
                          <TableCell className="font-medium">{bridge.name}</TableCell>
                          <TableCell>{bridge.zoneName}</TableCell>
                          <TableCell>
                            <StatusBadge value={bridge.status} />
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardDescription>Bridge requests</CardDescription>
                <CardTitle>Network pipeline</CardTitle>
              </CardHeader>
              <CardContent>
                {bridgeRequests.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No bridge requests exist for this datacenter yet.</p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Zone</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Created</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {bridgeRequests.map((request) => (
                        <TableRow key={request.id}>
                          <TableCell className="font-medium">{request.zoneName}</TableCell>
                          <TableCell>{request.bridgeType ?? 'Unavailable'}</TableCell>
                          <TableCell>
                            <StatusBadge value={request.status} />
                          </TableCell>
                          <TableCell>{formatDateTime(request.createdAt)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
