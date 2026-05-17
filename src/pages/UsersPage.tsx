import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { usersApi } from '@/services/api'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { Users } from 'lucide-react'
import toast from 'react-hot-toast'
import type { User } from '@/types'

const ROLE_COLORS: Record<string, string> = {
  admin: 'bg-red-100 text-red-700',
  organizer: 'bg-purple-100 text-purple-700',
  speaker: 'bg-blue-100 text-blue-700',
  staff: 'bg-orange-100 text-orange-700',
  attendee: 'bg-slate-100 text-slate-600',
}

export default function UsersPage() {
  const qc = useQueryClient()

  const { data: users, isLoading } = useQuery({
    queryKey: ['users'],
    queryFn: async () => { const { data } = await usersApi.list(); return data },
  })

  const statusMut = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) => usersApi.updateStatus(id, status),
    onSuccess: () => { toast.success('Estado actualizado'); qc.invalidateQueries({ queryKey: ['users'] }) },
    onError: () => toast.error('Error al actualizar'),
  })

  if (isLoading) return <p className="text-slate-400">Cargando usuarios...</p>

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <h1 className="font-serif text-2xl font-bold text-primary-700">Usuarios</h1>
        <span className="bg-slate-100 text-slate-600 text-sm font-medium px-3 py-1 rounded-full">{users?.length || 0}</span>
      </div>

      {users?.length === 0 && (
        <div className="card text-center py-12 text-slate-400">
          <Users size={48} className="mx-auto mb-3 opacity-30" />
          <p>No hay usuarios registrados.</p>
        </div>
      )}

      <div className="card overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                {['Nombre', 'Correo', 'Rol', 'Estado', 'Registrado', 'Acciones'].map((h) => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-medium text-slate-500 uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {users?.map((user: User) => (
                <tr key={user.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-4 py-3 font-medium text-slate-800">{user.name}</td>
                  <td className="px-4 py-3 text-slate-500">{user.email}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${ROLE_COLORS[user.role]}`}>
                      {user.role}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${user.status === 'active' ? 'badge-approved' : user.status === 'suspended' ? 'badge-rejected' : 'badge-pending'}`}>
                      {user.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-500 text-xs">
                    {format(new Date(user.created_at), "d MMM yyyy", { locale: es })}
                  </td>
                  <td className="px-4 py-3">
                    <select
                      value={user.status}
                      onChange={(e) => statusMut.mutate({ id: user.id, status: e.target.value })}
                      className="text-xs border border-slate-200 rounded px-2 py-1 text-slate-600 focus:outline-none focus:ring-1 focus:ring-primary-400"
                    >
                      <option value="active">Activo</option>
                      <option value="inactive">Inactivo</option>
                      <option value="suspended">Suspendido</option>
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}