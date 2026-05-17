import axios from 'axios'

const api = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' },
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

api.interceptors.response.use(
  (res) => res,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      window.location.href = '/login'
    }
    return Promise.reject(error)
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
  register: (data: { name: string; email: string; password: string; role?: string }) =>
    api.post('/auth/register', data),
}

// ── Users ───────────────────────────────────────────────────────────────────
export const usersApi = {
  me: () => api.get('/users/me'),
  updateMe: (data: object) => api.patch('/users/me', data),
  list: () => api.get('/users/'),
  updateStatus: (id: string, status: string) =>
    api.patch(`/users/${id}/status`, null, { params: { status } }),
}

// ── Events ──────────────────────────────────────────────────────────────────
export const eventsApi = {
  list: (status?: string) => api.get('/events/', { params: { status } }),
  get: (id: string) => api.get(`/events/${id}`),
  create: (data: object) => api.post('/events/', data),
  update: (id: string, data: object) => api.patch(`/events/${id}`, data),
  archive: (id: string) => api.delete(`/events/${id}`),
}

// ── Requests ────────────────────────────────────────────────────────────────
export const requestsApi = {
  create: (data: object) => api.post('/requests/', data),
  mine: () => api.get('/requests/me'),
  byEvent: (eventId: string) => api.get(`/requests/event/${eventId}`),
  update: (id: string, data: { status: string; admin_message?: string }) =>
    api.patch(`/requests/${id}`, data),
}

// ── Attendance ──────────────────────────────────────────────────────────────
export const attendanceApi = {
  checkIn: (data: object) => api.post('/attendance/check-in', data),
  checkOut: (id: string) => api.post(`/attendance/check-out/${id}`),
  byEvent: (eventId: string) => api.get(`/attendance/event/${eventId}`),
  generateQR: (eventId: string, userId: string) =>
    api.get(`/attendance/qr/${eventId}/${userId}`),
  scanQR: (token: string) => api.post(`/attendance/qr-scan/${token}`),
}

// ── Documents ───────────────────────────────────────────────────────────────
export const documentsApi = {
  issue: (eventId: string, userId: string, docType: string) =>
    api.post('/documents/issue', null, { params: { event_id: eventId, user_id: userId, doc_type: docType } }),
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
}

export default api