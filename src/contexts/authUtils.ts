// Constantes e utilitários para autenticação

export const PERMISSIONS = {
  vendedor: ['view_leads', 'generate_proposals', 'view_sales_dashboard'],
  engenheiro: ['technical_simulations', 'edit_kits', 'view_climate_data', 'view_leads', 'generate_proposals'],
  admin: ['manage_employees', 'view_reports', 'approve_budgets', 'view_leads', 'generate_proposals', 'technical_simulations'],
  super_admin: ['all']
};

export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;
  return emailRegex.test(email);
};

export const validatePassword = (password: string): { isValid: boolean; message?: string } => {
  if (password.length < 6) {
    return { isValid: false, message: 'A senha deve ter pelo menos 6 caracteres' };
  }
  return { isValid: true };
};

export const sanitizeEmail = (email: string): string => {
  return email.toLowerCase().trim();
};