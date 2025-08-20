/**
 * Testes unitários para useNotifications hook
 * 
 * Testa integração com Supabase, gerenciamento de estado,
 * funcionalidades offline e notificações push
 */

import { renderHook, act, waitFor } from '@testing-library/react';
import { useNotifications } from '../useNotifications';
import { supabase } from '../../lib/supabase';
import { connectivityService } from '../../services/connectivityService';
import { toast } from 'sonner';

type NotificationData = {
  id: string;
  title: string;
  message: string;
  type: string;
  read: boolean;
  created_at: string;
  user_id: string;
};

// Mocks
jest.mock('../../lib/supabase', () => ({
  supabase: {
    from: jest.fn(),
    auth: {
      getUser: jest.fn()
    },
    channel: jest.fn()
  }
}));

jest.mock('../../services/ConnectivityService', () => ({
  connectivityService: {
    isOnline: jest.fn(),
    on: jest.fn(),
    off: jest.fn()
  }
}));

jest.mock('../useToast', () => ({
  useToast: jest.fn()
}));

const mockSupabase = supabase as jest.Mocked<typeof supabase>;
const mockConnectivityService = connectivityService as jest.Mocked<typeof connectivityService>;
const mockUseToast = useToast as jest.MockedFunction<typeof useToast>;

interface MockToast {
  toast: jest.Mock;
}

interface MockSupabaseQuery {
  select: jest.Mock;
  eq: jest.Mock;
  order: jest.Mock;
  insert: jest.Mock;
  update: jest.Mock;
  delete: jest.Mock;
  single: jest.Mock;
  then: jest.Mock;
}

interface MockSupabaseChannel {
  on: jest.Mock;
  subscribe: jest.Mock;
}

