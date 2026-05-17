// Re-exportamos desde api.ts para mantener consistencia.
// Toda la lógica de autenticación HTTP vive en services/api.ts → authApi
export { authApi } from './api'