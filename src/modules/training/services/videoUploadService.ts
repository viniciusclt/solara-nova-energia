// services/videoUploadService.ts
import {
  VideoMetadata,
  VideoUploadConfig,
  VideoUploadResult,
  UploadProgress,
  VideoUploadChunk,
  VideoUploadSession,
  VideoProcessingJob,
  VideoSecurityConfig,
  VideoAPIResponse,
  VideoError,
  VideoSuccess,
  VideoFormat,
  VideoResolution,
  VideoStatus,
  VideoCategory,
  AccessLevel,
  VideoEventType,
  VideoErrorCode,
  DEFAULT_VIDEO_CONFIG,
  DEFAULT_SECURITY_CONFIG,
  VIDEO_CONSTANTS,
  generateVideoId,
  generateUploadToken,
  validateVideoMetadata,
  createVideoError,
  createVideoSuccess,
  isValidVideoFormat,
  formatVideoSize,
} from '../types/video';

export class VideoUploadService {
  private config: VideoUploadConfig;
  private securityConfig: VideoSecurityConfig;
  private baseUrl: string;
  private apiKey: string;
  private uploadSessions: Map<string, VideoUploadSession> = new Map();
  private eventListeners: Map<VideoEventType, ((data: unknown) => void)[]> = new Map();

  constructor(
    baseUrl: string,
    apiKey: string,
    config?: Partial<VideoUploadConfig>,
    securityConfig?: Partial<VideoSecurityConfig>
  ) {
    this.baseUrl = baseUrl.replace(/\/$/, ''); // Remove trailing slash
    this.apiKey = apiKey;
    this.config = { ...DEFAULT_VIDEO_CONFIG, ...config };
    this.securityConfig = { ...DEFAULT_SECURITY_CONFIG, ...securityConfig };
    
    // Initialize event listeners
    Object.values(VideoEventType).forEach(eventType => {
      this.eventListeners.set(eventType, []);
    });
  }

  /**
   * Inicia o upload de um vídeo
   */
  async uploadVideo(
    file: File,
    metadata: Partial<VideoMetadata>,
    onProgress?: (progress: UploadProgress) => void
  ): Promise<VideoAPIResponse<VideoUploadResult>> {
    try {
      // Validar arquivo
      const fileValidation = this.validateFile(file);
      if (!fileValidation.success) {
        return fileValidation;
      }

      // Validar metadados
      const metadataErrors = validateVideoMetadata(metadata);
      if (metadataErrors.length > 0) {
        return {
          success: false,
          error: {
            code: VideoErrorCode.INVALID_PARAMETERS,
            message: 'Invalid metadata',
            details: metadataErrors,
          },
        };
      }

      // Gerar ID do vídeo e token de upload
      const videoId = generateVideoId();
      const uploadToken = generateUploadToken(videoId, metadata.uploadedBy || 'anonymous');

      // Emitir evento de início do upload
      this.emit(VideoEventType.UPLOAD_STARTED, { videoId, file, metadata });

      // Determinar método de upload
      const useChunkedUpload = file.size > this.config.chunkSize;

      let result: VideoUploadResult;
      if (useChunkedUpload) {
        result = await this.uploadVideoChunked(file, videoId, uploadToken, metadata, onProgress);
      } else {
        result = await this.uploadVideoDirect(file, videoId, uploadToken, metadata, onProgress);
      }

      // Emitir evento de conclusão do upload
      this.emit(VideoEventType.UPLOAD_COMPLETED, { videoId, result });

      return createVideoSuccess('Video uploaded successfully', result);
    } catch (error) {
      const videoError = createVideoError(
        VideoErrorCode.UPLOAD_FAILED,
        'Failed to upload video',
        error
      );
      
      this.emit(VideoEventType.UPLOAD_FAILED, { error: videoError });
      
      return {
        success: false,
        error: videoError,
      };
    }
  }

