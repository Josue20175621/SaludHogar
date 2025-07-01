import type { ReactNode } from 'react';
import { createContext, useContext, useEffect, useState } from 'react';
import api from '../api/axios';

interface AuthCtx {
  isAuthenticated: boolean;
  loading: boolean;
  login: () => void;
  logout: () => Promise<void>;
  // optional helpers
  setAuthenticated: (v: boolean) => void;
}

const AuthContext = createContext<AuthCtx | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setAuthenticated] = useState(false);

  // one shot at app start-up
  useEffect(() => {
    (async () => {
      try {
        await api.get('/me');      // if 200 → cookie is valid
        setAuthenticated(true);
      } catch {
        setAuthenticated(false);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const login  = () => setAuthenticated(true);

  const logout = async () => {
    await api.post('/logout');     // cookie is cleared on the server
    setAuthenticated(false);       // UI updates immediately
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, loading, setAuthenticated, login, logout}}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be inside <AuthProvider>');
  return ctx;
}
