import React from 'react';
import { Menu } from 'lucide-react';
import { useSidebar } from '../../hooks/useSidebar';
import { Button } from '../ui/button';

interface SidebarToggleProps {
  className?: string;
}

export const SidebarToggle: React.FC<SidebarToggleProps> = ({ className = '' }) => {
  const { toggle, isOpen } = useSidebar();

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={toggle}
      className={`
        p-2 hover:bg-gray-100 dark:hover:bg-gray-800 
        transition-colors duration-200 rounded-md
        focus:outline-none focus:ring-2 focus:ring-blue-500
        ${className}
      `}
      aria-label={isOpen ? 'Fechar menu' : 'Abrir menu'}
      aria-expanded={isOpen}
      aria-controls="sidebar"
    >
      <Menu 
        size={20} 
        className="text-gray-600 dark:text-gray-300" 
      />
    </Button>
  );
};

export default SidebarToggle;