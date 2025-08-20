import React, { useRef } from 'react';
import { 
  Home, 
  Flame, 
  GraduationCap, 
  HelpCircle, 
  Settings, 
  LogOut,
  X,
  Wrench,
  Droplets,
  Waves,
  Zap
} from 'lucide-react';
import { useSidebar, useClickOutside, useSidebarKeyboard, useSidebarAutoDetect } from '../../../hooks/useSidebar';
import { SidebarItem } from './SidebarItem';
import { SidebarSection } from './SidebarSection';
import { useAuth } from '../../../contexts/AuthContext';
import { Button } from '../../../components/ui/button';
import { SettingsModal } from '../../../components/SettingsModal';
import { logError } from '../../../utils/secureLogger';

interface SidebarProps {
  onHelpClick?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  onHelpClick
}) => {
  const { isOpen, close } = useSidebar();
  const { signOut } = useAuth();
  const sidebarRef = useRef<HTMLDivElement>(null);

  // Fecha sidebar ao clicar fora
  useClickOutside(sidebarRef, close);
  
  // Atalhos de teclado
  useSidebarKeyboard();
  
  // Detecção automática do módulo ativo baseado na rota
  useSidebarAutoDetect();

  const handleLogout = async () => {
    try {
      await signOut();
      close();
    } catch (error) {
      logError({
        service: 'Sidebar',
        action: 'logout',
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      });
    }
  };

  return (
    <>
      {/* Backdrop para mobile */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={close}
          aria-hidden="true"
        />
      )}
      
      {/* Sidebar */}
      <div
        ref={sidebarRef}
        id="sidebar"
        className={`
          fixed top-0 left-0 h-full w-64 bg-white dark:bg-gray-900 
          border-r border-gray-200 dark:border-gray-700
          transform transition-transform duration-300 ease-in-out z-50
          flex flex-col
          ${isOpen ? 'translate-x-0' : '-translate-x-full'}
          lg:${isOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
        aria-hidden={!isOpen}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">S</span>
            </div>
            <span className="font-semibold text-gray-900 dark:text-white">
              Solara
            </span>
          </div>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={close}
            className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 lg:hidden"
            aria-label="Fechar sidebar"
          >
            <X size={16} />
          </Button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-4 px-2">
          {/* Início */}
          <SidebarSection>
            <SidebarItem
              icon={Home}
              label="Início"
              module="home"
            />
          </SidebarSection>
          
          {/* Espaçamento */}
          <div className="my-4" />
          
          {/* Módulos Principais */}
          <SidebarSection title="Módulos">
            <SidebarItem
              icon={Flame}
              label="Fotovoltaico"
              module="solar"
            />
            <SidebarItem
              icon={Droplets}
              label="Aquecimento Banho"
              module="heating-bath"
            />
            <SidebarItem
              icon={Waves}
              label="Aquecimento Piscina"
              module="heating-pool"
            />
            <SidebarItem
              icon={Zap}
              label="WallBox"
              module="wallbox"
            />
          </SidebarSection>
          
          {/* Espaçamento */}
          <div className="my-4" />
          
          {/* Seção Secundária */}
          <SidebarSection>
            <SidebarItem
              icon={GraduationCap}
              label="Treinamentos"
              module="training"
            />
          </SidebarSection>
        </nav>

        {/* Footer - Utilitários */}
        <div className="border-t border-gray-200 dark:border-gray-700 p-2 mt-auto">
          <SidebarSection>
            <SidebarItem
              icon={HelpCircle}
              label="Ajuda"
              onClick={onHelpClick}
            />
            <div className="w-full px-2 py-1">
              <SettingsModal />
            </div>
            <SidebarItem
              icon={LogOut}
              label="Sair"
              onClick={handleLogout}
              className="text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20"
            />
          </SidebarSection>
        </div>
      </div>
    </>
  );
};

export default Sidebar;