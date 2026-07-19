import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useAuthStore } from '@/stores/useAuthStore'
import LoginPage from '@/pages/Login'
import type { ReactNode } from 'react'

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
      <Routes>
        <Route path="/" element={<Navigate to={isLoggedIn ? '/chat' : '/login'} replace />} />
        <Route path="/login" element={<LoginPage />} />
        <Route
          path="/chat"
          element={
            <ProtectedRoute>
              <div className="flex items-center justify-center h-screen text-wechat-text">
                Chat Page Placeholder
              </div>
            </ProtectedRoute>
          }
        />
      </Routes>
    </BrowserRouter>
  )
}

export default App
