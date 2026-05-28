import { Navigate } from 'react-router-dom'
import { hasAnyRole, type OfficialRole } from '@/constants/roles'
import { useAuthStore } from '@/store/authStore'

interface RoleGuardProps {
  allowedRoles: OfficialRole[]
  children: React.ReactNode
}

export function RoleGuard({ allowedRoles, children }: RoleGuardProps) {
  const user = useAuthStore((s) => s.user)

  if (!user) return <Navigate to="/login" replace />
  if (!hasAnyRole(user.role, allowedRoles)) return <Navigate to="/dashboard" replace />

  return <>{children}</>
}
