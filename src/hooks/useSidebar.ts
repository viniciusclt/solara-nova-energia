import React from 'react';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type ModuleType = 'solar' | 'heating' | 'training' | 'equipment-management' | null;

interface SidebarState {
  isOpen: boolean;
  activeModule: string;
  toggle: () => void;
  open: () => void;
  close: () => void;
  setActiveModule: (module: string) => void;
}

export const useSidebar = create<SidebarState>()(
  persist(
    (set, get) => ({
      isOpen: false,
      activeModule: 'lead-data', // Configuração da rota padrão para "Dados do Lead"
      
      toggle: () => set((state) => ({ isOpen: !state.isOpen })),
      
      open: () => set({ isOpen: true }),
      
      close: () => set({ isOpen: false }),
      
      setActiveModule: (module: string) => {
        set({ activeModule: module });
        // Fecha o sidebar automaticamente após selecionar um módulo
        if (module) {
          setTimeout(() => {
            set({ isOpen: false });
          }, 300); // Delay para permitir animação
        }
      },
    }),
    {
      name: 'sidebar-storage',
      partialize: (state) => ({ activeModule: state.activeModule }), // Persiste apenas o módulo ativo
    }
  )
);

// Hook para detectar cliques fora do sidebar
export const useClickOutside = (ref: React.RefObject<HTMLElement>, callback: () => void) => {
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        callback();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [ref, callback]);
};

// Hook para gerenciar teclas de atalho
export const useSidebarKeyboard = () => {
  const { toggle, close } = useSidebar();

  React.useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Ctrl/Cmd + B para toggle do sidebar
      if ((event.ctrlKey || event.metaKey) && event.key === 'b') {
        event.preventDefault();
        toggle();
      }
      
      // Escape para fechar sidebar
      if (event.key === 'Escape') {
        close();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [toggle, close]);
};