export type UserRole = 'admin' | 'organizer' | 'assistant' | 'asistente' | 'speaker' | 'attendee' | 'staff'
export type UserStatus = 'active' | 'inactive' | 'suspended'

export interface User {
  id: string
  name: string
  email: string
  role: UserRole
  status: UserStatus
  institution?: string
  phone?: string
  bio?: string
  created_at: string
}

export type EventStatus = 'draft' | 'published' | 'ongoing' | 'finished' | 'archived'
export type EventType = 'conference' | 'workshop' | 'course' | 'seminar' | 'webinar'

export interface Event {
  id: string
  title: string
  description: string
  event_type: EventType
  start_date: string
  end_date: string
  venue?: string
  capacity: number
  registered: number
  status: EventStatus
  organizer_id: string
  retention_years: number
  created_at: string
}

export type RequestStatus = 'pending' | 'approved' | 'rejected'
export type ParticipantRole = 'assistant' | 'speaker' | 'attendee' | 'staff' | 'organizer'

export interface ParticipationRequest {
  id: string
  user_id: string
  event_id: string
  requested_role: ParticipantRole
  status: RequestStatus
  message?: string
  admin_message?: string
  created_at: string
}

export type DocumentType = 'diploma' | 'constancia' | 'reconocimiento'
export type DocumentStatus = 'active' | 'revoked' | 'archived'

export interface Document {
  id: string
  user_id: string
  event_id: string
  document_type: DocumentType
  status: DocumentStatus
  verification_code: string
  public_url: string
  pdf_url: string
  preview_url?: string
  download_url?: string
  issued_at: string
  expires_at?: string
  metadata: {
    user_name?: string
    event_title?: string
    role?: string
  }
}

export interface DashboardStats {
  total_events: number
  total_users: number
  total_documents: number
  total_requests: number
  pending_requests: number
  approved_requests: number
}

export interface AttendanceRecord {
  id: string
  user_id: string
  event_id: string
  method: 'manual' | 'qr'
  check_in: string
  check_out?: string
}