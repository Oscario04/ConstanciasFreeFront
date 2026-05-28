import axios from 'axios'
import { clearSession, readAccessToken, readRefreshToken } from '@/lib/auth'

let isRefreshing = false
let queuedRequests: Array<(token: string | null) => void> = []

const flushQueue = (token: string | null) => {
  queuedRequests.forEach((callback) => callback(token))
  queuedRequests = []
}

const mapRoleForBackend = (role?: string) => {
  if (role === 'assistant') return 'asistente'
  return role
}

const api = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' },
})

api.interceptors.request.use((config) => {
  const token = readAccessToken()
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const originalRequest = error.config
    const status = error.response?.status

    if (status !== 401 || originalRequest?._retry) {
      return Promise.reject(error)
    }

    const refreshToken = readRefreshToken()
    if (!refreshToken) {
      clearSession()
      window.location.href = '/login'
      return Promise.reject(error)
    }

    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        queuedRequests.push((token) => {
          if (!token) {
            reject(error)
            return
          }
          originalRequest.headers.Authorization = `Bearer ${token}`
          resolve(api(originalRequest))
        })
      })
    }

    originalRequest._retry = true
    isRefreshing = true

    try {
      const { data } = await axios.post('/api/auth/refresh', { refresh_token: refreshToken })
      const newToken = data?.access_token

      if (!newToken) {
        throw new Error('No access token returned by refresh endpoint')
      }

      localStorage.setItem('token', newToken)
      flushQueue(newToken)
      originalRequest.headers.Authorization = `Bearer ${newToken}`
      return api(originalRequest)
    } catch (refreshError) {
      flushQueue(null)
      clearSession()
      window.location.href = '/login'
      return Promise.reject(refreshError)
    } finally {
      isRefreshing = false
    }
  }
)

