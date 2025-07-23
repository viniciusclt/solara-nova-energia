/**
 * Detector de ambiente para determinar se o sistema está rodando em localhost
 * e se deve usar dados de demonstração
 */
export class EnvironmentDetector {
  /**
   * Verifica se está rodando em localhost
   */
  static isLocalhost(): boolean {
    return window.location.hostname === 'localhost' ||
           window.location.hostname === '127.0.0.1' ||
           window.location.hostname === '0.0.0.0';
  }

  /**
   * Verifica se está em modo de desenvolvimento
   */
  static isDevelopment(): boolean {
    return import.meta.env.DEV;
  }

  /**
   * Determina se deve usar dados de demonstração
   */
  static shouldUseDemoData(): boolean {
    return this.isLocalhost() && this.isDevelopment();
  }

  /**
   * Retorna informações do ambiente atual
   */
  static getEnvironmentInfo() {
    return {
      hostname: window.location.hostname,
      isDevelopment: this.isDevelopment(),
      isLocalhost: this.isLocalhost(),
      shouldUseDemoData: this.shouldUseDemoData(),
      mode: import.meta.env.MODE
    };
  }
}