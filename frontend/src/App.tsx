import { useQuery } from '@tanstack/react-query'
import { Link, Outlet } from 'react-router-dom'

import { getOverview } from '@/brokkr/api'
import { AppSidebar } from '@/components/app-sidebar'
import { ModeToggle } from '@/components/mode-toggle'
import { Button } from '@/components/ui/button'
import { SidebarInset, SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar'
import { Skeleton } from '@/components/ui/skeleton'

export default function App() {
  const overviewQuery = useQuery({
    queryKey: ['brokkr', 'overview'],
    queryFn: getOverview,
  })

  if (overviewQuery.isLoading) {
    return (
      <div className="flex min-h-screen bg-[radial-gradient(circle_at_top_left,_color-mix(in_oklab,var(--primary)_18%,transparent),transparent_22%),linear-gradient(180deg,color-mix(in_oklab,var(--background)_92%,#181526_8%),var(--background))] p-6">
        <div className="mx-auto flex w-full max-w-7xl gap-6">
          <Skeleton className="hidden h-[calc(100vh-3rem)] w-72 rounded-3xl md:block" />
          <div className="flex-1 space-y-4">
            <Skeleton className="h-16 rounded-2xl" />
            <Skeleton className="h-[calc(100vh-7rem)] rounded-3xl" />
          </div>
        </div>
      </div>
    )
  }

  if (overviewQuery.isError || !overviewQuery.data) {
    const message =
      overviewQuery.error instanceof Error ? overviewQuery.error.message : 'The Brokkr overview request failed.'

    return (
      <div className="flex min-h-screen items-center justify-center bg-[radial-gradient(circle_at_top_left,_color-mix(in_oklab,var(--primary)_18%,transparent),transparent_22%),linear-gradient(180deg,color-mix(in_oklab,var(--background)_92%,#181526_8%),var(--background))] p-6">
        <div className="w-full max-w-xl rounded-3xl border border-destructive/30 bg-card p-8 shadow-xl">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-primary">Connection issue</p>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight">Unable to reach the Brokkr control plane</h1>
          <p className="mt-3 text-sm leading-6 text-muted-foreground">{message}</p>
          <div className="mt-6 flex items-center gap-3">
            <Button
              onClick={() => {
                overviewQuery.refetch().catch((error: unknown) => {
                  console.error('Failed to refetch overview', error)
                })
              }}
            >
              Retry
            </Button>
            <Button asChild variant="outline">
              <Link to="/inventory">Go to inventory route</Link>
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <SidebarProvider defaultOpen>
      <div className="flex min-h-screen w-full bg-[radial-gradient(circle_at_top_left,_color-mix(in_oklab,var(--primary)_18%,transparent),transparent_22%),linear-gradient(180deg,color-mix(in_oklab,var(--background)_92%,#181526_8%),var(--background))]">
        <AppSidebar overview={overviewQuery.data} />
        <SidebarInset className="min-h-screen bg-transparent">
          <header className="sticky top-0 z-20 flex h-16 items-center gap-3 border-b border-border/60 bg-background/85 px-4 backdrop-blur md:px-6">
            <SidebarTrigger />
            <div className="min-w-0">
              <p className="text-sm font-semibold">Neocloud</p>
              <p className="truncate text-xs text-muted-foreground">Read-only Brokkr control plane</p>
            </div>
            <div className="ml-auto">
              <ModeToggle />
            </div>
          </header>

          <div className="mx-auto w-full max-w-7xl flex-1 px-4 py-6 md:px-6 md:py-8">
            <Outlet />
          </div>
        </SidebarInset>
      </div>
    </SidebarProvider>
  )
}
