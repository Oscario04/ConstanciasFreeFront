import { normalizeRole } from '@/constants/roles'

export const ACCESS_TOKEN_KEY = 'token'
export const REFRESH_TOKEN_KEY = 'refresh_token'
export const USER_KEY = 'user'

export function setSession(accessToken: string, refreshToken?: string | null) {
  localStorage.setItem(ACCESS_TOKEN_KEY, accessToken)
  if (refreshToken) {
    localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken)
  }
}

export function clearSession() {
  localStorage.removeItem(ACCESS_TOKEN_KEY)
  localStorage.removeItem(REFRESH_TOKEN_KEY)
  localStorage.removeItem(USER_KEY)
}

export function readAccessToken() {
  return localStorage.getItem(ACCESS_TOKEN_KEY)
}

export function readRefreshToken() {
  return localStorage.getItem(REFRESH_TOKEN_KEY)
}

export function normalizeUserRole<T extends { role?: string }>(user: T): T {
  return {
    ...user,
    role: normalizeRole(user.role),
  }
}
