import { useQuery } from '@tanstack/react-query'

import { getReservations } from '@/operator/api'
import { PageHeader } from '@/components/page-header'
import { StatusBadge } from '@/components/status-badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { formatCurrency, formatDateTime, formatPercent, titleCase } from '@/lib/formatters'

export function ReservationsPage() {
  const reservationsQuery = useQuery({
    queryKey: ['operator', 'reservations'],
    queryFn: getReservations,
  })

  if (reservationsQuery.isLoading) {
    return <Skeleton className="h-[70vh] rounded-3xl" />
  }

  if (reservationsQuery.isError || !reservationsQuery.data) {
    return (
      <Card className="border-destructive/40">
        <CardHeader>
          <CardTitle>Unable to load reservations</CardTitle>
          <CardDescription>{reservationsQuery.error?.message ?? 'The reservation request failed.'}</CardDescription>
        </CardHeader>
      </Card>
    )
  }

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Pipeline"
        title="Reservations"
        description="Track buyer pipeline, pricing, and invite conversion across your sellable instances."
      />

      <Card>
        <CardHeader>
          <CardDescription>Reservation pipeline</CardDescription>
          <CardTitle>Invites mapped to commercial instances</CardTitle>
        </CardHeader>
        <CardContent>
          {reservationsQuery.data.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border/70 p-6 text-sm text-muted-foreground">
              No reservation invites exist yet. As sales activity starts, this table will show the pricing and instance
              mapping for each invite.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Invitee</TableHead>
                  <TableHead>Instances</TableHead>
                  <TableHead>Contract</TableHead>
                  <TableHead>Buyer / supplier</TableHead>
                  <TableHead>Margin</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {reservationsQuery.data.map((reservation) => (
                  <TableRow key={reservation.id}>
                    <TableCell>
                      <p className="font-medium">{reservation.inviteeEmail ?? 'Private invite'}</p>
                      <p className="text-xs text-muted-foreground">
                        {reservation.listingName ?? reservation.gpuModel ?? reservation.channel}
                      </p>
                    </TableCell>
                    <TableCell>
                      {reservation.instanceNames.length > 0 ? (
                        <div className="space-y-1">
                          {reservation.instanceNames.map((name) => (
                            <p key={name} className="text-sm text-muted-foreground">
                              {name}
                            </p>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-muted-foreground">No local instance mapping yet</p>
                      )}
                    </TableCell>
                    <TableCell>
                      <p>{titleCase(reservation.contractType)}</p>
                      <p className="text-xs text-muted-foreground">{titleCase(reservation.billingFrequency)}</p>
                    </TableCell>
                    <TableCell>
                      <p>Buyer: {formatCurrency(reservation.buyerPrice)}</p>
                      <p className="text-xs text-muted-foreground">
                        Supplier: {formatCurrency(reservation.supplierPrice)}
                      </p>
                    </TableCell>
                    <TableCell>{formatPercent(reservation.margin)}</TableCell>
                    <TableCell>
                      <StatusBadge
                        value={reservation.dateAccepted ? 'Approved' : reservation.dateExpires ? 'Expired' : 'Pending'}
                      />
                    </TableCell>
                    <TableCell>{formatDateTime(reservation.dateCreated)}</TableCell>
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
