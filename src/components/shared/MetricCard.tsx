import { motion } from 'framer-motion'
import type { LucideIcon } from 'lucide-react'

interface MetricCardProps {
  title: string
  value: string | number
  helper?: string
  icon: LucideIcon
  accentClassName?: string
}

export default function MetricCard({ title, value, helper, icon: Icon, accentClassName = 'bg-primary-600' }: MetricCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className="card flex items-start justify-between"
    >
      <div>
        <p className="text-sm text-slate-500">{title}</p>
        <p className="mt-1 text-2xl font-bold text-slate-800">{value}</p>
        {helper && <p className="mt-1 text-xs text-slate-500">{helper}</p>}
      </div>
      <div className={`rounded-xl p-3 text-white ${accentClassName}`}>
        <Icon size={20} />
      </div>
    </motion.div>
  )
}
