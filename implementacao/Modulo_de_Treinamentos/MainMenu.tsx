import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { SolarDashboard } from "./SolarDashboard";
import { TrainingMain } from "@/pages/training";
import NotificationCenter from "./NotificationCenter";
import { useNotifications } from "@/hooks/useNotifications";
import { Sidebar } from "./sidebar";
import { useSidebar } from "@/hooks/useSidebar";

export function MainMenu() {
  const [isNotificationCenterOpen, setIsNotificationCenterOpen] = useState(false);
  useAuth();
  useNotifications();
  const { activeModule } = useSidebar();

  const renderActiveModule = () => {
    switch (activeModule) {
      case 'training':
        return <TrainingMain />;
      case 'solar':
      default:
        return <SolarDashboard />;
    }
  };

  return (
    <div className="flex">
      <Sidebar 
        onHelpClick={() => console.log('Ajuda clicada')}
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