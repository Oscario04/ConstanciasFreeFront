import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import Layout from '@/components/layout/layout'
import LoginPage from '@/pages/LoginPage'
import RegisterPage from '@/pages/RegisterPage'
import DashboardPage from '@/pages/DashboardPage'
import EventsPage from '@/pages/EventsPage'
import EventDetailPage from '@/pages/EventDetailPage'
import RequestsPage from '@/pages/RequestsPage'
import MyDocumentsPage from '@/pages/MyDocumentsPage'
import UsersPage from '@/pages/UsersPage'
import VerifyPage from '@/pages/VerifyPage'
import AttendancePage from '@/pages/AttendancePage'
import ForgotPasswordPage from '@/pages/ForgotPasswordPage'
import ReportsPage from '@/pages/ReportsPage'
import AuditPage from '@/pages/AuditPage'
import TemplatesPage from '@/pages/TemplatesPage'
import CertificatesPage from '@/pages/CertificatesPage'
import EvidencePage from '@/pages/EvidencePage'
import NotificationsPage from '@/pages/NotificationsPage'
import ProfilePage from '@/pages/ProfilePage'
import { ProtectedRoute } from '@/app/guards/ProtectedRoute'
import { RoleGuard } from '@/app/guards/RoleGuard'

export default function AppRouter() {
  return (
    <BrowserRouter
      future={{
        v7_startTransition: true,
        v7_relativeSplatPath: true,
      }}
    >
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/verify/:code" element={<VerifyPage />} />

        <Route
          path="/"
          element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate replace to="/dashboard" />} />
          <Route path="dashboard" element={<DashboardPage />} />
          <Route path="events" element={<EventsPage />} />
          <Route path="events/:id" element={<EventDetailPage />} />
          <Route path="requests" element={<RequestsPage />} />
          <Route path="documents" element={<MyDocumentsPage />} />
          <Route path="notifications" element={<NotificationsPage />} />
          <Route path="profile" element={<ProfilePage />} />

          <Route
            path="attendance"
            element={
              <RoleGuard allowedRoles={['admin', 'organizer']}>
                <AttendancePage />
              </RoleGuard>
            }
          />
          <Route
            path="certificates"
            element={
              <RoleGuard allowedRoles={['admin', 'organizer']}>
                <CertificatesPage />
              </RoleGuard>
            }
          />
          <Route
            path="templates"
            element={
              <RoleGuard allowedRoles={['admin', 'organizer']}>
                <TemplatesPage />
              </RoleGuard>
            }
          />
          <Route
            path="evidence"
            element={
              <RoleGuard allowedRoles={['admin', 'organizer']}>
                <EvidencePage />
              </RoleGuard>
            }
          />
          <Route
            path="reports"
            element={
              <RoleGuard allowedRoles={['admin', 'organizer']}>
                <ReportsPage />
              </RoleGuard>
            }
          />
          <Route
            path="users"
            element={
              <RoleGuard allowedRoles={['admin']}>
                <UsersPage />
              </RoleGuard>
            }
          />
          <Route
            path="audit"
            element={
              <RoleGuard allowedRoles={['admin']}>
                <AuditPage />
              </RoleGuard>
            }
          />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
