import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { FileSpreadsheet, Upload, Settings, CheckCircle2, AlertTriangle } from 'lucide-react';
import { FileUpload } from './FileUpload';
import { ColumnMapping } from './ColumnMapping';
import { DataValidation } from './DataValidation';
import { useExcelImporter } from './useExcelImporter';
import { ExcelImporterProps } from './types';

export const ExcelImporterRefactored: React.FC<ExcelImporterProps> = ({
  onDataImported,
  onError,
  acceptedFileTypes = ['.xlsx', '.xls'],
  maxFileSize = 10 * 1024 * 1024,
  requiredFields = ['nome', 'potencia', 'preco', 'fabricante']
}) => {
  const [currentStep, setCurrentStep] = useState<'upload' | 'mapping' | 'validation'>('upload');
  const [error, setError] = useState<string | null>(null);

  const {
    selectedFile,
    columnMapping,
    validationResult,
    isProcessing,
    progress,
    settings,
    handleFileSelect,
    updateColumnMapping,
    processData,
    downloadValidData,
    downloadErrorReport,
    resetImporter,
    updateSettings
  } = useExcelImporter();

  // Atualizar configurações baseadas nas props
  React.useEffect(() => {
    updateSettings({
      allowedExtensions: acceptedFileTypes,
      maxFileSize,
      requiredFields
    });
  }, [acceptedFileTypes, maxFileSize, requiredFields, updateSettings]);

  // Manipular seleção de arquivo
  const handleFileUpload = async (file: File) => {
    try {
      setError(null);
      await handleFileSelect(file);
      setCurrentStep('mapping');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao processar arquivo';
      setError(errorMessage);
      onError?.(errorMessage);
    }
  };

  // Manipular mapeamento de colunas
  const handleMappingComplete = () => {
    const requiredMapped = settings.requiredFields.every(field => 
      columnMapping[field] !== undefined && columnMapping[field] !== ''
    );
    
    if (!requiredMapped) {
      setError('Todos os campos obrigatórios devem ser mapeados');
      return;
    }
    
    setCurrentStep('validation');
  };

  // Processar dados e validar
  const handleProcessData = async () => {
    try {
      setError(null);
      await processData();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao processar dados';
      setError(errorMessage);
      onError?.(errorMessage);
    }
  };

  // Finalizar importação
  const handleImportComplete = () => {
    if (validationResult && validationResult.validProducts.length > 0) {
      onDataImported?.(validationResult.validProducts);
    }
  };

  // Reset completo
  const handleReset = () => {
    resetImporter();
    setCurrentStep('upload');
    setError(null);
  };

  // Determinar status do step
  const getStepStatus = (step: string) => {
    switch (step) {
      case 'upload':
        return selectedFile ? 'complete' : currentStep === 'upload' ? 'current' : 'pending';
      case 'mapping': {
        if (!selectedFile) return 'pending';
        const requiredMapped = settings.requiredFields.every(field => 
          columnMapping[field] !== undefined && columnMapping[field] !== ''
        );
        return requiredMapped ? 'complete' : currentStep === 'mapping' ? 'current' : 'pending';
      }
      case 'validation':
        return validationResult ? 'complete' : currentStep === 'validation' ? 'current' : 'pending';
      default:
        return 'pending';
    }
  };

  const getStepIcon = (step: string) => {
    const status = getStepStatus(step);
    switch (status) {
      case 'complete':
        return <CheckCircle2 className="h-5 w-5 text-green-600" />;
      case 'current':
        return <div className="h-5 w-5 rounded-full bg-blue-600 animate-pulse" />;
      default:
        return <div className="h-5 w-5 rounded-full bg-gray-300" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileSpreadsheet className="h-6 w-6" />
            Importador de Excel
          </CardTitle>
        </CardHeader>
        <CardContent>
          {/* Progress Steps */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              {getStepIcon('upload')}
              <span className={`text-sm font-medium ${
                getStepStatus('upload') === 'complete' ? 'text-green-600' : 
                getStepStatus('upload') === 'current' ? 'text-blue-600' : 'text-gray-500'
              }`}>
                Upload
              </span>
            </div>
            <div className="flex-1 h-px bg-gray-200 mx-4" />
            <div className="flex items-center gap-2">
              {getStepIcon('mapping')}
              <span className={`text-sm font-medium ${
                getStepStatus('mapping') === 'complete' ? 'text-green-600' : 
                getStepStatus('mapping') === 'current' ? 'text-blue-600' : 'text-gray-500'
              }`}>
                Mapeamento
              </span>
            </div>
            <div className="flex-1 h-px bg-gray-200 mx-4" />
            <div className="flex items-center gap-2">
              {getStepIcon('validation')}
              <span className={`text-sm font-medium ${
                getStepStatus('validation') === 'complete' ? 'text-green-600' : 
                getStepStatus('validation') === 'current' ? 'text-blue-600' : 'text-gray-500'
              }`}>
                Validação
              </span>
            </div>
          </div>

          {/* Progress Bar */}
          {isProcessing && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Processando...</span>
                <span>{progress}%</span>
              </div>
              <Progress value={progress} className="h-2" />
            </div>
          )}

          {/* Error Alert */}
          {error && (
            <Alert className="border-red-200 bg-red-50">
              <AlertTriangle className="h-4 w-4 text-red-600" />
              <AlertDescription className="text-red-700">
                {error}
              </AlertDescription>
            </Alert>
          )}

          {/* Actions */}
          <div className="flex gap-2 pt-4">
            {currentStep === 'mapping' && (
              <Button
                onClick={handleMappingComplete}
                disabled={!settings.requiredFields.every(field => 
                  columnMapping[field] !== undefined && columnMapping[field] !== ''
                )}
              >
                <Settings className="h-4 w-4 mr-2" />
                Continuar para Validação
              </Button>
            )}
            
            {currentStep === 'validation' && !validationResult && (
              <Button
                onClick={handleProcessData}
                disabled={isProcessing}
              >
                <CheckCircle2 className="h-4 w-4 mr-2" />
                Processar Dados
              </Button>
            )}
            
            {validationResult && (
              <Button
                onClick={handleImportComplete}
                disabled={!validationResult.validProducts.length}
              >
                <Upload className="h-4 w-4 mr-2" />
                Importar Dados Válidos
              </Button>
            )}
            
            <Button
              variant="outline"
              onClick={handleReset}
            >
              Reiniciar
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Content Tabs */}
      <Tabs value={currentStep} onValueChange={(value) => {
        if (value === 'upload' || 
           (value === 'mapping' && selectedFile) ||
           (value === 'validation' && selectedFile && Object.keys(columnMapping).length > 0)) {
          setCurrentStep(value as 'upload' | 'mapping' | 'validation');
        }
      }}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="upload" disabled={false}>
            <Upload className="h-4 w-4 mr-2" />
            Upload do Arquivo
          </TabsTrigger>
          <TabsTrigger value="mapping" disabled={!selectedFile}>
            <Settings className="h-4 w-4 mr-2" />
            Mapeamento de Colunas
          </TabsTrigger>
          <TabsTrigger value="validation" disabled={!selectedFile || Object.keys(columnMapping).length === 0}>
            <CheckCircle2 className="h-4 w-4 mr-2" />
            Validação de Dados
          </TabsTrigger>
        </TabsList>

        <TabsContent value="upload" className="mt-6">
          <FileUpload
            onFileSelect={handleFileUpload}
            selectedFile={selectedFile}
            isProcessing={isProcessing}
            progress={progress}
            settings={settings}
          />
        </TabsContent>

        <TabsContent value="mapping" className="mt-6">
          <ColumnMapping
            selectedFile={selectedFile}
            columnMapping={columnMapping}
            onMappingChange={updateColumnMapping}
            settings={settings}
            onPreview={() => {
              // Implementar preview se necessário
              console.log('Preview solicitado');
            }}
          />
        </TabsContent>

        <TabsContent value="validation" className="mt-6">
          <DataValidation
            validationResult={validationResult}
            onDownloadValid={downloadValidData}
            onDownloadErrors={downloadErrorReport}
            onRetry={() => {
              setCurrentStep('mapping');
              setError(null);
            }}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
};