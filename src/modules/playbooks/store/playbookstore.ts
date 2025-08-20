import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { Block, Playbook, EditorSettings } from '../types/editor';
import { logError, logInfo } from '@/utils/secureLogger';

// Interface do store
interface PlaybookStore {
  // Estado
  playbooks: Playbook[];
  selectedPlaybook: Playbook | null;
  isLoading: boolean;
  editorSettings: EditorSettings;
  
  // Ações
  setPlaybooks: (playbooks: Playbook[]) => void;
  addPlaybook: (playbook: Playbook) => void;
  updatePlaybook: (playbookId: string, updates: Partial<Playbook>) => void;
  removePlaybook: (playbookId: string) => void;
  setSelectedPlaybook: (playbook: Playbook | null) => void;
  setLoading: (loading: boolean) => void;
  updateEditorSettings: (settings: Partial<EditorSettings>) => void;
  
  // Ações de playbook
  createPlaybook: (data: Partial<Playbook>) => string;
  deletePlaybook: (playbookId: string) => void;
  duplicatePlaybook: (playbookId: string) => string;
  
  // Getters
  getPlaybookById: (id: string) => Playbook | undefined;
}

// Store Zustand com devtools
export const usePlaybookStore = create<PlaybookStore>()(devtools(
  (set, get) => ({
    // Estado inicial
    playbooks: [],
    selectedPlaybook: null,
    isLoading: false,
    editorSettings: {
      theme: 'light',
      fontSize: 'medium',
      autoSave: true,
      autoSaveInterval: 30000,
      showLineNumbers: false,
      enableComments: true,
      enableCollaboration: true,
      enableVersioning: true,
      enableAnalytics: false,
      enableSpellCheck: true,
      enableGrammarCheck: false,
      enableReadingTime: true,
      enableWordCount: true,
      enableBlockCount: true,
    },
    
    // Definir lista de playbooks
    setPlaybooks: (playbooks: Playbook[]) => {
      set({ playbooks }, false, 'setPlaybooks');
    },
    
    // Adicionar novo playbook
    addPlaybook: (playbook: Playbook) => {
      const currentPlaybooks = get().playbooks;
      set({ playbooks: [playbook, ...currentPlaybooks] }, false, 'addPlaybook');
    },
    
    // Atualizar playbook existente
    updatePlaybook: (playbookId: string, updates: Partial<Playbook>) => {
      const currentPlaybooks = get().playbooks;
      const updatedPlaybooks = currentPlaybooks.map(playbook => 
        playbook.id === playbookId ? { ...playbook, ...updates } : playbook
      );
      set({ playbooks: updatedPlaybooks }, false, 'updatePlaybook');
      
      // Atualizar playbook selecionado se for o mesmo
      const selectedPlaybook = get().selectedPlaybook;
      if (selectedPlaybook && selectedPlaybook.id === playbookId) {
        set({ selectedPlaybook: { ...selectedPlaybook, ...updates } }, false, 'updateSelectedPlaybook');
      }
    },
    
    // Remover playbook
    removePlaybook: (playbookId: string) => {
      const currentPlaybooks = get().playbooks;
      const filteredPlaybooks = currentPlaybooks.filter(playbook => playbook.id !== playbookId);
      set({ playbooks: filteredPlaybooks }, false, 'removePlaybook');
      
      // Limpar playbook selecionado se for o mesmo
      const selectedPlaybook = get().selectedPlaybook;
      if (selectedPlaybook && selectedPlaybook.id === playbookId) {
        set({ selectedPlaybook: null }, false, 'clearSelectedPlaybook');
      }
    },
    
    // Definir playbook selecionado
    setSelectedPlaybook: (playbook: Playbook | null) => {
      set({ selectedPlaybook: playbook }, false, 'setSelectedPlaybook');
    },
    
    // Definir estado de carregamento
    setLoading: (loading: boolean) => {
      set({ isLoading: loading }, false, 'setLoading');
    },
    
    // Atualizar configurações do editor
    updateEditorSettings: (settings: Partial<EditorSettings>) => {
      const currentSettings = get().editorSettings;
      set({ 
        editorSettings: { ...currentSettings, ...settings } 
      }, false, 'updateEditorSettings');
    },
    
    // Criar novo playbook
    createPlaybook: (data: Partial<Playbook>) => {
      const newId = `playbook-${Date.now()}`;
      const now = new Date().toISOString();
      
      const newPlaybook: Playbook = {
        id: newId,
        title: data.title || 'Novo Playbook',
        description: data.description || '',
        icon: data.icon,
        cover: data.cover,
        blocks: data.blocks || [],
        tags: data.tags || [],
        category: data.category || 'general',
        difficulty: data.difficulty || 'beginner',
        estimatedTime: data.estimatedTime || 30,
        visibility: data.visibility || 'private',
        template: data.template || false,
        version: data.version || '1.0.0',
        createdAt: now,
        updatedAt: now,
        author: data.author || {
          id: 'user-1',
          name: 'Usuário',
          email: 'usuario@exemplo.com',
          avatar: ''
        },
        collaborators: data.collaborators || [],
        isPublic: data.isPublic || false,
        settings: data.settings,
        metadata: {
          wordCount: 0,
          readingTime: 1,
          lastEditedBy: data.author?.id || 'user-1',
          ...data.metadata
        }
      };
      
      const { addPlaybook } = get();
      addPlaybook(newPlaybook);
      
      logInfo('Playbook criado', {
        playbookId: newId,
        title: newPlaybook.title,
        service: 'PlaybookStore'
      });
      
      return newId;
    },
    
    // Deletar playbook
    deletePlaybook: (playbookId: string) => {
      const { removePlaybook } = get();
      removePlaybook(playbookId);
      
      logInfo('Playbook deletado', {
        playbookId,
        service: 'PlaybookStore'
      });
    },
    
    // Duplicar playbook
    duplicatePlaybook: (playbookId: string) => {
      const playbook = get().getPlaybookById(playbookId);
      if (!playbook) {
        logError('Playbook não encontrado para duplicação', {
          playbookId,
          service: 'PlaybookStore'
        });
        throw new Error('Playbook não encontrado');
      }
      
      const { createPlaybook } = get();
      const duplicatedId = createPlaybook({
        ...playbook,
        title: `${playbook.title} (Cópia)`,
        id: undefined // Será gerado um novo ID
      });
      
      logInfo('Playbook duplicado', {
        originalId: playbookId,
        duplicatedId,
        service: 'PlaybookStore'
      });
      
      return duplicatedId;
    },
    
    // Obter playbook por ID
    getPlaybookById: (id: string) => {
      const { playbooks } = get();
      return playbooks.find(playbook => playbook.id === id);
    }
  }),
  {
    name: 'playbook-store'
  }
));