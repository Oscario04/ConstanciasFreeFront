import { z } from 'zod'

export const loginSchema = z.object({
  email: z.string().email('Ingresa un correo valido'),
  password: z.string().min(6, 'Minimo 6 caracteres'),
})

export const registerSchema = z.object({
  name: z.string().min(3, 'Ingresa tu nombre completo'),
  email: z.string().email('Ingresa un correo valido'),
  password: z.string().min(8, 'Minimo 8 caracteres'),
  role: z.enum(['assistant', 'organizer']),
})

export type LoginFormValues = z.infer<typeof loginSchema>
export type RegisterFormValues = z.infer<typeof registerSchema>
