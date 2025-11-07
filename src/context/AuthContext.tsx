import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { Alert } from 'react-native';
import { apiLogin, apiSignup } from '../lib/api';
import { clearToken, getToken, saveToken } from '../lib/storage';
import { useUser } from './UserContext';

type AuthContextType = {
  isAuthenticated: boolean;
  token: string | null;
  login: (email: string, password: string) => Promise<boolean>;
  signup: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
};

const AuthContext = createContext<AuthContextType>({
  isAuthenticated: false,
  token: null,
  login: async () => false,
  signup: async () => false,
  logout: () => {},
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [token, setToken] = useState<string | null>(null);
  const [initializing, setInitializing] = useState(true);
  const { reset } = useUser();

  useEffect(() => {
    const init = async () => {
      try {
        const storedToken = await getToken();
        setToken(storedToken);
      } finally {
        setInitializing(false);
      }
    };
    init();
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    if (!email || !password) {
      Alert.alert('Xəta', 'Email və şifrə lazımdır');
      return false;
    }
    try {
      const res = await apiLogin(email, password);
      if (!res.ok || !res.token) {
        Alert.alert('Xəta', res.error || 'Giriş mümkün olmadı');
        return false;
      }
      reset();
      await saveToken(res.token);
      setToken(res.token);
      return true;
    } catch (error) {
      Alert.alert('Xəta', 'Serverə qoşulmaq mümkün olmadı');
      return false;
    }
  }, [reset]);

  const signup = useCallback(async (email: string, password: string) => {
    if (!email || !password) {
      Alert.alert('Xəta', 'Email və şifrə lazımdır');
      return false;
    }
    try {
      const res = await apiSignup(email, password);
      if (!res.ok || !res.token) {
        Alert.alert('Xəta', res.error || 'Qeydiyyat mümkün olmadı');
        return false;
      }
      reset();
      await saveToken(res.token);
      setToken(res.token);
      return true;
    } catch (error) {
      Alert.alert('Xəta', 'Serverə qoşulmaq mümkün olmadı');
      return false;
    }
  }, [reset]);

  const logout = useCallback(() => {
    clearToken();
    reset();
    setToken(null);
  }, [reset]);

  const value = useMemo(
    () => ({
      isAuthenticated: !!token,
      token,
      login,
      signup,
      logout,
    }),
    [token, login, signup, logout]
  );

  if (initializing) return null;

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => useContext(AuthContext);
