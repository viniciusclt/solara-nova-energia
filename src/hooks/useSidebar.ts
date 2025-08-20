import { useEffect, useRef } from 'react';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { useLocation } from 'react-router-dom';

export type ModuleType = 'home' | 'solar' | 'heating-bath' | 'heating-pool' | 'wallbox' | 'training' | 'equipment-management' | null;

interface SidebarState {
  isOpen: boolean;
  activeModule: string;
  toggle: () => void;
  open: () => void;
  close: () => void;
  setActiveModule: (module: string) => void;
}

// Função para detectar o módulo ativo baseado na rota
const getModuleFromPath = (pathname: string): string => {
  if (pathname === '/' || pathname === '/home') return 'home';
  if (pathname.startsWith('/fv') || pathname.startsWith('/solar')) return 'solar';
  if (pathname.startsWith('/training')) return 'training';
  if (pathname.startsWith('/heating-bath')) return 'heating-bath';
  if (pathname.startsWith('/heating-pool')) return 'heating-pool';
  if (pathname.startsWith('/wallbox')) return 'wallbox';
  if (pathname.startsWith('/equipment')) return 'equipment-management';
  return 'home'; // fallback
};

export const useSidebar = create<SidebarState>()(
  persist(
    (set, get) => ({
      isOpen: false,
      activeModule: 'home',
      
      toggle: () => set((state) => ({ isOpen: !state.isOpen })),
      
      open: () => set({ isOpen: true }),
      
      close: () => set({ isOpen: false }),
      
      setActiveModule: (module: string) => {
        set({ activeModule: module });
      },
    }),
    {
      name: 'sidebar-storage',
      partialize: (state) => ({ activeModule: state.activeModule }),
      // Forçar que isOpen sempre inicie como false
      onRehydrateStorage: () => (state) => {
        if (state) {
          state.isOpen = false;
        }
      },
    }
  )
);

// Hook para detectar cliques fora do sidebar
export const useClickOutside = (ref: React.RefObject<HTMLElement>, callback: () => void) => {
  useEffect(() => {
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

  useEffect(() => {
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

// Hook para detectar automaticamente o módulo ativo baseado na rota
export const useSidebarAutoDetect = () => {
  const location = useLocation();
  const { setActiveModule, activeModule } = useSidebar();

  useEffect(() => {
    const currentModule = getModuleFromPath(location.pathname);
    if (currentModule !== activeModule) {
      setActiveModule(currentModule);
    }
  }, [location.pathname, activeModule, setActiveModule]);
};