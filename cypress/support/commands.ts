/// <reference types="cypress" />

// ***********************************************
// This example commands.ts shows you how to
// create various custom commands and overwrite
// existing commands.
//
// For more comprehensive examples of custom
// commands please read more here:
// https://on.cypress.io/custom-commands
// ***********************************************

// Comando para criar um nó no diagrama
Cypress.Commands.add('createDiagramNode', (type: 'rectangle' | 'circle' | 'diamond', x = 100, y = 100) => {
  // Selecionar ferramenta de criação
  cy.get(`[data-testid="tool-${type}"]`).click();
  
  // Clicar na área do canvas para criar o nó
  cy.get('[data-testid="diagram-canvas"]')
    .click(x, y);
  
  // Aguardar criação do nó
  cy.get('[data-testid^="node-"]').should('have.length.at.least', 1);
});

// Comando para conectar dois nós
Cypress.Commands.add('connectNodes', (sourceNodeId: string, targetNodeId: string) => {
  // Selecionar ferramenta de conexão
  cy.get('[data-testid="tool-connection"]').click();
  
  // Clicar no nó de origem
  cy.get(`[data-testid="node-${sourceNodeId}"]`).click();
  
  // Clicar no nó de destino
  cy.get(`[data-testid="node-${targetNodeId}"]`).click();
  
  // Verificar se a conexão foi criada
  cy.get(`[data-testid^="edge-${sourceNodeId}-${targetNodeId}"]`).should('exist');
});

// Comando para editar texto de um nó
Cypress.Commands.add('editNodeText', (nodeId: string, text: string) => {
  // Duplo clique no nó para editar
  cy.get(`[data-testid="node-${nodeId}"]`).dblclick();
  
  // Aguardar campo de edição aparecer
  cy.get(`[data-testid="node-${nodeId}-input"]`)
    .should('be.visible')
    .clear()
    .type(text)
    .type('{enter}');
  
  // Verificar se o texto foi atualizado
  cy.get(`[data-testid="node-${nodeId}"]`).should('contain.text', text);
});

// Comando para selecionar múltiplos nós
Cypress.Commands.add('selectMultipleNodes', (nodeIds: string[]) => {
  // Primeiro nó - clique normal
  cy.get(`[data-testid="node-${nodeIds[0]}"]`).click();
  
  // Demais nós - clique com Ctrl
  nodeIds.slice(1).forEach(nodeId => {
    cy.get(`[data-testid="node-${nodeId}"]`).click({ ctrlKey: true });
  });
  
  // Verificar seleção múltipla
  nodeIds.forEach(nodeId => {
    cy.get(`[data-testid="node-${nodeId}"]`).should('have.class', 'selected');
  });
});

// Comando para mover um nó
Cypress.Commands.add('moveNode', (nodeId: string, deltaX: number, deltaY: number) => {
  cy.get(`[data-testid="node-${nodeId}"]`)
    .trigger('mousedown', { button: 0 })
    .trigger('mousemove', { clientX: deltaX, clientY: deltaY })
    .trigger('mouseup');
});

// Comando para redimensionar um nó
Cypress.Commands.add('resizeNode', (nodeId: string, width: number, height: number) => {
  // Selecionar o nó
  cy.get(`[data-testid="node-${nodeId}"]`).click();
  
  // Usar handle de redimensionamento
  cy.get(`[data-testid="resize-handle-${nodeId}"]`)
    .trigger('mousedown', { button: 0 })
    .trigger('mousemove', { clientX: width, clientY: height })
    .trigger('mouseup');
});

// Comando para exportar diagrama
Cypress.Commands.add('exportDiagram', (format: 'json' | 'png' | 'svg') => {
  // Abrir menu de exportação
  cy.get('[data-testid="export-menu"]').click();
  
  // Selecionar formato
  cy.get(`[data-testid="export-${format}"]`).click();
  
  // Aguardar download (para formatos de arquivo)
  if (format !== 'json') {
    cy.readFile(`cypress/downloads/diagram.${format}`, { timeout: 10000 }).should('exist');
  }
});

