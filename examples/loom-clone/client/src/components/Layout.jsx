import { Link, useNavigate } from 'react-router-dom'
import { useSession } from '../auth/SessionProvider.jsx'

// Header shown on every signed-in page.
export default function Layout({ children }) {
  const { user, signOut } = useSession()
  const navigate = useNavigate()

  function handleLogout() {
    signOut()
    navigate('/login', { replace: true })
  }

  return (
    <>
      <header className="app-header">
        <Link to="/" className="wordmark">
          Looky
        </Link>
        <div className="header-right">
          {user && <span className="muted">{user.email}</span>}
          <button className="button" onClick={handleLogout} data-testid="logout-button">
            Log out
          </button>
        </div>
      </header>
      <main className="page">{children}</main>
    </>
  )
}
