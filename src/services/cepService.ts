/**
 * Serviço para busca de endereços por CEP usando a API ViaCEP
 */

export interface CEPData {
  cep: string;
  logradouro: string;
  complemento: string;
  bairro: string;
  localidade: string;
  uf: string;
  ibge: string;
  gia: string;
  ddd: string;
  siafi: string;
  erro?: boolean;
}

export interface AddressData {
  street: string;
  neighborhood: string;
  city: string;
  state: string;
  cep: string;
}

class CEPService {
  private readonly baseURL = 'https://viacep.com.br/ws';
  private readonly timeout = 5000; // 5 segundos

  /**
   * Busca endereço por CEP
   * @param cep - CEP no formato 00000-000 ou 00000000
   * @returns Promise com dados do endereço ou null se não encontrado
   */
  async searchByCEP(cep: string): Promise<AddressData | null> {
    try {
      // Limpar e validar CEP
      const cleanCEP = this.cleanCEP(cep);
      if (!this.isValidCEP(cleanCEP)) {
        throw new Error('CEP inválido');
      }

      // Fazer requisição para ViaCEP
      const response = await this.fetchWithTimeout(
        `${this.baseURL}/${cleanCEP}/json/`,
        this.timeout
      );

      if (!response.ok) {
        throw new Error(`Erro na requisição: ${response.status}`);
      }

      const data: CEPData = await response.json();

      // Verificar se CEP foi encontrado
      if (data.erro) {
        return null;
      }

      // Converter para formato interno
      return this.convertToAddressData(data);
    } catch (error) {
      console.error('Erro ao buscar CEP:', error);
      throw error;
    }
  }

  /**
   * Busca múltiplos CEPs de forma assíncrona
   * @param ceps - Array de CEPs
   * @returns Promise com array de resultados
   */
  async searchMultipleCEPs(ceps: string[]): Promise<(AddressData | null)[]> {
    const promises = ceps.map(cep => 
      this.searchByCEP(cep).catch(() => null)
    );
    
    return Promise.all(promises);
  }

  /**
   * Limpa formatação do CEP
   * @param cep - CEP com ou sem formatação
   * @returns CEP apenas com números
   */
  private cleanCEP(cep: string): string {
    return cep.replace(/\D/g, '');
  }

  /**
   * Valida formato do CEP
   * @param cep - CEP limpo (apenas números)
   * @returns true se válido
   */
  private isValidCEP(cep: string): boolean {
    return /^[0-9]{8}$/.test(cep);
  }

  /**
   * Converte dados da API ViaCEP para formato interno
   * @param data - Dados da API ViaCEP
   * @returns Dados formatados
   */
  private convertToAddressData(data: CEPData): AddressData {
    return {
      street: data.logradouro || '',
      neighborhood: data.bairro || '',
      city: data.localidade || '',
      state: data.uf || '',
      cep: this.formatCEP(data.cep)
    };
  }

  /**
   * Formata CEP para exibição (00000-000)
   * @param cep - CEP sem formatação
   * @returns CEP formatado
   */
  private formatCEP(cep: string): string {
    const cleanCEP = this.cleanCEP(cep);
    return cleanCEP.replace(/^(\d{5})(\d{3})$/, '$1-$2');
  }

  /**
   * Fetch com timeout
   * @param url - URL da requisição
   * @param timeout - Timeout em milissegundos
   * @returns Promise da resposta
   */
  private async fetchWithTimeout(url: string, timeout: number): Promise<Response> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
      const response = await fetch(url, {
        signal: controller.signal,
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        }
      });
      
      clearTimeout(timeoutId);
      return response;
    } catch (error) {
      clearTimeout(timeoutId);
      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error('Timeout na busca do CEP');
      }
      throw error;
    }
  }

  /**
   * Valida se o endereço retornado está completo
   * @param address - Dados do endereço
   * @returns true se endereço está completo
   */
  isCompleteAddress(address: AddressData): boolean {
    return !!(
      address.street && 
      address.neighborhood && 
      address.city && 
      address.state
    );
  }

  /**
   * Gera sugestões de CEP baseado em endereço parcial
   * Nota: ViaCEP não suporta busca reversa, mas podemos implementar
   * uma lógica básica de sugestões baseada em padrões conhecidos
   */
  generateCEPSuggestions(partialAddress: Partial<AddressData>): string[] {
    // Esta é uma implementação básica
    // Em um cenário real, você poderia usar uma base de dados local
    // ou integrar com outros serviços que oferecem busca reversa
    const suggestions: string[] = [];
    
    // Exemplos de CEPs conhecidos por estado (implementação básica)
    const stateCEPRanges: Record<string, string[]> = {
      'RJ': ['20000-000', '28000-000'],
      'SP': ['01000-000', '19000-000'],
      'MG': ['30000-000', '39000-000'],
      'ES': ['29000-000', '29999-999']
    };

    if (partialAddress.state && stateCEPRanges[partialAddress.state]) {
      suggestions.push(...stateCEPRanges[partialAddress.state]);
    }

    return suggestions;
  }
}

// Exportar instância singleton
export const cepService = new CEPService();

// Exportar classe para testes
export { CEPService };