// hooks/useVideoUpload.ts
import { useState, useCallback, useRef, useEffect } from 'react';
import {
  VideoMetadata,
  VideoUploadConfig,
  VideoUploadProgress,
  VideoUploadSession,
  VideoCompressionSettings,
  VideoSecuritySettings,
  VideoProcessingStatus,
  DEFAULT_UPLOAD_CONFIG,
  DEFAULT_COMPRESSION_SETTINGS,
  DEFAULT_SECURITY_SETTINGS,
} from '../types/video';
import { VideoUploadService } from '../services/videoUploadService';
import { toast } from 'sonner';

interface UploadFile {
  id: string;
  file: File;
  metadata?: Partial<VideoMetadata>;
  progress?: VideoUploadProgress;
  session?: VideoUploadSession;
  status: 'pending' | 'uploading' | 'processing' | 'completed' | 'error' | 'cancelled';
  error?: string;
  retryCount: number;
}

interface UseVideoUploadOptions {
  config?: Partial<VideoUploadConfig>;
  compressionSettings?: Partial<VideoCompressionSettings>;
  securitySettings?: Partial<VideoSecuritySettings>;
  maxFiles?: number;
  allowMultiple?: boolean;
  autoStart?: boolean;
  onUploadStart?: (session: VideoUploadSession) => void;
  onUploadProgress?: (progress: VideoUploadProgress, file: UploadFile) => void;
  onUploadComplete?: (metadata: VideoMetadata, file: UploadFile) => void;
  onUploadError?: (error: string, file: UploadFile) => void;
  onUploadCancel?: (sessionId: string, file: UploadFile) => void;
  onAllUploadsComplete?: (results: VideoMetadata[]) => void;
}

interface UseVideoUploadReturn {
  // State
  files: UploadFile[];
  isUploading: boolean;
  config: VideoUploadConfig;
  compressionSettings: VideoCompressionSettings;
  securitySettings: VideoSecuritySettings;
  
  // Statistics
  stats: {
    total: number;
    pending: number;
    uploading: number;
    processing: number;
    completed: number;
    error: number;
    cancelled: number;
  };
  
  // Progress
  overallProgress: {
    percentage: number;
    uploadedBytes: number;
    totalBytes: number;
    speed: number;
    estimatedTimeRemaining: number;
  };
  
  // Actions
  addFiles: (files: File[]) => void;
  removeFile: (fileId: string) => void;
  removeAllFiles: () => void;
  startUpload: (fileId?: string) => Promise<void>;
  startAllUploads: () => Promise<void>;
  cancelUpload: (fileId: string) => Promise<void>;
  cancelAllUploads: () => Promise<void>;
  retryUpload: (fileId: string) => Promise<void>;
  retryFailedUploads: () => Promise<void>;
  updateFileMetadata: (fileId: string, metadata: Partial<VideoMetadata>) => void;
  updateConfig: (config: Partial<VideoUploadConfig>) => void;
  updateCompressionSettings: (settings: Partial<VideoCompressionSettings>) => void;
  updateSecuritySettings: (settings: Partial<VideoSecuritySettings>) => void;
  
  // Utilities
  validateFile: (file: File) => { valid: boolean; error?: string };
  getFileById: (fileId: string) => UploadFile | undefined;
  clearCompleted: () => void;
  clearErrors: () => void;
}

