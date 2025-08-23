// ***********************************************************
// This example support/e2e.ts is processed and
// loaded automatically before your test files.
//
// This is a great place to put global configuration and
// behavior that modifies Cypress.
//
// You can change the location of this file or turn off
// automatically serving support files with the
// 'supportFile' configuration option.
//
// You can read more here:
// https://on.cypress.io/configuration
// ***********************************************************

// Import commands.js using ES2015 syntax:
import './commands';

// Alternatively you can use CommonJS syntax:
// require('./commands')

// Import Cypress Testing Library commands
import '@testing-library/cypress/add-commands';

// Configurações globais
Cypress.on('uncaught:exception', (err, runnable) => {
  // Ignorar erros específicos que não afetam os testes
  if (err.message.includes('ResizeObserver loop limit exceeded')) {
    return false;
  }
  
  if (err.message.includes('Non-Error promise rejection captured')) {
    return false;
  }
  
  // Permitir que outros erros falhem o teste
  return true;
});

// Configurações de viewport responsivo
Cypress.Commands.add('setViewport', (device: 'mobile' | 'tablet' | 'desktop') => {
  const viewports = {
    mobile: [375, 667],
    tablet: [768, 1024],
    desktop: [1280, 720],
  };
  
  const [width, height] = viewports[device];
  cy.viewport(width, height);
});

// Comando para aguardar carregamento da aplicação
Cypress.Commands.add('waitForApp', () => {
  cy.get('[data-testid="app-loaded"]', { timeout: 10000 }).should('exist');
});

// Comando para limpar dados locais
Cypress.Commands.add('clearAppData', () => {
  cy.clearLocalStorage();
  cy.clearCookies();
  cy.window().then((win) => {
    win.sessionStorage.clear();
  });
});

// Comando para mock de WebSocket
Cypress.Commands.add('mockWebSocket', () => {
  cy.window().then((win) => {
    // Mock WebSocket para testes de colaboração
    const mockWS = {
      send: cy.stub(),
      close: cy.stub(),
      addEventListener: cy.stub(),
      removeEventListener: cy.stub(),
      readyState: 1, // OPEN
    };
    
    win.WebSocket = cy.stub().returns(mockWS);
  });
});

// Comando para aguardar elemento ser visível
Cypress.Commands.add('waitForVisible', (selector: string, timeout = 5000) => {
  cy.get(selector, { timeout }).should('be.visible');
});

// Comando para drag and drop
Cypress.Commands.add('dragAndDrop', (sourceSelector: string, targetSelector: string) => {
  cy.get(sourceSelector).trigger('mousedown', { button: 0 });
  cy.get(targetSelector).trigger('mousemove').trigger('mouseup');
});

// Comando para aguardar animações
Cypress.Commands.add('waitForAnimations', () => {
  cy.wait(300); // Aguardar animações CSS
});

// Comando para verificar acessibilidade básica
Cypress.Commands.add('checkA11y', (selector?: string) => {
  const target = selector || 'body';
  
  cy.get(target).within(() => {
    // Verificar se elementos interativos têm labels
    cy.get('button, input, select, textarea').each(($el) => {
      const hasLabel = $el.attr('aria-label') || 
                      $el.attr('aria-labelledby') || 
                      $el.attr('title') ||
                      $el.closest('label').length > 0;
      
      if (!hasLabel) {
        cy.log(`Elemento sem label acessível: ${$el.prop('tagName')}`);
      }
    });
    
    // Verificar se imagens têm alt text
    cy.get('img').each(($img) => {
      const hasAlt = $img.attr('alt') !== undefined;
      if (!hasAlt) {
        cy.log(`Imagem sem alt text: ${$img.attr('src')}`);
      }
    });
  });
});

// Configurações de beforeEach globais
beforeEach(() => {
  // Interceptar chamadas de API comuns
  cy.intercept('GET', '/api/health', { statusCode: 200, body: { status: 'ok' } });
  
  // Configurar viewport padrão
  cy.viewport(1280, 720);
  
  // Visitar página inicial
  cy.visit('/');
  
  // Aguardar carregamento da aplicação
  cy.waitForApp();
});

// Declarações de tipos para TypeScript
declare global {
  namespace Cypress {
    interface Chainable {
      setViewport(device: 'mobile' | 'tablet' | 'desktop'): Chainable<void>;
      waitForApp(): Chainable<void>;
      clearAppData(): Chainable<void>;
      mockWebSocket(): Chainable<void>;
      waitForVisible(selector: string, timeout?: number): Chainable<void>;
      dragAndDrop(sourceSelector: string, targetSelector: string): Chainable<void>;
      waitForAnimations(): Chainable<void>;
      checkA11y(selector?: string): Chainable<void>;
    }
  }
}