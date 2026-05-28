import { motion } from 'framer-motion'

interface PageHeaderProps {
  title: string
  subtitle?: string
  action?: React.ReactNode
}

export default function PageHeader({ title, subtitle, action }: PageHeaderProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.28 }}
      className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between"
    >
      <div>
        <h1 className="font-serif text-2xl font-bold text-primary-700 md:text-3xl">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-slate-500 md:text-base">{subtitle}</p>}
      </div>
      {action}
    </motion.div>
  )
}
