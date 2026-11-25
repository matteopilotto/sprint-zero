import { Link, useNavigate } from 'react-router-dom';
import { useSession } from '../auth/SessionProvider.jsx';

export default function Header() {
  const { user, signOut } = useSession();
  const navigate = useNavigate();

  function handleLogout() {
    signOut();
    navigate('/login');
  }

  return (
    <header className="header">
      <Link to="/notes" className="wordmark">Granola Clone</Link>
      <div className="header-right">
        {user && <span className="user-name" data-testid="user-name">{user.name}</span>}
        <button type="button" className="ghost" data-testid="logout-button" onClick={handleLogout}>
          Log out
        </button>
      </div>
    </header>
  );
}
