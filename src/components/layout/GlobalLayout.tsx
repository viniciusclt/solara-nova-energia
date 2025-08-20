import React from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from '@/core/components/layout/Sidebar';
import { AppHeader } from './AppHeader';
import { useSidebar } from '@/hooks/useSidebar';
import { cn } from '@/lib/utils';

interface GlobalLayoutProps {
  children?: React.ReactNode;
}

export const GlobalLayout: React.FC<GlobalLayoutProps> = ({ children }) => {
  const { isOpen } = useSidebar();

  return (
    <div className="min-h-screen bg-background">
      <div className="flex h-screen">
        {/* Sidebar */}
        <Sidebar />
        
        {/* Main Content Area */}
        <div className={cn(
          "flex-1 flex flex-col transition-all duration-300",
          isOpen ? "ml-64" : "ml-0"
        )}>
          {/* Header */}
          <AppHeader />
          
          {/* Page Content */}
          <main className="flex-1 overflow-auto p-6">
            {children || <Outlet />}
          </main>
        </div>
      </div>
    </div>
  );
};

export default GlobalLayout;