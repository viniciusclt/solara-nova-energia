// ============================================================================
// DiagramMigrationWrapper - Wrapper para migração gradual dos componentes
// ============================================================================

import React, { useState, useEffect, memo } from 'react';
import { ReactFlowProvider } from 'reactflow';
import { UnifiedDiagramEditor } from '../UnifiedDiagramEditor';
import { useDiagramStore } from '../stores/useDiagramStore';
import { DiagramType } from '../types';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { ArrowRight, AlertTriangle, CheckCircle, Settings } from 'lucide-react';
import { secureLogger } from '@/utils/secureLogger';
import { toast } from 'sonner';

// ============================================================================
// Types
// ============================================================================

interface DiagramMigrationWrapperProps {
  flowchartId?: string;
  diagramType?: DiagramType;
  onSave?: (data: unknown) => void;
  onClose?: () => void;
  readOnly?: boolean;
  showToolbar?: boolean;
  showSidebar?: boolean;
  className?: string;
  // Migration options
  enableNewArchitecture?: boolean;
  showMigrationControls?: boolean;
  autoMigrate?: boolean;
}

interface MigrationState {
  isUsingNewArchitecture: boolean;
  migrationInProgress: boolean;
  migrationErrors: string[];
  dataCompatibility: 'compatible' | 'needs-migration' | 'incompatible';
}

// ============================================================================
// Migration Utilities
// ============================================================================

const checkDataCompatibility = (data: unknown): MigrationState['dataCompatibility'] => {
  if (!data) return 'compatible';
  
  // Check if data structure matches new format
  const hasNewStructure = data.nodes && data.edges && data.settings;
  const hasOldStructure = data.flowchart || data.mindmap;
  
  if (hasNewStructure && !hasOldStructure) {
    return 'compatible';
  } else if (hasOldStructure && !hasNewStructure) {
    return 'needs-migration';
  } else {
    return 'incompatible';
  }
};

const migrateDataToNewFormat = (oldData: unknown): unknown => {
  try {
    // Convert old flowchart format to new diagram format
    if (oldData.flowchart) {
      return {
        id: oldData.id || 'migrated-diagram',
        title: oldData.title || 'Migrated Diagram',
        type: 'flowchart' as DiagramType,
        nodes: oldData.flowchart.nodes || [],
        edges: oldData.flowchart.edges || [],
        settings: {
          gridSize: 20,
          snapToGrid: false,
          showGrid: true,
          showMinimap: true,
          connectionType: 'bezier',
          ...oldData.settings
        },
        metadata: {
          created_at: oldData.created_at || new Date().toISOString(),
          updated_at: new Date().toISOString(),
          version: '2.0.0',
          migrated_from: '1.0.0'
        }
      };
    }
    
    return oldData;
  } catch (error) {
    secureLogger.error('Data migration failed', { error, oldData });
    throw new Error('Failed to migrate data format');
  }
};

// ============================================================================
// Migration Controls Component
// ============================================================================

