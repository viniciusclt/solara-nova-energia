import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { 
  Settings, 
  Sheet, 
  HardDrive, 
  FileText, 
  Activity, 
  Database,
  Shield,
  Bell,
  Palette,
  Globe
} from "lucide-react";
import { GoogleSheetsSettings } from "./GoogleSheetsSettings";
import { BackupSettings } from "./BackupSettings";
import { AuditSettings } from "./AuditSettings";
import { PerformanceSettings } from "./PerformanceSettings";

interface SettingsContainerProps {
  isOpen: boolean;
  onClose: () => void;
  defaultTab?: string;
}

interface SettingsTab {
  id: string;
  label: string;
  icon: React.ReactNode;
  badge?: string;
  component: React.ReactNode;
  description: string;
}

export const SettingsContainer: React.FC<SettingsContainerProps> = ({ 
  isOpen, 
  onClose, 
  defaultTab = "general" 
}) => {
  const [activeTab, setActiveTab] = useState(defaultTab);

  const settingsTabs: SettingsTab[] = [
    {
      id: "general",
      label: "Geral",
      icon: <Settings className="h-4 w-4" />,
      description: "Configurações gerais do sistema",
      component: (
        <div className="space-y-6">
          <div className="text-center py-12">
            <Settings className="h-12 w-12 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Configurações Gerais</h3>
            <p className="text-gray-500">Esta seção será implementada em breve.</p>
          </div>
        </div>
      )
    },
    {
      id: "integrations",
      label: "Integrações",
      icon: <Sheet className="h-4 w-4" />,
      badge: "Google Sheets",
      description: "Configurações de integrações externas",
      component: <GoogleSheetsSettings />
    },
    {
      id: "backup",
      label: "Backup",
      icon: <HardDrive className="h-4 w-4" />,
      description: "Configurações de backup e restauração",
      component: <BackupSettings />
    },
    {
      id: "audit",
      label: "Auditoria",
      icon: <FileText className="h-4 w-4" />,
      description: "Logs de auditoria e monitoramento",
      component: <AuditSettings />
    },
    {
      id: "performance",
      label: "Performance",
      icon: <Activity className="h-4 w-4" />,
      badge: "Monitoramento",
      description: "Monitoramento e otimização de performance",
      component: <PerformanceSettings />
    },
    {
      id: "database",
      label: "Banco de Dados",
      icon: <Database className="h-4 w-4" />,
      description: "Configurações do banco de dados",
      component: (
        <div className="space-y-6">
          <div className="text-center py-12">
            <Database className="h-12 w-12 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Configurações do Banco</h3>
            <p className="text-gray-500">Esta seção será implementada em breve.</p>
          </div>
        </div>
      )
    },
    {
      id: "security",
      label: "Segurança",
      icon: <Shield className="h-4 w-4" />,
      description: "Configurações de segurança e autenticação",
      component: (
        <div className="space-y-6">
          <div className="text-center py-12">
            <Shield className="h-12 w-12 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Configurações de Segurança</h3>
            <p className="text-gray-500">Esta seção será implementada em breve.</p>
          </div>
        </div>
      )
    },
    {
      id: "notifications",
      label: "Notificações",
      icon: <Bell className="h-4 w-4" />,
      description: "Configurações de notificações e alertas",
      component: (
        <div className="space-y-6">
          <div className="text-center py-12">
            <Bell className="h-12 w-12 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Configurações de Notificações</h3>
            <p className="text-gray-500">Esta seção será implementada em breve.</p>
          </div>
        </div>
      )
    },
    {
      id: "appearance",
      label: "Aparência",
      icon: <Palette className="h-4 w-4" />,
      description: "Configurações de tema e interface",
      component: (
        <div className="space-y-6">
          <div className="text-center py-12">
            <Palette className="h-12 w-12 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Configurações de Aparência</h3>
            <p className="text-gray-500">Esta seção será implementada em breve.</p>
          </div>
        </div>
      )
    },
    {
      id: "localization",
      label: "Localização",
      icon: <Globe className="h-4 w-4" />,
      description: "Configurações de idioma e região",
      component: (
        <div className="space-y-6">
          <div className="text-center py-12">
            <Globe className="h-12 w-12 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Configurações de Localização</h3>
            <p className="text-gray-500">Esta seção será implementada em breve.</p>
          </div>
        </div>
      )
    }
  ];

  const currentTab = settingsTabs.find(tab => tab.id === activeTab) || settingsTabs[0];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] p-0">
        <DialogHeader className="px-6 py-4 border-b">
          <DialogTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Configurações do Sistema
          </DialogTitle>
          <p className="text-sm text-gray-500 mt-1">
            {currentTab.description}
          </p>
        </DialogHeader>
        
        <div className="flex h-[calc(90vh-120px)]">
          {/* Sidebar com abas */}
          <div className="w-64 border-r bg-gray-50/50">
            <ScrollArea className="h-full">
              <div className="p-4 space-y-1">
                {settingsTabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full flex items-center gap-3 px-3 py-2 text-left rounded-lg transition-colors ${
                      activeTab === tab.id
                        ? "bg-primary text-primary-foreground"
                        : "hover:bg-gray-100 text-gray-700"
                    }`}
                  >
                    {tab.icon}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium truncate">
                          {tab.label}
                        </span>
                        {tab.badge && (
                          <Badge 
                            variant={activeTab === tab.id ? "secondary" : "outline"} 
                            className="text-xs"
                          >
                            {tab.badge}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </ScrollArea>
          </div>
          
          {/* Conteúdo principal */}
          <div className="flex-1">
            <ScrollArea className="h-full">
              <div className="p-6">
                {currentTab.component}
              </div>
            </ScrollArea>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

// Hook para facilitar o uso do SettingsContainer
export const useSettings = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [defaultTab, setDefaultTab] = useState("general");

  const openSettings = (tab?: string) => {
    if (tab) setDefaultTab(tab);
    setIsOpen(true);
  };

  const closeSettings = () => {
    setIsOpen(false);
  };

  return {
    isOpen,
    defaultTab,
    openSettings,
    closeSettings,
    SettingsModal: () => (
      <SettingsContainer 
        isOpen={isOpen} 
        onClose={closeSettings} 
        defaultTab={defaultTab} 
      />
    )
  };
};