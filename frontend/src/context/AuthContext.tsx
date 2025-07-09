import type { ReactNode } from 'react';
import { createContext, useContext, useEffect, useState } from 'react';
import { authApi } from '../api/axios';

interface AuthCtx {
  isAuthenticated: boolean;
  loading: boolean;
  login: () => void;
  logout: () => Promise<void>;

  preAuthToken: string | null;
  setPreAuthToken: (tok: string | null) => void;
}


const AuthContext = createContext<AuthCtx | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setAuthenticated] = useState(false);

  // Read any existing token from sessionStorage once
  const [preAuthToken, _setPreAuthToken] = useState<string | null>(() =>
    sessionStorage.getItem('preauth')
  );

  // Keep React state and sessionStorage in sync
  const setPreAuthToken = (tok: string | null) => {
    if (tok) sessionStorage.setItem('preauth', tok);
    else sessionStorage.removeItem('preauth');
    _setPreAuthToken(tok);
  };

  useEffect(() => {
    (async () => {
      try {
        await authApi.get('/me');
        setAuthenticated(true);
      } catch {
        setAuthenticated(false);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const login = () => setAuthenticated(true);

  const logout = async () => {
    await authApi.post('/logout');
    setAuthenticated(false);
    setPreAuthToken(null);
  };

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        loading,
        login,
        logout,
        preAuthToken,
        setPreAuthToken,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be inside <AuthProvider>');
  return ctx;
}
