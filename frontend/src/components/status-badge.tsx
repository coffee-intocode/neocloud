import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

const variantClasses: Record<string, string> = {
  online: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30',
  running: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30',
  active: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30',
  connected: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30',
  healthy: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30',
  listed: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30',
  approved: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30',
  off: 'bg-slate-500/15 text-slate-700 dark:text-slate-300 border-slate-500/30',
  offline: 'bg-slate-500/15 text-slate-700 dark:text-slate-300 border-slate-500/30',
  draft: 'bg-slate-500/15 text-slate-700 dark:text-slate-300 border-slate-500/30',
  paused: 'bg-slate-500/15 text-slate-700 dark:text-slate-300 border-slate-500/30',
  reserve: 'bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30',
  pending: 'bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30',
  attention: 'bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30',
  'bridge required': 'bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30',
  preorder: 'bg-sky-500/15 text-sky-700 dark:text-sky-300 border-sky-500/30',
  rejected: 'bg-rose-500/15 text-rose-700 dark:text-rose-300 border-rose-500/30',
  expired: 'bg-rose-500/15 text-rose-700 dark:text-rose-300 border-rose-500/30',
  hidden: 'bg-rose-500/15 text-rose-700 dark:text-rose-300 border-rose-500/30',
  'on demand': 'bg-violet-500/15 text-violet-700 dark:text-violet-300 border-violet-500/30',
  reserved: 'bg-violet-500/15 text-violet-700 dark:text-violet-300 border-violet-500/30',
  deployed: 'bg-violet-500/15 text-violet-700 dark:text-violet-300 border-violet-500/30',
}

export function StatusBadge({ value, className }: { value: string; className?: string }) {
  const normalized = value.trim().toLowerCase()

  return (
    <Badge
      variant="outline"
      className={cn(
        'border-transparent font-medium capitalize',
        variantClasses[normalized] ?? 'bg-muted text-foreground',
        className,
      )}
    >
      {value}
    </Badge>
  )
}
