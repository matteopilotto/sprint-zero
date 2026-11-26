import { useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { useSession } from './SessionProvider.jsx'

// Shared email + password form used by the login and sign-up pages.
export default function AuthForm({ heading, action, submitLabel, submitTestId, footer }) {
  const { session, loading } = useSession()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  if (!loading && session && !busy) return <Navigate to="/" replace />

  async function handleSubmit(event) {
    event.preventDefault()
    setError('')
    setBusy(true)
    try {
      await action(email, password)
      navigate('/', { replace: true })
    } catch (err) {
      setError(err.message)
      setBusy(false)
    }
  }

  return (
    <main className="auth-page">
      <p className="wordmark">Loom clone</p>
      <form className="card auth-card" onSubmit={handleSubmit}>
        <h1>{heading}</h1>
        <label htmlFor="email">Email</label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          data-testid="email-input"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <label htmlFor="password">Password</label>
        <input
          id="password"
          name="password"
          type="password"
          required
          data-testid="password-input"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        {error && (
          <p className="error" role="alert">
            {error}
          </p>
        )}
        <button className="button primary" type="submit" disabled={busy} data-testid={submitTestId}>
          {submitLabel}
        </button>
      </form>
      <p className="auth-footer">
        {footer.text}{' '}
        <Link to={footer.to} data-testid={footer.testId}>
          {footer.label}
        </Link>
      </p>
    </main>
  )
}
