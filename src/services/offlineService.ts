import { supabase } from '@/integrations/supabase/client';
import { SolarModule } from '@/types';

interface OfflineData {
  modules: SolarModule[];
  lastSync: number;
  pendingChanges: {
    modules: {
      create: SolarModule[];
      update: SolarModule[];
      delete: string[];
    };
  };
}

class OfflineService {
  private static instance: OfflineService;
  private isOnline: boolean = navigator.onLine;
  private syncInProgress: boolean = false;
  private readonly STORAGE_KEY = 'solara_offline_data';
  private readonly SYNC_INTERVAL = 30000; // 30 segundos
  private syncTimer: NodeJS.Timeout | null = null;

  private constructor() {
    this.setupOnlineListener();
    this.startPeriodicSync();
  }

  static getInstance(): OfflineService {
    if (!OfflineService.instance) {
      OfflineService.instance = new OfflineService();
    }
    return OfflineService.instance;
  }

  private setupOnlineListener() {
    window.addEventListener('online', () => {
      this.isOnline = true;
      console.log('Conexão restaurada - iniciando sincronização...');
      this.syncPendingChanges();
    });

    window.addEventListener('offline', () => {
      this.isOnline = false;
      console.log('Conexão perdida - modo offline ativado');
    });
  }

  private startPeriodicSync() {
    this.syncTimer = setInterval(() => {
      if (this.isOnline && !this.syncInProgress) {
        this.syncPendingChanges();
      }
    }, this.SYNC_INTERVAL);
  }

  private getOfflineData(): OfflineData {
    const stored = localStorage.getItem(this.STORAGE_KEY);
    if (stored) {
      try {
        return JSON.parse(stored);
      } catch (error) {
        console.error('Erro ao carregar dados offline:', error);
      }
    }
    
    return {
      modules: [],
      lastSync: 0,
      pendingChanges: {
        modules: {
          create: [],
          update: [],
          delete: []
        }
      }
    };
  }

