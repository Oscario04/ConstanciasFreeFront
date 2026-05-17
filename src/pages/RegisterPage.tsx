import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { authApi } from '@/services/api'
import toast from 'react-hot-toast'
import { Award } from 'lucide-react'

export default function RegisterPage() {
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'attendee' })
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const set = (field: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm((f) => ({ ...f, [field]: e.target.value }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      await authApi.register(form)
      toast.success('Cuenta creada. Por favor inicia sesión.')
      navigate('/login')
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Error al crear la cuenta')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-8">
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 w-full max-w-md p-8">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-3">
            <Award size={32} className="text-primary-600" />
          </div>
          <h2 className="font-serif text-2xl font-bold text-primary-700">Crear cuenta</h2>
          <p className="text-slate-500 text-sm mt-1">Únete a la plataforma</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="label">Nombre completo</label>
            <input type="text" className="input" value={form.name} onChange={set('name')} required />
          </div>
          <div>
            <label className="label">Correo electrónico</label>
            <input type="email" className="input" value={form.email} onChange={set('email')} required />
          </div>
          <div>
            <label className="label">Contraseña</label>
            <input type="password" className="input" value={form.password} onChange={set('password')} minLength={6} required />
          </div>
          <div>
            <label className="label">Tipo de usuario</label>
            <select className="input" value={form.role} onChange={set('role')}>
              <option value="attendee">Participante / Oyente</option>
              <option value="speaker">Ponente / Expositor</option>
              <option value="staff">Staff</option>
            </select>
          </div>
          <button type="submit" disabled={loading} className="btn-primary w-full py-2.5 mt-2">
            {loading ? 'Creando cuenta...' : 'Registrarse'}
          </button>
        </form>

        <p className="text-center text-sm text-slate-500 mt-6">
          ¿Ya tienes cuenta?{' '}
          <Link to="/login" className="text-primary-600 font-medium hover:underline">Inicia sesión</Link>
        </p>
      </div>
    </div>
  )
}