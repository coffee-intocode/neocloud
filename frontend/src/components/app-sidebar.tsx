import { CpuIcon, LayoutDashboardIcon, LogOutIcon, ServerIcon } from 'lucide-react'
import { Link, useLocation } from 'react-router-dom'
import type { ComponentProps } from 'react'

import type { OverviewResponse } from '@/brokkr/types'
import { useAuth } from '@/context/AuthContext'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from '@/components/ui/sidebar'
import { getInitials } from '@/lib/formatters'

const navigation = [
  { title: 'Overview', url: '/', icon: LayoutDashboardIcon, end: true },
  { title: 'Inventory', url: '/inventory', icon: CpuIcon },
  { title: 'Deployments', url: '/deployments', icon: ServerIcon },
]

export function AppSidebar({
  overview,
  ...props
}: ComponentProps<typeof Sidebar> & {
  overview: OverviewResponse
}) {
  const location = useLocation()
  const { signOut } = useAuth()
  const userLabel = overview.user?.name ?? overview.user?.email ?? 'Connected account'

  return (
    <Sidebar collapsible="icon" variant="sidebar" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
            >
              <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
                <span className="text-lg font-black tracking-tight">N</span>
              </div>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-semibold">Neocloud</span>
                <span className="truncate text-xs text-sidebar-foreground/70">Read-only Brokkr control plane</span>
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem className="group-data-[collapsible=icon]:hidden">
            <SidebarMenuButton size="lg">
              <Avatar className="size-8 rounded-lg border border-sidebar-border/70">
                <AvatarImage src={overview.organization.logoUrl ?? undefined} alt={overview.organization.name} />
                <AvatarFallback className="rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
                  {getInitials(overview.organization.name)}
                </AvatarFallback>
              </Avatar>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-medium">{overview.organization.name}</span>
                <span className="truncate text-xs text-sidebar-foreground/70">
                  {overview.organization.tenantType ?? 'Organization'}
                </span>
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Console</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navigation.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    isActive={item.end ? location.pathname === item.url : location.pathname.startsWith(item.url)}
                    tooltip={item.title}
                  >
                    <Link to={item.url}>
                      <item.icon />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup className="group-data-[collapsible=icon]:hidden">
          <SidebarGroupLabel>Context</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton>
                  <span className="truncate">Deployments</span>
                  <span className="ml-auto text-xs text-sidebar-foreground/70">{overview.deploymentCount}</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton>
                  <span className="truncate">Regions</span>
                  <span className="ml-auto text-xs text-sidebar-foreground/70">{overview.inventoryRegionCount}</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" tooltip={userLabel}>
              <Avatar className="size-8 rounded-lg border border-sidebar-border/70">
                <AvatarImage src={overview.user?.avatarUrl ?? undefined} alt={userLabel} />
                <AvatarFallback className="rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
                  {getInitials(userLabel)}
                </AvatarFallback>
              </Avatar>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-medium">{userLabel}</span>
                <span className="truncate text-xs text-sidebar-foreground/70">
                  {overview.user?.membershipRole ?? overview.user?.role ?? 'API session'}
                </span>
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <Button
              variant="ghost"
              className="w-full justify-start gap-2"
              onClick={() => {
                signOut().catch((error: unknown) => {
                  console.error('Failed to sign out', error)
                })
              }}
            >
              <LogOutIcon className="size-4" />
              <span>Sign out</span>
            </Button>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
