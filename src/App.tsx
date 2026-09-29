import { lazy, Suspense } from 'react'
import type { ReactNode } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router'
import { useAuthStore } from '@/stores/useAuthStore'

const LoginPage = lazy(() => import('@/pages/Login'))
const ChatPage = lazy(() => import('@/pages/Chat'))

function ProtectedRoute({ children }: { children: ReactNode }) {
  const isLoggedIn = useAuthStore((s) => s.isLoggedIn)
  if (!isLoggedIn) {
    return <Navigate to="/login" replace />
  }
  return <>{children}</>
}

function App() {
  const isLoggedIn = useAuthStore((s) => s.isLoggedIn)

  return (
    <BrowserRouter>
      <Suspense fallback={<div className="flex items-center justify-center h-dvh">Loading...</div>}>
        <Routes>
          <Route path="/" element={<Navigate to={isLoggedIn ? '/chat' : '/login'} replace />} />
          <Route path="/login" element={<LoginPage />} />
          <Route
            path="/chat"
            element={
              <ProtectedRoute>
                <ChatPage />
              </ProtectedRoute>
            }
          />
        </Routes>
      </Suspense>
    </BrowserRouter>
  )
}

export default App
