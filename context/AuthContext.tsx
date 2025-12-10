import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '../types';
import { useData } from './DataContext';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  login: (email: string, pass: string) => boolean;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { users } = useData();
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const storedUserId = localStorage.getItem('gf_auth_user_id');
    if (storedUserId) {
      const foundUser = users.find(u => u.id === storedUserId);
      if (foundUser) {
        setUser(foundUser);
      }
    }
  }, [users]);

  const login = (email: string, pass: string): boolean => {
    // Simple mock hash check for demonstration
    // In a real app, use a crypto library to hash 'pass' before comparing
    const mockHash = pass === '123456' ? 'e10adc3949ba59abbe56e057f20f883e' : pass;
    
    const foundUser = users.find(
      u => u.email === email && u.passwordHash === mockHash
    );

    if (foundUser) {
      setUser(foundUser);
      localStorage.setItem('gf_auth_user_id', foundUser.id);
      return true;
    }
    return false;
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('gf_auth_user_id');
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      isAuthenticated: !!user, 
      login, 
      logout 
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};