  /**
   * Upload direto para arquivos pequenos
   */
  private async uploadVideoDirect(
    file: File,
    videoId: string,
    uploadToken: string,
    metadata: Partial<VideoMetadata>,
    onProgress?: (progress: UploadProgress) => void
  ): Promise<VideoUploadResult> {
    const formData = new FormData();
    formData.append('video', file);
    formData.append('videoId', videoId);
    formData.append('uploadToken', uploadToken);
    formData.append('metadata', JSON.stringify(metadata));

    const xhr = new XMLHttpRequest();
    
    return new Promise((resolve, reject) => {
      xhr.upload.addEventListener('progress', (event) => {
        if (event.lengthComputable && onProgress) {
          const progress: UploadProgress = {
            loaded: event.loaded,
            total: event.total,
            percentage: (event.loaded / event.total) * 100,
            speed: this.calculateUploadSpeed(event.loaded, Date.now()),
            timeRemaining: this.calculateTimeRemaining(event.loaded, event.total, Date.now()),
          };
          
          onProgress(progress);
          this.emit(VideoEventType.UPLOAD_PROGRESS, { videoId, progress });
        }
      });

      xhr.addEventListener('load', () => {
        if (xhr.status === 200) {
          try {
            const response = JSON.parse(xhr.responseText);
            resolve(response.data);
          } catch (error) {
            reject(new Error('Invalid response format'));
          }
        } else {
          reject(new Error(`Upload failed with status ${xhr.status}`));
        }
      });

      xhr.addEventListener('error', () => {
        reject(new Error('Network error during upload'));
      });

      xhr.open('POST', `${this.baseUrl}/api/videos/upload`);
      xhr.setRequestHeader('Authorization', `Bearer ${this.apiKey}`);
      xhr.setRequestHeader('X-Upload-Token', uploadToken);
      xhr.send(formData);
    });
  }

  /**
   * Upload em chunks para arquivos grandes
   */
  private async uploadVideoChunked(
    file: File,
    videoId: string,
    uploadToken: string,
    metadata: Partial<VideoMetadata>,
    onProgress?: (progress: UploadProgress) => void
  ): Promise<VideoUploadResult> {
    // Criar sessão de upload
    const session = await this.createUploadSession(file, videoId, uploadToken, metadata);
    this.uploadSessions.set(videoId, session);

    const totalChunks = Math.ceil(file.size / this.config.chunkSize);
    let uploadedBytes = 0;
    const startTime = Date.now();

    try {
      // Upload de cada chunk
      for (let chunkIndex = 0; chunkIndex < totalChunks; chunkIndex++) {
        const start = chunkIndex * this.config.chunkSize;
        const end = Math.min(start + this.config.chunkSize, file.size);
        const chunkBlob = file.slice(start, end);
        const chunkBuffer = await chunkBlob.arrayBuffer();
        
        const chunk: VideoUploadChunk = {
          chunkIndex,
          totalChunks,
          chunkSize: chunkBuffer.byteLength,
          checksum: await this.calculateChecksum(chunkBuffer),
          data: chunkBuffer,
        };

        await this.uploadChunk(session.sessionId, chunk, uploadToken);
        
        uploadedBytes += chunk.chunkSize;
        
        if (onProgress) {
          const progress: UploadProgress = {
            loaded: uploadedBytes,
            total: file.size,
            percentage: (uploadedBytes / file.size) * 100,
            speed: this.calculateUploadSpeed(uploadedBytes, Date.now() - startTime),
            timeRemaining: this.calculateTimeRemaining(uploadedBytes, file.size, Date.now() - startTime),
          };
          
          onProgress(progress);
          this.emit(VideoEventType.UPLOAD_PROGRESS, { videoId, progress });
        }
      }

      // Finalizar upload
      const result = await this.finalizeUpload(session.sessionId, uploadToken);
      this.uploadSessions.delete(videoId);
      
      return result;
    } catch (error) {
      this.uploadSessions.delete(videoId);
      throw error;
    }
  }

