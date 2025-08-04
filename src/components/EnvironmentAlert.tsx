/**
 * Componente de Alerta de Ambiente
 * Exibe alertas sobre problemas de configuração de ambiente
 */

import React, { useEffect, useState } from 'react';
import { Alert, AlertDescription, AlertTitle } from './ui/alert';
import { AlertTriangle, CheckCircle, Info } from 'lucide-react';
import { environmentValidator } from '../config/environmentValidator';
import { isDevelopment } from '../config/environment';

interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

const EnvironmentAlert: React.FC = () => {
  const [validation, setValidation] = useState<ValidationResult | null>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Apenas executar em desenvolvimento
    if (!isDevelopment()) {
      return;
    }

    const result = environmentValidator.validateEnvironment();
    setValidation(result);
    
    // Mostrar alerta se houver problemas
    setIsVisible(!result.isValid || result.warnings.length > 0);
  }, []);

  // Não renderizar em produção ou se não há problemas
  if (!isDevelopment() || !isVisible || !validation) {
    return null;
  }

  const handleDismiss = () => {
    setIsVisible(false);
  };

  const getAlertVariant = () => {
    if (validation.errors.length > 0) {
      return 'destructive';
    }
    if (validation.warnings.length > 0) {
      return 'default';
    }
    return 'default';
  };

  const getIcon = () => {
    if (validation.errors.length > 0) {
      return <AlertTriangle className="h-4 w-4" />;
    }
    if (validation.warnings.length > 0) {
      return <Info className="h-4 w-4" />;
    }
    return <CheckCircle className="h-4 w-4" />;
  };

  const getTitle = () => {
    if (validation.errors.length > 0) {
      return 'Problemas de Configuração Detectados';
    }
    if (validation.warnings.length > 0) {
      return 'Configurações Opcionais';
    }
    return 'Configuração OK';
  };

  return (
    <div className="fixed top-4 right-4 z-50 max-w-md">
      <Alert variant={getAlertVariant()} className="relative">
        {getIcon()}
        <AlertTitle className="flex items-center justify-between">
          {getTitle()}
          <button
            onClick={handleDismiss}
            className="ml-2 text-sm opacity-70 hover:opacity-100"
            aria-label="Fechar alerta"
          >
            ✕
          </button>
        </AlertTitle>
        <AlertDescription className="mt-2">
          {validation.errors.length > 0 && (
            <div className="mb-2">
              <strong className="text-red-600">Erros:</strong>
              <ul className="list-disc list-inside mt-1 text-sm">
                {validation.errors.map((error, index) => (
                  <li key={index}>{error}</li>
                ))}
              </ul>
            </div>
          )}
          
          {validation.warnings.length > 0 && (
            <div>
              <strong className="text-blue-600">Configurações Opcionais:</strong>
              <ul className="list-disc list-inside mt-1 text-sm">
                {validation.warnings.map((warning, index) => (
                  <li key={index}>{warning}</li>
                ))}
              </ul>
            </div>
          )}
          
          <div className="mt-3 text-xs text-muted-foreground">
            <p>💡 Essas configurações são opcionais - a aplicação funciona sem elas</p>
            <p>📖 Consulte o arquivo .env.example para mais detalhes</p>
            <p>🔧 Este alerta só aparece em desenvolvimento</p>
          </div>
        </AlertDescription>
      </Alert>
    </div>
  );
};

export default EnvironmentAlert;