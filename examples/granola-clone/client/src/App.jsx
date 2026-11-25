import { Navigate, Route, Routes } from 'react-router-dom';
import { useSession } from './auth/SessionProvider.jsx';
import ProtectedRoute from './auth/ProtectedRoute.jsx';
import LoginPage from './auth/LoginPage.jsx';
import SignupPage from './auth/SignupPage.jsx';
import Header from './components/Header.jsx';
import NotesListPage from './pages/NotesListPage.jsx';
import NoteEditorPage from './pages/NoteEditorPage.jsx';

// "/" sends signed-in users to their notes and everyone else to login.
function RootRedirect() {
  const { session, loading } = useSession();
  if (loading) return <p className="loading">Loading...</p>;
  return <Navigate to={session ? '/notes' : '/login'} replace />;
}

function Protected({ children }) {
  return (
    <ProtectedRoute>
      <Header />
      <main className="container">{children}</main>
    </ProtectedRoute>
  );
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<RootRedirect />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/signup" element={<SignupPage />} />
      <Route path="/notes" element={<Protected><NotesListPage /></Protected>} />
      <Route path="/notes/:id" element={<Protected><NoteEditorPage /></Protected>} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
