import ModulePageShell from '@/pages/modules/ModulePageShell'
import { UserCircle2 } from 'lucide-react'
import EmptyState from '@/components/shared/EmptyState'
import { useQuery } from '@tanstack/react-query'
import { usersApi } from '@/services/api'

export default function ProfilePage() {
  const { data: profile } = useQuery({
    queryKey: ['profile-me'],
    queryFn: async () => {
      const { data } = await usersApi.me()
      return data
    },
  })

  return (
    <ModulePageShell
      title="Mi Perfil"
      subtitle="Informacion personal, preferencias y seguridad de la cuenta."
    >
      {!profile && (
        <EmptyState
          icon={UserCircle2}
          title="Perfil sin datos"
          description="No se encontro informacion de perfil en base de datos."
        />
      )}
      {profile && (
        <div className="card">
          <h2 className="text-lg font-semibold text-slate-800">{profile.name}</h2>
          <p className="mt-1 text-sm text-slate-500">{profile.email}</p>
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            <div>
              <p className="text-xs uppercase tracking-wide text-slate-500">Rol</p>
              <p className="text-sm font-medium text-slate-700 capitalize">{profile.role}</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-slate-500">Estatus</p>
              <p className="text-sm font-medium text-slate-700 capitalize">{profile.status}</p>
            </div>
          </div>
        </div>
      )}
    </ModulePageShell>
  )
}
