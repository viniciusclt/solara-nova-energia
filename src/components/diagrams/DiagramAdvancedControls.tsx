// ============================================================================
// Controles Avançados para Diagramas
// ============================================================================

import React, { memo, useRef, useState } from 'react';
import {
  Download,
  Upload,
  Map,
  Settings,
  MoreVertical,
  FileText,
  Image,
  Camera,
  Grid,
  Eye,
  EyeOff
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { secureLogger } from '@/utils/secureLogger';
import { useDiagramExport } from './hooks/useDiagramExport';
import { useDiagramImport } from './hooks/useDiagramImport';
import { useDiagramMinimap } from './DiagramMinimap';
import { useDiagramStore } from './stores/useDiagramStore';
import type { ExportFormat } from './types';

interface DiagramAdvancedControlsProps {
  className?: string;
  position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
  orientation?: 'horizontal' | 'vertical';
}

export const DiagramAdvancedControls = memo<DiagramAdvancedControlsProps>({
  displayName: 'DiagramAdvancedControls',
  
  component: ({
    className,
    position = 'top-right',
    orientation = 'vertical'
  }) => {
    const [isExportMenuOpen, setIsExportMenuOpen] = useState(false);
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    
    const { exportDiagram, isExporting } = useDiagramExport();
    const { importDiagram, isImporting } = useDiagramImport();
    const { isVisible: isMinimapVisible, toggle: toggleMinimap } = useDiagramMinimap();
    
    const {
      showGrid,
      showControls,
      toggleGrid,
      toggleControls
    } = useDiagramStore((state) => ({
      showGrid: state.ui.showGrid,
      showControls: state.ui.showControls,
      toggleGrid: state.toggleGrid,
      toggleControls: state.toggleControls
    }));

    const positionClasses = {
      'top-left': 'top-4 left-4',
      'top-right': 'top-4 right-4',
      'bottom-left': 'bottom-4 left-4',
      'bottom-right': 'bottom-4 right-4'
    };

    const orientationClasses = {
      horizontal: 'flex-row',
      vertical: 'flex-col'
    };

    // Handlers para export
    const handleExport = async (format: ExportFormat) => {
      try {
        secureLogger.info('Iniciando export via controles avançados', { format });
        await exportDiagram(format);
        setIsExportMenuOpen(false);
      } catch (error) {
        secureLogger.error('Erro no export:', { error });
      }
    };

    // Handler para import
    const handleImport = () => {
      fileInputRef.current?.click();
    };

    const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file) return;

      try {
        secureLogger.info('Iniciando import via controles avançados', { filename: file.name });
        const result = await importDiagram(file);
        
        if (result.success) {
          secureLogger.info('Import concluído com sucesso');
        } else {
          secureLogger.error('Erro no import:', { error: result.error });
        }
      } catch (error) {
        secureLogger.error('Erro no import:', { error });
      }
      
      // Reset input
      event.target.value = '';
    };

    return (
      <div
        className={cn(
          'absolute z-20 flex gap-2 p-2 bg-white border border-gray-200 rounded-lg shadow-lg',
          'dark:bg-gray-800 dark:border-gray-700',
          positionClasses[position],
          orientationClasses[orientation],
          className
        )}
      >
        {/* Export Menu */}
        <div className="relative">
          <button
            onClick={() => setIsExportMenuOpen(!isExportMenuOpen)}
            disabled={isExporting}
            className={cn(
              'p-2 rounded-md border border-gray-200 bg-white hover:bg-gray-50',
              'dark:border-gray-600 dark:bg-gray-700 dark:hover:bg-gray-600',
              'disabled:opacity-50 disabled:cursor-not-allowed',
              'transition-colors duration-150'
            )}
            title="Exportar diagrama"
          >
            <Download size={16} className={isExporting ? 'animate-pulse' : ''} />
          </button>
          
          {isExportMenuOpen && (
            <div className="absolute top-full mt-1 right-0 min-w-40 bg-white border border-gray-200 rounded-lg shadow-lg py-1 dark:bg-gray-800 dark:border-gray-700">
              <button
                onClick={() => handleExport('json')}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                <FileText size={14} />
                JSON
              </button>
              <button
                onClick={() => handleExport('png')}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                <Image size={14} />
                PNG
              </button>
              <button
                onClick={() => handleExport('jpeg')}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                <Camera size={14} />
                JPEG
              </button>
              <button
                onClick={() => handleExport('svg')}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                <Image size={14} />
                SVG
              </button>
            </div>
          )}
        </div>

        {/* Import */}
        <button
          onClick={handleImport}
          disabled={isImporting}
          className={cn(
            'p-2 rounded-md border border-gray-200 bg-white hover:bg-gray-50',
            'dark:border-gray-600 dark:bg-gray-700 dark:hover:bg-gray-600',
            'disabled:opacity-50 disabled:cursor-not-allowed',
            'transition-colors duration-150'
          )}
          title="Importar diagrama"
        >
          <Upload size={16} className={isImporting ? 'animate-pulse' : ''} />
        </button>
        
        <input
          ref={fileInputRef}
          type="file"
          accept=".json"
          onChange={handleFileChange}
          className="hidden"
        />

        {/* Minimap Toggle */}
        <button
          onClick={toggleMinimap}
          className={cn(
            'p-2 rounded-md border border-gray-200 bg-white hover:bg-gray-50',
            'dark:border-gray-600 dark:bg-gray-700 dark:hover:bg-gray-600',
            'transition-colors duration-150',
            isMinimapVisible && 'bg-blue-50 border-blue-200 dark:bg-blue-900/20 dark:border-blue-700'
          )}
          title={isMinimapVisible ? 'Ocultar minimap' : 'Mostrar minimap'}
        >
          <Map size={16} className={isMinimapVisible ? 'text-blue-600 dark:text-blue-400' : ''} />
        </button>

        {/* Grid Toggle */}
        <button
          onClick={toggleGrid}
          className={cn(
            'p-2 rounded-md border border-gray-200 bg-white hover:bg-gray-50',
            'dark:border-gray-600 dark:bg-gray-700 dark:hover:bg-gray-600',
            'transition-colors duration-150',
            showGrid && 'bg-blue-50 border-blue-200 dark:bg-blue-900/20 dark:border-blue-700'
          )}
          title={showGrid ? 'Ocultar grade' : 'Mostrar grade'}
        >
          <Grid size={16} className={showGrid ? 'text-blue-600 dark:text-blue-400' : ''} />
        </button>

        {/* Controls Toggle */}
        <button
          onClick={toggleControls}
          className={cn(
            'p-2 rounded-md border border-gray-200 bg-white hover:bg-gray-50',
            'dark:border-gray-600 dark:bg-gray-700 dark:hover:bg-gray-600',
            'transition-colors duration-150',
            showControls && 'bg-blue-50 border-blue-200 dark:bg-blue-900/20 dark:border-blue-700'
          )}
          title={showControls ? 'Ocultar controles' : 'Mostrar controles'}
        >
          {showControls ? (
            <Eye size={16} className="text-blue-600 dark:text-blue-400" />
          ) : (
            <EyeOff size={16} />
          )}
        </button>

        {/* Settings Menu */}
        <div className="relative">
          <button
            onClick={() => setIsSettingsOpen(!isSettingsOpen)}
            className={cn(
              'p-2 rounded-md border border-gray-200 bg-white hover:bg-gray-50',
              'dark:border-gray-600 dark:bg-gray-700 dark:hover:bg-gray-600',
              'transition-colors duration-150'
            )}
            title="Configurações"
          >
            <Settings size={16} />
          </button>
          
          {isSettingsOpen && (
            <div className="absolute top-full mt-1 right-0 min-w-48 bg-white border border-gray-200 rounded-lg shadow-lg py-1 dark:bg-gray-800 dark:border-gray-700">
              <div className="px-3 py-2 text-xs font-medium text-gray-500 dark:text-gray-400 border-b border-gray-200 dark:border-gray-600">
                Configurações do Diagrama
              </div>
              
              <button
                onClick={toggleGrid}
                className="w-full flex items-center justify-between px-3 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                <span>Grade</span>
                <div className={cn(
                  'w-4 h-4 rounded border',
                  showGrid ? 'bg-blue-500 border-blue-500' : 'border-gray-300 dark:border-gray-600'
                )} />
              </button>
              
              <button
                onClick={toggleMinimap}
                className="w-full flex items-center justify-between px-3 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                <span>Minimap</span>
                <div className={cn(
                  'w-4 h-4 rounded border',
                  isMinimapVisible ? 'bg-blue-500 border-blue-500' : 'border-gray-300 dark:border-gray-600'
                )} />
              </button>
              
              <button
                onClick={toggleControls}
                className="w-full flex items-center justify-between px-3 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                <span>Controles</span>
                <div className={cn(
                  'w-4 h-4 rounded border',
                  showControls ? 'bg-blue-500 border-blue-500' : 'border-gray-300 dark:border-gray-600'
                )} />
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }
});

export default DiagramAdvancedControls;