// ── Auth ────────────────────────────────────────────────────────────────────
export const authApi = {
  login: (email: string, password: string) => {
    const form = new FormData()
    form.append('username', email)
    form.append('password', password)
    return api.post('/auth/login', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
  },
  refresh: (refreshToken: string) => api.post('/auth/refresh', { refresh_token: refreshToken }),
  register: (data: { name: string; email: string; password: string; role?: string }) =>
    api.post('/auth/register', {
      ...data,
      role: mapRoleForBackend(data.role),
    }),
}

// ── Users ───────────────────────────────────────────────────────────────────
export const usersApi = {
  me: () => api.get('/users/me'),
  updateMe: (data: object) => api.patch('/users/me', data),
  list: () => api.get('/users/'),
  updateRole: (id: string, role: string) => api.put(`/users/${id}/role`, { role: mapRoleForBackend(role) }),
  updateStatus: (id: string, status: string) =>
    api.patch(`/users/${id}/status`, null, { params: { status } }),
  updateStatusV2: (id: string, status: string) => api.put(`/users/${id}/status`, { status }),
}

// ── Events ──────────────────────────────────────────────────────────────────
export const eventsApi = {
  list: (status?: string) => api.get('/events/', { params: { status } }),
  get: (id: string) => api.get(`/events/${id}`),
  create: (data: object) => api.post('/events/', data),
  update: (id: string, data: object) => api.patch(`/events/${id}`, data),
  replace: (id: string, data: object) => api.put(`/events/${id}`, data),
  archive: (id: string) => api.delete(`/events/${id}`),
  createRequest: (eventId: string, data: object) => api.post(`/events/${eventId}/requests`, data),
  getRequests: (eventId: string) => api.get(`/events/${eventId}/requests`),
  createAttendance: (eventId: string, data: object) => api.post(`/events/${eventId}/attendance`, data),
  purgeAttendance: (eventId: string) => api.delete(`/events/${eventId}/attendance/purge`),
}

// ── Requests ────────────────────────────────────────────────────────────────
export const requestsApi = {
  create: (data: object) => api.post('/requests/', data),
  createEventRequestAlias: (eventId: string, data: object) =>
    api.post(`/requests/events/${eventId}/requests`, data),
  eventRequestsAlias: (eventId: string) => api.get(`/requests/events/${eventId}/requests`),
  mine: () => api.get('/requests/me'),
  byEvent: (eventId: string) => api.get(`/requests/event/${eventId}`),
  get: (id: string) => api.get(`/requests/${id}`),
  updatePut: (id: string, data: object) => api.put(`/requests/${id}`, data),
  cancel: (id: string) => api.delete(`/requests/${id}`),
  review: (id: string, data: { status: string; admin_message?: string }) =>
    api.patch(`/requests/${id}/review`, data),
  update: (id: string, data: { status: string; admin_message?: string }) =>
    api.patch(`/requests/${id}/review`, data),
}

// ── Attendance ──────────────────────────────────────────────────────────────
export const attendanceApi = {
  checkIn: (data: object) => api.post('/attendance/check-in', data),
  checkInAlias: (eventId: string, data: object) => api.post(`/attendance/events/${eventId}/attendance`, data),
  checkOut: (id: string) => api.post(`/attendance/check-out/${id}`),
  checkOutAlias: (id: string, data?: object) => api.put(`/attendance/${id}/checkout`, data || {}),
  byEvent: (eventId: string) => api.get(`/attendance/event/${eventId}`),
  generateQR: (eventId: string, userId: string) =>
    api.get(`/attendance/qr/${eventId}/${userId}`),
  scanQR: (token: string) => api.post(`/attendance/qr-scan/${token}`),
  purgeEventAttendance: (eventId: string) => api.delete(`/attendance/events/${eventId}/attendance/purge`),
}

// ── Documents ───────────────────────────────────────────────────────────────
export const documentsApi = {
  issue: (eventId: string, userId: string, docType: string) =>
    api.post('/documents/issue', null, { params: { event_id: eventId, user_id: userId, doc_type: docType } }),
  issueBatch: (eventId: string, data?: object) => api.post(`/documents/issue-batch/${eventId}`, data || {}),
  downloadPdf: (code: string) => api.get(`/documents/pdf/${code}`, { responseType: 'blob' }),
  verify: (code: string) => api.get(`/documents/verify/${code}`),
  mine: () => api.get('/documents/me'),
  byEvent: (eventId: string) => api.get(`/documents/event/${eventId}`),
  revoke: (id: string, reason: string) =>
    api.patch(`/documents/${id}/revoke`, null, { params: { reason } }),
}

// ── Stats ────────────────────────────────────────────────────────────────────
export const statsApi = {
  dashboard: () => api.get('/stats/dashboard'),
  byEvent: (eventId: string) => api.get(`/stats/event/${eventId}`),
  exportAttendanceCsv: (eventId: string) =>
    api.get(`/stats/event/${eventId}/export/attendance`, { responseType: 'blob' }),
  exportDocumentsCsv: (eventId: string) =>
    api.get(`/stats/event/${eventId}/export/documents`, { responseType: 'blob' }),
}

// ── Admin ───────────────────────────────────────────────────────────────────
export const adminApi = {
  getConfig: () => api.get('/admin/config'),
  updateConfig: (data: object) => api.patch('/admin/config', data),
}

// ── Event Types ─────────────────────────────────────────────────────────────
export const eventTypesApi = {
  list: () => api.get('/event-types/'),
  create: (data: object) => api.post('/event-types/', data),
  remove: (typeId: string) => api.delete(`/event-types/${typeId}`),
}

// ── Templates ───────────────────────────────────────────────────────────────
export const templatesApi = {
  list: (params?: { document_type?: string; active_only?: boolean }) =>
    api.get('/templates/', { params }),
  getActive: (documentType: string) => api.get(`/templates/active/${documentType}`),
  create: (data: object) => api.post('/templates/', data),
  update: (templateId: string, data: object) => api.put(`/templates/${templateId}`, data),
  activate: (templateId: string) => api.patch(`/templates/${templateId}/activate`),
}

// ── Evidence ────────────────────────────────────────────────────────────────
export const evidenceApi = {
  listByEvent: (eventId: string) => api.get(`/evidence/events/${eventId}`),
  upload: (
    eventId: string,
    file: File,
    metadata?: { label?: string; notes?: string; session?: string },
    onProgress?: (percent: number) => void
  ) => {
    const form = new FormData()
    form.append('file', file)
    if (metadata?.label) form.append('label', metadata.label)
    if (metadata?.notes) form.append('notes', metadata.notes)
    if (metadata?.session) form.append('session', metadata.session)

    return api.post(`/evidence/events/${eventId}/upload`, form, {
      headers: { 'Content-Type': 'multipart/form-data' },
      onUploadProgress: (evt) => {
        if (!onProgress || !evt.total) return
        const percent = Math.round((evt.loaded * 100) / evt.total)
        onProgress(percent)
      },
    })
  },
  remove: (evidenceId: string) => api.delete(`/evidence/${evidenceId}`),
}

// ── Health / Root ───────────────────────────────────────────────────────────
export const systemApi = {
  root: () => api.get('/'),
  health: () => api.get('/health'),
}

export default api