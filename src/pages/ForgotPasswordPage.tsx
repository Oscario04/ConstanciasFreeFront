import { Mail } from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router-dom'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault()
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 p-6">
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
        <h1 className="font-serif text-2xl font-bold text-primary-700">Recuperar acceso</h1>
        <p className="mt-1 text-sm text-slate-500">Ingresa tu correo institucional para continuar.</p>

        <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
          <div>
            <label className="label">Correo</label>
            <div className="relative">
              <Mail size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                className="input pl-9"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="nombre@udg.mx"
                required
              />
            </div>
          </div>

          <button className="btn-primary w-full" disabled type="submit">
            Endpoint no disponible
          </button>
        </form>

        <p className="mt-4 text-center text-sm text-slate-500">
          <Link className="font-medium text-primary-600 hover:underline" to="/login">
            Volver a iniciar sesion
          </Link>
        </p>
      </div>
    </div>
  )
}
