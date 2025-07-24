import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Info } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface VersionInfo {
  version: string;
  buildDate: string;
  environment: 'development' | 'production';
  commitHash?: string;
}

const VersionDisplay: React.FC = () => {
  const getVersionInfo = (): VersionInfo => {
    const isDev = import.meta.env.DEV;
    const isLocalhost = window.location.hostname === 'localhost' || 
                       window.location.hostname === '127.0.0.1';
    
    return {
      version: '2.0.0',
      buildDate: new Date().toLocaleDateString('pt-BR'),
      environment: isDev || isLocalhost ? 'development' : 'production',
      commitHash: import.meta.env.VITE_COMMIT_HASH || 'local'
    };
  };

  const versionInfo = getVersionInfo();
  const isDevelopment = versionInfo.environment === 'development';

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors cursor-help">
            <Info className="h-3 w-3" />
            <span>v{versionInfo.version}</span>
            <Badge 
              variant={isDevelopment ? "secondary" : "outline"}
              className="text-xs px-1 py-0"
            >
              {versionInfo.environment === 'development' ? 'DEV' : 'PROD'}
            </Badge>
          </div>
        </TooltipTrigger>
        <TooltipContent side="top" className="text-xs">
          <div className="space-y-1">
            <div><strong>Versão:</strong> {versionInfo.version}</div>
            <div><strong>Ambiente:</strong> {versionInfo.environment}</div>
            <div><strong>Build:</strong> {versionInfo.buildDate}</div>
            {versionInfo.commitHash && versionInfo.commitHash !== 'local' && (
              <div><strong>Commit:</strong> {versionInfo.commitHash.substring(0, 7)}</div>
            )}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

export default VersionDisplay;