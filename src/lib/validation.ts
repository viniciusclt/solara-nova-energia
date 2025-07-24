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
  
  const checkDigit1 = sum % 11 < 2 ? 0 : 11 - (sum % 11);
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
  
  const checkDigit2 = sum % 11 < 2 ? 0 : 11 - (sum % 11);
  return parseInt(cleanCNPJ.charAt(13)) === checkDigit2;
};

export const sanitizeInput = (input: string): string => {
  // Remove potential XSS characters and limit length
  return input
    .replace(/[<>'"&`]/g, '')
    .replace(/javascript:/gi, '')
    .replace(/on\w+=/gi, '')
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

// Enhanced security validations

export const validatePhone = (phone: string): { isValid: boolean; message?: string } => {
  // Remove non-numeric characters
  const cleanPhone = phone.replace(/[^0-9]/g, '');
  
  // Brazilian phone validation - allow 10 or 11 digits
  if (cleanPhone.length < 10 || cleanPhone.length > 11) {
    return { isValid: false, message: 'Telefone deve ter 10 ou 11 dígitos' };
  }
  
  // Basic validation for mobile numbers (11 digits) and landlines (10 digits)
  if (cleanPhone.length === 11 && cleanPhone.charAt(2) !== '9') {
    return { isValid: false, message: 'Número de celular deve começar com 9 após o DDD' };
  }
  
  return { isValid: true };
};

export const validateDate = (date: string): { isValid: boolean; message?: string } => {
  if (!date) {
    return { isValid: false, message: 'Data é obrigatória' };
  }
  
  const dateObj = new Date(date);
  const now = new Date();
  
  if (isNaN(dateObj.getTime())) {
    return { isValid: false, message: 'Data inválida' };
  }
  
  // Check if date is not in the future (for birth dates)
  if (dateObj > now) {
    return { isValid: false, message: 'Data não pode ser no futuro' };
  }
  
  // Check if person is at least 18 years old
  const eighteenYearsAgo = new Date();
  eighteenYearsAgo.setFullYear(now.getFullYear() - 18);
  
  if (dateObj > eighteenYearsAgo) {
    return { isValid: false, message: 'Pessoa deve ter pelo menos 18 anos' };
  }
  
  return { isValid: true };
};

export const validateNumericRange = (value: number, min: number, max: number, fieldName: string): { isValid: boolean; message?: string } => {
  if (isNaN(value)) {
    return { isValid: false, message: `${fieldName} deve ser um número válido` };
  }
  
  if (value < min || value > max) {
    return { isValid: false, message: `${fieldName} deve estar entre ${min} e ${max}` };
  }
  
  return { isValid: true };
};

export const validateCEP = (cep: string): { isValid: boolean; message?: string } => {
  const cleanCEP = cep.replace(/[^0-9]/g, '');
  
  if (cleanCEP.length !== 8) {
    return { isValid: false, message: 'CEP deve ter 8 dígitos' };
  }
  
  // Basic validation - check if it's not all zeros or all the same digit
  if (/^0{8}$/.test(cleanCEP) || /^(\d)\1{7}$/.test(cleanCEP)) {
    return { isValid: false, message: 'CEP inválido' };
  }
  
  return { isValid: true };
};

export const validateAddress = (address: string): { isValid: boolean; message?: string } => {
  const sanitized = sanitizeInput(address);
  
  if (sanitized.length < 5) {
    return { isValid: false, message: 'Endereço deve ter pelo menos 5 caracteres' };
  }
  
  if (sanitized.length > 200) {
    return { isValid: false, message: 'Endereço muito longo' };
  }
  
  return { isValid: true };
};

// Rate limiting helper
export const checkRateLimit = (key: string, maxAttempts: number = 5, windowMs: number = 600000): boolean => {
  const now = Date.now();
  const attempts = JSON.parse(localStorage.getItem(`rate_limit_${key}`) || '[]') as number[];
  
  // Remove old attempts outside the window
  const recentAttempts = attempts.filter(timestamp => now - timestamp < windowMs);
  
  if (recentAttempts.length >= maxAttempts) {
    return false; // Rate limited
  }
  
  // Add current attempt and save
  recentAttempts.push(now);
  localStorage.setItem(`rate_limit_${key}`, JSON.stringify(recentAttempts));
  
  return true; // Not rate limited
};