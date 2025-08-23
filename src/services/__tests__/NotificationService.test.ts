/**
 * Testes unitários para NotificationService
 * 
 * Testa gerenciamento de notificações, tipos, prioridades,
 * configurações e funcionalidades específicas
 */

import { NotificationService, NotificationType, NotificationPriority, Notification, NotificationConfig } from '../NotificationService';

describe('NotificationService', () => {
  let notificationService: NotificationService;
  let mockLocalStorage: { [key: string]: string };

  beforeEach(() => {
    // Mock do localStorage
    mockLocalStorage = {};
    Object.defineProperty(window, 'localStorage', {
      value: {
        getItem: vi.fn((key: string) => mockLocalStorage[key] || null),
        setItem: vi.fn((key: string, value: string) => {
          mockLocalStorage[key] = value;
        }),
        removeItem: vi.fn((key: string) => {
          delete mockLocalStorage[key];
        }),
        clear: vi.fn(() => {
          mockLocalStorage = {};
        })
      },
      writable: true
    });

    // Mock do Notification API
    Object.defineProperty(global, 'Notification', {
      value: {
        permission: 'granted',
        requestPermission: vi.fn().mockResolvedValue('granted')
      },
      writable: true
    });

    global.Notification = vi.fn().mockImplementation((title, options) => ({
      title,
      ...options,
      close: vi.fn(),
      onclick: null
    })) as any;

    // Reset singleton instance
    (NotificationService as any).instance = null;
    notificationService = NotificationService.getInstance();
    notificationService.clearAll(); // Limpar estado antes de cada teste
    vi.clearAllMocks();
  });

  afterEach(() => {
    if (notificationService) {
      notificationService.clearAll();
    }
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
      const config = notificationService.getConfig();
      
      expect(config.maxNotifications).toBe(100);
      expect(config.defaultAutoClose).toBe(5000);
      expect(config.enableSound).toBe(true);
      expect(config.enableBrowserNotifications).toBe(false);
      expect(config.persistentTypes).toEqual(['error', 'warning']);
    });

    test('deve atualizar configurações', () => {
      const novasConfiguracoes: Partial<NotificationConfig> = {
        maxNotifications: 150,
        enableSound: false,
        defaultAutoClose: 3000
      };
      
      notificationService.updateConfig(novasConfiguracoes);
      const config = notificationService.getConfig();
      
      expect(config.maxNotifications).toBe(150);
      expect(config.enableSound).toBe(false);
      expect(config.defaultAutoClose).toBe(3000);
      expect(config.enableBrowserNotifications).toBe(false); // Não alterado
    });
  });

  describe('Adição de Notificações', () => {
    test('deve adicionar notificação básica', () => {
      const notificationId = notificationService.addNotification(
        'info',
        'Teste',
        'Mensagem de teste'
      );
      
      const notifications = notificationService.getNotifications();
      const notification = notifications.find(n => n.id === notificationId);
      
      expect(notification).toBeDefined();
      expect(notification!.title).toBe('Teste');
      expect(notification!.message).toBe('Mensagem de teste');
      expect(notification!.type).toBe('info');
      expect(notification!.priority).toBe('medium');
      expect(notification!.read).toBe(false);
      expect(notification!.timestamp).toBeInstanceOf(Date);
    });

    test('deve adicionar notificação com prioridade customizada', () => {
      const notificationId = notificationService.addNotification(
        'warning',
        'Aviso Importante',
        'Mensagem de aviso',
        { priority: 'high' }
      );
      
      const notifications = notificationService.getNotifications();
      const notification = notifications.find(n => n.id === notificationId);
      
      expect(notification!.type).toBe('warning');
      expect(notification!.priority).toBe('high');
    });

    test('deve adicionar notificação de sucesso', () => {
      const notificationId = notificationService.success('Sucesso', 'Operação concluída');
      
      const notifications = notificationService.getNotifications();
      const notification = notifications.find(n => n.id === notificationId);
      
      expect(notification!.type).toBe('success');
      expect(notification!.title).toBe('Sucesso');
    });

    test('deve adicionar notificação de erro', () => {
      const notificationId = notificationService.error('Erro', 'Algo deu errado');
      
      const notifications = notificationService.getNotifications();
      const notification = notifications.find(n => n.id === notificationId);
      
      expect(notification!.type).toBe('error');
      expect(notification!.persistent).toBe(true); // Erros são persistentes por padrão
    });
  });

  describe('Gerenciamento de Notificações', () => {
    test('deve marcar notificação como lida', () => {
      const notificationId = notificationService.info('Teste', 'Mensagem');
      
      notificationService.markAsRead(notificationId);
      
      const notifications = notificationService.getNotifications();
      const notification = notifications.find(n => n.id === notificationId);
      
      expect(notification!.read).toBe(true);
    });

    test('deve marcar todas como lidas', () => {
      notificationService.info('Teste 1', 'Mensagem 1');
      notificationService.warning('Teste 2', 'Mensagem 2');
      notificationService.error('Teste 3', 'Mensagem 3');
      
      notificationService.markAllAsRead();
      
      const notifications = notificationService.getNotifications();
      notifications.forEach(notification => {
        expect(notification.read).toBe(true);
      });
    });

    test('deve remover notificação específica', () => {
      const id1 = notificationService.info('Teste 1', 'Mensagem 1');
      const id2 = notificationService.info('Teste 2', 'Mensagem 2');
      
      notificationService.removeNotification(id1);
      
      const notifications = notificationService.getNotifications();
      expect(notifications.length).toBe(1);
      expect(notifications[0].id).toBe(id2);
    });

    test('deve limpar todas as notificações', () => {
      notificationService.info('Teste 1', 'Mensagem 1');
      notificationService.info('Teste 2', 'Mensagem 2');
      
      notificationService.clearAll();
      
      const notifications = notificationService.getNotifications();
      expect(notifications.length).toBe(0);
    });

    test('deve limpar apenas notificações lidas', () => {
      const id1 = notificationService.info('Teste 1', 'Mensagem 1');
      const id2 = notificationService.info('Teste 2', 'Mensagem 2');
      
      notificationService.markAsRead(id1);
      notificationService.clearRead();
      
      const notifications = notificationService.getNotifications();
      expect(notifications.length).toBe(1);
      expect(notifications[0].id).toBe(id2);
    });
  });

  describe('Filtros e Consultas', () => {
    beforeEach(() => {
      notificationService.info('Info 1', 'Mensagem info');
      notificationService.warning('Aviso 1', 'Mensagem aviso');
      notificationService.error('Erro 1', 'Mensagem erro');
      notificationService.success('Sucesso 1', 'Mensagem sucesso');
    });

    test('deve filtrar por tipo', () => {
      const errorNotifications = notificationService.getNotifications({ type: 'error' });
      
      expect(errorNotifications.length).toBe(1);
      expect(errorNotifications[0].type).toBe('error');
    });

    test('deve filtrar por prioridade', () => {
      // Adicionar notificação com prioridade alta
      notificationService.addNotification('warning', 'Urgente', 'Mensagem urgente', { priority: 'high' });
      
      const highPriorityNotifications = notificationService.getNotifications({ priority: 'high' });
      
      expect(highPriorityNotifications.length).toBe(2);
      expect(highPriorityNotifications.every(n => n.priority === 'high')).toBe(true);
    });

    test('deve filtrar por status de leitura', () => {
      const notifications = notificationService.getNotifications();
      notificationService.markAsRead(notifications[0].id);
      
      const unreadNotifications = notificationService.getNotifications({ read: false });
      const readNotifications = notificationService.getNotifications({ read: true });
      
      expect(unreadNotifications.length).toBe(3);
      expect(readNotifications.length).toBe(1);
    });

    test('deve obter contadores', () => {
      const notifications = notificationService.getNotifications();
      notificationService.markAsRead(notifications[0].id);
      
      const counters = notificationService.getCounters();
      
      expect(counters.total).toBe(4);
      expect(counters.unread).toBe(3);
      expect(counters.byType.info).toBe(1);
      expect(counters.byType.warning).toBe(1);
      expect(counters.byType.error).toBe(1);
      expect(counters.byType.success).toBe(1);
    });
  });

  describe('Listeners', () => {
    test('deve adicionar e notificar listeners', () => {
      const mockListener = vi.fn();
      const removeListener = notificationService.addListener(mockListener);
      
      notificationService.info('Teste', 'Mensagem');
      
      expect(mockListener).toHaveBeenCalled();
      
      // Remover listener
      removeListener();
      mockListener.mockClear();
      
      notificationService.info('Teste 2', 'Mensagem 2');
      expect(mockListener).not.toHaveBeenCalled();
    });
  });

  describe('Notificações Específicas do Sistema', () => {
    test('deve criar notificação de erro de cálculo', () => {
      const notificationId = notificationService.calculationError('Erro na simulação', { step: 'irradiance' });
      
      const notifications = notificationService.getNotifications();
      const notification = notifications.find(n => n.id === notificationId);
      
      expect(notification!.type).toBe('error');
      expect(notification!.title).toBe('Erro no Cálculo');
      expect(notification!.message).toContain('Erro na simulação');
    });

    test('deve criar notificação de sucesso de cálculo', () => {
      const notificationId = notificationService.calculationSuccess('Simulação Solar', 1500);
      
      const notifications = notificationService.getNotifications();
      const notification = notifications.find(n => n.id === notificationId);
      
      expect(notification!.type).toBe('success');
      expect(notification!.title).toBe('Cálculo Concluído');
      expect(notification!.message).toContain('Simulação Solar');
      expect(notification!.message).toContain('1500ms');
    });

    test('deve criar notificação de aviso de validação', () => {
      const notificationId = notificationService.dataValidationWarning('potencia', 5000, '1000-4000W');
      
      const notifications = notificationService.getNotifications();
      const notification = notifications.find(n => n.id === notificationId);
      
      expect(notification!.type).toBe('warning');
      expect(notification!.title).toBe('Dados Fora do Esperado');
      expect(notification!.message).toContain('potencia');
      expect(notification!.message).toContain('1000-4000W');
    });
  });

  describe('Persistência', () => {
    test('deve salvar notificações no localStorage', () => {
      notificationService.info('Teste', 'Mensagem');
      
      expect(localStorage.setItem).toHaveBeenCalledWith(
        'solar_notifications',
        expect.stringContaining('"title":"Teste"')
      );
    });

    test('deve carregar notificações do localStorage', () => {
      const savedData = {
        notifications: [{
          id: 'test-1',
          title: 'Teste Salvo',
          message: 'Mensagem salva',
          type: 'info' as NotificationType,
          priority: 'medium' as NotificationPriority,
          read: false,
          persistent: false,
          timestamp: new Date().toISOString()
        }],
        timestamp: Date.now()
      };
      
      mockLocalStorage['solar_notifications'] = JSON.stringify(savedData);
      
      // Reset singleton e criar nova instância
      (NotificationService as any).instance = null;
      const newService = NotificationService.getInstance();
      const notifications = newService.getNotifications();
      
      expect(notifications.length).toBe(1);
      expect(notifications[0].title).toBe('Teste Salvo');
    });

    test('deve lidar com localStorage corrompido', () => {
      mockLocalStorage['solar_notifications'] = 'json inválido';
      
      // Não deve lançar erro
      expect(() => {
        (NotificationService as any).instance = null;
        NotificationService.getInstance();
      }).not.toThrow();
    });
  });

  describe('Limitação de Notificações', () => {
    test('deve limitar número máximo de notificações', () => {
      // Configurar limite baixo para teste
      notificationService.updateConfig({ maxNotifications: 3 });
      
      // Adicionar mais notificações que o limite
      for (let i = 0; i < 5; i++) {
        notificationService.info(`Teste ${i}`, `Mensagem ${i}`);
      }
      
      const notifications = notificationService.getNotifications();
      expect(notifications.length).toBeLessThanOrEqual(3);
    });
  });
});