import { useState, useCallback } from 'react';
import { useToast } from '@/hooks/useToast';

interface FileItem {
  id: string;
  name: string;
  path: string;
  size: number;
  type: 'file' | 'folder';
  extension?: string;
  lastModified: string;
  category: 'document' | 'image' | 'video' | 'audio' | 'archive' | 'code' | 'other';
  isDuplicate?: boolean;
  duplicateGroup?: string;
  isLarge?: boolean;
  isOld?: boolean;
  isUnused?: boolean;
}

interface CleanupRule {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  type: 'size' | 'age' | 'duplicate' | 'extension' | 'unused';
  criteria: {
    maxSize?: number; // em MB
    maxAge?: number; // em dias
    extensions?: string[];
    excludePaths?: string[];
  };
}

interface CleanupStats {
  totalFiles: number;
  totalSize: number;
  duplicateFiles: number;
  duplicateSize: number;
  largeFiles: number;
  largeSize: number;
  oldFiles: number;
  oldSize: number;
  unusedFiles: number;
  unusedSize: number;
}

interface CleanupResult {
  filesProcessed: number;
  filesRemoved: number;
  spaceFreed: number;
  errors: string[];
  warnings: string[];
}

export const useFileCleanup = () => {
  const { toast } = useToast();
  const [files, setFiles] = useState<FileItem[]>([]);
  const [isScanning, setIsScanning] = useState(false);
  const [isCleaning, setIsCleaning] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);
  const [cleanupProgress, setCleanupProgress] = useState(0);
  const [stats, setStats] = useState<CleanupStats>({
    totalFiles: 0,
    totalSize: 0,
    duplicateFiles: 0,
    duplicateSize: 0,
    largeFiles: 0,
    largeSize: 0,
    oldFiles: 0,
    oldSize: 0,
    unusedFiles: 0,
    unusedSize: 0
  });

  // Regras padrão de limpeza
  const [cleanupRules, setCleanupRules] = useState<CleanupRule[]>([
    {
      id: 'large-files',
      name: 'Arquivos Grandes',
      description: 'Arquivos maiores que 100MB',
      enabled: true,
      type: 'size',
      criteria: { maxSize: 100 }
    },
    {
      id: 'old-files',
      name: 'Arquivos Antigos',
      description: 'Arquivos não modificados há mais de 365 dias',
      enabled: false,
      type: 'age',
      criteria: { maxAge: 365 }
    },
    {
      id: 'duplicate-files',
      name: 'Arquivos Duplicados',
      description: 'Arquivos com conteúdo idêntico',
      enabled: true,
      type: 'duplicate',
      criteria: {}
    },
    {
      id: 'temp-files',
      name: 'Arquivos Temporários',
      description: 'Arquivos temporários e cache',
      enabled: true,
      type: 'extension',
      criteria: {
        extensions: ['.tmp', '.temp', '.cache', '.log', '.bak']
      }
    },
    {
      id: 'unused-files',
      name: 'Arquivos Não Utilizados',
      description: 'Arquivos que não foram acessados recentemente',
      enabled: false,
      type: 'unused',
      criteria: { maxAge: 180 }
    }
  ]);

  // Categorizar arquivo por extensão
  const categorizeFile = (fileName: string): FileItem['category'] => {
    const extension = fileName.split('.').pop()?.toLowerCase() || '';
    
    const categories = {
      document: ['pdf', 'doc', 'docx', 'txt', 'rtf', 'odt', 'xls', 'xlsx', 'ppt', 'pptx'],
      image: ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'svg', 'webp', 'ico'],
      video: ['mp4', 'avi', 'mkv', 'mov', 'wmv', 'flv', 'webm'],
      audio: ['mp3', 'wav', 'flac', 'aac', 'ogg', 'wma'],
      archive: ['zip', 'rar', '7z', 'tar', 'gz', 'bz2'],
      code: ['js', 'ts', 'jsx', 'tsx', 'html', 'css', 'scss', 'json', 'xml', 'py', 'java', 'cpp', 'c']
    };
    
    for (const [category, extensions] of Object.entries(categories)) {
      if (extensions.includes(extension)) {
        return category as FileItem['category'];
      }
    }
    
    return 'other';
  };

  // Simular escaneamento de arquivos
  const scanFiles = useCallback(async (paths: string[] = []) => {
    setIsScanning(true);
    setScanProgress(0);
    
    try {
      // Simular arquivos encontrados
      const mockFiles: Omit<FileItem, 'isDuplicate' | 'duplicateGroup' | 'isLarge' | 'isOld' | 'isUnused'>[] = [
        {
          id: 'file-1',
          name: 'proposta-cliente-1.pdf',
          path: '/documentos/propostas/proposta-cliente-1.pdf',
          size: 2.5 * 1024 * 1024, // 2.5MB
          type: 'file',
          extension: 'pdf',
          lastModified: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 dias atrás
          category: 'document'
        },
        {
          id: 'file-2',
          name: 'proposta-cliente-1-copia.pdf',
          path: '/documentos/backup/proposta-cliente-1-copia.pdf',
          size: 2.5 * 1024 * 1024, // 2.5MB (duplicata)
          type: 'file',
          extension: 'pdf',
          lastModified: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000).toISOString(),
          category: 'document'
        },
        {
          id: 'file-3',
          name: 'video-treinamento.mp4',
          path: '/videos/video-treinamento.mp4',
          size: 150 * 1024 * 1024, // 150MB
          type: 'file',
          extension: 'mp4',
          lastModified: new Date(Date.now() - 400 * 24 * 60 * 60 * 1000).toISOString(), // 400 dias atrás
          category: 'video'
        },
        {
          id: 'file-4',
          name: 'cache.tmp',
          path: '/temp/cache.tmp',
          size: 50 * 1024, // 50KB
          type: 'file',
          extension: 'tmp',
          lastModified: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
          category: 'other'
        },
        {
          id: 'file-5',
          name: 'backup-antigo.bak',
          path: '/backup/backup-antigo.bak',
          size: 75 * 1024 * 1024, // 75MB
          type: 'file',
          extension: 'bak',
          lastModified: new Date(Date.now() - 500 * 24 * 60 * 60 * 1000).toISOString(), // 500 dias atrás
          category: 'other'
        },
        {
          id: 'file-6',
          name: 'relatorio-mensal.xlsx',
          path: '/documentos/relatorios/relatorio-mensal.xlsx',
          size: 1.2 * 1024 * 1024, // 1.2MB
          type: 'file',
          extension: 'xlsx',
          lastModified: new Date(Date.now() - 200 * 24 * 60 * 60 * 1000).toISOString(),
          category: 'document'
        },
        {
          id: 'file-7',
          name: 'imagem-projeto.png',
          path: '/imagens/imagem-projeto.png',
          size: 5 * 1024 * 1024, // 5MB
          type: 'file',
          extension: 'png',
          lastModified: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(),
          category: 'image'
        },
        {
          id: 'file-8',
          name: 'log-sistema.log',
          path: '/logs/log-sistema.log',
          size: 10 * 1024 * 1024, // 10MB
          type: 'file',
          extension: 'log',
          lastModified: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
          category: 'other'
        }
      ];
      
      // Simular progresso
      for (let i = 0; i <= 100; i += 10) {
        setScanProgress(i);
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      
      // Analisar arquivos e aplicar regras
      const analyzedFiles: FileItem[] = mockFiles.map(file => {
        const now = Date.now();
        const fileAge = (now - new Date(file.lastModified).getTime()) / (1000 * 60 * 60 * 24); // dias
        const fileSizeMB = file.size / (1024 * 1024);
        
        return {
          ...file,
          isDuplicate: file.name.includes('copia') || file.name.includes('backup'),
          duplicateGroup: file.name.includes('proposta-cliente-1') ? 'proposta-cliente-1' : undefined,
          isLarge: fileSizeMB > 100,
          isOld: fileAge > 365,
          isUnused: fileAge > 180 && !file.name.includes('relatorio')
        };
      });
      
      setFiles(analyzedFiles);
      
      // Calcular estatísticas
      const newStats: CleanupStats = {
        totalFiles: analyzedFiles.length,
        totalSize: analyzedFiles.reduce((sum, file) => sum + file.size, 0),
        duplicateFiles: analyzedFiles.filter(f => f.isDuplicate).length,
        duplicateSize: analyzedFiles.filter(f => f.isDuplicate).reduce((sum, file) => sum + file.size, 0),
        largeFiles: analyzedFiles.filter(f => f.isLarge).length,
        largeSize: analyzedFiles.filter(f => f.isLarge).reduce((sum, file) => sum + file.size, 0),
        oldFiles: analyzedFiles.filter(f => f.isOld).length,
        oldSize: analyzedFiles.filter(f => f.isOld).reduce((sum, file) => sum + file.size, 0),
        unusedFiles: analyzedFiles.filter(f => f.isUnused).length,
        unusedSize: analyzedFiles.filter(f => f.isUnused).reduce((sum, file) => sum + file.size, 0)
      };
      
      setStats(newStats);
      
      toast({
        title: "Escaneamento Concluído",
        description: `${analyzedFiles.length} arquivos analisados`,
        variant: "default"
      });
      
    } catch (error) {
      console.error('❌ Erro no escaneamento:', error);
      toast({
        title: "Erro no Escaneamento",
        description: "Falha ao escanear arquivos",
        variant: "destructive"
      });
    } finally {
      setIsScanning(false);
      setScanProgress(0);
    }
  }, [toast]);

  // Executar limpeza
  const executeCleanup = useCallback(async (selectedFileIds: string[] = []) => {
    setIsCleaning(true);
    setCleanupProgress(0);
    
    try {
      const filesToClean = selectedFileIds.length > 0 
        ? files.filter(f => selectedFileIds.includes(f.id))
        : files.filter(file => {
            return cleanupRules.some(rule => {
              if (!rule.enabled) return false;
              
              switch (rule.type) {
                case 'size':
                  return rule.criteria.maxSize && (file.size / (1024 * 1024)) > rule.criteria.maxSize;
                case 'age': {
                  const fileAge = (Date.now() - new Date(file.lastModified).getTime()) / (1000 * 60 * 60 * 24);
                  return rule.criteria.maxAge && fileAge > rule.criteria.maxAge;
                }
                case 'duplicate':
                  return file.isDuplicate;
                case 'extension':
                  return rule.criteria.extensions?.includes(file.extension || '');
                case 'unused':
                  return file.isUnused;
                default:
                  return false;
              }
            });
          });
      
      const result: CleanupResult = {
        filesProcessed: filesToClean.length,
        filesRemoved: 0,
        spaceFreed: 0,
        errors: [],
        warnings: []
      };
      
      // Simular limpeza
      for (let i = 0; i < filesToClean.length; i++) {
        const file = filesToClean[i];
        
        try {
          // Simular remoção do arquivo
          await new Promise(resolve => setTimeout(resolve, 200));
          
          // Verificar se é seguro remover
          if (file.category === 'document' && !file.isDuplicate && !file.name.includes('backup')) {
            result.warnings.push(`Arquivo importante mantido: ${file.name}`);
          } else {
            result.filesRemoved++;
            result.spaceFreed += file.size;
          }
          
        } catch (error) {
          result.errors.push(`Erro ao remover ${file.name}: ${error}`);
        }
        
        setCleanupProgress(Math.round(((i + 1) / filesToClean.length) * 100));
      }
      
      // Atualizar lista de arquivos
      const remainingFiles = files.filter(file => 
        !filesToClean.some(cleaned => 
          cleaned.id === file.id && 
          !result.errors.some(error => error.includes(file.name))
        )
      );
      
      setFiles(remainingFiles);
      
      // Recalcular estatísticas
      const newStats: CleanupStats = {
        totalFiles: remainingFiles.length,
        totalSize: remainingFiles.reduce((sum, file) => sum + file.size, 0),
        duplicateFiles: remainingFiles.filter(f => f.isDuplicate).length,
        duplicateSize: remainingFiles.filter(f => f.isDuplicate).reduce((sum, file) => sum + file.size, 0),
        largeFiles: remainingFiles.filter(f => f.isLarge).length,
        largeSize: remainingFiles.filter(f => f.isLarge).reduce((sum, file) => sum + file.size, 0),
        oldFiles: remainingFiles.filter(f => f.isOld).length,
        oldSize: remainingFiles.filter(f => f.isOld).reduce((sum, file) => sum + file.size, 0),
        unusedFiles: remainingFiles.filter(f => f.isUnused).length,
        unusedSize: remainingFiles.filter(f => f.isUnused).reduce((sum, file) => sum + file.size, 0)
      };
      
      setStats(newStats);
      
      toast({
        title: "Limpeza Concluída",
        description: `${result.filesRemoved} arquivos removidos, ${(result.spaceFreed / (1024 * 1024)).toFixed(1)}MB liberados`,
        variant: "default"
      });
      
      return result;
      
    } catch (error) {
      console.error('❌ Erro na limpeza:', error);
      toast({
        title: "Erro na Limpeza",
        description: "Falha ao executar limpeza",
        variant: "destructive"
      });
      throw error;
    } finally {
      setIsCleaning(false);
      setCleanupProgress(0);
    }
  }, [files, cleanupRules, toast]);

  // Atualizar regra de limpeza
  const updateCleanupRule = useCallback((ruleId: string, updates: Partial<CleanupRule>) => {
    setCleanupRules(prev => prev.map(rule => 
      rule.id === ruleId ? { ...rule, ...updates } : rule
    ));
  }, []);

  // Adicionar regra personalizada
  const addCustomRule = useCallback((rule: Omit<CleanupRule, 'id'>) => {
    const newRule: CleanupRule = {
      ...rule,
      id: `custom-${Date.now()}`
    };
    setCleanupRules(prev => [...prev, newRule]);
  }, []);

  // Remover regra
  const removeRule = useCallback((ruleId: string) => {
    setCleanupRules(prev => prev.filter(rule => rule.id !== ruleId));
  }, []);

  // Exportar relatório
  const exportReport = useCallback(() => {
    const report = {
      timestamp: new Date().toISOString(),
      stats,
      files: files.map(file => ({
        name: file.name,
        path: file.path,
        size: file.size,
        category: file.category,
        lastModified: file.lastModified,
        flags: {
          isDuplicate: file.isDuplicate,
          isLarge: file.isLarge,
          isOld: file.isOld,
          isUnused: file.isUnused
        }
      })),
      rules: cleanupRules
    };
    
    const blob = new Blob([JSON.stringify(report, null, 2)], {
      type: 'application/json'
    });
    
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `cleanup-report-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, [stats, files, cleanupRules]);

  // Formatar tamanho de arquivo
  const formatFileSize = useCallback((bytes: number): string => {
    if (bytes === 0) return '0 B';
    
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  }, []);

  return {
    // Estado
    files,
    isScanning,
    isCleaning,
    scanProgress,
    cleanupProgress,
    stats,
    cleanupRules,
    
    // Ações
    scanFiles,
    executeCleanup,
    updateCleanupRule,
    addCustomRule,
    removeRule,
    exportReport,
    
    // Utilitários
    formatFileSize,
    categorizeFile
  };
};

export default useFileCleanup;