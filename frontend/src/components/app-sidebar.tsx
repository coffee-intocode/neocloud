import { useQuery } from '@tanstack/react-query'
import { Building2Icon, LayoutDashboardIcon, NetworkIcon, Package2Icon, ServerCogIcon, TicketIcon } from 'lucide-react'
import { Link, useLocation } from 'react-router-dom'
import type { ComponentProps } from 'react'

import { getActiveOrganization } from '@/brokkr/api'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
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
import { getInitials, titleCase } from '@/lib/formatters'

const navigation = [
  { title: 'Dashboard', url: '/', icon: LayoutDashboardIcon, end: true },
  { title: 'Datacenters', url: '/datacenters', icon: Building2Icon },
  { title: 'Network', url: '/network', icon: NetworkIcon },
  { title: 'Devices', url: '/devices', icon: ServerCogIcon },
  { title: 'Instances', url: '/instances', icon: Package2Icon },
  { title: 'Reservations', url: '/reservations', icon: TicketIcon },
]

export function AppSidebar({ ...props }: ComponentProps<typeof Sidebar>) {
  const location = useLocation()
  const organizationQuery = useQuery({
    queryKey: ['brokkr', 'organization'],
    queryFn: getActiveOrganization,
  })

  const organizationName = organizationQuery.data?.name ?? 'Brokkr organization'
  const organizationSubtitle =
    organizationQuery.data?.tenantType != null
      ? titleCase(organizationQuery.data.tenantType)
      : (organizationQuery.data?.country ?? 'Operator context')

  return (
    <Sidebar collapsible="icon" variant="sidebar" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              size="lg"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
            >
              <Link to="/">
                <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
                  <span className="text-lg font-black tracking-tight">N</span>
                </div>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-semibold">Neocloud</span>
                  <span className="truncate text-xs text-sidebar-foreground/70">Operator console</span>
                </div>
              </Link>
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
      </SidebarContent>

      <SidebarFooter className="group-data-[collapsible=icon]:hidden">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" tooltip={organizationName}>
              <Avatar className="size-8 rounded-lg border border-sidebar-border/70">
                <AvatarImage src={organizationQuery.data?.logoUrl ?? undefined} alt={organizationName} />
                <AvatarFallback className="rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
                  {getInitials(organizationName)}
                </AvatarFallback>
              </Avatar>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-medium">{organizationName}</span>
                <span className="truncate text-xs text-sidebar-foreground/70">{organizationSubtitle}</span>
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
