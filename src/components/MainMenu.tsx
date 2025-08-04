import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate, useLocation } from "react-router-dom";
import { SolarDashboard } from "./SolarDashboard";
import NotificationCenter from "./NotificationCenter";
import { useNotifications } from "@/hooks/useNotifications";
import { Sidebar } from "./sidebar";
import { useSidebar } from "@/hooks/useSidebar";
import { logInfo } from "@/utils/secureLogger";
import { TrainingMain } from "@/pages/training";

export function MainMenu() {
  const [isNotificationCenterOpen, setIsNotificationCenterOpen] = useState(false);
  const { } = useAuth();
  const { } = useNotifications();
  const { activeModule } = useSidebar();
  const navigate = useNavigate();
  const location = useLocation();

  const renderActiveModule = () => {
    // Se estamos em uma rota de treinamento, não renderizar aqui
    if (location.pathname.startsWith('/training')) {
      return null;
    }
    
    switch (activeModule) {
      case 'training':
        // Navegar para a rota de treinamentos
        navigate('/training');
        return null;
      default:
        return <SolarDashboard />;
    }
  };

  return (
    <div className="flex">
      <Sidebar 
        onHelpClick={() => logInfo({
          service: 'MainMenu',
          action: 'helpClick',
          message: 'Usuário clicou em ajuda'
        })}
      />
      <div className="flex-1">
        {renderActiveModule()}
      </div>
      
      {/* Notification Center */}
      <NotificationCenter 
        isOpen={isNotificationCenterOpen}
        onClose={() => setIsNotificationCenterOpen(false)}
      />
    </div>
  );
}