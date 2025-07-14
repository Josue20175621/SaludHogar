import type { ReactNode } from 'react';
import { createContext, useContext, useEffect, useState } from 'react';
import { authApi } from '../api/axios';
import { useQueryClient } from '@tanstack/react-query';
import type { User, Family } from '../types/family';

interface AuthCtx {
  isAuthenticated: boolean;
  loading: boolean;
  user: User | null;
  activeFamily: Family | null;
  fetchAndSetUser: () => Promise<void>;
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

  const queryClient = useQueryClient();

  const clearAuthState = () => {
    setUser(null);
    setActiveFamily(null);
    setAuthenticated(false);
    setPreAuthToken(null);
    queryClient.removeQueries(); // Still important to clear the cache
  };

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

  const fetchAndSetUser = async () => {
    try {
      const { data: userData } = await authApi.get<User>('/me');
      handleSuccessfulAuth(userData); // This sets user, activeFamily, etc.
    } catch (error) {
      // If fetching the user fails, it's a full logout.
      clearAuthState();
      // Re-throw the error so the calling component knows it failed
      throw error;
    }
  };

  const logout = async () => {
    try {
      await authApi.post('/logout');
    } catch (error) {
      console.error("Logout API call failed, but clearing state anyway:", error);
    } finally {
      clearAuthState();
    }
  };

  useEffect(() => {
    const checkAuthStatus = async () => {
      setLoading(true);
      try {
        await fetchAndSetUser();
      } catch {
        // We can ignore the error here because fetchAndSetUser handles the state clearing.
      } finally {
        setLoading(false);
      }
    };
    checkAuthStatus();
  }, []);

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        loading,
        user,
        activeFamily,
        fetchAndSetUser,
        logout,
        setActiveFamily,
        preAuthToken,
        setPreAuthToken,
      }}
    >
      {!loading && children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be inside <AuthProvider>');
  return ctx;
}
