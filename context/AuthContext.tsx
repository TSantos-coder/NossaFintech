
import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, UserRole } from '../types';
import { supabase } from '../lib/supabaseClient';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  login: (email: string, pass: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (session?.user) {
          await fetchProfile(session.user.id, session.user.email!);
        } else {
          setLoading(false);
        }
      } catch (e) {
        console.error("Auth Session Error:", e);
        setLoading(false);
      }
    };

    checkSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session?.user) {
        await fetchProfile(session.user.id, session.user.email!);
      } else {
        setUser(null);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const setFallbackUser = (userId: string, email: string) => {
    setUser({
      id: userId,
      email: email,
      name: email.split('@')[0],
      role: (email.includes('admin') || email.includes('master') ? 'MASTER' : 'STANDARD'),
      createdAt: new Date().toISOString(),
      passwordHash: ''
    });
  };

  const fetchProfile = async (userId: string, email: string) => {
    try {
      // Tenta buscar o perfil. Se a tabela 'profiles' não existir, isso gera erro.
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error || !data) {
        console.warn('Perfil não encontrado ou erro DB. Usando Fallback.');
        setFallbackUser(userId, email);
      } else {
        setUser({
          id: data.id,
          email: data.email || email,
          name: data.name || 'Usuário',
          role: (data.role as UserRole) || 'STANDARD',
          createdAt: new Date().toISOString(),
          passwordHash: ''
        });
      }
    } catch (e) {
      console.error("Critical Profile Fetch Error:", e);
      // Fallback em caso de exceção (ex: erro de conexão, schema inválido)
      setFallbackUser(userId, email);
    } finally {
      setLoading(false);
    }
  };

  const login = async (email: string, pass: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password: pass,
      });

      if (error) {
        return { success: false, error: error.message };
      }
      return { success: true };
    } catch (e: any) {
      return { success: false, error: e.message || 'Erro de conexão' };
    }
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      isAuthenticated: !!user, 
      login, 
      logout,
      loading
    }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};