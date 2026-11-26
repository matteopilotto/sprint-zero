import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import * as api from '../api/client.js'

const TOKEN_KEY = 'loomclone_token'
const SessionContext = createContext(null)

export function useSession() {
  return useContext(SessionContext)
}

export function SessionProvider({ children }) {
  const [accessToken, setAccessToken] = useState(() => localStorage.getItem(TOKEN_KEY))
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(Boolean(accessToken))

  // Logging out is client-side only: throw the token away.
  const signOut = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY)
    setAccessToken(null)
    setUser(null)
  }, [])

  const startSession = useCallback((data) => {
    localStorage.setItem(TOKEN_KEY, data.access_token)
    setAccessToken(data.access_token)
    setUser(data.user)
  }, [])

  const signIn = useCallback(
    async (email, password) => startSession(await api.login(email, password)),
    [startSession],
  )
  const signUp = useCallback(
    async (email, password) => startSession(await api.signup(email, password)),
    [startSession],
  )

  // Any 401 on a signed-in call ends the session.
  useEffect(() => {
    api.setUnauthorizedHandler(signOut)
  }, [signOut])

  // On load, check that a stored token is still valid.
  useEffect(() => {
    const stored = localStorage.getItem(TOKEN_KEY)
    if (!stored) return
    let cancelled = false
    api
      .getMe(stored)
      .then((data) => !cancelled && setUser(data.user))
      .catch(() => {}) // a 401 has already signed us out; other errors show on the page
      .finally(() => !cancelled && setLoading(false))
    return () => {
      cancelled = true
    }
  }, [])

  const value = useMemo(
    () => ({
      session: accessToken ? { access_token: accessToken, user } : null,
      user,
      accessToken,
      signUp,
      signIn,
      signOut,
      loading,
    }),
    [accessToken, user, signUp, signIn, signOut, loading],
  )

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>
}
