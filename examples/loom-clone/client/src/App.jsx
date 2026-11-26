import { Navigate, Route, Routes } from 'react-router-dom'
import LoginPage from './auth/LoginPage.jsx'
import SignupPage from './auth/SignupPage.jsx'
import ProtectedRoute from './auth/ProtectedRoute.jsx'
import Layout from './components/Layout.jsx'
import LibraryPage from './pages/LibraryPage.jsx'
import RecordPage from './pages/RecordPage.jsx'
import RecordingPage from './pages/RecordingPage.jsx'

const shell = (page) => (
  <ProtectedRoute>
    <Layout>{page}</Layout>
  </ProtectedRoute>
)

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/signup" element={<SignupPage />} />
      <Route path="/" element={shell(<LibraryPage />)} />
      <Route path="/record" element={shell(<RecordPage />)} />
      <Route path="/recordings/:id" element={shell(<RecordingPage />)} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
