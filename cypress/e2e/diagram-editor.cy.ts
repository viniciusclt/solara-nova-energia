/**
 * Testes E2E para o Editor de Diagramas
 * 
 * Testa fluxos completos de criação, edição e colaboração
 * em diagramas usando Cypress
 */

describe('Editor de Diagramas', () => {
  beforeEach(() => {
    // Visitar a página do editor de diagramas
    cy.visit('/playbooks/diagrams/new');
    
    // Aguardar carregamento completo
    cy.get('[data-testid="diagram-canvas"]').should('be.visible');
    cy.get('[data-testid="toolbar"]').should('be.visible');
  });

  describe('Criação de Diagramas', () => {
    it('deve criar um novo diagrama vazio', () => {
      // Verificar elementos iniciais
      cy.get('[data-testid="diagram-canvas"]').should('be.empty');
      cy.get('[data-testid="node-count"]').should('contain', '0');
      cy.get('[data-testid="connection-count"]').should('contain', '0');
    });

    it('deve adicionar nó retangular ao canvas', () => {
      // Selecionar ferramenta de retângulo
      cy.get('[data-testid="tool-rectangle"]').click();
      
      // Clicar no canvas para adicionar nó
      cy.get('[data-testid="diagram-canvas"]')
        .click(200, 150);
      
      // Verificar se nó foi criado
      cy.get('[data-testid^="node-"]').should('have.length', 1);
      cy.get('[data-testid="node-count"]').should('contain', '1');
      
      // Verificar propriedades do nó
      cy.get('[data-testid^="node-"]')
        .should('have.attr', 'data-type', 'rectangle')
        .and('be.visible');
    });

    it('deve adicionar nó circular ao canvas', () => {
      // Selecionar ferramenta de círculo
      cy.get('[data-testid="tool-circle"]').click();
      
      // Clicar no canvas
      cy.get('[data-testid="diagram-canvas"]')
        .click(300, 200);
      
      // Verificar criação
      cy.get('[data-testid^="node-"]')
        .should('have.length', 1)
        .and('have.attr', 'data-type', 'circle');
    });

    it('deve adicionar múltiplos nós de tipos diferentes', () => {
      // Adicionar retângulo
      cy.get('[data-testid="tool-rectangle"]').click();
      cy.get('[data-testid="diagram-canvas"]').click(150, 100);
      
      // Adicionar círculo
      cy.get('[data-testid="tool-circle"]').click();
      cy.get('[data-testid="diagram-canvas"]').click(350, 100);
      
      // Adicionar losango
      cy.get('[data-testid="tool-diamond"]').click();
      cy.get('[data-testid="diagram-canvas"]').click(250, 250);
      
      // Verificar contagem
      cy.get('[data-testid^="node-"]').should('have.length', 3);
      cy.get('[data-testid="node-count"]').should('contain', '3');
    });
  });

  describe('Edição de Nós', () => {
    beforeEach(() => {
      // Criar nó para testes
      cy.get('[data-testid="tool-rectangle"]').click();
      cy.get('[data-testid="diagram-canvas"]').click(200, 150);
    });

    it('deve selecionar nó ao clicar', () => {
      cy.get('[data-testid^="node-"]').click();
      
      // Verificar seleção visual
      cy.get('[data-testid^="node-"]')
        .should('have.class', 'selected');
      
      // Verificar painel de propriedades
      cy.get('[data-testid="properties-panel"]')
        .should('be.visible');
    });

    it('deve editar texto do nó', () => {
      // Selecionar nó
      cy.get('[data-testid^="node-"]').click();
      
      // Duplo clique para editar
      cy.get('[data-testid^="node-"]').dblclick();
      
      // Editar texto
      cy.get('[data-testid="node-text-input"]')
        .clear()
        .type('Novo Texto{enter}');
      
      // Verificar mudança
      cy.get('[data-testid^="node-"]')
        .should('contain', 'Novo Texto');
    });

    it('deve mover nó com drag and drop', () => {
      const initialPosition = { x: 200, y: 150 };
      const newPosition = { x: 300, y: 250 };
      
      // Arrastar nó
      cy.get('[data-testid^="node-"]')
        .trigger('mousedown', { which: 1 })
        .trigger('mousemove', { 
          clientX: newPosition.x, 
          clientY: newPosition.y 
        })
        .trigger('mouseup');
      
      // Verificar nova posição
      cy.get('[data-testid^="node-"]')
        .should('have.attr', 'data-x')
        .and('not.equal', initialPosition.x.toString());
    });

    it('deve redimensionar nó', () => {
      // Selecionar nó
      cy.get('[data-testid^="node-"]').click();
      
      // Arrastar handle de redimensionamento
      cy.get('[data-testid="resize-handle-se"]')
        .trigger('mousedown', { which: 1 })
        .trigger('mousemove', { clientX: 50, clientY: 50 })
        .trigger('mouseup');
      
      // Verificar mudança de tamanho
      cy.get('[data-testid^="node-"]')
        .should('have.attr', 'data-width')
        .and('not.equal', '120'); // Tamanho padrão
    });

    it('deve alterar cor do nó', () => {
      // Selecionar nó
      cy.get('[data-testid^="node-"]').click();
      
      // Abrir seletor de cor
      cy.get('[data-testid="color-picker"]').click();
      
      // Selecionar cor vermelha
      cy.get('[data-testid="color-red"]').click();
      
      // Verificar mudança
      cy.get('[data-testid^="node-"]')
        .should('have.css', 'background-color')
        .and('include', 'rgb(239, 68, 68)'); // Tailwind red-500
    });

    it('deve deletar nó selecionado', () => {
      // Selecionar nó
      cy.get('[data-testid^="node-"]').click();
      
      // Pressionar Delete
      cy.get('body').type('{del}');
      
      // Verificar remoção
      cy.get('[data-testid^="node-"]').should('not.exist');
      cy.get('[data-testid="node-count"]').should('contain', '0');
    });
  });

  describe('Conexões entre Nós', () => {
    beforeEach(() => {
      // Criar dois nós para conectar
      cy.get('[data-testid="tool-rectangle"]').click();
      cy.get('[data-testid="diagram-canvas"]').click(150, 100);
      cy.get('[data-testid="diagram-canvas"]').click(350, 200);
    });

    it('deve criar conexão entre dois nós', () => {
      // Selecionar ferramenta de conexão
      cy.get('[data-testid="tool-connection"]').click();
      
      // Conectar nós
      cy.get('[data-testid^="node-"]').first().click();
      cy.get('[data-testid^="node-"]').last().click();
      
      // Verificar conexão criada
      cy.get('[data-testid^="connection-"]').should('have.length', 1);
      cy.get('[data-testid="connection-count"]').should('contain', '1');
    });

    it('deve criar conexão arrastando de um nó para outro', () => {
      // Arrastar do primeiro nó para o segundo
      cy.get('[data-testid^="node-"]').first()
        .trigger('mousedown', { which: 1, shiftKey: true })
        .trigger('mousemove', { clientX: 350, clientY: 200 })
        .trigger('mouseup');
      
      // Verificar conexão
      cy.get('[data-testid^="connection-"]').should('exist');
    });

    it('deve alterar tipo de conexão', () => {
      // Criar conexão
      cy.get('[data-testid="tool-connection"]').click();
      cy.get('[data-testid^="node-"]').first().click();
      cy.get('[data-testid^="node-"]').last().click();
      
      // Selecionar conexão
      cy.get('[data-testid^="connection-"]').click();
      
      // Alterar para curva
      cy.get('[data-testid="connection-type-curved"]').click();
      
      // Verificar mudança
      cy.get('[data-testid^="connection-"]')
        .should('have.attr', 'data-type', 'curved');
    });

    it('deve deletar conexão', () => {
      // Criar conexão
      cy.get('[data-testid="tool-connection"]').click();
      cy.get('[data-testid^="node-"]').first().click();
      cy.get('[data-testid^="node-"]').last().click();
      
      // Selecionar e deletar
      cy.get('[data-testid^="connection-"]').click();
      cy.get('body').type('{del}');
      
      // Verificar remoção
      cy.get('[data-testid^="connection-"]').should('not.exist');
      cy.get('[data-testid="connection-count"]').should('contain', '0');
    });
  });

  describe('Auto-routing', () => {
    beforeEach(() => {
      // Criar cenário com obstáculo
      cy.get('[data-testid="tool-rectangle"]').click();
      cy.get('[data-testid="diagram-canvas"]').click(100, 100); // Nó origem
      cy.get('[data-testid="diagram-canvas"]').click(400, 100); // Nó destino
      cy.get('[data-testid="diagram-canvas"]').click(250, 100); // Obstáculo
    });

    it('deve calcular rota automática evitando obstáculos', () => {
      // Habilitar auto-routing
      cy.get('[data-testid="auto-routing-toggle"]').click();
      
      // Conectar primeiro e último nó
      cy.get('[data-testid="tool-connection"]').click();
      cy.get('[data-testid^="node-"]').first().click();
      cy.get('[data-testid^="node-"]').last().click();
      
      // Verificar que a conexão contorna o obstáculo
      cy.get('[data-testid^="connection-"]')
        .should('have.attr', 'data-auto-routed', 'true');
      
      // Verificar múltiplos pontos na rota
      cy.get('[data-testid^="connection-"] path')
        .should('have.attr', 'd')
        .and('include', 'L'); // Comando de linha, indicando múltiplos pontos
    });

    it('deve recalcular rota quando obstáculo é movido', () => {
      // Habilitar auto-routing e criar conexão
      cy.get('[data-testid="auto-routing-toggle"]').click();
      cy.get('[data-testid="tool-connection"]').click();
      cy.get('[data-testid^="node-"]').first().click();
      cy.get('[data-testid^="node-"]').last().click();
      
      // Mover obstáculo
      cy.get('[data-testid^="node-"]').eq(2)
        .trigger('mousedown', { which: 1 })
        .trigger('mousemove', { clientX: 250, clientY: 200 })
        .trigger('mouseup');
      
      // Verificar que a rota foi recalculada
      cy.get('[data-testid^="connection-"]')
        .should('have.attr', 'data-route-updated', 'true');
    });
  });

  describe('Colaboração em Tempo Real', () => {
    it('deve mostrar painel de colaboração', () => {
      // Abrir painel de colaboração
      cy.get('[data-testid="collaboration-toggle"]').click();
      
      // Verificar elementos do painel
      cy.get('[data-testid="collaboration-panel"]').should('be.visible');
      cy.get('[data-testid="user-list"]').should('be.visible');
      cy.get('[data-testid="comments-section"]').should('be.visible');
    });

    it('deve adicionar comentário ao diagrama', () => {
      // Abrir painel de colaboração
      cy.get('[data-testid="collaboration-toggle"]').click();
      
      // Clicar no canvas para adicionar comentário
      cy.get('[data-testid="diagram-canvas"]')
        .rightclick(200, 150);
      
      // Selecionar "Adicionar Comentário"
      cy.get('[data-testid="add-comment"]').click();
      
      // Escrever comentário
      cy.get('[data-testid="comment-input"]')
        .type('Este é um comentário de teste');
      
      // Salvar comentário
      cy.get('[data-testid="save-comment"]').click();
      
      // Verificar comentário criado
      cy.get('[data-testid^="comment-"]').should('be.visible');
      cy.get('[data-testid="comments-count"]').should('contain', '1');
    });

    it('deve simular cursor de outro usuário', () => {
      // Simular conexão de colaboração
      cy.window().then((win) => {
        win.dispatchEvent(new CustomEvent('collaboration:user-joined', {
          detail: {
            userId: 'user-2',
            name: 'Usuário Teste',
            cursor: { x: 300, y: 200 }
          }
        }));
      });
      
      // Verificar cursor do outro usuário
      cy.get('[data-testid="user-cursor-user-2"]')
        .should('be.visible')
        .and('have.css', 'left', '300px')
        .and('have.css', 'top', '200px');
    });
  });

  describe('Exportação e Importação', () => {
    beforeEach(() => {
      // Criar diagrama simples
      cy.get('[data-testid="tool-rectangle"]').click();
      cy.get('[data-testid="diagram-canvas"]').click(200, 150);
    });

    it('deve exportar diagrama como JSON', () => {
      // Abrir menu de exportação
      cy.get('[data-testid="export-menu"]').click();
      
      // Selecionar JSON
      cy.get('[data-testid="export-json"]').click();
      
      // Verificar download
      cy.readFile('cypress/downloads/diagram.json').should('exist');
    });

    it('deve exportar diagrama como PNG', () => {
      // Abrir menu de exportação
      cy.get('[data-testid="export-menu"]').click();
      
      // Selecionar PNG
      cy.get('[data-testid="export-png"]').click();
      
      // Verificar download
      cy.readFile('cypress/downloads/diagram.png').should('exist');
    });

    it('deve importar diagrama de arquivo JSON', () => {
      // Preparar arquivo de teste
      const diagramData = {
        nodes: [
          {
            id: 'imported-node',
            type: 'circle',
            position: { x: 300, y: 200 },
            data: { label: 'Nó Importado' }
          }
        ],
        connections: []
      };
      
      cy.writeFile('cypress/fixtures/test-diagram.json', diagramData);
      
      // Importar arquivo
      cy.get('[data-testid="import-button"]').click();
      cy.get('[data-testid="file-input"]')
        .selectFile('cypress/fixtures/test-diagram.json');
      
      // Verificar importação
      cy.get('[data-testid="node-imported-node"]')
        .should('be.visible')
        .and('contain', 'Nó Importado');
    });
  });

  describe('Undo/Redo', () => {
    it('deve desfazer criação de nó', () => {
      // Criar nó
      cy.get('[data-testid="tool-rectangle"]').click();
      cy.get('[data-testid="diagram-canvas"]').click(200, 150);
      
      // Verificar criação
      cy.get('[data-testid^="node-"]').should('have.length', 1);
      
      // Desfazer
      cy.get('body').type('{ctrl+z}');
      
      // Verificar que nó foi removido
      cy.get('[data-testid^="node-"]').should('not.exist');
    });

    it('deve refazer ação desfeita', () => {
      // Criar nó
      cy.get('[data-testid="tool-rectangle"]').click();
      cy.get('[data-testid="diagram-canvas"]').click(200, 150);
      
      // Desfazer
      cy.get('body').type('{ctrl+z}');
      
      // Refazer
      cy.get('body').type('{ctrl+y}');
      
      // Verificar que nó voltou
      cy.get('[data-testid^="node-"]').should('have.length', 1);
    });
  });

  describe('Responsividade', () => {
    it('deve adaptar interface para mobile', () => {
      // Simular viewport mobile
      cy.viewport(375, 667);
      
      // Verificar adaptações
      cy.get('[data-testid="toolbar"]')
        .should('have.class', 'mobile-layout');
      
      cy.get('[data-testid="properties-panel"]')
        .should('have.class', 'collapsed');
    });

    it('deve manter funcionalidade em tablet', () => {
      // Simular viewport tablet
      cy.viewport(768, 1024);
      
      // Testar criação de nó
      cy.get('[data-testid="tool-rectangle"]').click();
      cy.get('[data-testid="diagram-canvas"]').click(200, 150);
      
      // Verificar que funciona normalmente
      cy.get('[data-testid^="node-"]').should('have.length', 1);
    });
  });

  describe('Performance', () => {
    it('deve manter performance com muitos nós', () => {
      // Criar muitos nós
      cy.get('[data-testid="tool-rectangle"]').click();
      
      for (let i = 0; i < 50; i++) {
        const x = (i % 10) * 80 + 50;
        const y = Math.floor(i / 10) * 60 + 50;
        cy.get('[data-testid="diagram-canvas"]').click(x, y);
      }
      
      // Verificar que a interface ainda responde
      cy.get('[data-testid="node-count"]').should('contain', '50');
      
      // Testar seleção múltipla
      cy.get('body').type('{ctrl+a}');
      cy.get('[data-testid^="node-"].selected').should('have.length', 50);
    });

    it('deve carregar rapidamente', () => {
      // Medir tempo de carregamento
      cy.window().then((win) => {
        const startTime = win.performance.now();
        
        cy.get('[data-testid="diagram-canvas"]').should('be.visible').then(() => {
          const loadTime = win.performance.now() - startTime;
          expect(loadTime).to.be.lessThan(2000); // Menos de 2 segundos
        });
      });
    });
  });

  describe('Acessibilidade', () => {
    it('deve ser navegável por teclado', () => {
      // Testar navegação por tab
      cy.get('body').tab();
      cy.focused().should('have.attr', 'data-testid', 'tool-select');
      
      cy.focused().tab();
      cy.focused().should('have.attr', 'data-testid', 'tool-rectangle');
    });

    it('deve ter labels acessíveis', () => {
      // Verificar aria-labels
      cy.get('[data-testid="tool-rectangle"]')
        .should('have.attr', 'aria-label', 'Ferramenta Retângulo');
      
      cy.get('[data-testid="diagram-canvas"]')
        .should('have.attr', 'aria-label', 'Canvas do Diagrama');
    });

    it('deve suportar leitores de tela', () => {
      // Verificar roles ARIA
      cy.get('[data-testid="diagram-canvas"]')
        .should('have.attr', 'role', 'application');
      
      cy.get('[data-testid="toolbar"]')
        .should('have.attr', 'role', 'toolbar');
    });
  });
});