  /**
   * Cria uma sessão de upload para arquivos grandes
   */
  private async createUploadSession(
    file: File,
    videoId: string,
    uploadToken: string,
    metadata: Partial<VideoMetadata>
  ): Promise<VideoUploadSession> {
    const response = await fetch(`${this.baseUrl}/api/videos/upload/session`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`,
        'X-Upload-Token': uploadToken,
      },
      body: JSON.stringify({
        videoId,
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type,
        chunkSize: this.config.chunkSize,
        metadata,
      }),
    });

    if (!response.ok) {
      throw new Error(`Failed to create upload session: ${response.statusText}`);
    }

    const data = await response.json();
    return data.session;
  }

  /**
   * Faz upload de um chunk individual
   */
  private async uploadChunk(
    sessionId: string,
    chunk: VideoUploadChunk,
    uploadToken: string
  ): Promise<void> {
    const formData = new FormData();
    formData.append('sessionId', sessionId);
    formData.append('chunkIndex', chunk.chunkIndex.toString());
    formData.append('totalChunks', chunk.totalChunks.toString());
    formData.append('checksum', chunk.checksum);
    formData.append('chunk', new Blob([chunk.data]));

    const response = await fetch(`${this.baseUrl}/api/videos/upload/chunk`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'X-Upload-Token': uploadToken,
      },
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`Failed to upload chunk ${chunk.chunkIndex}: ${response.statusText}`);
    }
  }

  /**
   * Finaliza o upload após todos os chunks serem enviados
   */
  private async finalizeUpload(
    sessionId: string,
    uploadToken: string
  ): Promise<VideoUploadResult> {
    const response = await fetch(`${this.baseUrl}/api/videos/upload/finalize`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`,
        'X-Upload-Token': uploadToken,
      },
      body: JSON.stringify({ sessionId }),
    });

    if (!response.ok) {
      throw new Error(`Failed to finalize upload: ${response.statusText}`);
    }

    const data = await response.json();
    return data.result;
  }

  /**
   * Valida o arquivo antes do upload
   */
  private validateFile(file: File): VideoAPIResponse<boolean> {
    // Verificar tamanho do arquivo
    if (file.size > this.config.maxFileSize) {
      return {
        success: false,
        error: {
          code: VideoErrorCode.FILE_TOO_LARGE,
          message: `File size exceeds maximum allowed size of ${formatVideoSize(this.config.maxFileSize)}`,
          details: { fileSize: file.size, maxSize: this.config.maxFileSize },
        },
      };
    }

    // Verificar formato do arquivo
    const fileExtension = file.name.split('.').pop()?.toLowerCase() as VideoFormat;
    if (!isValidVideoFormat(fileExtension)) {
      return {
        success: false,
        error: {
          code: VideoErrorCode.UNSUPPORTED_FORMAT,
          message: `Unsupported file format: ${fileExtension}`,
          details: { 
            format: fileExtension, 
            supportedFormats: this.config.supportedFormats 
          },
        },
      };
    }

    return { success: true, data: true };
  }

  /**
   * Calcula o checksum de um chunk
   */
  private async calculateChecksum(data: ArrayBuffer): Promise<string> {
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }

  /**
   * Calcula a velocidade de upload
   */
  private calculateUploadSpeed(bytesUploaded: number, timeElapsed: number): number {
    if (timeElapsed === 0) return 0;
    return (bytesUploaded / timeElapsed) * 1000; // bytes per second
  }

  /**
   * Calcula o tempo restante estimado
   */
  private calculateTimeRemaining(
    bytesUploaded: number,
    totalBytes: number,
    timeElapsed: number
  ): number {
    if (bytesUploaded === 0 || timeElapsed === 0) return 0;
    
    const speed = this.calculateUploadSpeed(bytesUploaded, timeElapsed);
    const remainingBytes = totalBytes - bytesUploaded;
    
    return remainingBytes / speed; // seconds
  }

  /**
   * Retoma um upload interrompido
   */
  async resumeUpload(
    videoId: string,
    file: File,
    onProgress?: (progress: UploadProgress) => void
  ): Promise<VideoAPIResponse<VideoUploadResult>> {
    try {
      // Verificar se existe uma sessão de upload
      const session = this.uploadSessions.get(videoId);
      if (!session) {
        return {
          success: false,
          error: {
            code: VideoErrorCode.INVALID_PARAMETERS,
            message: 'No upload session found for this video',
            details: { videoId },
          },
        };
      }

      // Verificar quais chunks já foram enviados
      const uploadedChunks = await this.getUploadedChunks(session.sessionId);
      const totalChunks = Math.ceil(file.size / this.config.chunkSize);
      
      let uploadedBytes = uploadedChunks.length * this.config.chunkSize;
      const startTime = Date.now();

      // Continuar upload dos chunks restantes
      for (let chunkIndex = 0; chunkIndex < totalChunks; chunkIndex++) {
        if (uploadedChunks.includes(chunkIndex)) {
          continue; // Chunk já foi enviado
        }

        const start = chunkIndex * this.config.chunkSize;
        const end = Math.min(start + this.config.chunkSize, file.size);
        const chunkBlob = file.slice(start, end);
        const chunkBuffer = await chunkBlob.arrayBuffer();
        
        const chunk: VideoUploadChunk = {
          chunkIndex,
          totalChunks,
          chunkSize: chunkBuffer.byteLength,
          checksum: await this.calculateChecksum(chunkBuffer),
          data: chunkBuffer,
        };

        await this.uploadChunk(session.sessionId, chunk, session.sessionId);
        
        uploadedBytes += chunk.chunkSize;
        
        if (onProgress) {
          const progress: UploadProgress = {
            loaded: uploadedBytes,
            total: file.size,
            percentage: (uploadedBytes / file.size) * 100,
            speed: this.calculateUploadSpeed(uploadedBytes, Date.now() - startTime),
            timeRemaining: this.calculateTimeRemaining(uploadedBytes, file.size, Date.now() - startTime),
          };
          
          onProgress(progress);
          this.emit(VideoEventType.UPLOAD_PROGRESS, { videoId, progress });
        }
      }

      // Finalizar upload
      const result = await this.finalizeUpload(session.sessionId, session.sessionId);
      this.uploadSessions.delete(videoId);
      
      this.emit(VideoEventType.UPLOAD_COMPLETED, { videoId, result });
      
      return createVideoSuccess('Video upload resumed and completed', result);
    } catch (error) {
      const videoError = createVideoError(
        VideoErrorCode.UPLOAD_FAILED,
        'Failed to resume video upload',
        error
      );
      
      this.emit(VideoEventType.UPLOAD_FAILED, { error: videoError });
      
      return {
        success: false,
        error: videoError,
      };
    }
  }

  /**
   * Obtém a lista de chunks já enviados
   */
  private async getUploadedChunks(sessionId: string): Promise<number[]> {
    const response = await fetch(`${this.baseUrl}/api/videos/upload/session/${sessionId}/chunks`, {
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to get uploaded chunks: ${response.statusText}`);
    }

    const data = await response.json();
    return data.uploadedChunks || [];
  }

  /**
   * Cancela um upload em andamento
   */
  async cancelUpload(videoId: string): Promise<VideoAPIResponse<boolean>> {
    try {
      const session = this.uploadSessions.get(videoId);
      if (!session) {
        return {
          success: false,
          error: {
            code: VideoErrorCode.INVALID_PARAMETERS,
            message: 'No upload session found for this video',
            details: { videoId },
          },
        };
      }

      // Cancelar no servidor
      const response = await fetch(`${this.baseUrl}/api/videos/upload/session/${session.sessionId}/cancel`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to cancel upload: ${response.statusText}`);
      }

      // Remover sessão local
      this.uploadSessions.delete(videoId);
      
      this.emit(VideoEventType.UPLOAD_FAILED, { videoId, reason: 'cancelled' });
      
      return createVideoSuccess('Upload cancelled successfully', true);
    } catch (error) {
      return {
        success: false,
        error: createVideoError(
          VideoErrorCode.UNKNOWN,
          'Failed to cancel upload',
          error
        ),
      };
    }
  }

  /**
   * Obtém o status de processamento de um vídeo
   */
  async getProcessingStatus(videoId: string): Promise<VideoAPIResponse<VideoProcessingJob[]>> {
    try {
      const response = await fetch(`${this.baseUrl}/api/videos/${videoId}/processing`, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to get processing status: ${response.statusText}`);
      }

      const data = await response.json();
      return createVideoSuccess('Processing status retrieved', data.jobs);
    } catch (error) {
      return {
        success: false,
        error: createVideoError(
          VideoErrorCode.UNKNOWN,
          'Failed to get processing status',
          error
        ),
      };
    }
  }

  /**
   * Obtém metadados de um vídeo
   */
  async getVideoMetadata(videoId: string): Promise<VideoAPIResponse<VideoMetadata>> {
    try {
      const response = await fetch(`${this.baseUrl}/api/videos/${videoId}/metadata`, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to get video metadata: ${response.statusText}`);
      }

      const data = await response.json();
      return createVideoSuccess('Video metadata retrieved', data.metadata);
    } catch (error) {
      return {
        success: false,
        error: createVideoError(
          VideoErrorCode.UNKNOWN,
          'Failed to get video metadata',
          error
        ),
      };
    }
  }

  /**
   * Atualiza metadados de um vídeo
   */
  async updateVideoMetadata(
    videoId: string,
    metadata: Partial<VideoMetadata>
  ): Promise<VideoAPIResponse<VideoMetadata>> {
    try {
      const metadataErrors = validateVideoMetadata(metadata);
      if (metadataErrors.length > 0) {
        return {
          success: false,
          error: {
            code: VideoErrorCode.INVALID_PARAMETERS,
            message: 'Invalid metadata',
            details: metadataErrors,
          },
        };
      }

      const response = await fetch(`${this.baseUrl}/api/videos/${videoId}/metadata`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify(metadata),
      });

      if (!response.ok) {
        throw new Error(`Failed to update video metadata: ${response.statusText}`);
      }

      const data = await response.json();
      return createVideoSuccess('Video metadata updated', data.metadata);
    } catch (error) {
      return {
        success: false,
        error: createVideoError(
          VideoErrorCode.UNKNOWN,
          'Failed to update video metadata',
          error
        ),
      };
    }
  }

  /**
   * Deleta um vídeo
   */
  async deleteVideo(videoId: string): Promise<VideoAPIResponse<boolean>> {
    try {
      const response = await fetch(`${this.baseUrl}/api/videos/${videoId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to delete video: ${response.statusText}`);
      }

      return createVideoSuccess('Video deleted successfully', true);
    } catch (error) {
      return {
        success: false,
        error: createVideoError(
          VideoErrorCode.UNKNOWN,
          'Failed to delete video',
          error
        ),
      };
    }
  }

  /**
   * Adiciona um listener para eventos de vídeo
   */
  addEventListener(eventType: VideoEventType, listener: (data: unknown) => void): void {
    const listeners = this.eventListeners.get(eventType) || [];
    listeners.push(listener);
    this.eventListeners.set(eventType, listeners);
  }

  /**
   * Remove um listener de eventos de vídeo
   */
  removeEventListener(eventType: VideoEventType, listener: (data: unknown) => void): void {
    const listeners = this.eventListeners.get(eventType) || [];
    const index = listeners.indexOf(listener);
    if (index > -1) {
      listeners.splice(index, 1);
      this.eventListeners.set(eventType, listeners);
    }
  }

  /**
   * Emite um evento
   */
  private emit(eventType: VideoEventType, data: unknown): void {
    const listeners = this.eventListeners.get(eventType) || [];
    listeners.forEach(listener => {
      try {
        listener(data);
      } catch (error) {
        console.error(`Error in event listener for ${eventType}:`, error);
      }
    });
  }

  /**
   * Obtém a configuração atual
   */
  getConfig(): VideoUploadConfig {
    return { ...this.config };
  }

  /**
   * Atualiza a configuração
   */
  updateConfig(newConfig: Partial<VideoUploadConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  /**
   * Obtém a configuração de segurança atual
   */
  getSecurityConfig(): VideoSecurityConfig {
    return { ...this.securityConfig };
  }

  /**
   * Atualiza a configuração de segurança
   */
  updateSecurityConfig(newConfig: Partial<VideoSecurityConfig>): void {
    this.securityConfig = { ...this.securityConfig, ...newConfig };
  }

  /**
   * Obtém estatísticas de upload
   */
  getUploadStats(): {
    activeSessions: number;
    totalSessions: number;
    averageSpeed: number;
    successRate: number;
  } {
    return {
      activeSessions: this.uploadSessions.size,
      totalSessions: 0, // Implementar contador persistente
      averageSpeed: 0, // Implementar cálculo de velocidade média
      successRate: 0, // Implementar cálculo de taxa de sucesso
    };
  }

  /**
   * Limpa sessões expiradas
   */
  cleanupExpiredSessions(): void {
    const now = new Date();
    for (const [videoId, session] of this.uploadSessions.entries()) {
      if (session.expiresAt < now) {
        this.uploadSessions.delete(videoId);
      }
    }
  }

  /**
   * Verifica se o serviço está disponível
   */
  async healthCheck(): Promise<VideoAPIResponse<boolean>> {
    try {
      const response = await fetch(`${this.baseUrl}/api/health`, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Health check failed: ${response.statusText}`);
      }

      return createVideoSuccess('Service is healthy', true);
    } catch (error) {
      return {
        success: false,
        error: createVideoError(
          VideoErrorCode.SERVER_ERROR,
          'Service health check failed',
          error
        ),
      };
    }
  }
}

// Instância singleton do serviço
let videoUploadServiceInstance: VideoUploadService | null = null;

/**
 * Inicializa o serviço de upload de vídeos
 */
export function initializeVideoUploadService(
  baseUrl: string,
  apiKey: string,
  config?: Partial<VideoUploadConfig>,
  securityConfig?: Partial<VideoSecurityConfig>
): VideoUploadService {
  videoUploadServiceInstance = new VideoUploadService(baseUrl, apiKey, config, securityConfig);
  return videoUploadServiceInstance;
}

/**
 * Obtém a instância do serviço de upload de vídeos
 */
export function getVideoUploadService(): VideoUploadService {
  if (!videoUploadServiceInstance) {
    throw new Error('Video upload service not initialized. Call initializeVideoUploadService first.');
  }
  return videoUploadServiceInstance;
}

/**
 * Utilitários para upload de vídeos
 */
export const VideoUploadUtils = {
  /**
   * Converte bytes para formato legível
   */
  formatFileSize: formatVideoSize,

  /**
   * Valida formato de vídeo
   */
  isValidFormat: isValidVideoFormat,

  /**
   * Gera ID único para vídeo
   */
  generateId: generateVideoId,

  /**
   * Gera token de upload
   */
  generateToken: generateUploadToken,

  /**
   * Valida metadados de vídeo
   */
  validateMetadata: validateVideoMetadata,

  /**
   * Calcula tempo estimado de upload
   */
  estimateUploadTime: (fileSize: number, speed: number): number => {
    if (speed === 0) return 0;
    return fileSize / speed;
  },

  /**
   * Calcula número de chunks necessários
   */
  calculateChunkCount: (fileSize: number, chunkSize: number): number => {
    return Math.ceil(fileSize / chunkSize);
  },

  /**
   * Verifica se o arquivo precisa ser dividido em chunks
   */
  needsChunking: (fileSize: number, chunkSize: number): boolean => {
    return fileSize > chunkSize;
  },

  /**
   * Obtém extensão do arquivo
   */
  getFileExtension: (fileName: string): string => {
    return fileName.split('.').pop()?.toLowerCase() || '';
  },

  /**
   * Verifica se o navegador suporta upload de arquivos
   */
  supportsFileUpload: (): boolean => {
    return !!(window.File && window.FileReader && window.FileList && window.Blob);
  },

  /**
   * Verifica se o navegador suporta Web Workers
   */
  supportsWebWorkers: (): boolean => {
    return typeof Worker !== 'undefined';
  },

  /**
   * Verifica se o navegador suporta Crypto API
   */
  supportsCrypto: (): boolean => {
    return !!(window.crypto && window.crypto.subtle);
  },
};

export default VideoUploadService;