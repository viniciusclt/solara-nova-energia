/**
 * Testes unitários para NotificationService
 * 
 * Testa gerenciamento de notificações, tipos, prioridades,
 * configurações e funcionalidades específicas
 */

import { NotificationService, TipoNotificacao, PrioridadeNotificacao, Notificacao, ConfiguracoesNotificacao } from '../NotificationService';

describe('NotificationService', () => {
  let notificationService: NotificationService;
  let mockLocalStorage: { [key: string]: string };

  beforeEach(() => {
    // Mock do localStorage
    mockLocalStorage = {};
    Object.defineProperty(window, 'localStorage', {
      value: {
        getItem: jest.fn((key: string) => mockLocalStorage[key] || null),
        setItem: jest.fn((key: string, value: string) => {
          mockLocalStorage[key] = value;
        }),
        removeItem: jest.fn((key: string) => {
          delete mockLocalStorage[key];
        }),
        clear: jest.fn(() => {
          mockLocalStorage = {};
        })
      },
      writable: true
    });

    // Mock do Notification API
    Object.defineProperty(window, 'Notification', {
      value: {
        permission: 'granted',
        requestPermission: jest.fn().mockResolvedValue('granted')
      },
      writable: true
    });

    global.Notification = jest.fn().mockImplementation((title, options) => ({
      title,
      ...options,
      close: jest.fn(),
      onclick: null
    })) as jest.MockedClass<typeof Notification>;

    notificationService = NotificationService.getInstance();
    notificationService.limparNotificacoes(); // Limpar estado antes de cada teste
    jest.clearAllMocks();
  });

  afterEach(() => {
    notificationService.limparNotificacoes();
  });

  describe('Singleton Pattern', () => {
    test('deve retornar a mesma instância', () => {
      const instance1 = NotificationService.getInstance();
      const instance2 = NotificationService.getInstance();
      
      expect(instance1).toBe(instance2);
    });
  });

  describe('Configurações', () => {
    test('deve carregar configurações padrão', () => {
      const config = notificationService.obterConfiguracoes();
      
      expect(config.max_notificacoes).toBe(50);
      expect(config.auto_fechar_tempo_ms).toBe(5000);
      expect(config.som_habilitado).toBe(true);
      expect(config.notificacoes_navegador).toBe(true);
      expect(config.mostrar_apenas_nao_lidas).toBe(false);
    });

    test('deve atualizar configurações', () => {
      const novasConfiguracoes: Partial<ConfiguracoesNotificacao> = {
        max_notificacoes: 100,
        som_habilitado: false,
        auto_fechar_tempo_ms: 3000
      };
      
      notificationService.atualizarConfiguracoes(novasConfiguracoes);
      const config = notificationService.obterConfiguracoes();
      
      expect(config.max_notificacoes).toBe(100);
      expect(config.som_habilitado).toBe(false);
      expect(config.auto_fechar_tempo_ms).toBe(3000);
      expect(config.notificacoes_navegador).toBe(true); // Não alterado
    });

    test('deve persistir configurações no localStorage', () => {
      const novasConfiguracoes: Partial<ConfiguracoesNotificacao> = {
        max_notificacoes: 75
      };
      
      notificationService.atualizarConfiguracoes(novasConfiguracoes);
      
      expect(localStorage.setItem).toHaveBeenCalledWith(
        'notification_settings',
        expect.stringContaining('"max_notificacoes":75')
      );
    });

    test('deve carregar configurações do localStorage', () => {
      const configSalva = {
        max_notificacoes: 25,
        som_habilitado: false,
        auto_fechar_tempo_ms: 8000,
        notificacoes_navegador: false,
        mostrar_apenas_nao_lidas: true
      };
      
      mockLocalStorage['notification_settings'] = JSON.stringify(configSalva);
      
      // Criar nova instância para carregar configurações
      const novoService = new (NotificationService as typeof NotificationService)();
      const config = novoService.obterConfiguracoes();
      
      expect(config.max_notificacoes).toBe(25);
      expect(config.som_habilitado).toBe(false);
    });
  });

  describe('Adição de Notificações', () => {
    test('deve adicionar notificação básica', () => {
      const notificacao = notificationService.adicionarNotificacao(
        'Teste',
        'Mensagem de teste',
        TipoNotificacao.INFO
      );
      
      expect(notificacao).toBeDefined();
      expect(notificacao.titulo).toBe('Teste');
      expect(notificacao.mensagem).toBe('Mensagem de teste');
      expect(notificacao.tipo).toBe(TipoNotificacao.INFO);
      expect(notificacao.prioridade).toBe(PrioridadeNotificacao.NORMAL);
      expect(notificacao.lida).toBe(false);
      expect(notificacao.id).toBeDefined();
    });

    test('deve adicionar notificação com prioridade específica', () => {
      const notificacao = notificationService.adicionarNotificacao(
        'Erro Crítico',
        'Sistema indisponível',
        TipoNotificacao.ERRO,
        PrioridadeNotificacao.URGENTE
      );
      
      expect(notificacao.prioridade).toBe(PrioridadeNotificacao.URGENTE);
      expect(notificacao.tipo).toBe(TipoNotificacao.ERRO);
    });

    test('deve gerar IDs únicos para notificações', () => {
      const notif1 = notificationService.adicionarNotificacao('Teste 1', 'Msg 1', TipoNotificacao.INFO);
      const notif2 = notificationService.adicionarNotificacao('Teste 2', 'Msg 2', TipoNotificacao.INFO);
      
      expect(notif1.id).not.toBe(notif2.id);
    });

    test('deve definir timestamp corretamente', () => {
      const antes = Date.now();
      const notificacao = notificationService.adicionarNotificacao('Teste', 'Msg', TipoNotificacao.INFO);
      const depois = Date.now();
      
      expect(notificacao.timestamp).toBeGreaterThanOrEqual(antes);
      expect(notificacao.timestamp).toBeLessThanOrEqual(depois);
    });

    test('deve respeitar limite máximo de notificações', () => {
      // Configurar limite baixo
      notificationService.atualizarConfiguracoes({ max_notificacoes: 3 });
      
      // Adicionar mais notificações que o limite
      for (let i = 0; i < 5; i++) {
        notificationService.adicionarNotificacao(`Teste ${i}`, `Msg ${i}`, TipoNotificacao.INFO);
      }
      
      const notificacoes = notificationService.obterNotificacoes();
      expect(notificacoes.length).toBe(3);
      
      // Deve manter as mais recentes
      expect(notificacoes[0].titulo).toBe('Teste 4');
      expect(notificacoes[1].titulo).toBe('Teste 3');
      expect(notificacoes[2].titulo).toBe('Teste 2');
    });
  });

  describe('Gerenciamento de Estado', () => {
    test('deve marcar notificação como lida', () => {
      const notificacao = notificationService.adicionarNotificacao('Teste', 'Msg', TipoNotificacao.INFO);
      
      expect(notificacao.lida).toBe(false);
      
      notificationService.marcarComoLida(notificacao.id);
      
      const notificacoes = notificationService.obterNotificacoes();
      const notifAtualizada = notificacoes.find(n => n.id === notificacao.id);
      
      expect(notifAtualizada?.lida).toBe(true);
    });

    test('deve marcar notificação como não lida', () => {
      const notificacao = notificationService.adicionarNotificacao('Teste', 'Msg', TipoNotificacao.INFO);
      
      // Marcar como lida primeiro
      notificationService.marcarComoLida(notificacao.id);
      
      // Depois marcar como não lida
      notificationService.marcarComoNaoLida(notificacao.id);
      
      const notificacoes = notificationService.obterNotificacoes();
      const notifAtualizada = notificacoes.find(n => n.id === notificacao.id);
      
      expect(notifAtualizada?.lida).toBe(false);
    });

    test('deve remover notificação específica', () => {
      const notif1 = notificationService.adicionarNotificacao('Teste 1', 'Msg 1', TipoNotificacao.INFO);
      const notif2 = notificationService.adicionarNotificacao('Teste 2', 'Msg 2', TipoNotificacao.INFO);
      
      notificationService.removerNotificacao(notif1.id);
      
      const notificacoes = notificationService.obterNotificacoes();
      expect(notificacoes.length).toBe(1);
      expect(notificacoes[0].id).toBe(notif2.id);
    });

    test('deve marcar todas como lidas', () => {
      notificationService.adicionarNotificacao('Teste 1', 'Msg 1', TipoNotificacao.INFO);
      notificationService.adicionarNotificacao('Teste 2', 'Msg 2', TipoNotificacao.AVISO);
      notificationService.adicionarNotificacao('Teste 3', 'Msg 3', TipoNotificacao.ERRO);
      
      notificationService.marcarTodasComoLidas();
      
      const notificacoes = notificationService.obterNotificacoes();
      notificacoes.forEach(notif => {
        expect(notif.lida).toBe(true);
      });
    });

    test('deve limpar todas as notificações', () => {
      notificationService.adicionarNotificacao('Teste 1', 'Msg 1', TipoNotificacao.INFO);
      notificationService.adicionarNotificacao('Teste 2', 'Msg 2', TipoNotificacao.INFO);
      
      notificationService.limparNotificacoes();
      
      const notificacoes = notificationService.obterNotificacoes();
      expect(notificacoes.length).toBe(0);
    });
  });

  describe('Filtros e Consultas', () => {
    beforeEach(() => {
      // Adicionar notificações de teste
      notificationService.adicionarNotificacao('Info 1', 'Msg info', TipoNotificacao.INFO);
      notificationService.adicionarNotificacao('Aviso 1', 'Msg aviso', TipoNotificacao.AVISO, PrioridadeNotificacao.ALTA);
      notificationService.adicionarNotificacao('Erro 1', 'Msg erro', TipoNotificacao.ERRO, PrioridadeNotificacao.URGENTE);
      notificationService.adicionarNotificacao('Sucesso 1', 'Msg sucesso', TipoNotificacao.SUCESSO);
    });

    test('deve filtrar por tipo', () => {
      const notificacoesErro = notificationService.filtrarPorTipo(TipoNotificacao.ERRO);
      
      expect(notificacoesErro.length).toBe(1);
      expect(notificacoesErro[0].tipo).toBe(TipoNotificacao.ERRO);
    });

    test('deve filtrar por prioridade', () => {
      const notificacoesUrgentes = notificationService.filtrarPorPrioridade(PrioridadeNotificacao.URGENTE);
      
      expect(notificacoesUrgentes.length).toBe(1);
      expect(notificacoesUrgentes[0].prioridade).toBe(PrioridadeNotificacao.URGENTE);
    });

    test('deve obter apenas não lidas', () => {
      const notificacoes = notificationService.obterNotificacoes();
      
      // Marcar uma como lida
      notificationService.marcarComoLida(notificacoes[0].id);
      
      const naoLidas = notificationService.obterNaoLidas();
      
      expect(naoLidas.length).toBe(3);
      naoLidas.forEach(notif => {
        expect(notif.lida).toBe(false);
      });
    });

    test('deve contar notificações por tipo', () => {
      const contadores = notificationService.contarPorTipo();
      
      expect(contadores[TipoNotificacao.INFO]).toBe(1);
      expect(contadores[TipoNotificacao.AVISO]).toBe(1);
      expect(contadores[TipoNotificacao.ERRO]).toBe(1);
      expect(contadores[TipoNotificacao.SUCESSO]).toBe(1);
      expect(contadores[TipoNotificacao.SISTEMA]).toBe(0);
    });

    test('deve contar notificações por prioridade', () => {
      const contadores = notificationService.contarPorPrioridade();
      
      expect(contadores[PrioridadeNotificacao.NORMAL]).toBe(2); // INFO e SUCESSO
      expect(contadores[PrioridadeNotificacao.ALTA]).toBe(1); // AVISO
      expect(contadores[PrioridadeNotificacao.URGENTE]).toBe(1); // ERRO
      expect(contadores[PrioridadeNotificacao.BAIXA]).toBe(0);
    });
  });

  describe('Notificações Específicas', () => {
    test('deve criar notificação de erro de cálculo', () => {
      const erro = new Error('Divisão por zero');
      const notificacao = notificationService.notificarErroCalculo(erro, { custo_sistema: 50000 });
      
      expect(notificacao.tipo).toBe(TipoNotificacao.ERRO);
      expect(notificacao.prioridade).toBe(PrioridadeNotificacao.ALTA);
      expect(notificacao.titulo).toBe('Erro no Cálculo');
      expect(notificacao.mensagem).toContain('Divisão por zero');
    });

    test('deve criar notificação de aviso de validação', () => {
      const avisos = ['Consumo muito baixo', 'Taxa de desconto alta'];
      const notificacao = notificationService.notificarAvisoValidacao(avisos);
      
      expect(notificacao.tipo).toBe(TipoNotificacao.AVISO);
      expect(notificacao.prioridade).toBe(PrioridadeNotificacao.NORMAL);
      expect(notificacao.titulo).toBe('Avisos de Validação');
      expect(notificacao.mensagem).toContain('Consumo muito baixo');
      expect(notificacao.mensagem).toContain('Taxa de desconto alta');
    });

    test('deve criar notificação de sucesso de cálculo', () => {
      const resultado = { vpl: 15000, tir: 0.15, payback_simples_anos: 8.5 };
      const notificacao = notificationService.notificarSucessoCalculo(resultado);
      
      expect(notificacao.tipo).toBe(TipoNotificacao.SUCESSO);
      expect(notificacao.prioridade).toBe(PrioridadeNotificacao.NORMAL);
      expect(notificacao.titulo).toBe('Cálculo Concluído');
      expect(notificacao.mensagem).toContain('VPL: R$ 15.000');
      expect(notificacao.mensagem).toContain('TIR: 15.00%');
    });

    test('deve criar notificação de aviso de cache', () => {
      const notificacao = notificationService.notificarAvisoCache(
        'Cache quase cheio',
        { tamanho_atual: 950, limite: 1000 }
      );
      
      expect(notificacao.tipo).toBe(TipoNotificacao.AVISO);
      expect(notificacao.prioridade).toBe(PrioridadeNotificacao.BAIXA);
      expect(notificacao.titulo).toBe('Aviso do Cache');
      expect(notificacao.mensagem).toBe('Cache quase cheio');
    });

    test('deve criar notificação de análise de sensibilidade', () => {
      const resultado = {
        parametros_analisados: ['custo_sistema', 'geracao_anual_kwh'],
        tempo_execucao_ms: 2500
      };
      
      const notificacao = notificationService.notificarAnaliseCompleta(resultado);
      
      expect(notificacao.tipo).toBe(TipoNotificacao.INFO);
      expect(notificacao.prioridade).toBe(PrioridadeNotificacao.NORMAL);
      expect(notificacao.titulo).toBe('Análise de Sensibilidade Concluída');
      expect(notificacao.mensagem).toContain('2 parâmetros');
      expect(notificacao.mensagem).toContain('2.5 segundos');
    });
  });

  describe('Notificações do Navegador', () => {
    test('deve solicitar permissão para notificações', async () => {
      await notificationService.solicitarPermissaoNotificacoes();
      
      expect(Notification.requestPermission).toHaveBeenCalled();
    });

    test('deve enviar notificação do navegador para erro urgente', () => {
      notificationService.adicionarNotificacao(
        'Erro Crítico',
        'Sistema falhou',
        TipoNotificacao.ERRO,
        PrioridadeNotificacao.URGENTE
      );
      
      expect(global.Notification).toHaveBeenCalledWith(
        'Erro Crítico',
        expect.objectContaining({
          body: 'Sistema falhou',
          icon: expect.any(String)
        })
      );
    });

    test('deve não enviar notificação do navegador se desabilitado', () => {
      notificationService.atualizarConfiguracoes({ notificacoes_navegador: false });
      
      notificationService.adicionarNotificacao(
        'Erro Crítico',
        'Sistema falhou',
        TipoNotificacao.ERRO,
        PrioridadeNotificacao.URGENTE
      );
      
      expect(global.Notification).not.toHaveBeenCalled();
    });

    test('deve não enviar notificação se permissão negada', () => {
      Object.defineProperty(window, 'Notification', {
        value: {
          permission: 'denied',
          requestPermission: jest.fn().mockResolvedValue('denied')
        },
        writable: true
      });
      
      notificationService.adicionarNotificacao(
        'Erro Crítico',
        'Sistema falhou',
        TipoNotificacao.ERRO,
        PrioridadeNotificacao.URGENTE
      );
      
      expect(global.Notification).not.toHaveBeenCalled();
    });
  });

  describe('Persistência', () => {
    test('deve salvar notificações no localStorage', () => {
      notificationService.adicionarNotificacao('Teste', 'Mensagem', TipoNotificacao.INFO);
      
      expect(localStorage.setItem).toHaveBeenCalledWith(
        'notifications',
        expect.stringContaining('"titulo":"Teste"')
      );
    });

    test('deve carregar notificações do localStorage', () => {
      const notificacoesSalvas = [
        {
          id: 'test-1',
          titulo: 'Teste Salvo',
          mensagem: 'Mensagem salva',
          tipo: TipoNotificacao.INFO,
          prioridade: PrioridadeNotificacao.NORMAL,
          lida: false,
          timestamp: Date.now()
        }
      ];
      
      mockLocalStorage['notifications'] = JSON.stringify(notificacoesSalvas);
      
      // Criar nova instância para carregar notificações
      const novoService = new (NotificationService as typeof NotificationService)();
      const notificacoes = novoService.obterNotificacoes();
      
      expect(notificacoes.length).toBe(1);
      expect(notificacoes[0].titulo).toBe('Teste Salvo');
    });

    test('deve lidar com localStorage corrompido', () => {
      mockLocalStorage['notifications'] = 'json inválido';
      
      // Não deve lançar erro
      expect(() => {
        new (NotificationService as typeof NotificationService)();
      }).not.toThrow();
    });
  });

  describe('Limpeza Automática', () => {
    test('deve remover notificações antigas automaticamente', () => {
      // Mock de notificação antiga (mais de 7 dias)
      const notificacaoAntiga = {
        id: 'old-1',
        titulo: 'Antiga',
        mensagem: 'Mensagem antiga',
        tipo: TipoNotificacao.INFO,
        prioridade: PrioridadeNotificacao.NORMAL,
        lida: true,
        timestamp: Date.now() - (8 * 24 * 60 * 60 * 1000) // 8 dias atrás
      };
      
      mockLocalStorage['notifications'] = JSON.stringify([notificacaoAntiga]);
      
      // Criar nova instância (deve limpar automaticamente)
      const novoService = new (NotificationService as typeof NotificationService)();
      const notificacoes = novoService.obterNotificacoes();
      
      expect(notificacoes.length).toBe(0);
    });

    test('deve manter notificações recentes', () => {
      const notificacaoRecente = {
        id: 'recent-1',
        titulo: 'Recente',
        mensagem: 'Mensagem recente',
        tipo: TipoNotificacao.INFO,
        prioridade: PrioridadeNotificacao.NORMAL,
        lida: false,
        timestamp: Date.now() - (2 * 24 * 60 * 60 * 1000) // 2 dias atrás
      };
      
      mockLocalStorage['notifications'] = JSON.stringify([notificacaoRecente]);
      
      const novoService = new (NotificationService as typeof NotificationService)();
      const notificacoes = novoService.obterNotificacoes();
      
      expect(notificacoes.length).toBe(1);
      expect(notificacoes[0].titulo).toBe('Recente');
    });
  });

  describe('Tratamento de Erros', () => {
    test('deve lidar com ID inexistente ao marcar como lida', () => {
      expect(() => {
        notificationService.marcarComoLida('id-inexistente');
      }).not.toThrow();
    });

    test('deve lidar com ID inexistente ao remover', () => {
      expect(() => {
        notificationService.removerNotificacao('id-inexistente');
      }).not.toThrow();
    });

    test('deve lidar com erro no localStorage', () => {
      // Mock erro no localStorage
      (localStorage.setItem as jest.Mock).mockImplementation(() => {
        throw new Error('Quota exceeded');
      });
      
      expect(() => {
        notificationService.adicionarNotificacao('Teste', 'Msg', TipoNotificacao.INFO);
      }).not.toThrow();
    });
  });

  describe('Performance', () => {
    test('deve manter performance com muitas notificações', () => {
      const inicio = Date.now();
      
      // Adicionar muitas notificações
      for (let i = 0; i < 1000; i++) {
        notificationService.adicionarNotificacao(`Teste ${i}`, `Msg ${i}`, TipoNotificacao.INFO);
      }
      
      const duracao = Date.now() - inicio;
      expect(duracao).toBeLessThan(1000); // Menos de 1 segundo
    });

    test('deve filtrar rapidamente', () => {
      // Adicionar notificações variadas
      for (let i = 0; i < 100; i++) {
        const tipo = i % 2 === 0 ? TipoNotificacao.INFO : TipoNotificacao.ERRO;
        notificationService.adicionarNotificacao(`Teste ${i}`, `Msg ${i}`, tipo);
      }
      
      const inicio = Date.now();
      const filtradas = notificationService.filtrarPorTipo(TipoNotificacao.INFO);
      const duracao = Date.now() - inicio;
      
      expect(filtradas.length).toBe(50);
      expect(duracao).toBeLessThan(100); // Menos de 100ms
    });
  });
});