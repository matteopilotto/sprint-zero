import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useSession } from './SessionProvider.jsx';

export default function SignupPage() {
  const { signUp } = useSession();
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      await signUp(name, email, password);
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
        <h1>Sign up</h1>
        <label>
          Name
          <input name="name" type="text" data-testid="name-input" value={name}
            onChange={(e) => setName(e.target.value)} autoComplete="name" />
        </label>
        <label>
          Email
          <input name="email" type="email" data-testid="email-input" value={email}
            onChange={(e) => setEmail(e.target.value)} autoComplete="email" />
        </label>
        <label>
          Password
          <input name="password" type="password" data-testid="password-input" value={password}
            onChange={(e) => setPassword(e.target.value)} autoComplete="new-password" />
        </label>
        {error && <p className="error" role="alert">{error}</p>}
        <button type="submit" className="primary" data-testid="signup-button" disabled={busy}>
          Sign up
        </button>
        <p className="switch">
          Have an account? <Link to="/login" data-testid="go-to-login">Log in</Link>
        </p>
      </form>
    </div>
  );
}
