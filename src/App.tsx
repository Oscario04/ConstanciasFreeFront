import { QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from 'react-hot-toast'
import AppRouter from '@/app/routes/AppRouter'
import { queryClient } from '@/app/providers/queryClient'

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Toaster position="top-right" toastOptions={{ duration: 3500 }} />
      <AppRouter />
    </QueryClientProvider>
  )
}