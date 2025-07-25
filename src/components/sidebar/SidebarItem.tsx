import React from 'react';
import { LucideIcon } from 'lucide-react';
import { ModuleType, useSidebar } from '../../hooks/useSidebar';

interface SidebarItemProps {
  icon: LucideIcon;
  label: string;
  module?: ModuleType;
  onClick?: () => void;
  isActive?: boolean;
  className?: string;
}

export const SidebarItem: React.FC<SidebarItemProps> = ({
  icon: Icon,
  label,
  module,
  onClick,
  isActive = false,
  className = ''
}) => {
  const { setActiveModule, activeModule } = useSidebar();
  
  const isCurrentModule = module && activeModule === module;
  const isItemActive = isActive || isCurrentModule;

  const handleClick = () => {
    if (module) {
      setActiveModule(module);
    }
    if (onClick) {
      onClick();
    }
  };

  return (
    <button
      onClick={handleClick}
      className={`
        w-full flex items-center gap-3 px-4 py-3 text-left
        transition-all duration-200 rounded-lg group
        hover:bg-gray-100 dark:hover:bg-gray-800
        focus:outline-none focus:ring-2 focus:ring-blue-500
        ${isItemActive 
          ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 border-r-2 border-blue-500' 
          : 'text-gray-700 dark:text-gray-300'
        }
        ${className}
      `}
      aria-current={isItemActive ? 'page' : undefined}
    >
      <Icon 
        size={20} 
        className={`
          transition-colors duration-200
          ${isItemActive 
            ? 'text-blue-600 dark:text-blue-400' 
            : 'text-gray-500 dark:text-gray-400 group-hover:text-gray-700 dark:group-hover:text-gray-200'
          }
        `}
      />
      <span className={`
        font-medium transition-colors duration-200
        ${isItemActive 
          ? 'text-blue-600 dark:text-blue-400' 
          : 'text-gray-700 dark:text-gray-300 group-hover:text-gray-900 dark:group-hover:text-gray-100'
        }
      `}>
        {label}
      </span>
    </button>
  );
};

export default SidebarItem;