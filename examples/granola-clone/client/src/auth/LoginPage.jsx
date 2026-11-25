import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useSession } from './SessionProvider.jsx';

export default function LoginPage() {
  const { signIn } = useSession();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      await signIn(email, password);
      navigate('/notes');
    } catch (err) {
      setError(err.message);
      setBusy(false);
    }
  }

  return (
    <div className="auth-page">
      <form className="auth-card" onSubmit={handleSubmit} noValidate>
        <div className="wordmark">Granola Clone</div>
        <h1>Log in</h1>
        <label>
          Email
          <input name="email" type="email" data-testid="email-input" value={email}
            onChange={(e) => setEmail(e.target.value)} autoComplete="email" />
        </label>
        <label>
          Password
          <input name="password" type="password" data-testid="password-input" value={password}
            onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" />
        </label>
        {error && <p className="error" role="alert">{error}</p>}
        <button type="submit" className="primary" data-testid="login-button" disabled={busy}>
          Log in
        </button>
        <p className="switch">
          No account? <Link to="/signup" data-testid="go-to-signup">Sign up</Link>
        </p>
      </form>
    </div>
  );
}
