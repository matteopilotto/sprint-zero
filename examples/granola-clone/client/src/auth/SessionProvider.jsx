// Holds the signed-in user and their access token.
// Local data layer: the backend issues the JWT; we keep it in localStorage.
import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { authApi } from '../api/client.js';

const TOKEN_KEY = 'access_token';
const SessionContext = createContext(null);

export function SessionProvider({ children }) {
  const [accessToken, setAccessToken] = useState(() => localStorage.getItem(TOKEN_KEY));
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(Boolean(localStorage.getItem(TOKEN_KEY)));

  const saveSession = (data) => {
    localStorage.setItem(TOKEN_KEY, data.access_token);
    setAccessToken(data.access_token);
    setUser(data.user);
  };

  const signOut = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    setAccessToken(null);
    setUser(null);
  }, []);

  // On first load, restore the session from the saved token.
  useEffect(() => {
    const token = localStorage.getItem(TOKEN_KEY);
    if (!token) return;
    authApi
      .me(token)
      .then((data) => setUser(data.user))
      .catch((err) => {
        if (err.status === 401) signOut();
      })
      .finally(() => setLoading(false));
  }, [signOut]);

  const signIn = async (email, password) => saveSession(await authApi.login(email, password));
  const signUp = async (name, email, password) =>
    saveSession(await authApi.signup(name, email, password));

  const value = {
    session: accessToken ? { access_token: accessToken, user } : null,
    user,
    accessToken,
    loading,
    signIn,
    signUp,
    signOut,
  };
  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useSession() {
  return useContext(SessionContext);
}
