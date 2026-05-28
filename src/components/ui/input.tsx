import { cn } from '@/lib/cn'

export function Input({ className, ...props }: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        'h-10 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm transition-all focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent',
        className
      )}
      {...props}
    />
  )
}
