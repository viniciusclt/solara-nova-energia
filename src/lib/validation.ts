// Security validation utility functions

export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;
  return emailRegex.test(email);
};

export const validatePassword = (password: string): { isValid: boolean; message?: string } => {
  if (password.length < 8) {
    return { isValid: false, message: 'Senha deve ter pelo menos 8 caracteres' };
  }
  
  if (!/(?=.*[a-z])/.test(password)) {
    return { isValid: false, message: 'Senha deve conter pelo menos uma letra minúscula' };
  }
  
  if (!/(?=.*[A-Z])/.test(password)) {
    return { isValid: false, message: 'Senha deve conter pelo menos uma letra maiúscula' };
  }
  
  if (!/(?=.*\d)/.test(password)) {
    return { isValid: false, message: 'Senha deve conter pelo menos um número' };
  }
  
  return { isValid: true };
};

export const validateCNPJ = (cnpj: string): boolean => {
  // Remove non-numeric characters
  const cleanCNPJ = cnpj.replace(/[^0-9]/g, '');
  
  // Check length
  if (cleanCNPJ.length !== 14) {
    return false;
  }
  
  // Check for known invalid patterns
  const invalidPatterns = [
    '00000000000000', '11111111111111', '22222222222222',
    '33333333333333', '44444444444444', '55555555555555',
    '66666666666666', '77777777777777', '88888888888888',
    '99999999999999'
  ];
  
  if (invalidPatterns.includes(cleanCNPJ)) {
    return false;
  }
  
  // Basic CNPJ algorithm validation
  let sum = 0;
  let pos = 5;
  
  // First check digit
  for (let i = 0; i < 12; i++) {
    sum += parseInt(cleanCNPJ.charAt(i)) * pos--;
    if (pos < 2) pos = 9;
  }
  
  let checkDigit1 = sum % 11 < 2 ? 0 : 11 - (sum % 11);
  if (parseInt(cleanCNPJ.charAt(12)) !== checkDigit1) {
    return false;
  }
  
  // Second check digit
  sum = 0;
  pos = 6;
  for (let i = 0; i < 13; i++) {
    sum += parseInt(cleanCNPJ.charAt(i)) * pos--;
    if (pos < 2) pos = 9;
  }
  
  let checkDigit2 = sum % 11 < 2 ? 0 : 11 - (sum % 11);
  return parseInt(cleanCNPJ.charAt(13)) === checkDigit2;
};

export const sanitizeInput = (input: string): string => {
  // Remove potential XSS characters
  return input
    .replace(/[<>'"&]/g, '')
    .trim()
    .substring(0, 500); // Limit length
};

export const validateName = (name: string): { isValid: boolean; message?: string } => {
  const sanitized = sanitizeInput(name);
  
  if (sanitized.length < 2) {
    return { isValid: false, message: 'Nome deve ter pelo menos 2 caracteres' };
  }
  
  if (sanitized.length > 100) {
    return { isValid: false, message: 'Nome muito longo' };
  }
  
  if (!/^[a-zA-ZÀ-ÿ\s]+$/.test(sanitized)) {
    return { isValid: false, message: 'Nome deve conter apenas letras e espaços' };
  }
  
  return { isValid: true };
};

export const validateCompanyName = (name: string): { isValid: boolean; message?: string } => {
  const sanitized = sanitizeInput(name);
  
  if (sanitized.length < 2) {
    return { isValid: false, message: 'Nome da empresa deve ter pelo menos 2 caracteres' };
  }
  
  if (sanitized.length > 200) {
    return { isValid: false, message: 'Nome da empresa muito longo' };
  }
  
  return { isValid: true };
};