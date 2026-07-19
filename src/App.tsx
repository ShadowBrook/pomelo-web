import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/login" element={<div className="flex items-center justify-center h-screen text-wechat-text">Login Page Placeholder</div>} />
        <Route path="/chat" element={<div className="flex items-center justify-center h-screen text-wechat-text">Chat Page Placeholder</div>} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