export const useVideoUpload = (options: UseVideoUploadOptions = {}): UseVideoUploadReturn => {
  const {
    config: initialConfig = {},
    compressionSettings: initialCompressionSettings = {},
    securitySettings: initialSecuritySettings = {},
    maxFiles = 10,
    allowMultiple = true,
    autoStart = false,
    onUploadStart,
    onUploadProgress,
    onUploadComplete,
    onUploadError,
    onUploadCancel,
    onAllUploadsComplete,
  } = options;

  // State
  const [files, setFiles] = useState<UploadFile[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [config, setConfig] = useState<VideoUploadConfig>({
    ...DEFAULT_UPLOAD_CONFIG,
    ...initialConfig,
  });
  const [compressionSettings, setCompressionSettings] = useState<VideoCompressionSettings>({
    ...DEFAULT_COMPRESSION_SETTINGS,
    ...initialCompressionSettings,
  });
  const [securitySettings, setSecuritySettings] = useState<VideoSecuritySettings>({
    ...DEFAULT_SECURITY_SETTINGS,
    ...initialSecuritySettings,
  });

  // Services
  const uploadServiceRef = useRef<VideoUploadService>();
  const activeUploadsRef = useRef<Map<string, AbortController>>(new Map());
  const progressIntervalRef = useRef<NodeJS.Timeout>();

  // Initialize upload service
  useEffect(() => {
    if (!uploadServiceRef.current) {
      uploadServiceRef.current = new VideoUploadService();
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      // Cancel all active uploads
      activeUploadsRef.current.forEach(controller => {
        controller.abort();
      });
      activeUploadsRef.current.clear();
      
      // Clear progress interval
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
      }
    };
  }, []);

  // Update uploading state
  useEffect(() => {
    const hasActiveUploads = files.some(file => 
      file.status === 'uploading' || file.status === 'processing'
    );
    setIsUploading(hasActiveUploads);
  }, [files]);

  // Check for completion
  useEffect(() => {
    const completedFiles = files.filter(file => file.status === 'completed');
    const totalFiles = files.length;
    
    if (totalFiles > 0 && completedFiles.length === totalFiles && onAllUploadsComplete) {
      const results = completedFiles
        .map(file => file.metadata as VideoMetadata)
        .filter(Boolean);
      onAllUploadsComplete(results);
    }
  }, [files, onAllUploadsComplete]);

  // Statistics
  const stats = {
    total: files.length,
    pending: files.filter(f => f.status === 'pending').length,
    uploading: files.filter(f => f.status === 'uploading').length,
    processing: files.filter(f => f.status === 'processing').length,
    completed: files.filter(f => f.status === 'completed').length,
    error: files.filter(f => f.status === 'error').length,
    cancelled: files.filter(f => f.status === 'cancelled').length,
  };

  // Overall progress
  const overallProgress = {
    percentage: files.length > 0 
      ? files.reduce((acc, file) => acc + (file.progress?.percentage || 0), 0) / files.length
      : 0,
    uploadedBytes: files.reduce((acc, file) => acc + (file.progress?.uploadedBytes || 0), 0),
    totalBytes: files.reduce((acc, file) => acc + file.file.size, 0),
    speed: files.reduce((acc, file) => acc + (file.progress?.speed || 0), 0),
    estimatedTimeRemaining: Math.max(
      ...files.map(file => file.progress?.estimatedTimeRemaining || 0)
    ),
  };

  // File validation
  const validateFile = useCallback((file: File): { valid: boolean; error?: string } => {
    // Check file type
    if (!file.type.startsWith('video/')) {
      return { valid: false, error: 'Apenas arquivos de vídeo são permitidos' };
    }

    // Check file size
    if (config.maxFileSize && file.size > config.maxFileSize) {
      return { 
        valid: false, 
        error: `Arquivo muito grande. Máximo permitido: ${(config.maxFileSize / (1024 * 1024 * 1024)).toFixed(1)}GB` 
      };
    }

    // Check supported formats
    if (config.allowedFormats && config.allowedFormats.length > 0) {
      const fileExtension = file.name.split('.').pop()?.toLowerCase();
      if (!fileExtension || !config.allowedFormats.includes(fileExtension)) {
        return { 
          valid: false, 
          error: `Formato não suportado. Formatos permitidos: ${config.allowedFormats.join(', ')}` 
        };
      }
    }

    return { valid: true };
  }, [config]);

  // Add files
  const addFiles = useCallback((newFiles: File[]) => {
    // Validate multiple files
    if (!allowMultiple && newFiles.length > 1) {
      toast.error('Apenas um arquivo é permitido');
      return;
    }

    // Check max files limit
    if (files.length + newFiles.length > maxFiles) {
      toast.error(`Máximo de ${maxFiles} arquivos permitidos`);
      return;
    }

    // Validate and create upload files
    const validFiles: UploadFile[] = [];
    const errors: string[] = [];

    newFiles.forEach(file => {
      const validation = validateFile(file);
      if (validation.valid) {
        validFiles.push({
          id: `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          file,
          status: 'pending',
          retryCount: 0,
          metadata: {
            title: file.name.replace(/\.[^/.]+$/, ''),
            description: '',
            category: 'tutorial',
            visibility: 'private',
            tags: [],
          },
        });
      } else {
        errors.push(`${file.name}: ${validation.error}`);
      }
    });

    // Show errors
    if (errors.length > 0) {
      errors.forEach(error => toast.error(error));
    }

    // Add valid files
    if (validFiles.length > 0) {
      setFiles(prev => [...prev, ...validFiles]);
      
      // Auto-start if enabled
      if (autoStart) {
        validFiles.forEach(file => {
          startUpload(file.id);
        });
      }
    }
  }, [files.length, maxFiles, allowMultiple, validateFile, autoStart]);

  // Remove file
  const removeFile = useCallback((fileId: string) => {
    const file = files.find(f => f.id === fileId);
    if (file && file.status === 'uploading') {
      cancelUpload(fileId);
    }
    
    setFiles(prev => prev.filter(f => f.id !== fileId));
  }, [files]);

  // Remove all files
  const removeAllFiles = useCallback(() => {
    // Cancel all active uploads
    const uploadingFiles = files.filter(f => f.status === 'uploading');
    uploadingFiles.forEach(file => cancelUpload(file.id));
    
    setFiles([]);
  }, [files]);

  // Start upload
  const startUpload = useCallback(async (fileId?: string) => {
    const uploadService = uploadServiceRef.current;
    if (!uploadService) return;

    const targetFiles = fileId 
      ? files.filter(f => f.id === fileId)
      : files.filter(f => f.status === 'pending');

    for (const file of targetFiles) {
      if (file.status !== 'pending') continue;

      try {
        // Update status
        setFiles(prev => prev.map(f => 
          f.id === file.id ? { ...f, status: 'uploading' } : f
        ));

        // Create abort controller
        const abortController = new AbortController();
        activeUploadsRef.current.set(file.id, abortController);

        // Create upload session
        const session = await uploadService.createUploadSession({
          fileName: file.file.name,
          fileSize: file.file.size,
          mimeType: file.file.type,
          metadata: file.metadata as VideoMetadata,
          config,
          compressionSettings,
          securitySettings,
        });

        // Update file with session
        setFiles(prev => prev.map(f => 
          f.id === file.id ? { ...f, session } : f
        ));

        onUploadStart?.(session);

        // Start upload
        const result = await uploadService.uploadFile(file.file, {
          onProgress: (progress) => {
            setFiles(prev => prev.map(f => 
              f.id === file.id ? { ...f, progress } : f
            ));
            onUploadProgress?.(progress, file);
          },
          sessionId: session.id,
          signal: abortController.signal,
        });

        // Update status to processing
        setFiles(prev => prev.map(f => 
          f.id === file.id ? { ...f, status: 'processing' } : f
        ));

        // Poll for processing completion
        const pollProcessing = async (): Promise<void> => {
          try {
            const status = await uploadService.getProcessingStatus(result.videoId);
            
            if (status.status === 'completed') {
              const metadata = await uploadService.getVideoMetadata(result.videoId);
              setFiles(prev => prev.map(f => 
                f.id === file.id ? { 
                  ...f, 
                  status: 'completed',
                  metadata: { ...f.metadata, ...metadata }
                } : f
              ));
              onUploadComplete?.(metadata, file);
            } else if (status.status === 'failed') {
              throw new Error(status.error || 'Falha no processamento');
            } else {
              // Continue polling
              setTimeout(pollProcessing, 2000);
            }
          } catch (error) {
            throw error;
          }
        };

        await pollProcessing();

      } catch (error) {
        if (error instanceof Error && error.name === 'AbortError') {
          // Upload was cancelled
          setFiles(prev => prev.map(f => 
            f.id === file.id ? { ...f, status: 'cancelled' } : f
          ));
        } else {
          // Upload failed
          const errorMessage = error instanceof Error ? error.message : 'Erro no upload';
          setFiles(prev => prev.map(f => 
            f.id === file.id ? { 
              ...f, 
              status: 'error', 
              error: errorMessage,
              retryCount: f.retryCount + 1
            } : f
          ));
          onUploadError?.(errorMessage, file);
        }
      } finally {
        // Clean up abort controller
        activeUploadsRef.current.delete(file.id);
      }
    }
  }, [files, config, compressionSettings, securitySettings, onUploadStart, onUploadProgress, onUploadComplete, onUploadError]);

  // Start all uploads
  const startAllUploads = useCallback(async () => {
    await startUpload();
  }, [startUpload]);

  // Cancel upload
  const cancelUpload = useCallback(async (fileId: string) => {
    const abortController = activeUploadsRef.current.get(fileId);
    if (abortController) {
      abortController.abort();
      activeUploadsRef.current.delete(fileId);
    }

    const file = files.find(f => f.id === fileId);
    if (file?.session) {
      try {
        const uploadService = uploadServiceRef.current;
        if (uploadService) {
          await uploadService.cancelUpload(file.session.id);
        }
        onUploadCancel?.(file.session.id, file);
      } catch (error) {
        console.error('Error cancelling upload:', error);
      }
    }

    setFiles(prev => prev.map(f => 
      f.id === fileId ? { ...f, status: 'cancelled' } : f
    ));
  }, [files, onUploadCancel]);

  // Cancel all uploads
  const cancelAllUploads = useCallback(async () => {
    const uploadingFiles = files.filter(f => f.status === 'uploading');
    await Promise.all(uploadingFiles.map(file => cancelUpload(file.id)));
  }, [files, cancelUpload]);

  // Retry upload
  const retryUpload = useCallback(async (fileId: string) => {
    setFiles(prev => prev.map(f => 
      f.id === fileId ? { ...f, status: 'pending', error: undefined } : f
    ));
    await startUpload(fileId);
  }, [startUpload]);

  // Retry failed uploads
  const retryFailedUploads = useCallback(async () => {
    const failedFiles = files.filter(f => f.status === 'error');
    for (const file of failedFiles) {
      await retryUpload(file.id);
    }
  }, [files, retryUpload]);

  // Update file metadata
  const updateFileMetadata = useCallback((fileId: string, metadata: Partial<VideoMetadata>) => {
    setFiles(prev => prev.map(f => 
      f.id === fileId ? { ...f, metadata: { ...f.metadata, ...metadata } } : f
    ));
  }, []);

  // Update config
  const updateConfig = useCallback((newConfig: Partial<VideoUploadConfig>) => {
    setConfig(prev => ({ ...prev, ...newConfig }));
  }, []);

  // Update compression settings
  const updateCompressionSettings = useCallback((newSettings: Partial<VideoCompressionSettings>) => {
    setCompressionSettings(prev => ({ ...prev, ...newSettings }));
  }, []);

  // Update security settings
  const updateSecuritySettings = useCallback((newSettings: Partial<VideoSecuritySettings>) => {
    setSecuritySettings(prev => ({ ...prev, ...newSettings }));
  }, []);

  // Get file by ID
  const getFileById = useCallback((fileId: string) => {
    return files.find(f => f.id === fileId);
  }, [files]);

  // Clear completed files
  const clearCompleted = useCallback(() => {
    setFiles(prev => prev.filter(f => f.status !== 'completed'));
  }, []);

  // Clear error files
  const clearErrors = useCallback(() => {
    setFiles(prev => prev.filter(f => f.status !== 'error'));
  }, []);

  return {
    // State
    files,
    isUploading,
    config,
    compressionSettings,
    securitySettings,
    
    // Statistics
    stats,
    overallProgress,
    
    // Actions
    addFiles,
    removeFile,
    removeAllFiles,
    startUpload,
    startAllUploads,
    cancelUpload,
    cancelAllUploads,
    retryUpload,
    retryFailedUploads,
    updateFileMetadata,
    updateConfig,
    updateCompressionSettings,
    updateSecuritySettings,
    
    // Utilities
    validateFile,
    getFileById,
    clearCompleted,
    clearErrors,
  };
};

export default useVideoUpload;