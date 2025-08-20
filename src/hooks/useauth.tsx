// =====================================================
// HOOK DE AUTENTICAÇÃO
// Sistema de Autenticação - Solara Nova Energia
// Versão: 1.0
// Data: 2024-12-12
// =====================================================

import { useState, useEffect, createContext, useContext } from 'react';

// =====================================================
// TIPOS
// =====================================================

export interface User {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'manager' | 'user';
  company_id: string;
  department?: string;
  position?: string;
  avatar_url?: string;
  created_at: string;
  updated_at: string;
}

export interface AuthState {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
}

export interface AuthContextType extends AuthState {
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  updateUser: (userData: Partial<User>) => Promise<void>;
}

// =====================================================
// CONTEXTO DE AUTENTICAÇÃO
// =====================================================

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// =====================================================
// HOOK DE AUTENTICAÇÃO
// =====================================================

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  
  if (context === undefined) {
    // Se não há contexto, retorna um estado mock para desenvolvimento
    return {
      user: {
        id: '1',
        email: 'usuario@solara.com.br',
        name: 'Usuário Teste',
        role: 'user',
        company_id: '1',
        department: 'Engenharia',
        position: 'Técnico Solar',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      isLoading: false,
      isAuthenticated: true,
      login: async () => {},
      logout: async () => {},
      updateUser: async () => {}
    };
  }
  
  return context;
}

// =====================================================
// PROVIDER DE AUTENTICAÇÃO
// =====================================================

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Simular carregamento inicial
    const timer = setTimeout(() => {
      setUser({
        id: '1',
        email: 'usuario@solara.com.br',
        name: 'Usuário Teste',
        role: 'user',
        company_id: '1',
        department: 'Engenharia',
        position: 'Técnico Solar',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });
      setIsLoading(false);
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      // Implementar lógica de login real aqui
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setUser({
        id: '1',
        email,
        name: 'Usuário Logado',
        role: 'user',
        company_id: '1',
        department: 'Engenharia',
        position: 'Técnico Solar',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });
    } catch (error) {
      throw new Error('Erro ao fazer login');
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    setIsLoading(true);
    try {
      // Implementar lógica de logout real aqui
      await new Promise(resolve => setTimeout(resolve, 500));
      setUser(null);
    } catch (error) {
      throw new Error('Erro ao fazer logout');
    } finally {
      setIsLoading(false);
    }
  };

  const updateUser = async (userData: Partial<User>) => {
    if (!user) return;
    
    setIsLoading(true);
    try {
      // Implementar lógica de atualização real aqui
      await new Promise(resolve => setTimeout(resolve, 500));
      
      setUser({
        ...user,
        ...userData,
        updated_at: new Date().toISOString()
      });
    } catch (error) {
      throw new Error('Erro ao atualizar usuário');
    } finally {
      setIsLoading(false);
    }
  };

  const value: AuthContextType = {
    user,
    isLoading,
    isAuthenticated: !!user,
    login,
    logout,
    updateUser
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

// =====================================================
// HOOK PARA VERIFICAR PERMISSÕES
// =====================================================

export function usePermissions() {
  const { user } = useAuth();
  
  const hasRole = (role: User['role']) => {
    return user?.role === role;
  };
  
  const hasAnyRole = (roles: User['role'][]) => {
    return roles.includes(user?.role || 'user');
  };
  
  const isAdmin = () => hasRole('admin');
  const isManager = () => hasRole('manager');
  const isUser = () => hasRole('user');
  
  return {
    hasRole,
    hasAnyRole,
    isAdmin,
    isManager,
    isUser,
    canManageUsers: isAdmin() || isManager(),
    canCreateModules: isAdmin(),
    canViewReports: isAdmin() || isManager()
  };
}

export default useAuth;