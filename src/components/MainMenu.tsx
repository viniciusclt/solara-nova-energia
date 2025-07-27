import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { SolarDashboard } from "./SolarDashboard";
import NotificationCenter from "./NotificationCenter";
import { useNotifications } from "@/hooks/useNotifications";
import { Sidebar } from "./sidebar";
import { useSidebar } from "@/hooks/useSidebar";

export function MainMenu() {
  const [isNotificationCenterOpen, setIsNotificationCenterOpen] = useState(false);
  const { profile } = useAuth();
  const { stats } = useNotifications();


  return (
    <div className="flex">
      <Sidebar 
        onHelpClick={() => console.log('Ajuda clicada')}
      />
      <div className="flex-1">
        <SolarDashboard />
      </div>
      
      {/* Notification Center */}
      <NotificationCenter 
        isOpen={isNotificationCenterOpen}
        onClose={() => setIsNotificationCenterOpen(false)}
      />
    </div>
  );
}