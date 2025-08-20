import { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Database, Info } from 'lucide-react';
import { DemoDataService } from '@/services/DemoDataService';
import { EnvironmentDetector } from '@/utils/EnvironmentDetector';

/**
 * Componente que indica quando dados de demonstração estão sendo usados
 * Aparece apenas em localhost durante desenvolvimento
 */
export function DemoDataIndicator() {
  const [showIndicator, setShowIndicator] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [environmentInfo, setEnvironmentInfo] = useState<{ hostname: string; mode: string } | null>(null);

  useEffect(() => {
    const demoService = DemoDataService.getInstance();
    const shouldShow = demoService.shouldUseDemoData();
    
    setShowIndicator(shouldShow);
    
    if (shouldShow) {
      setEnvironmentInfo(EnvironmentDetector.getEnvironmentInfo());
      
      // Ocultar o texto após 5 segundos
      const timer = setTimeout(() => {
        setIsCollapsed(true);
      }, 5000);
      
      return () => clearTimeout(timer);
    }
  }, []);

  if (!showIndicator) {
    return null;
  }

  return (
    <div 
      className="fixed top-4 right-20 z-50 transition-all duration-300 ease-in-out group"
      onMouseEnter={() => setIsCollapsed(false)}
      onMouseLeave={() => setIsCollapsed(true)}
    >
      <Alert className={`border-orange-200 bg-orange-50 transition-all duration-300 ${
        isCollapsed ? 'w-12 h-12 p-2' : 'max-w-sm p-4'
      }`}>
        <Database className={`text-orange-600 transition-all duration-300 ${
          isCollapsed ? 'h-6 w-6' : 'h-4 w-4'
        }`} />
        {!isCollapsed && (
          <AlertDescription className="text-orange-800">
            <div className="flex items-center gap-2 mb-2">
              <Badge variant="outline" className="text-orange-700 border-orange-300">
                <Info className="h-3 w-3 mr-1" />
                Modo Demonstração
              </Badge>
            </div>
            <p className="text-sm">
              Dados de demonstração ativos em localhost.
              <br />
              <span className="text-xs text-orange-600">
                5 leads, 2 módulos e 2 inversores disponíveis.
              </span>
            </p>
            {environmentInfo && (
              <div className="mt-2 text-xs text-orange-600">
                <div>Hostname: {environmentInfo.hostname}</div>
                <div>Modo: {environmentInfo.mode}</div>
              </div>
            )}
          </AlertDescription>
        )}
      </Alert>
    </div>
  );
}