
import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { User } from '../types';
import { authApi, logActivity } from '../services/apiService';

interface AuthContextType {
  user: User | null;
  login: (user: User, accessToken: string, refreshToken: string, rememberMe: boolean) => void;
  logout: () => void;
  loading: boolean;
  token: string | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let storedUser: string | null = null;
    let storedToken: string | null = null;
    
    // Check localStorage first for "Remember me" session
    storedUser = localStorage.getItem('user');
    storedToken = localStorage.getItem('token');

    // If not in localStorage, check sessionStorage for regular session
    if (!storedUser || !storedToken) {
      storedUser = sessionStorage.getItem('user');
      storedToken = sessionStorage.getItem('token');
    }

    if (storedUser && storedToken) {
      try {
        setUser(JSON.parse(storedUser));
        setToken(storedToken);
      } catch (error) {
        console.error("Failed to parse user from storage", error);
        sessionStorage.clear();
        localStorage.clear();
      }
    }
    setLoading(false);
  }, []);
  
  // FIX: Import `useCallback` from react to fix "Cannot find name 'useCallback'" error.
  const handleLogout = useCallback(() => {
    if (user) {
      logActivity(user.username, 'Logged out');
    }
    // Clear from both storages on logout
    sessionStorage.clear();
    localStorage.clear();
    setUser(null);
    setToken(null);
  }, [user]);

  // Listen for auth errors from apiService to auto-logout
  useEffect(() => {
    const handleAuthError = () => {
        handleLogout();
    };
    window.addEventListener('auth-error', handleAuthError);
    return () => window.removeEventListener('auth-error', handleAuthError);
  }, [handleLogout]);

  const login = (userData: User, accessToken: string, refreshToken: string, rememberMe: boolean) => {
    const storage = rememberMe ? localStorage : sessionStorage;
    storage.setItem('user', JSON.stringify(userData));
    storage.setItem('token', accessToken);
    storage.setItem('refreshToken', refreshToken);
    
    // Clear the other storage to avoid conflicts
    const otherStorage = rememberMe ? sessionStorage : localStorage;
    otherStorage.removeItem('user');
    otherStorage.removeItem('token');
    otherStorage.removeItem('refreshToken');

    setUser(userData);
    setToken(accessToken);
    logActivity(userData.username, 'Logged in');
  };

  const logout = () => {
    const refreshToken = localStorage.getItem('refreshToken') || sessionStorage.getItem('refreshToken');
    if(refreshToken) {
        authApi.logout(refreshToken).catch(err => console.error("Logout failed on backend:", err));
    }
    handleLogout();
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, loading, token }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
