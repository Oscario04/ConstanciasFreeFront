import { cn } from '@/lib/cn'

type ButtonVariant = 'default' | 'secondary' | 'ghost'

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
}

const variants: Record<ButtonVariant, string> = {
  default: 'bg-primary-600 text-white hover:bg-primary-700',
  secondary: 'bg-slate-100 text-slate-700 hover:bg-slate-200',
  ghost: 'bg-transparent text-slate-600 hover:bg-slate-100',
}

export function Button({ className, variant = 'default', ...props }: ButtonProps) {
  return (
    <button
      className={cn(
        'inline-flex items-center justify-center rounded-lg px-4 py-2 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50',
        variants[variant],
        className
      )}
      {...props}
    />
  )
}
