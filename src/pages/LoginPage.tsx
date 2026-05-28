import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'
import { authApi } from '@/services/api'
import toast from 'react-hot-toast'
import { Award, Eye, EyeOff } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { loginSchema, type LoginFormValues } from '@/schemas/authSchemas'

export default function LoginPage() {
  const [showPw, setShowPw] = useState(false)
  const { login } = useAuthStore()
  const navigate = useNavigate()

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
    mode: 'onBlur',
  })

  const onSubmit = async (values: LoginFormValues) => {
    try {
      const { data } = await authApi.login(values.email, values.password)
      login(data.user, data.access_token, data.refresh_token)
      navigate('/dashboard')
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Credenciales incorrectas')
    }
  }

  return (
    <div className="min-h-screen flex">
      {/* Panel izquierdo */}
      <div className="hidden lg:flex lg:w-1/2 bg-primary-600 items-center justify-center p-12">
        <div className="text-white text-center max-w-md">
          <Award size={64} className="text-accent-400 mx-auto mb-6" />
          <h1 className="font-serif text-4xl font-bold mb-4">Plataforma de Constancias</h1>
          <p className="text-primary-200 text-lg leading-relaxed">
            Emite, gestiona y verifica diplomas, constancias y reconocimientos con validez permanente y trazabilidad completa.
          </p>
        </div>
      </div>

      {/* Formulario */}
      <div className="flex-1 flex items-center justify-center p-8 bg-white">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <div className="flex items-center justify-center gap-2 mb-2 lg:hidden">
              <Award size={28} className="text-primary-600" />
            </div>
            <h2 className="font-serif text-3xl font-bold text-primary-700">Bienvenido</h2>
            <p className="text-slate-500 mt-1">Inicia sesión en tu cuenta</p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div>
              <label className="label">Correo electrónico</label>
              <input
                type="email"
                className="input"
                {...register('email')}
                placeholder="usuario@correo.com"
              />
              {errors.email && <p className="mt-1 text-xs text-red-600">{errors.email.message}</p>}
            </div>

            <div>
              <label className="label">Contraseña</label>
              <div className="relative">
                <input
                  type={showPw ? 'text' : 'password'}
                  className="input pr-10"
                  {...register('password')}
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPw(!showPw)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {errors.password && <p className="mt-1 text-xs text-red-600">{errors.password.message}</p>}
              <div className="mt-2 text-right">
                <Link to="/forgot-password" className="text-xs font-medium text-primary-600 hover:underline">
                  ¿Olvidaste tu contraseña?
                </Link>
              </div>
            </div>

            <button type="submit" disabled={isSubmitting} className="btn-primary w-full py-2.5">
              {isSubmitting ? 'Iniciando sesión...' : 'Iniciar sesión'}
            </button>
          </form>

          <p className="text-center text-sm text-slate-500 mt-6">
            ¿No tienes cuenta?{' '}
            <Link to="/register" className="text-primary-600 font-medium hover:underline">
              Regístrate
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}