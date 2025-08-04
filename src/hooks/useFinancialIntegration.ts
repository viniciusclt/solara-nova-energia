import { useState, useCallback, useEffect } from 'react';
import { useToast } from './useToast';
import { supabase } from '../lib/supabase';
import { logFinancial, logError, logInfo } from '../utils/secureLogger';

interface FinancialInstitution {
  id: string;
  name: string;
  type: 'bank' | 'fintech' | 'cooperative';
  apiEndpoint?: string;
  apiKey?: string;
  isActive: boolean;
  supportedProducts: string[];
  interestRates: {
    min: number;
    max: number;
    type: 'fixed' | 'variable';
  };
  maxAmount: number;
  minAmount: number;
  maxTermMonths: number;
  minTermMonths: number;
  processingTime: number; // dias
  requirements: string[];
}

interface LoanApplication {
  id: string;
  institutionId: string;
  customerData: {
    name: string;
    cpf: string;
    email: string;
    phone: string;
    income: number;
    address: {
      street: string;
      number: string;
      city: string;
      state: string;
      zipCode: string;
    };
  };
  projectData: {
    totalValue: number;
    systemPower: number;
    estimatedSavings: number;
    paybackPeriod: number;
  };
  loanDetails: {
    amount: number;
    termMonths: number;
    interestRate: number;
    monthlyPayment: number;
  };
  status: 'draft' | 'submitted' | 'analyzing' | 'approved' | 'rejected' | 'completed';
  submittedAt?: string;
  responseAt?: string;
  documents: {
    type: string;
    url: string;
    status: 'pending' | 'approved' | 'rejected';
  }[];
}

interface LoanSimulation {
  institutionId: string;
  amount: number;
  termMonths: number;
  interestRate: number;
  monthlyPayment: number;
  totalAmount: number;
  totalInterest: number;
  approvalProbability: number;
}

interface UseFinancialIntegrationReturn {
  institutions: FinancialInstitution[];
  applications: LoanApplication[];
  isLoading: boolean;
  error: string | null;
  
  // Institution management
  loadInstitutions: () => Promise<void>;
  addInstitution: (institution: Omit<FinancialInstitution, 'id'>) => Promise<void>;
  updateInstitution: (id: string, updates: Partial<FinancialInstitution>) => Promise<void>;
  removeInstitution: (id: string) => Promise<void>;
  testConnection: (institutionId: string) => Promise<boolean>;
  
  // Loan simulation
  simulateLoan: (amount: number, termMonths: number, institutionIds?: string[]) => Promise<LoanSimulation[]>;
  
  // Application management
  createApplication: (application: Omit<LoanApplication, 'id' | 'status' | 'submittedAt'>) => Promise<string>;
  submitApplication: (applicationId: string) => Promise<void>;
  updateApplication: (applicationId: string, updates: Partial<LoanApplication>) => Promise<void>;
  checkApplicationStatus: (applicationId: string) => Promise<LoanApplication['status']>;
  uploadDocument: (applicationId: string, file: File, type: string) => Promise<string>;
  
  // Bulk operations
  syncAllApplications: () => Promise<void>;
  exportApplications: () => Promise<Blob>;
}

