import type { ReactNode } from 'react';
import { createContext, useContext, useEffect, useState } from 'react';
import { authApi } from '../api/axios';
import type { User, Family } from '../types/family';

interface AuthCtx {
  isAuthenticated: boolean;
  loading: boolean;
  user: User | null;
  activeFamily: Family | null;
  login: () => void;
  logout: () => Promise<void>;
  setActiveFamily: (family: Family) => void;

  preAuthToken: string | null;
  setPreAuthToken: (tok: string | null) => void;
}


const AuthContext = createContext<AuthCtx | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const [activeFamily, setActiveFamily] = useState<Family | null>(null);
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

  // A helper function to handle setting state after a successful auth
  const handleSuccessfulAuth = (userData: User) => {
    let defaultFamily = userData.families.find(family => family.role === 'owner');
    if (!defaultFamily && userData.families.length > 0) {
      defaultFamily = userData.families[0];
    }

    setUser(userData);
    setActiveFamily(defaultFamily || null);
    setAuthenticated(true);
  };

  useEffect(() => {
    (async () => {
      try {
        const { data: userData } = await authApi.get<User>('/me');
        handleSuccessfulAuth(userData);
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
    setUser(null);
    setActiveFamily(null);
  };

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        loading,
        user,
        activeFamily,
        login,
        logout,
        setActiveFamily,
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
