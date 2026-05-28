export const OFFICIAL_ROLES = ['admin', 'organizer', 'assistant'] as const

export type OfficialRole = (typeof OFFICIAL_ROLES)[number]

// Backward compatibility with existing backend payloads.
const LEGACY_ROLE_MAP: Record<string, OfficialRole> = {
  attendee: 'assistant',
  asistente: 'assistant',
  speaker: 'assistant',
  staff: 'assistant',
  admin: 'admin',
  organizer: 'organizer',
  assistant: 'assistant',
}

export const normalizeRole = (role?: string | null): OfficialRole => {
  if (!role) return 'assistant'
  return LEGACY_ROLE_MAP[role] || 'assistant'
}

export const hasAnyRole = (role: string | undefined, allowedRoles: OfficialRole[]) => {
  return allowedRoles.includes(normalizeRole(role))
}