export const useFinancialIntegration = (): UseFinancialIntegrationReturn => {
  const { toast } = useToast();
  const [institutions, setInstitutions] = useState<FinancialInstitution[]>([]);
  const [applications, setApplications] = useState<LoanApplication[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load institutions from database
  const loadInstitutions = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      logFinancial('Carregando instituições financeiras', 'useFinancialIntegration');
      
      const { data, error: supabaseError } = await supabase
        .from('financial_institutions')
        .select('*')
        .eq('is_active', true)
        .order('name');
      
      if (supabaseError) {
        throw supabaseError;
      }
      
      // Transform data to match interface
      const transformedInstitutions: FinancialInstitution[] = data?.map(item => ({
        id: item.id,
        name: item.name,
        type: item.type,
        apiEndpoint: item.api_endpoint,
        apiKey: item.api_key,
        isActive: item.is_active,
        supportedProducts: item.supported_products || [],
        interestRates: item.interest_rates || { min: 0, max: 0, type: 'fixed' },
        maxAmount: item.max_amount || 0,
        minAmount: item.min_amount || 0,
        maxTermMonths: item.max_term_months || 0,
        minTermMonths: item.min_term_months || 0,
        processingTime: item.processing_time || 0,
        requirements: item.requirements || []
      })) || [];
      
      setInstitutions(transformedInstitutions);
      
      // Save to localStorage as cache
      localStorage.setItem('financial_institutions_cache', JSON.stringify(transformedInstitutions));
      
      logFinancial(`${transformedInstitutions.length} instituições carregadas com sucesso`, 'useFinancialIntegration');
      
    } catch (err: unknown) {
      logError('Erro ao carregar instituições financeiras', 'useFinancialIntegration', { error: (err as Error).message });
      setError((err as Error).message);
      
      // Try to load from cache
      try {
        const cached = localStorage.getItem('financial_institutions_cache');
        if (cached) {
          const cachedInstitutions = JSON.parse(cached);
          setInstitutions(cachedInstitutions);
          
          toast({
            title: "Modo Offline",
            description: "Carregando instituições do cache local",
            variant: "default"
          });
        }
      } catch (cacheError) {
          logError('Erro ao carregar cache de instituições', 'useFinancialIntegration', { error: (cacheError as Error).message });
        }
      
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  // Add new institution
  const addInstitution = useCallback(async (institution: Omit<FinancialInstitution, 'id'>) => {
    setIsLoading(true);
    
    try {
      const { data, error: supabaseError } = await supabase
        .from('financial_institutions')
        .insert({
          name: institution.name,
          type: institution.type,
          api_endpoint: institution.apiEndpoint,
          api_key: institution.apiKey,
          is_active: institution.isActive,
          supported_products: institution.supportedProducts,
          interest_rates: institution.interestRates,
          max_amount: institution.maxAmount,
          min_amount: institution.minAmount,
          max_term_months: institution.maxTermMonths,
          min_term_months: institution.minTermMonths,
          processing_time: institution.processingTime,
          requirements: institution.requirements
        })
        .select()
        .single();
      
      if (supabaseError) throw supabaseError;
      
      await loadInstitutions(); // Reload list
      
      toast({
        title: "Instituição Adicionada",
        description: `${institution.name} foi adicionada com sucesso`,
        variant: "default"
      });
      
    } catch (err: unknown) {
      logError('Erro ao adicionar instituição financeira', 'useFinancialIntegration', { error: (err as Error).message });
      toast({
        title: "Erro",
        description: "Falha ao adicionar instituição financeira",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  }, [loadInstitutions, toast]);

  // Update institution
  const updateInstitution = useCallback(async (id: string, updates: Partial<FinancialInstitution>) => {
    setIsLoading(true);
    
    try {
      const { error: supabaseError } = await supabase
        .from('financial_institutions')
        .update({
          name: updates.name,
          type: updates.type,
          api_endpoint: updates.apiEndpoint,
          api_key: updates.apiKey,
          is_active: updates.isActive,
          supported_products: updates.supportedProducts,
          interest_rates: updates.interestRates,
          max_amount: updates.maxAmount,
          min_amount: updates.minAmount,
          max_term_months: updates.maxTermMonths,
          min_term_months: updates.minTermMonths,
          processing_time: updates.processingTime,
          requirements: updates.requirements
        })
        .eq('id', id);
      
      if (supabaseError) throw supabaseError;
      
      await loadInstitutions(); // Reload list
      
      toast({
        title: "Instituição Atualizada",
        description: "Dados atualizados com sucesso",
        variant: "default"
      });
      
    } catch (err: unknown) {
      logError('Erro ao atualizar instituição financeira', 'useFinancialIntegration', { error: (err as Error).message });
      toast({
        title: "Erro",
        description: "Falha ao atualizar instituição",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  }, [loadInstitutions, toast]);

  // Remove institution
  const removeInstitution = useCallback(async (id: string) => {
    setIsLoading(true);
    
    try {
      const { error: supabaseError } = await supabase
        .from('financial_institutions')
        .update({ is_active: false })
        .eq('id', id);
      
      if (supabaseError) throw supabaseError;
      
      await loadInstitutions(); // Reload list
      
      toast({
        title: "Instituição Removida",
        description: "Instituição desativada com sucesso",
        variant: "default"
      });
      
    } catch (err: unknown) {
      logError('Erro ao remover instituição financeira', 'useFinancialIntegration', { error: (err as Error).message });
      toast({
        title: "Erro",
        description: "Falha ao remover instituição",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  }, [loadInstitutions, toast]);

  // Test API connection
  const testConnection = useCallback(async (institutionId: string): Promise<boolean> => {
    const institution = institutions.find(i => i.id === institutionId);
    if (!institution?.apiEndpoint) return false;
    
    try {
      // Simulate API test - in real implementation, this would make actual API calls
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Mock success/failure based on institution name for demo
      const success = !institution.name.toLowerCase().includes('test-fail');
      
      toast({
        title: success ? "Conexão OK" : "Falha na Conexão",
        description: success ? "API respondendo corretamente" : "Erro ao conectar com a API",
        variant: success ? "default" : "destructive"
      });
      
      return success;
      
    } catch (err) {
      toast({
        title: "Erro de Conexão",
        description: "Falha ao testar conexão com a API",
        variant: "destructive"
      });
      return false;
    }
  }, [institutions, toast]);

  // Simulate loan with multiple institutions
  const simulateLoan = useCallback(async (
    amount: number, 
    termMonths: number, 
    institutionIds?: string[]
  ): Promise<LoanSimulation[]> => {
    const targetInstitutions = institutionIds 
      ? institutions.filter(i => institutionIds.includes(i.id))
      : institutions.filter(i => i.isActive);
    
    const simulations: LoanSimulation[] = [];
    
    for (const institution of targetInstitutions) {
      // Check if amount is within limits
      if (amount < institution.minAmount || amount > institution.maxAmount) continue;
      if (termMonths < institution.minTermMonths || termMonths > institution.maxTermMonths) continue;
      
      // Calculate interest rate (simplified)
      const baseRate = (institution.interestRates.min + institution.interestRates.max) / 2;
      const riskAdjustment = Math.random() * 2 - 1; // -1 to +1
      const interestRate = Math.max(
        institution.interestRates.min,
        Math.min(institution.interestRates.max, baseRate + riskAdjustment)
      );
      
      // Calculate monthly payment using PMT formula
      const monthlyRate = interestRate / 100 / 12;
      const monthlyPayment = amount * (monthlyRate * Math.pow(1 + monthlyRate, termMonths)) / 
                            (Math.pow(1 + monthlyRate, termMonths) - 1);
      
      const totalAmount = monthlyPayment * termMonths;
      const totalInterest = totalAmount - amount;
      
      // Mock approval probability based on various factors
      const approvalProbability = Math.min(95, Math.max(10, 
        80 - (interestRate - baseRate) * 10 + Math.random() * 20
      ));
      
      simulations.push({
        institutionId: institution.id,
        amount,
        termMonths,
        interestRate: Number(interestRate.toFixed(2)),
        monthlyPayment: Number(monthlyPayment.toFixed(2)),
        totalAmount: Number(totalAmount.toFixed(2)),
        totalInterest: Number(totalInterest.toFixed(2)),
        approvalProbability: Number(approvalProbability.toFixed(1))
      });
    }
    
    // Sort by best conditions (lowest total interest)
    return simulations.sort((a, b) => a.totalInterest - b.totalInterest);
  }, [institutions]);

  // Create loan application
  const createApplication = useCallback(async (
    application: Omit<LoanApplication, 'id' | 'status' | 'submittedAt'>
  ): Promise<string> => {
    try {
      const { data, error: supabaseError } = await supabase
        .from('loan_applications')
        .insert({
          institution_id: application.institutionId,
          customer_data: application.customerData,
          project_data: application.projectData,
          loan_details: application.loanDetails,
          status: 'draft',
          documents: application.documents || []
        })
        .select()
        .single();
      
      if (supabaseError) throw supabaseError;
      
      toast({
        title: "Aplicação Criada",
        description: "Rascunho da aplicação salvo com sucesso",
        variant: "default"
      });
      
      return data.id;
      
    } catch (err: unknown) {
      logError('Erro ao criar aplicação financeira', {
        error: err instanceof Error ? err.message : 'Erro desconhecido',
        service: 'useFinancialIntegration'
      });
      toast({
        title: "Erro",
        description: "Falha ao criar aplicação de empréstimo",
        variant: "destructive"
      });
      throw err;
    }
  }, [toast]);

  // Submit application to institution
  const submitApplication = useCallback(async (applicationId: string) => {
    try {
      const { error: supabaseError } = await supabase
        .from('loan_applications')
        .update({
          status: 'submitted',
          submitted_at: new Date().toISOString()
        })
        .eq('id', applicationId);
      
      if (supabaseError) throw supabaseError;
      
      // In real implementation, this would also send data to institution's API
      
      toast({
        title: "Aplicação Enviada",
        description: "Aplicação enviada para análise da instituição",
        variant: "default"
      });
      
    } catch (err: unknown) {
      logError('Erro ao enviar aplicação financeira', 'useFinancialIntegration', {
        error: err instanceof Error ? err.message : 'Erro desconhecido'
      });
      toast({
        title: "Erro",
        description: "Falha ao enviar aplicação",
        variant: "destructive"
      });
    }
  }, [toast]);

  // Update application
  const updateApplication = useCallback(async (
    applicationId: string, 
    updates: Partial<LoanApplication>
  ) => {
    try {
      const { error: supabaseError } = await supabase
        .from('loan_applications')
        .update({
          customer_data: updates.customerData,
          project_data: updates.projectData,
          loan_details: updates.loanDetails,
          status: updates.status,
          documents: updates.documents
        })
        .eq('id', applicationId);
      
      if (supabaseError) throw supabaseError;
      
      toast({
        title: "Aplicação Atualizada",
        description: "Dados atualizados com sucesso",
        variant: "default"
      });
      
    } catch (err: unknown) {
      logError('Erro ao atualizar aplicação financeira', {
        error: err instanceof Error ? err.message : 'Erro desconhecido',
        service: 'useFinancialIntegration',
        applicationId
      });
      toast({
        title: "Erro",
        description: "Falha ao atualizar aplicação",
        variant: "destructive"
      });
    }
  }, [toast]);

  // Check application status
  const checkApplicationStatus = useCallback(async (
    applicationId: string
  ): Promise<LoanApplication['status']> => {
    try {
      const { data, error: supabaseError } = await supabase
        .from('loan_applications')
        .select('status')
        .eq('id', applicationId)
        .single();
      
      if (supabaseError) throw supabaseError;
      
      return data.status;
      
    } catch (err: unknown) {
      logError('Erro ao verificar status da aplicação', {
        error: err instanceof Error ? err.message : 'Erro desconhecido',
        service: 'useFinancialIntegration',
        applicationId
      });
      return 'draft';
    }
  }, []);

  // Upload document
  const uploadDocument = useCallback(async (
    applicationId: string, 
    file: File, 
    type: string
  ): Promise<string> => {
    try {
      // Upload file to Supabase Storage
      const fileName = `${applicationId}/${type}/${Date.now()}-${file.name}`;
      
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('loan-documents')
        .upload(fileName, file);
      
      if (uploadError) throw uploadError;
      
      // Get public URL
      const { data: urlData } = supabase.storage
        .from('loan-documents')
        .getPublicUrl(fileName);
      
      // Update application with new document
      const { data: appData, error: appError } = await supabase
        .from('loan_applications')
        .select('documents')
        .eq('id', applicationId)
        .single();
      
      if (appError) throw appError;
      
      const updatedDocuments = [
        ...(appData.documents || []),
        {
          type,
          url: urlData.publicUrl,
          status: 'pending' as const
        }
      ];
      
      const { error: updateError } = await supabase
        .from('loan_applications')
        .update({ documents: updatedDocuments })
        .eq('id', applicationId);
      
      if (updateError) throw updateError;
      
      toast({
        title: "Documento Enviado",
        description: `${type} enviado com sucesso`,
        variant: "default"
      });
      
      return urlData.publicUrl;
      
    } catch (err: unknown) {
      logError('Erro ao enviar documento financeiro', 'useFinancialIntegration', {
        error: err instanceof Error ? err.message : 'Erro desconhecido'
      });
      toast({
        title: "Erro",
        description: "Falha ao enviar documento",
        variant: "destructive"
      });
      throw err;
    }
  }, [toast]);

  // Sync all applications
  const syncAllApplications = useCallback(async () => {
    setIsLoading(true);
    
    try {
      const { data, error: supabaseError } = await supabase
        .from('loan_applications')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (supabaseError) throw supabaseError;
      
      const transformedApplications: LoanApplication[] = data?.map(item => ({
        id: item.id,
        institutionId: item.institution_id,
        customerData: item.customer_data,
        projectData: item.project_data,
        loanDetails: item.loan_details,
        status: item.status,
        submittedAt: item.submitted_at,
        responseAt: item.response_at,
        documents: item.documents || []
      })) || [];
      
      setApplications(transformedApplications);
      
      toast({
        title: "Sincronização Concluída",
        description: `${transformedApplications.length} aplicações sincronizadas`,
        variant: "default"
      });
      
    } catch (err: unknown) {
      logError('Erro na sincronização de aplicações', {
        error: err instanceof Error ? err.message : 'Erro desconhecido',
        service: 'useFinancialIntegration'
      });
      toast({
        title: "Erro",
        description: "Falha na sincronização das aplicações",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  // Export applications
  const exportApplications = useCallback(async (): Promise<Blob> => {
    const exportData = {
      institutions,
      applications,
      exportedAt: new Date().toISOString(),
      version: '1.0'
    };
    
    return new Blob([JSON.stringify(exportData, null, 2)], {
      type: 'application/json'
    });
  }, [institutions, applications]);

  // Load institutions on mount
  useEffect(() => {
    loadInstitutions();
  }, [loadInstitutions]);

  return {
    institutions,
    applications,
    isLoading,
    error,
    
    // Institution management
    loadInstitutions,
    addInstitution,
    updateInstitution,
    removeInstitution,
    testConnection,
    
    // Loan simulation
    simulateLoan,
    
    // Application management
    createApplication,
    submitApplication,
    updateApplication,
    checkApplicationStatus,
    uploadDocument,
    
    // Bulk operations
    syncAllApplications,
    exportApplications
  };
};

export default useFinancialIntegration;