  private saveOfflineData(data: OfflineData) {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(data));
    } catch (error) {
      console.error('Erro ao salvar dados offline:', error);
    }
  }

  async getModules(): Promise<SolarModule[]> {
    if (this.isOnline) {
      try {
        const { data, error } = await supabase
          .from('modules' as never)
          .select('*')
          .order('name');

        if (!error && data) {
          // Atualizar cache local
          const offlineData = this.getOfflineData();
          offlineData.modules = data as SolarModule[];
          offlineData.lastSync = Date.now();
          this.saveOfflineData(offlineData);
          return data as SolarModule[];
        }
      } catch (error) {
        console.warn('Erro ao buscar módulos online, usando cache:', error);
      }
    }

    // Fallback para dados offline
    const offlineData = this.getOfflineData();
    return offlineData.modules;
  }

  async saveModule(module: SolarModule, isEditing: boolean = false): Promise<boolean> {
    const offlineData = this.getOfflineData();

    if (this.isOnline) {
      try {
        let result;
        if (isEditing && module.id) {
          result = await supabase
            .from('modules' as never)
            .update(module as never)
            .eq('id', module.id);
        } else {
          result = await supabase
            .from('modules' as never)
            .insert(module as never);
        }

        if (!result.error) {
          // Atualizar cache local
          if (isEditing) {
            const index = offlineData.modules.findIndex(m => m.id === module.id);
            if (index !== -1) {
              offlineData.modules[index] = module;
            }
          } else {
            offlineData.modules.push(module);
          }
          this.saveOfflineData(offlineData);
          return true;
        }
      } catch (error) {
        console.warn('Erro ao salvar online, salvando offline:', error);
      }
    }

    // Salvar offline para sincronização posterior
    if (isEditing) {
      // Atualizar no cache local
      const index = offlineData.modules.findIndex(m => m.id === module.id);
      if (index !== -1) {
        offlineData.modules[index] = module;
      }
      // Adicionar à lista de pendências
      const updateIndex = offlineData.pendingChanges.modules.update.findIndex(m => m.id === module.id);
      if (updateIndex !== -1) {
        offlineData.pendingChanges.modules.update[updateIndex] = module;
      } else {
        offlineData.pendingChanges.modules.update.push(module);
      }
    } else {
      // Gerar ID temporário para novos módulos
      const tempId = `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const moduleWithTempId = { ...module, id: tempId };
      
      offlineData.modules.push(moduleWithTempId);
      offlineData.pendingChanges.modules.create.push(moduleWithTempId);
    }

    this.saveOfflineData(offlineData);
    return true;
  }

  async deleteModule(id: string): Promise<boolean> {
    const offlineData = this.getOfflineData();

    if (this.isOnline) {
      try {
        const { error } = await supabase
          .from('modules' as never)
          .delete()
          .eq('id', id);

        if (!error) {
          // Remover do cache local
          offlineData.modules = offlineData.modules.filter(m => m.id !== id);
          this.saveOfflineData(offlineData);
          return true;
        }
      } catch (error) {
        console.warn('Erro ao deletar online, salvando para sincronização:', error);
      }
    }

    // Remover do cache local
    offlineData.modules = offlineData.modules.filter(m => m.id !== id);
    
    // Se é um ID temporário, remover das pendências de criação
    if (id.startsWith('temp_')) {
      offlineData.pendingChanges.modules.create = offlineData.pendingChanges.modules.create.filter(m => m.id !== id);
    } else {
      // Adicionar à lista de exclusões pendentes
      if (!offlineData.pendingChanges.modules.delete.includes(id)) {
        offlineData.pendingChanges.modules.delete.push(id);
      }
    }

    this.saveOfflineData(offlineData);
    return true;
  }

  async syncPendingChanges(): Promise<void> {
    if (!this.isOnline || this.syncInProgress) {
      return;
    }

    this.syncInProgress = true;
    const offlineData = this.getOfflineData();
    let hasChanges = false;

    try {
      // Sincronizar criações
      for (const module of offlineData.pendingChanges.modules.create) {
        try {
          const moduleToCreate = { ...module };
          delete moduleToCreate.id; // Remover ID temporário
          
          const { data, error } = await supabase
            .from('modules' as never)
            .insert(moduleToCreate as never)
            .select()
            .single();

          if (!error && data) {
            // Atualizar o módulo no cache com o ID real
            const index = offlineData.modules.findIndex(m => m.id === module.id);
            if (index !== -1) {
              offlineData.modules[index] = data as SolarModule;
            }
            hasChanges = true;
          }
        } catch (error) {
          console.error('Erro ao sincronizar criação de módulo:', error);
        }
      }

      // Sincronizar atualizações
      for (const module of offlineData.pendingChanges.modules.update) {
        try {
          const { error } = await supabase
            .from('modules' as never)
            .update(module as never)
            .eq('id', module.id);

          if (!error) {
            hasChanges = true;
          }
        } catch (error) {
          console.error('Erro ao sincronizar atualização de módulo:', error);
        }
      }

      // Sincronizar exclusões
      for (const id of offlineData.pendingChanges.modules.delete) {
        try {
          const { error } = await supabase
            .from('modules' as never)
            .delete()
            .eq('id', id);

          if (!error) {
            hasChanges = true;
          }
        } catch (error) {
          console.error('Erro ao sincronizar exclusão de módulo:', error);
        }
      }

      if (hasChanges) {
        // Limpar pendências após sincronização bem-sucedida
        offlineData.pendingChanges = {
          modules: {
            create: [],
            update: [],
            delete: []
          }
        };
        offlineData.lastSync = Date.now();
        this.saveOfflineData(offlineData);
        
        console.log('Sincronização concluída com sucesso');
        
        // Disparar evento customizado para notificar componentes
        window.dispatchEvent(new CustomEvent('offline-sync-complete'));
      }
    } catch (error) {
      console.error('Erro durante sincronização:', error);
    } finally {
      this.syncInProgress = false;
    }
  }

  hasPendingChanges(): boolean {
    const offlineData = this.getOfflineData();
    const { create, update, delete: del } = offlineData.pendingChanges.modules;
    return create.length > 0 || update.length > 0 || del.length > 0;
  }

  getLastSyncTime(): number {
    return this.getOfflineData().lastSync;
  }

  isOfflineMode(): boolean {
    return !this.isOnline;
  }

  destroy() {
    if (this.syncTimer) {
      clearInterval(this.syncTimer);
    }
  }
}

export default OfflineService;