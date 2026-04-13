import React from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { getToken } from './api'
import Login from './pages/Login'
import Documents from './pages/Documents'
import Chat from './pages/Chat'
import Sidebar from './components/Sidebar'

const globalStyles = `
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body {
    font-family: 'Inter', system-ui, sans-serif;
    background: #0F172A;
    color: #F8FAFC;
    min-height: 100vh;
  }
  a { color: #3B82F6; text-decoration: none; }
  a:hover { text-decoration: underline; }
  ::-webkit-scrollbar { width: 6px; }
  ::-webkit-scrollbar-track { background: #1E293B; }
  ::-webkit-scrollbar-thumb { background: #475569; border-radius: 3px; }
`

function ProtectedRoute({ children }) {
  if (!getToken()) return <Navigate to="/login" replace />
  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <Sidebar />
      <main style={{ flex: 1, padding: '24px 32px', marginLeft: 240, minHeight: '100vh' }}>
        {children}
      </main>
    </div>
  )
}

export default function App() {
  return (
    <>
      <style>{globalStyles}</style>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/documents" element={<ProtectedRoute><Documents /></ProtectedRoute>} />
          <Route path="/chat/:documentId" element={<ProtectedRoute><Chat /></ProtectedRoute>} />
          <Route path="/" element={<Navigate to="/documents" replace />} />
          <Route path="*" element={<Navigate to="/documents" replace />} />
        </Routes>
      </BrowserRouter>
    </>
  )
}
