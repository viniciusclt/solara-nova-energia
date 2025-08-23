// ***********************************************************
// This example support/component.ts is processed and
// loaded automatically before your component test files.
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

// Import global styles
import '../../src/index.css';

// Import React and mount function
import { mount } from 'cypress/react18';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';

// Augment the Cypress namespace to include type definitions for
// your custom command.
// Alternatively, can be defined in cypress/support/component.d.ts
// with a <reference path="./component" /> at the top of your spec.
declare global {
  namespace Cypress {
    interface Chainable {
      mount: typeof mount;
      mountWithProviders: typeof mountWithProviders;
    }
  }
}

// Função para montar componentes com provedores necessários
function mountWithProviders(
  component: React.ReactElement,
  options: {
    routerProps?: any;
    queryClientOptions?: any;
    initialEntries?: string[];
  } = {}
) {
  const { routerProps = {}, queryClientOptions = {}, initialEntries = ['/'] } = options;
  
  // Criar cliente de query para testes
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        cacheTime: 0,
      },
      mutations: {
        retry: false,
      },
    },
    ...queryClientOptions,
  });
  
  const Wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter {...routerProps}>
        {children}
      </BrowserRouter>
    </QueryClientProvider>
  );
  
  return mount(component, {
    wrapper: Wrapper,
    ...options,
  });
}

// Registrar comandos
Cypress.Commands.add('mount', mount);
Cypress.Commands.add('mountWithProviders', mountWithProviders);

// Configurações globais para testes de componente
beforeEach(() => {
  // Mock de APIs comuns
  cy.intercept('GET', '/api/**', { fixture: 'api-response.json' }).as('apiCall');
  
  // Mock de WebSocket
  cy.window().then((win) => {
    const mockWS = {
      send: cy.stub().as('wsSend'),
      close: cy.stub().as('wsClose'),
      addEventListener: cy.stub().as('wsAddEventListener'),
      removeEventListener: cy.stub().as('wsRemoveEventListener'),
      readyState: 1, // OPEN
    };
    
    win.WebSocket = cy.stub().returns(mockWS).as('WebSocketConstructor');
  });
  
  // Mock de ResizeObserver
  cy.window().then((win) => {
    win.ResizeObserver = cy.stub().callsFake(() => ({
      observe: cy.stub(),
      unobserve: cy.stub(),
      disconnect: cy.stub(),
    }));
  });
  
  // Mock de IntersectionObserver
  cy.window().then((win) => {
    win.IntersectionObserver = cy.stub().callsFake(() => ({
      observe: cy.stub(),
      unobserve: cy.stub(),
      disconnect: cy.stub(),
    }));
  });
  
  // Mock de matchMedia
  cy.window().then((win) => {
    win.matchMedia = cy.stub().callsFake((query) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: cy.stub(),
      removeListener: cy.stub(),
      addEventListener: cy.stub(),
      removeEventListener: cy.stub(),
      dispatchEvent: cy.stub(),
    }));
  });
  
  // Mock de localStorage
  cy.window().then((win) => {
    const localStorageMock = {
      getItem: cy.stub(),
      setItem: cy.stub(),
      removeItem: cy.stub(),
      clear: cy.stub(),
      length: 0,
      key: cy.stub(),
    };
    
    Object.defineProperty(win, 'localStorage', {
      value: localStorageMock,
      writable: true,
    });
  });
  
  // Mock de sessionStorage
  cy.window().then((win) => {
    const sessionStorageMock = {
      getItem: cy.stub(),
      setItem: cy.stub(),
      removeItem: cy.stub(),
      clear: cy.stub(),
      length: 0,
      key: cy.stub(),
    };
    
    Object.defineProperty(win, 'sessionStorage', {
      value: sessionStorageMock,
      writable: true,
    });
  });
});

// Configurações de erro para testes de componente
Cypress.on('uncaught:exception', (err, runnable) => {
  // Ignorar erros específicos que não afetam os testes de componente
  if (err.message.includes('ResizeObserver loop limit exceeded')) {
    return false;
  }
  
  if (err.message.includes('Non-Error promise rejection captured')) {
    return false;
  }
  
  if (err.message.includes('Cannot read properties of undefined')) {
    return false;
  }
  
  // Permitir que outros erros falhem o teste
  return true;
});