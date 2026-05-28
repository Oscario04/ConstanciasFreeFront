import { motion } from 'framer-motion'
import { ArrowRight } from 'lucide-react'
import PageHeader from '@/components/shared/PageHeader'

interface QuickAction {
  label: string
  description: string
  onClick?: () => void
}

interface ModulePageShellProps {
  title: string
  subtitle: string
  kpis?: Array<{ label: string; value: string | number }>
  quickActions?: QuickAction[]
  children?: React.ReactNode
}

export default function ModulePageShell({
  title,
  subtitle,
  kpis = [],
  quickActions = [],
  children,
}: ModulePageShellProps) {
  return (
    <div>
      <PageHeader title={title} subtitle={subtitle} />

      {kpis.length > 0 && (
        <section className="mb-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {kpis.map((kpi) => (
            <div className="card p-4" key={kpi.label}>
              <p className="text-xs uppercase tracking-wide text-slate-500">{kpi.label}</p>
              <p className="mt-1 text-2xl font-bold text-primary-700">{kpi.value}</p>
            </div>
          ))}
        </section>
      )}

      {quickActions.length > 0 && (
        <section className="mb-6">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">Acciones rapidas</h2>
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {quickActions.map((action) => (
              <motion.button
                key={action.label}
                type="button"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2 }}
                onClick={action.onClick}
                className="card group text-left transition-all hover:-translate-y-0.5 hover:shadow-md"
              >
                <p className="font-semibold text-slate-800">{action.label}</p>
                <p className="mt-1 text-sm text-slate-500">{action.description}</p>
                <span className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-primary-600">
                  Abrir <ArrowRight size={14} className="transition-transform group-hover:translate-x-0.5" />
                </span>
              </motion.button>
            ))}
          </div>
        </section>
      )}

      {children}
    </div>
  )
}