const MigrationControls: React.FC<{
  migrationState: MigrationState;
  onToggleArchitecture: (useNew: boolean) => void;
  onMigrateData: () => void;
  onResetMigration: () => void;
}> = ({ migrationState, onToggleArchitecture, onMigrateData, onResetMigration }) => {
  return (
    <Card className="mb-4">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings className="h-5 w-5" />
          Migration Controls
          <Badge variant={migrationState.isUsingNewArchitecture ? 'default' : 'secondary'}>
            {migrationState.isUsingNewArchitecture ? 'New Architecture' : 'Legacy Architecture'}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Architecture Toggle */}
        <div className="flex items-center space-x-2">
          <Switch
            id="architecture-toggle"
            checked={migrationState.isUsingNewArchitecture}
            onCheckedChange={onToggleArchitecture}
            disabled={migrationState.migrationInProgress}
          />
          <Label htmlFor="architecture-toggle">
            Use New Architecture
          </Label>
        </div>

        {/* Data Compatibility Status */}
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">Data Compatibility:</span>
          {migrationState.dataCompatibility === 'compatible' && (
            <Badge variant="default" className="bg-green-100 text-green-800">
              <CheckCircle className="h-3 w-3 mr-1" />
              Compatible
            </Badge>
          )}
          {migrationState.dataCompatibility === 'needs-migration' && (
            <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
              <AlertTriangle className="h-3 w-3 mr-1" />
              Needs Migration
            </Badge>
          )}
          {migrationState.dataCompatibility === 'incompatible' && (
            <Badge variant="destructive">
              <AlertTriangle className="h-3 w-3 mr-1" />
              Incompatible
            </Badge>
          )}
        </div>

        {/* Migration Actions */}
        {migrationState.dataCompatibility === 'needs-migration' && (
          <div className="flex gap-2">
            <Button
              onClick={onMigrateData}
              disabled={migrationState.migrationInProgress}
              size="sm"
            >
              <ArrowRight className="h-4 w-4 mr-1" />
              Migrate Data
            </Button>
            <Button
              onClick={onResetMigration}
              variant="outline"
              size="sm"
            >
              Reset
            </Button>
          </div>
        )}

        {/* Migration Errors */}
        {migrationState.migrationErrors.length > 0 && (
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Migration errors: {migrationState.migrationErrors.join(', ')}
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
};

// ============================================================================
// Main Migration Wrapper Component
// ============================================================================

export const DiagramMigrationWrapper: React.FC<DiagramMigrationWrapperProps> = memo(({
  flowchartId,
  diagramType = 'flowchart',
  onSave,
  onClose,
  readOnly = false,
  showToolbar = true,
  showSidebar = true,
  className = '',
  enableNewArchitecture = false,
  showMigrationControls = true,
  autoMigrate = false
}) => {
  const [migrationState, setMigrationState] = useState<MigrationState>({
    isUsingNewArchitecture: enableNewArchitecture,
    migrationInProgress: false,
    migrationErrors: [],
    dataCompatibility: 'compatible'
  });

  const [diagramData, setDiagramData] = useState<unknown>(null);
  const { loadDocument } = useDiagramStore();

  // Load and check data compatibility
  useEffect(() => {
    const loadData = async () => {
      if (flowchartId) {
        try {
          // Load data from legacy or new source
          const data = await loadDocument(flowchartId);
          setDiagramData(data);
          
          const compatibility = checkDataCompatibility(data);
          setMigrationState(prev => ({
            ...prev,
            dataCompatibility: compatibility
          }));

          // Auto-migrate if enabled and needed
          if (autoMigrate && compatibility === 'needs-migration') {
            handleMigrateData();
          }
        } catch (error) {
          secureLogger.error('Failed to load diagram data', { flowchartId, error });
          toast.error('Failed to load diagram data');
        }
      }
    };

    loadData();
  }, [flowchartId, autoMigrate]);

  // Migration handlers
  const handleToggleArchitecture = (useNew: boolean) => {
    setMigrationState(prev => ({
      ...prev,
      isUsingNewArchitecture: useNew
    }));
    
    secureLogger.info('Architecture toggled', { useNew, flowchartId });
  };

  const handleMigrateData = async () => {
    setMigrationState(prev => ({
      ...prev,
      migrationInProgress: true,
      migrationErrors: []
    }));

    try {
      const migratedData = migrateDataToNewFormat(diagramData);
      setDiagramData(migratedData);
      
      setMigrationState(prev => ({
        ...prev,
        migrationInProgress: false,
        dataCompatibility: 'compatible',
        isUsingNewArchitecture: true
      }));

      toast.success('Data migrated successfully');
      secureLogger.info('Data migration completed', { flowchartId });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      setMigrationState(prev => ({
        ...prev,
        migrationInProgress: false,
        migrationErrors: [errorMessage]
      }));
      
      toast.error('Migration failed: ' + errorMessage);
      secureLogger.error('Data migration failed', { flowchartId, error });
    }
  };

  const handleResetMigration = () => {
    setMigrationState(prev => ({
      ...prev,
      isUsingNewArchitecture: false,
      migrationErrors: [],
      dataCompatibility: checkDataCompatibility(diagramData)
    }));
  };

  // Render appropriate editor based on architecture choice
  const renderEditor = () => {
    if (migrationState.isUsingNewArchitecture) {
      return (
        <ReactFlowProvider>
          <UnifiedDiagramEditor
            diagramId={flowchartId}
            diagramType={diagramType}
            onSave={onSave}
            onClose={onClose}
            readOnly={readOnly}
            showToolbar={showToolbar}
            showSidebar={showSidebar}
            className={className}
          />
        </ReactFlowProvider>
      );
    } else {
      return (
        <UnifiedDiagramEditor
          diagramType={diagramType}
          diagramId={flowchartId}
          onSave={onSave}
          onClose={onClose}
          readOnly={readOnly}
          showToolbar={showToolbar}
          showSidebar={showSidebar}
          className={className}
        />
      );
    }
  };

  return (
    <div className={`diagram-migration-wrapper ${className}`}>
      {showMigrationControls && (
        <MigrationControls
          migrationState={migrationState}
          onToggleArchitecture={handleToggleArchitecture}
          onMigrateData={handleMigrateData}
          onResetMigration={handleResetMigration}
        />
      )}
      
      {renderEditor()}
    </div>
  );
});

export default DiagramMigrationWrapper;