// Comando para importar diagrama
Cypress.Commands.add('importDiagram', (filePath: string) => {
  // Abrir menu de importação
  cy.get('[data-testid="import-menu"]').click();
  
  // Selecionar arquivo
  cy.get('[data-testid="file-input"]').selectFile(filePath);
  
  // Aguardar carregamento
  cy.get('[data-testid="diagram-canvas"]').should('contain', '[data-testid^="node-"]');
});

// Comando para testar colaboração
Cypress.Commands.add('simulateCollaboration', (action: 'join' | 'leave' | 'comment', data?: any) => {
  cy.window().then((win) => {
    // Simular evento de WebSocket
    const event = new CustomEvent('websocket-message', {
      detail: {
        type: action,
        data: data || {},
        timestamp: Date.now(),
        userId: 'test-user-' + Math.random().toString(36).substr(2, 9)
      }
    });
    
    win.dispatchEvent(event);
  });
});

// Comando para verificar performance
Cypress.Commands.add('measurePerformance', (action: () => void) => {
  cy.window().then((win) => {
    const startTime = win.performance.now();
    
    action();
    
    cy.then(() => {
      const endTime = win.performance.now();
      const duration = endTime - startTime;
      
      cy.log(`Performance: ${duration.toFixed(2)}ms`);
      
      // Falhar se muito lento (>2s)
      expect(duration).to.be.lessThan(2000);
    });
  });
});

// Comando para aguardar auto-routing
Cypress.Commands.add('waitForAutoRouting', () => {
  // Aguardar indicador de processamento
  cy.get('[data-testid="auto-routing-indicator"]', { timeout: 5000 })
    .should('not.exist');
});

// Comando para verificar acessibilidade de teclado
Cypress.Commands.add('testKeyboardNavigation', () => {
  // Testar navegação por Tab
  cy.get('body').tab();
  cy.focused().should('be.visible');
  
  // Testar teclas de seta para navegação no diagrama
  cy.get('[data-testid="diagram-canvas"]').focus();
  cy.focused().type('{rightarrow}');
  cy.focused().type('{downarrow}');
});

// Comando para limpar diagrama
Cypress.Commands.add('clearDiagram', () => {
  // Selecionar todos os elementos
  cy.get('body').type('{ctrl+a}');
  
  // Deletar seleção
  cy.get('body').type('{del}');
  
  // Verificar se o canvas está vazio
  cy.get('[data-testid="diagram-canvas"]')
    .find('[data-testid^="node-"]')
    .should('not.exist');
});

// Comando para aguardar salvamento automático
Cypress.Commands.add('waitForAutoSave', () => {
  cy.get('[data-testid="save-indicator"]')
    .should('contain.text', 'Salvo')
    .or('not.exist');
});

// Declarações de tipos para TypeScript
declare global {
  namespace Cypress {
    interface Chainable {
      createDiagramNode(type: 'rectangle' | 'circle' | 'diamond', x?: number, y?: number): Chainable<void>;
      connectNodes(sourceNodeId: string, targetNodeId: string): Chainable<void>;
      editNodeText(nodeId: string, text: string): Chainable<void>;
      selectMultipleNodes(nodeIds: string[]): Chainable<void>;
      moveNode(nodeId: string, deltaX: number, deltaY: number): Chainable<void>;
      resizeNode(nodeId: string, width: number, height: number): Chainable<void>;
      exportDiagram(format: 'json' | 'png' | 'svg'): Chainable<void>;
      importDiagram(filePath: string): Chainable<void>;
      simulateCollaboration(action: 'join' | 'leave' | 'comment', data?: any): Chainable<void>;
      measurePerformance(action: () => void): Chainable<void>;
      waitForAutoRouting(): Chainable<void>;
      testKeyboardNavigation(): Chainable<void>;
      clearDiagram(): Chainable<void>;
      waitForAutoSave(): Chainable<void>;
    }
  }
}