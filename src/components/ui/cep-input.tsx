import { useState, useEffect, forwardRef } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, MapPin, Loader2, CheckCircle, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { useCEP } from "@/hooks/useCEP";
import { AddressData } from "@/services/cepService";

interface CEPInputProps {
  value: string;
  onChange: (value: string) => void;
  onAddressFound?: (address: AddressData) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  autoSearch?: boolean;
  showSearchButton?: boolean;
}

export const CEPInput = forwardRef<HTMLInputElement, CEPInputProps>(
  ({ 
    value, 
    onChange, 
    onAddressFound,
    placeholder = "00000-000",
    className,
    disabled = false,
    autoSearch = true,
    showSearchButton = true,
    ...props 
  }, ref) => {
    const { searchCEP, isLoading, error, clearError } = useCEP();
    const [searchTimeout, setSearchTimeout] = useState<NodeJS.Timeout | null>(null);
    const [lastFoundAddress, setLastFoundAddress] = useState<AddressData | null>(null);

    // Formatar CEP conforme o usuário digita
    const formatCEP = (cep: string | undefined): string => {
      if (!cep || typeof cep !== 'string') return '';
      const numbers = cep.replace(/\D/g, '');
      if (numbers.length <= 5) {
        return numbers;
      }
      return `${numbers.slice(0, 5)}-${numbers.slice(5, 8)}`;
    };

    // Limpar CEP (apenas números)
    const cleanCEP = (cep: string | undefined): string => {
      if (!cep || typeof cep !== 'string') return '';
      return cep.replace(/\D/g, '');
    };

    // Handler para mudança no input
    const handleInputChange = (inputValue: string) => {
      const formatted = formatCEP(inputValue);
      onChange(formatted);
      clearError();

      // Auto search se habilitado
      if (autoSearch) {
        handleAutoSearch(formatted);
      }
    };

    // Busca automática com debounce
    const handleAutoSearch = (cep: string) => {
      // Limpar timeout anterior
      if (searchTimeout) {
        clearTimeout(searchTimeout);
      }

      const cleanedCEP = cleanCEP(cep);
      
      // Só buscar se CEP estiver completo (8 dígitos)
      if (cleanedCEP.length === 8) {
        const timeout = setTimeout(() => {
          performSearch(cep);
        }, 800); // 800ms de debounce

        setSearchTimeout(timeout);
      }
    };

    // Busca manual (botão)
    const handleManualSearch = () => {
      if (value) {
        performSearch(value);
      }
    };

    // Executar busca
    const performSearch = async (cep: string) => {
      try {
        const result = await searchCEP(cep);
        if (result) {
          setLastFoundAddress(result);
          if (onAddressFound) {
            onAddressFound(result);
          }
        } else {
          setLastFoundAddress(null);
        }
      } catch (error) {
        setLastFoundAddress(null);
      }
    };

    // Cleanup do timeout
    useEffect(() => {
      return () => {
        if (searchTimeout) {
          clearTimeout(searchTimeout);
        }
      };
    }, [searchTimeout]);

    // Determinar ícone de status
    const getStatusIcon = () => {
      if (isLoading) {
        return <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />;
      }
      
      if (error) {
        return <AlertCircle className="h-4 w-4 text-destructive" />;
      }
      
      if (lastFoundAddress && cleanCEP(value).length === 8) {
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      }
      
      return <MapPin className="h-4 w-4 text-muted-foreground" />;
    };

    // Determinar cor da borda
    const getBorderColor = () => {
      if (error) return "border-destructive";
      if (lastFoundAddress && cleanCEP(value).length === 8) return "border-green-500";
      return "";
    };

    return (
      <div className="relative">
        <div className="relative">
          <Input
            ref={ref}
            type="text"
            value={value}
            onChange={(e) => handleInputChange(e.target.value)}
            placeholder={placeholder}
            className={cn(
              "pl-10 pr-12",
              getBorderColor(),
              className
            )}
            disabled={disabled}
            maxLength={9} // 00000-000
            aria-label="Campo de CEP com busca automática de endereço"
            {...props}
          />
          
          {/* Ícone de status */}
          <div className="absolute left-3 top-1/2 -translate-y-1/2">
            {getStatusIcon()}
          </div>

          {/* Botão de busca manual */}
          {showSearchButton && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8 p-0"
              onClick={handleManualSearch}
              disabled={disabled || isLoading || cleanCEP(value).length !== 8}
            >
              <Search className="h-4 w-4" />
            </Button>
          )}
        </div>

        {/* Informações do endereço encontrado */}
        {lastFoundAddress && cleanCEP(value).length === 8 && (
          <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded-md">
            <div className="flex items-center gap-2 text-sm text-green-700">
              <CheckCircle className="h-4 w-4" />
              <span className="font-medium">Endereço encontrado:</span>
            </div>
            <div className="text-sm text-green-600 mt-1">
              {lastFoundAddress.street && (
                <div>{lastFoundAddress.street}</div>
              )}
              <div>
                {lastFoundAddress.neighborhood}, {lastFoundAddress.city} - {lastFoundAddress.state}
              </div>
            </div>
          </div>
        )}

        {/* Mensagem de erro */}
        {error && (
          <div className="mt-2 p-2 bg-destructive/10 border border-destructive/20 rounded-md">
            <div className="flex items-center gap-2 text-sm text-destructive">
              <AlertCircle className="h-4 w-4" />
              <span>{error}</span>
            </div>
          </div>
        )}
      </div>
    );
  }
);

CEPInput.displayName = "CEPInput";