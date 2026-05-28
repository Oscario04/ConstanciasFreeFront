import { cn } from '@/lib/cn'

const STATUS_STYLES: Record<string, string> = {
  pending: 'bg-amber-100 text-amber-700',
  approved: 'bg-emerald-100 text-emerald-700',
  rejected: 'bg-rose-100 text-rose-700',
  active: 'bg-blue-100 text-blue-700',
  revoked: 'bg-rose-100 text-rose-700',
  archived: 'bg-slate-200 text-slate-700',
  draft: 'bg-slate-100 text-slate-700',
  published: 'bg-emerald-100 text-emerald-700',
  ongoing: 'bg-indigo-100 text-indigo-700',
  finished: 'bg-violet-100 text-violet-700',
}

export default function StatusPill({ status, className }: { status: string; className?: string }) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium capitalize',
        STATUS_STYLES[status] || 'bg-slate-100 text-slate-700',
        className
      )}
    >
      {status.replace('_', ' ')}
    </span>
  )
}
