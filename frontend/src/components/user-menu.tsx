import { LogOutIcon, MonitorIcon, MoonIcon, SunIcon } from 'lucide-react'

import { useAuth } from '@/context/AuthContext'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useTheme } from '@/components/theme-provider'
import { getInitials } from '@/lib/formatters'

function getThemeLabel(theme: string) {
  switch (theme) {
    case 'light':
      return 'Light'
    case 'dark':
      return 'Dark'
    default:
      return 'System'
  }
}

function getThemeIcon(theme: string) {
  switch (theme) {
    case 'light':
      return <SunIcon data-icon="inline-start" />
    case 'dark':
      return <MoonIcon data-icon="inline-start" />
    default:
      return <MonitorIcon data-icon="inline-start" />
  }
}

export function UserMenu() {
  const { signOut, user } = useAuth()
  const { theme, setTheme } = useTheme()
  const userLabel = user?.email ?? 'Operator session'

  function handleThemeToggle() {
    if (theme === 'system') {
      setTheme('light')
      return
    }

    if (theme === 'light') {
      setTheme('dark')
      return
    }

    setTheme('system')
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="size-10 rounded-xl border-0 shadow-none">
          <Avatar className="size-8 rounded-lg">
            <AvatarImage src={undefined} alt={userLabel} />
            <AvatarFallback className="rounded-lg bg-primary text-primary-foreground">
              {getInitials(userLabel)}
            </AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-72">
        <DropdownMenuLabel className="flex flex-col gap-1">
          <span className="truncate font-medium">{userLabel}</span>
          <span className="text-xs font-normal text-muted-foreground">Operator session</span>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem
            onClick={() => {
              handleThemeToggle()
            }}
          >
            {getThemeIcon(theme)}
            <span>Theme</span>
            <span className="ml-auto text-xs text-muted-foreground">{getThemeLabel(theme)}</span>
          </DropdownMenuItem>
          <DropdownMenuItem
            variant="destructive"
            onClick={() => {
              signOut().catch((error: unknown) => {
                console.error('Failed to sign out', error)
              })
            }}
          >
            <LogOutIcon data-icon="inline-start" />
            <span>Sign out</span>
          </DropdownMenuItem>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
