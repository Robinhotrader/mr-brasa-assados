import { User } from 'firebase/auth';
import React, { createContext, ReactNode, useContext, useEffect, useState } from 'react';
import {
  login,
  logout,
  onAuthStateChange,
  register
} from '../services/firebase';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  isAdmin: boolean;
  login: (email: string, senha: string) => Promise<{ success: boolean; user?: User; error?: string }>;
  register: (email: string, senha: string) => Promise<{ success: boolean; user?: User; error?: string }>;
  logout: () => Promise<{ success: boolean; error?: string }>;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth deve ser usado dentro de AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [isAdmin, setIsAdmin] = useState<boolean>(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChange((user: User | null) => {
      setUser(user);
      // Verificar se é admin
      if (user) {
        setIsAdmin(user.email === 'admin@mrbrasa.com');
      } else {
        setIsAdmin(false);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const handleLogin = async (email: string, senha: string) => {
    const result = await login(email, senha);
    if (result.success) {
      setIsAdmin(email === 'admin@mrbrasa.com');
    }
    return result;
  };

  const handleRegister = async (email: string, senha: string) => {
    return await register(email, senha);
  };

  const handleLogout = async () => {
    const result = await logout();
    if (result.success) {
      setIsAdmin(false);
    }
    return result;
  };

  const value: AuthContextType = {
    user,
    loading,
    isAdmin,
    login: handleLogin,
    register: handleRegister,
    logout: handleLogout,
    isAuthenticated: !!user,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
