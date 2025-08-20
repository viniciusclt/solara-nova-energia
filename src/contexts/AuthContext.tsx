import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '../integrations/supabase/client';
import { useToast } from '../hooks/use-toast';
import { PERMISSIONS, validateEmail, validatePassword, sanitizeEmail } from './authUtils';
import { logWarn, logError } from '@/utils/secureLogger';
import { DashboardService } from '@/services/DashboardService';
import { useConnectivity } from '@/services/connectivityService';


export type UserAccessType = 'vendedor' | 'engenheiro' | 'admin' | 'super_admin';

export interface UserProfile {
  id: string;
  email: string;
  name: string;
  access_type: UserAccessType;
  company_id: string | null;
  last_login: string | null;
}

export interface Company {
  id: string;
  name: string;
  cnpj: string;
  address: string | null;
  num_employees: number;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: UserProfile | null;
  company: Company | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUp: (email: string, password: string, name: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  hasPermission: (action: string) => boolean;
  isSubscriptionActive: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};



export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [company, setCompany] = useState<Company | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSubscriptionActive, setIsSubscriptionActive] = useState(false);
  const { toast } = useToast();
  const connectivity = useConnectivity();

  /**
   * Garante que existe uma empresa padrão no sistema
   */
  const ensureDefaultCompanyExists = async (): Promise<string | null> => {
    try {
      return await DashboardService.ensureDefaultCompany();
    } catch (error) {
      console.error('[AuthContext] Erro ao garantir empresa padrão:', error);
      return null;
    }
  };

  const fetchProfile = async (userId: string) => {
    try {
      console.log(`[AuthContext] Buscando perfil para usuário: ${userId}`);
      
      // Verificar conectividade antes de tentar acessar Supabase
      if (!connectivity?.isOnline) {
        console.log('[AuthContext] Modo offline detectado, usando perfil de demonstração');
        throw new Error('Offline mode - using demo profile');
      }
      
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (profileError) throw profileError;
      
      if (!profileData) {
        logWarn('Perfil não encontrado para o usuário', {
          service: 'AuthContext',
          userId,
          action: 'fetchProfile'
        });
        setProfile(null);
        setLoading(false);
        return;
      }
      
      // Verificar se usuário tem empresa associada
      if (!profileData.company_id) {
        console.warn(`[AuthContext] Usuário ${userId} sem empresa. Tentando associar à empresa padrão.`);
        
        // Tentar associar à empresa padrão
        const defaultCompanyId = await ensureDefaultCompanyExists();
        
        if (defaultCompanyId) {
          console.log(`[AuthContext] Associando usuário ${userId} à empresa padrão: ${defaultCompanyId}`);
          
          // Atualizar perfil com empresa padrão
          const { data: updatedProfile, error: updateError } = await supabase
            .from('profiles')
            .update({ 
              company_id: defaultCompanyId,
              updated_at: new Date().toISOString()
            })
            .eq('id', userId)
            .select('*')
            .single();

          if (!updateError && updatedProfile) {
            console.log(`[AuthContext] Usuário ${userId} associado à empresa padrão com sucesso`);
            profileData.company_id = defaultCompanyId;
            
            // Log da ação
            await supabase
              .from('audit_logs')
              .insert({
                user_id: userId,
                action: 'auto_assign_company',
                details: { 
                  company_id: defaultCompanyId,
                  timestamp: new Date().toISOString(),
                  reason: 'user_without_company'
                }
              });
          } else {
            console.error(`[AuthContext] Erro ao associar usuário à empresa padrão:`, updateError);
          }
        } else {
          console.error(`[AuthContext] Não foi possível criar/encontrar empresa padrão`);
        }
      }
      
      setProfile(profileData);

      if (profileData.company_id) {
        console.log(`[AuthContext] Carregando dados da empresa: ${profileData.company_id}`);
        
        const { data: companyData } = await supabase
          .from('companies')
          .select('*')
          .eq('id', profileData.company_id)
          .maybeSingle();
        
        setCompany(companyData);

        // Check subscription status
        const { data: subscriptionData } = await supabase
          .from('subscriptions')
          .select('status, end_date')
          .eq('company_id', profileData.company_id)
          .maybeSingle();

        if (subscriptionData) {
          const isActive = (subscriptionData.status === 'ativa' || subscriptionData.status === 'gratuita') &&
                          (!subscriptionData.end_date || new Date(subscriptionData.end_date) > new Date());
          setIsSubscriptionActive(isActive);
        }
      } else {
        console.warn(`[AuthContext] Usuário ${userId} ainda sem empresa após tentativa de associação`);
        setCompany(null);
        setIsSubscriptionActive(false);
      }

      // Update last login
      await supabase
        .from('profiles')
        .update({ last_login: new Date().toISOString() })
        .eq('id', userId);

      // Log login action
      await supabase
        .from('audit_logs')
        .insert({
          user_id: userId,
          action: 'login',
          details: { timestamp: new Date().toISOString() }
         });

      // Sempre define loading como false ao final
      setLoading(false);

    } catch (error) {
      console.warn(`[AuthContext] Erro ao conectar com Supabase, usando dados de demonstração:`, error);
      
      // Fallback para desenvolvimento/localhost - criar perfil de demonstração
      const demoProfile: UserProfile = {
        id: userId,
        email: user?.email || 'demo@solara.com.br',
        name: 'Usuário Demonstração',
        access_type: 'admin',
        company_id: 'demo-company-id',
        last_login: new Date().toISOString()
      };
      
      const demoCompany: Company = {
        id: 'demo-company-id',
        name: 'Solara Energia - Demo',
        cnpj: '00.000.000/0001-00',
        address: 'Endereço de Demonstração',
        num_employees: 10
      };
      
      setProfile(demoProfile);
      setCompany(demoCompany);
      setIsSubscriptionActive(true); // Ativo para demonstração
      setLoading(false);
      
      console.log(`[AuthContext] Perfil de demonstração criado para usuário: ${userId}`);
    }
  };

  useEffect(() => {
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          // Usar setTimeout para evitar problemas de recursão
          setTimeout(() => {
            fetchProfile(session.user.id);
          }, 0);
        } else {
          setProfile(null);
          setCompany(null);
          setIsSubscriptionActive(false);
          setLoading(false);
        }
      }
    );

    // Check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        setTimeout(() => {
          fetchProfile(session.user.id);
        }, 0);
      } else {
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      // Basic input validation
      if (!email || !password) {
        const error = new Error('Email e senha são obrigatórios');
        return { error };
      }

      // Validate email format
      if (!validateEmail(email)) {
        const error = new Error('Formato de email inválido');
        return { error };
      }

      const { error } = await supabase.auth.signInWithPassword({
        email: sanitizeEmail(email),
        password,
      });
      
      if (error) {
        // Security: Use generic error messages to prevent user enumeration
        const secureMessage = "Credenciais inválidas";
        
        // Log failed login attempt - simplified for now
        try {
          await supabase
            .from('audit_logs')
            .insert({
              user_id: user?.id || 'anonymous',
              action: 'failed_login',
              details: { 
                email: sanitizeEmail(email),
                timestamp: new Date().toISOString()
              }
            });
        } catch {
          // Fail silently for security logging
        }

        toast({
          title: "Erro no login",
          description: secureMessage,
          variant: "destructive",
        });
      }
      
      return { error };
    } catch (error) {
      // Secure error handling - avoid console logging in production
      return { error: new Error('Erro interno. Tente novamente.') };
    }
  };

  const signUp = async (email: string, password: string, name: string) => {
    try {
      // Input validation
      if (!email || !password || !name) {
        const error = new Error('Todos os campos são obrigatórios');
        return { error };
      }

      // Validate email format
      if (!validateEmail(email)) {
        const error = new Error('Formato de email inválido');
        return { error };
      }

      // Validate password strength
      const passwordValidation = validatePassword(password);
      if (!passwordValidation.isValid) {
        const error = new Error(passwordValidation.message || 'Senha inválida');
        return { error };
      }

      // Validate name
      if (!name.trim() || name.trim().length < 2) {
        const error = new Error('Nome deve ter pelo menos 2 caracteres');
        return { error };
      }

      const { error } = await supabase.auth.signUp({
        email: sanitizeEmail(email),
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/`,
          data: {
            name: name.trim(),
          },
        },
      });
      
      if (error) {
        // Security: Use generic error messages
        let secureMessage = "Erro ao criar conta. Tente novamente.";
        
        // Some specific errors we can show
        if (error.message.includes('User already registered')) {
          secureMessage = "Este email já está cadastrado";
        }

        toast({
          title: "Erro no cadastro",
          description: secureMessage,
          variant: "destructive",
        });
      } else {
        // Log successful signup attempt
        try {
          await supabase
            .from('audit_logs')
            .insert({
              user_id: user?.id || 'pending',
              action: 'signup_attempt',
              details: { 
                email: sanitizeEmail(email),
                timestamp: new Date().toISOString()
              }
            });
        } catch {
          // Fail silently for security logging
        }
      }
      
      return { error };
    } catch (error) {
      // Secure error handling - avoid console logging in production
      return { error: new Error('Erro interno. Tente novamente.') };
    }
  };

  const signOut = async () => {
    try {
      if (user) {
        await supabase
          .from('audit_logs')
          .insert({
            user_id: user.id,
            action: 'logout',
            details: { timestamp: new Date().toISOString() }
          });
      }
      
      await supabase.auth.signOut();
      setProfile(null);
      setCompany(null);
      setIsSubscriptionActive(false);
    } catch (error) {
      // Secure error handling - avoid console logging in production
    }
  };

  const hasPermission = (action: string): boolean => {
    if (!profile) return false;
    
    const userPermissions = PERMISSIONS[profile.access_type];
    return userPermissions.includes('all') || userPermissions.includes(action);
  };

  const value = {
    user,
    session,
    profile,
    company,
    loading,
    signIn,
    signUp,
    signOut,
    hasPermission,
    isSubscriptionActive,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};