describe('useNotifications', () => {
  let mockToast: MockToast;
  let mockSupabaseQuery: MockSupabaseQuery;
  let mockSupabaseChannel: MockSupabaseChannel;

  const mockUser = {
    id: 'user-123',
    email: 'test@example.com'
  };

  const mockNotifications = [
    {
      id: '1',
      user_id: 'user-123',
      type: 'success',
      priority: 'medium',
      title: 'Cálculo Concluído',
      message: 'Análise financeira finalizada',
      read: false,
      created_at: new Date().toISOString(),
      expires_at: new Date(Date.now() + 86400000).toISOString()
    },
    {
      id: '2',
      user_id: 'user-123',
      type: 'error',
      priority: 'high',
      title: 'Erro no Sistema',
      message: 'Falha na conexão',
      read: true,
      created_at: new Date().toISOString(),
      expires_at: new Date(Date.now() + 86400000).toISOString()
    }
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock do localStorage
    const localStorageMock = {
      getItem: jest.fn(),
      setItem: jest.fn(),
      removeItem: jest.fn(),
      clear: jest.fn()
    };
    Object.defineProperty(window, 'localStorage', {
      value: localStorageMock
    });

    // Mock do Notification API
    global.Notification = {
      permission: 'granted',
      requestPermission: jest.fn().mockResolvedValue('granted')
    } as typeof Notification;

    // Mock do useToast
    mockToast = {
      toast: jest.fn()
    };
    mockUseToast.mockReturnValue(mockToast);

    // Mock do connectivityService
    mockConnectivityService.isOnline.mockReturnValue(true);
    mockConnectivityService.on.mockImplementation(() => {});
    mockConnectivityService.off.mockImplementation(() => {});

    // Mock do Supabase auth
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: mockUser },
      error: null
    });

    // Mock do Supabase query
    mockSupabaseQuery = {
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      order: jest.fn().mockReturnThis(),
      insert: jest.fn().mockReturnThis(),
      update: jest.fn().mockReturnThis(),
      delete: jest.fn().mockReturnThis(),
      single: jest.fn(),
      then: jest.fn()
    };

    mockSupabase.from.mockReturnValue(mockSupabaseQuery);

    // Mock do Supabase channel
    mockSupabaseChannel = {
      on: jest.fn().mockReturnThis(),
      subscribe: jest.fn()
    };
    mockSupabase.channel.mockReturnValue(mockSupabaseChannel);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('Inicialização', () => {
    test('deve inicializar com estado padrão', () => {
      const { result } = renderHook(() => useNotifications());
      
      expect(result.current.notifications).toEqual([]);
      expect(result.current.loading).toBe(true);
      expect(result.current.error).toBeNull();
      expect(result.current.stats.total).toBe(0);
      expect(result.current.stats.unread).toBe(0);
    });

    test('deve carregar notificações do Supabase quando online', async () => {
      mockSupabaseQuery.then.mockResolvedValue({
        data: mockNotifications,
        error: null
      });

      const { result } = renderHook(() => useNotifications());
      
      await waitFor(() => {
        expect(result.current.loading).toBe(false);
        expect(result.current.notifications).toHaveLength(2);
        expect(result.current.stats.total).toBe(2);
        expect(result.current.stats.unread).toBe(1);
      });
    });

    test('deve carregar do cache quando offline', async () => {
      mockConnectivityService.isOnline.mockReturnValue(false);
      
      const cachedNotifications = JSON.stringify({
        notifications: mockNotifications,
        timestamp: Date.now(),
        userId: 'user-123'
      });
      
      (window.localStorage.getItem as jest.Mock).mockReturnValue(cachedNotifications);

      const { result } = renderHook(() => useNotifications());
      
      await waitFor(() => {
        expect(result.current.loading).toBe(false);
        expect(result.current.notifications).toHaveLength(2);
      });
    });

    test('deve configurar subscription em tempo real', async () => {
      renderHook(() => useNotifications());
      
      await waitFor(() => {
        expect(mockSupabase.channel).toHaveBeenCalledWith('notifications');
        expect(mockSupabaseChannel.on).toHaveBeenCalledWith(
          'postgres_changes',
          expect.objectContaining({
            event: '*',
            schema: 'public',
            table: 'notifications'
          }),
          expect.any(Function)
        );
        expect(mockSupabaseChannel.subscribe).toHaveBeenCalled();
      });
    });
  });

  describe('Carregamento de Notificações', () => {
    test('deve lidar com erro de tabela não encontrada', async () => {
      mockSupabaseQuery.then.mockResolvedValue({
        data: null,
        error: { code: '42P01', message: 'relation "notifications" does not exist' }
      });

      const { result } = renderHook(() => useNotifications());
      
      await waitFor(() => {
        expect(result.current.loading).toBe(false);
        expect(result.current.notifications).toEqual([]);
        expect(mockToast.toast).toHaveBeenCalledWith({
          title: 'Sistema de Notificações',
          description: 'Tabela de notificações não configurada. Usando cache local.',
          variant: 'default'
        });
      });
    });

    test('deve lidar com erro de conexão', async () => {
      mockSupabaseQuery.then.mockResolvedValue({
        data: null,
        error: { message: 'Network error' }
      });

      const { result } = renderHook(() => useNotifications());
      
      await waitFor(() => {
        expect(result.current.loading).toBe(false);
        expect(result.current.error).toBe('Network error');
        expect(mockToast.toast).toHaveBeenCalledWith({
          title: 'Erro de Conexão',
          description: 'Não foi possível carregar notificações. Usando cache local.',
          variant: 'destructive'
        });
      });
    });

    test('deve validar cache local', async () => {
      mockConnectivityService.isOnline.mockReturnValue(false);
      
      // Cache com usuário diferente
      const invalidCache = JSON.stringify({
        notifications: mockNotifications,
        timestamp: Date.now(),
        userId: 'other-user'
      });
      
      (window.localStorage.getItem as jest.Mock).mockReturnValue(invalidCache);

      const { result } = renderHook(() => useNotifications());
      
      await waitFor(() => {
        expect(result.current.notifications).toEqual([]);
      });
    });

    test('deve validar idade do cache', async () => {
      mockConnectivityService.isOnline.mockReturnValue(false);
      
      // Cache muito antigo (mais de 24 horas)
      const oldCache = JSON.stringify({
        notifications: mockNotifications,
        timestamp: Date.now() - (25 * 60 * 60 * 1000),
        userId: 'user-123'
      });
      
      (window.localStorage.getItem as jest.Mock).mockReturnValue(oldCache);

      const { result } = renderHook(() => useNotifications());
      
      await waitFor(() => {
        expect(result.current.notifications).toEqual([]);
      });
    });
  });

  describe('Criação de Notificações', () => {
    test('deve criar notificação quando online', async () => {
      mockSupabaseQuery.then.mockResolvedValue({
        data: [{ ...mockNotifications[0], id: 'new-id' }],
        error: null
      });

      const { result } = renderHook(() => useNotifications());
      
      await act(async () => {
        await result.current.createNotification({
          type: 'success',
          title: 'Nova Notificação',
          message: 'Teste de criação'
        });
      });

      expect(mockSupabase.from).toHaveBeenCalledWith('notifications');
      expect(mockSupabaseQuery.insert).toHaveBeenCalledWith(
        expect.objectContaining({
          user_id: 'user-123',
          type: 'success',
          title: 'Nova Notificação',
          message: 'Teste de criação'
        })
      );
    });

    test('deve criar notificação localmente quando offline', async () => {
      mockConnectivityService.isOnline.mockReturnValue(false);

      const { result } = renderHook(() => useNotifications());
      
      await act(async () => {
        await result.current.createNotification({
          type: 'info',
          title: 'Notificação Offline',
          message: 'Criada localmente'
        });
      });

      expect(result.current.notifications).toHaveLength(1);
      expect(result.current.notifications[0].title).toBe('Notificação Offline');
    });

    test('deve enviar notificação push para alta prioridade', async () => {
      const mockNotificationConstructor = jest.fn();
      global.Notification = mockNotificationConstructor as typeof Notification;
      global.Notification.permission = 'granted';

      const { result } = renderHook(() => useNotifications());
      
      await act(async () => {
        await result.current.createNotification({
          type: 'error',
          priority: 'high',
          title: 'Erro Crítico',
          message: 'Sistema indisponível'
        });
      });

      expect(mockNotificationConstructor).toHaveBeenCalledWith(
        'Erro Crítico',
        expect.objectContaining({
          body: 'Sistema indisponível',
          icon: expect.any(String)
        })
      );
    });

    test('deve lidar com erro na criação', async () => {
      mockSupabaseQuery.then.mockResolvedValue({
        data: null,
        error: { message: 'Insert failed' }
      });

      const { result } = renderHook(() => useNotifications());
      
      await act(async () => {
        await result.current.createNotification({
          type: 'info',
          title: 'Teste',
          message: 'Falha esperada'
        });
      });

      expect(mockToast.toast).toHaveBeenCalledWith({
        title: 'Erro ao Criar Notificação',
        description: 'Insert failed',
        variant: 'destructive'
      });
    });
  });

  describe('Gerenciamento de Estado', () => {
    test('deve marcar notificação como lida', async () => {
      mockSupabaseQuery.then
        .mockResolvedValueOnce({ data: mockNotifications, error: null }) // Load inicial
        .mockResolvedValueOnce({ data: null, error: null }); // Update

      const { result } = renderHook(() => useNotifications());
      
      await waitFor(() => {
        expect(result.current.notifications).toHaveLength(2);
      });

      await act(async () => {
        await result.current.markAsRead('1');
      });

      expect(mockSupabaseQuery.update).toHaveBeenCalledWith({ read: true });
      expect(mockSupabaseQuery.eq).toHaveBeenCalledWith('id', '1');
    });

    test('deve marcar notificação como não lida', async () => {
      mockSupabaseQuery.then
        .mockResolvedValueOnce({ data: mockNotifications, error: null })
        .mockResolvedValueOnce({ data: null, error: null });

      const { result } = renderHook(() => useNotifications());
      
      await waitFor(() => {
        expect(result.current.notifications).toHaveLength(2);
      });

      await act(async () => {
        await result.current.markAsUnread('2');
      });

      expect(mockSupabaseQuery.update).toHaveBeenCalledWith({ read: false });
      expect(mockSupabaseQuery.eq).toHaveBeenCalledWith('id', '2');
    });

    test('deve deletar notificação', async () => {
      mockSupabaseQuery.then
        .mockResolvedValueOnce({ data: mockNotifications, error: null })
        .mockResolvedValueOnce({ data: null, error: null });

      const { result } = renderHook(() => useNotifications());
      
      await waitFor(() => {
        expect(result.current.notifications).toHaveLength(2);
      });

      await act(async () => {
        await result.current.deleteNotification('1');
      });

      expect(mockSupabaseQuery.delete).toHaveBeenCalled();
      expect(mockSupabaseQuery.eq).toHaveBeenCalledWith('id', '1');
    });

    test('deve marcar todas como lidas', async () => {
      mockSupabaseQuery.then
        .mockResolvedValueOnce({ data: mockNotifications, error: null })
        .mockResolvedValueOnce({ data: null, error: null });

      const { result } = renderHook(() => useNotifications());
      
      await waitFor(() => {
        expect(result.current.notifications).toHaveLength(2);
      });

      await act(async () => {
        await result.current.markAllAsRead();
      });

      expect(mockSupabaseQuery.update).toHaveBeenCalledWith({ read: true });
      expect(mockSupabaseQuery.eq).toHaveBeenCalledWith('user_id', 'user-123');
    });

    test('deve limpar notificações expiradas', async () => {
      const expiredNotification = {
        ...mockNotifications[0],
        expires_at: new Date(Date.now() - 1000).toISOString() // Expirada
      };

      mockSupabaseQuery.then
        .mockResolvedValueOnce({ data: [expiredNotification], error: null })
        .mockResolvedValueOnce({ data: null, error: null });

      const { result } = renderHook(() => useNotifications());
      
      await waitFor(() => {
        expect(result.current.notifications).toHaveLength(1);
      });

      await act(async () => {
        await result.current.clearExpired();
      });

      expect(mockSupabaseQuery.delete).toHaveBeenCalled();
    });
  });

  describe('Filtros e Consultas', () => {
    beforeEach(async () => {
      mockSupabaseQuery.then.mockResolvedValue({
        data: mockNotifications,
        error: null
      });
    });

    test('deve filtrar por tipo', async () => {
      const { result } = renderHook(() => useNotifications());
      
      await waitFor(() => {
        expect(result.current.notifications).toHaveLength(2);
      });

      const successNotifications = result.current.getByType('success');
      expect(successNotifications).toHaveLength(1);
      expect(successNotifications[0].type).toBe('success');
    });

    test('deve filtrar por prioridade', async () => {
      const { result } = renderHook(() => useNotifications());
      
      await waitFor(() => {
        expect(result.current.notifications).toHaveLength(2);
      });

      const highPriorityNotifications = result.current.getByPriority('high');
      expect(highPriorityNotifications).toHaveLength(1);
      expect(highPriorityNotifications[0].priority).toBe('high');
    });

    test('deve retornar notificações não lidas', async () => {
      const { result } = renderHook(() => useNotifications());
      
      await waitFor(() => {
        expect(result.current.notifications).toHaveLength(2);
      });

      const unreadNotifications = result.current.getUnread();
      expect(unreadNotifications).toHaveLength(1);
      expect(unreadNotifications[0].read).toBe(false);
    });

    test('deve agrupar por tipo', async () => {
      const { result } = renderHook(() => useNotifications());
      
      await waitFor(() => {
        expect(result.current.notifications).toHaveLength(2);
      });

      const grouped = result.current.groupByType();
      expect(grouped.success).toHaveLength(1);
      expect(grouped.error).toHaveLength(1);
    });

    test('deve calcular estatísticas corretamente', async () => {
      const { result } = renderHook(() => useNotifications());
      
      await waitFor(() => {
        expect(result.current.stats).toEqual({
          total: 2,
          unread: 1,
          urgent: 1,
          byType: {
            success: 1,
            error: 1,
            warning: 0,
            info: 0,
            system: 0
          },
          byPriority: {
            low: 0,
            medium: 1,
            high: 1,
            urgent: 0
          }
        });
      });
    });
  });

  describe('Notificações de Conveniência', () => {
    test('deve criar notificação de sucesso', async () => {
      const { result } = renderHook(() => useNotifications());
      
      await act(async () => {
        await result.current.success('Operação realizada', 'Dados salvos com sucesso');
      });

      expect(mockSupabaseQuery.insert).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'success',
          priority: 'medium',
          title: 'Operação realizada',
          message: 'Dados salvos com sucesso'
        })
      );
    });

    test('deve criar notificação de erro', async () => {
      const { result } = renderHook(() => useNotifications());
      
      await act(async () => {
        await result.current.error('Falha no sistema', 'Erro interno do servidor');
      });

      expect(mockSupabaseQuery.insert).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'error',
          priority: 'high',
          title: 'Falha no sistema',
          message: 'Erro interno do servidor'
        })
      );
    });

    test('deve criar notificação de aviso', async () => {
      const { result } = renderHook(() => useNotifications());
      
      await act(async () => {
        await result.current.warning('Atenção necessária', 'Dados podem estar desatualizados');
      });

      expect(mockSupabaseQuery.insert).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'warning',
          priority: 'medium',
          title: 'Atenção necessária',
          message: 'Dados podem estar desatualizados'
        })
      );
    });

    test('deve criar notificação de informação', async () => {
      const { result } = renderHook(() => useNotifications());
      
      await act(async () => {
        await result.current.info('Nova funcionalidade', 'Dashboard atualizado');
      });

      expect(mockSupabaseQuery.insert).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'info',
          priority: 'low',
          title: 'Nova funcionalidade',
          message: 'Dashboard atualizado'
        })
      );
    });

    test('deve criar notificação de sistema', async () => {
      const { result } = renderHook(() => useNotifications());
      
      await act(async () => {
        await result.current.system('Manutenção programada', 'Sistema será atualizado às 02:00');
      });

      expect(mockSupabaseQuery.insert).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'system',
          priority: 'medium',
          title: 'Manutenção programada',
          message: 'Sistema será atualizado às 02:00'
        })
      );
    });
  });

  describe('Notificações Push', () => {
    test('deve solicitar permissão para notificações', async () => {
      global.Notification.permission = 'default';
      global.Notification.requestPermission = jest.fn().mockResolvedValue('granted');

      const { result } = renderHook(() => useNotifications());
      
      await act(async () => {
        await result.current.requestNotificationPermission();
      });

      expect(global.Notification.requestPermission).toHaveBeenCalled();
    });

    test('deve lidar com permissão negada', async () => {
      global.Notification.permission = 'denied';

      const { result } = renderHook(() => useNotifications());
      
      await act(async () => {
        await result.current.createNotification({
          type: 'error',
          priority: 'high',
          title: 'Erro',
          message: 'Teste'
        });
      });

      // Não deve tentar criar notificação push
      expect(global.Notification).not.toHaveBeenCalled();
    });

    test('deve configurar auto-fechamento de notificação push', async () => {
      const mockNotificationInstance = {
        onclick: null,
        close: jest.fn()
      };
      
      global.Notification = jest.fn().mockReturnValue(mockNotificationInstance) as typeof Notification;
      global.Notification.permission = 'granted';

      const { result } = renderHook(() => useNotifications());
      
      await act(async () => {
        await result.current.createNotification({
          type: 'info',
          priority: 'high',
          title: 'Teste',
          message: 'Auto-fechamento'
        });
      });

      // Simular auto-fechamento após 5 segundos
      jest.advanceTimersByTime(5000);
      expect(mockNotificationInstance.close).toHaveBeenCalled();
    });
  });

  describe('Persistência Local', () => {
    test('deve salvar notificações no localStorage', async () => {
      mockSupabaseQuery.then.mockResolvedValue({
        data: mockNotifications,
        error: null
      });

      renderHook(() => useNotifications());
      
      await waitFor(() => {
        expect(window.localStorage.setItem).toHaveBeenCalledWith(
          'notifications_cache',
          expect.stringContaining('"notifications":')
        );
      });
    });

    test('deve lidar com erro no localStorage', async () => {
      (window.localStorage.setItem as jest.Mock).mockImplementation(() => {
        throw new Error('Storage full');
      });

      mockSupabaseQuery.then.mockResolvedValue({
        data: mockNotifications,
        error: null
      });

      const { result } = renderHook(() => useNotifications());
      
      await waitFor(() => {
        expect(result.current.notifications).toHaveLength(2);
      });

      // Não deve quebrar o funcionamento
      expect(result.current.error).toBeNull();
    });

    test('deve lidar com dados corrompidos no cache', async () => {
      (window.localStorage.getItem as jest.Mock).mockReturnValue('invalid json');
      
      mockConnectivityService.isOnline.mockReturnValue(false);

      const { result } = renderHook(() => useNotifications());
      
      await waitFor(() => {
        expect(result.current.notifications).toEqual([]);
        expect(result.current.loading).toBe(false);
      });
    });
  });

  describe('Conectividade', () => {
    test('deve reagir a mudanças de conectividade', async () => {
      let connectivityCallback: () => void;
      
      mockConnectivityService.on.mockImplementation((event, callback) => {
        if (event === 'online') {
          connectivityCallback = callback;
        }
      });

      mockSupabaseQuery.then.mockResolvedValue({
        data: mockNotifications,
        error: null
      });

      renderHook(() => useNotifications());
      
      // Simular volta da conectividade
      await act(async () => {
        connectivityCallback();
      });

      // Deve recarregar notificações
      expect(mockSupabase.from).toHaveBeenCalledWith('notifications');
    });

    test('deve limpar listeners ao desmontar', () => {
      const { unmount } = renderHook(() => useNotifications());
      
      unmount();
      
      expect(mockConnectivityService.off).toHaveBeenCalledWith('online', expect.any(Function));
      expect(mockConnectivityService.off).toHaveBeenCalledWith('offline', expect.any(Function));
    });
  });

  describe('Subscription em Tempo Real', () => {
    test('deve processar inserção em tempo real', async () => {
      let subscriptionCallback: (payload: { eventType: string; new: NotificationData; old: NotificationData | null }) => void;
      
      mockSupabaseChannel.on.mockImplementation((event, config, callback) => {
        subscriptionCallback = callback;
        return mockSupabaseChannel;
      });

      const { result } = renderHook(() => useNotifications());
      
      const newNotification = {
        ...mockNotifications[0],
        id: 'new-real-time',
        title: 'Nova Notificação'
      };

      await act(async () => {
        subscriptionCallback({
          eventType: 'INSERT',
          new: newNotification,
          old: null
        });
      });

      expect(result.current.notifications).toContainEqual(
        expect.objectContaining({ id: 'new-real-time' })
      );
    });

    test('deve processar atualização em tempo real', async () => {
      let subscriptionCallback: (payload: { eventType: string; new: NotificationData; old: NotificationData | null }) => void;
      
      mockSupabaseChannel.on.mockImplementation((event, config, callback) => {
        subscriptionCallback = callback;
        return mockSupabaseChannel;
      });

      mockSupabaseQuery.then.mockResolvedValue({
        data: mockNotifications,
        error: null
      });

      const { result } = renderHook(() => useNotifications());
      
      await waitFor(() => {
        expect(result.current.notifications).toHaveLength(2);
      });

      const updatedNotification = {
        ...mockNotifications[0],
        read: true
      };

      await act(async () => {
        subscriptionCallback({
          eventType: 'UPDATE',
          new: updatedNotification,
          old: mockNotifications[0]
        });
      });

      const notification = result.current.notifications.find(n => n.id === '1');
      expect(notification?.read).toBe(true);
    });

    test('deve processar exclusão em tempo real', async () => {
      let subscriptionCallback: (payload: { eventType: string; new: NotificationData | null; old: NotificationData | null }) => void;
      
      mockSupabaseChannel.on.mockImplementation((event, config, callback) => {
        subscriptionCallback = callback;
        return mockSupabaseChannel;
      });

      mockSupabaseQuery.then.mockResolvedValue({
        data: mockNotifications,
        error: null
      });

      const { result } = renderHook(() => useNotifications());
      
      await waitFor(() => {
        expect(result.current.notifications).toHaveLength(2);
      });

      await act(async () => {
        subscriptionCallback({
          eventType: 'DELETE',
          new: null,
          old: mockNotifications[0]
        });
      });

      expect(result.current.notifications).toHaveLength(1);
      expect(result.current.notifications.find(n => n.id === '1')).toBeUndefined();
    });
  });

  describe('Performance', () => {
    test('deve lidar com muitas notificações', async () => {
      const manyNotifications = Array.from({ length: 1000 }, (_, i) => ({
        ...mockNotifications[0],
        id: `notification-${i}`,
        title: `Notificação ${i}`
      }));

      mockSupabaseQuery.then.mockResolvedValue({
        data: manyNotifications,
        error: null
      });

      const startTime = performance.now();
      const { result } = renderHook(() => useNotifications());
      
      await waitFor(() => {
        expect(result.current.notifications).toHaveLength(1000);
      });
      
      const endTime = performance.now();
      expect(endTime - startTime).toBeLessThan(1000); // Menos de 1 segundo
    });

    test('deve otimizar atualizações de estado', async () => {
      const renderSpy = jest.fn();
      
      const TestComponent = () => {
        renderSpy();
        return useNotifications();
      };

      const { result } = renderHook(() => TestComponent());
      
      // Múltiplas operações que não devem causar re-renders desnecessários
      await act(async () => {
        await result.current.markAsRead('1');
        await result.current.markAsRead('2');
      });

      // Deve ter renderizado apenas as vezes necessárias
      expect(renderSpy.mock.calls.length).toBeLessThan(10);
    });
  });
});