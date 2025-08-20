// ============================================================================
// Video Service - Gerenciamento de Upload e Streaming de Vídeos
// ============================================================================

import { createClient } from '@supabase/supabase-js';
import {
  VideoUpload,
  VideoUploadCreate,
  VideoUploadUpdate,
  UploadConfig,
  UploadProgress,
  ProcessingProgress,
  VideoMetadata,
  QualityVariant,
  StreamingUrl,
  VideoAnalytics,
  VideoComment,
  VideoFilters,
  VideoPlaylist,
  VideoSystemConfig,
  VideoAPI,
  VideoServiceConfig,
  UploadStatus,
  ProcessingStatus,
  VideoQuality,
  VideoFormat,
  VideoContentType,
  VideoPrivacyLevel,
  WatermarkSettings,
  SecuritySettings,
  VIDEO_CONSTANTS
} from '@/types/video';

/**
 * Configuração padrão do serviço de vídeo
 */
const DEFAULT_CONFIG: VideoServiceConfig = {
  apiUrl: import.meta.env.VITE_SUPABASE_URL || '',
  uploadUrl: import.meta.env.VITE_SUPABASE_URL || '',
  cdnUrl: import.meta.env.VITE_CDN_URL || '',
  timeout: 30000,
  retryAttempts: 3
};

/**
 * Configuração padrão de upload
 */
const DEFAULT_UPLOAD_CONFIG: UploadConfig = {
  maxFileSize: VIDEO_CONSTANTS.MAX_FILE_SIZE,
  allowedFormats: VIDEO_CONSTANTS.SUPPORTED_FORMATS,
  chunkSize: VIDEO_CONSTANTS.CHUNK_SIZE,
  maxConcurrentUploads: VIDEO_CONSTANTS.MAX_CONCURRENT_UPLOADS,
  autoProcess: true,
  generateThumbnails: true,
  privacy: 'private',
  contentType: 'training'
};

class VideoService implements VideoAPI {
  private supabase;
  private config: VideoServiceConfig;
  private uploadQueue: Map<string, VideoUpload> = new Map();
  private activeUploads: Map<string, AbortController> = new Map();
  private eventListeners: Map<string, Function[]> = new Map();

  constructor(config?: Partial<VideoServiceConfig>) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.supabase = createClient(
      this.config.apiUrl,
      import.meta.env.VITE_SUPABASE_ANON_KEY || ''
    );
  }

  // ============================================================================
  // Event Management
  // ============================================================================

  /**
   * Adiciona listener para eventos
   */
  addEventListener(event: string, callback: Function): void {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, []);
    }
    this.eventListeners.get(event)?.push(callback);
  }

  /**
   * Remove listener de eventos
   */
  removeEventListener(event: string, callback: Function): void {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      const index = listeners.indexOf(callback);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    }
  }

  /**
   * Emite evento
   */
  private emit(event: string, data: unknown): void {
    const listeners = this.eventListeners.get(event) || [];
    listeners.forEach(callback => callback(data));
  }

  // ============================================================================
  // Upload Management
  // ============================================================================

  /**
   * Faz upload de um vídeo
   */
  async upload(file: File, config: UploadConfig = DEFAULT_UPLOAD_CONFIG): Promise<VideoUpload> {
    const uploadId = this.generateUploadId();
    const abortController = new AbortController();
    
    // Validação do arquivo
    this.validateFile(file, config);
    
    // Extração de metadados
    const metadata = await this.extractMetadata(file);
    
    // Criação do objeto de upload
    const upload: VideoUpload = {
      id: uploadId,
      title: file.name.replace(/\.[^/.]+$/, ''),
      fileName: file.name,
      file,
      contentType: config.contentType,
      privacy: config.privacy,
      status: 'uploading',
      metadata,
      thumbnails: [],
      subtitles: [],
      chapters: [],
      qualities: [],
      streamingUrls: [],
      comments: [],
      uploadedBy: await this.getCurrentUserId(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      tags: [],
      playlistIds: [],
      relatedVideoIds: [],
      allowedUsers: [],
      allowedRoles: [],
      watermark: config.watermark,
      uploadProgress: {
        uploadedBytes: 0,
        totalBytes: file.size,
        percentage: 0,
        speed: 0,
        estimatedTimeRemaining: 0,
        currentChunk: 0,
        totalChunks: Math.ceil(file.size / config.chunkSize)
      }
    };

    this.uploadQueue.set(uploadId, upload);
    this.activeUploads.set(uploadId, abortController);
    
    this.emit('uploadStart', upload);

    try {
      // Upload em chunks
      await this.uploadInChunks(upload, config, abortController.signal);
      
      // Salvar no banco de dados
      const savedUpload = await this.saveToDatabase(upload);
      
      // Iniciar processamento se configurado
      if (config.autoProcess) {
        this.startProcessing(savedUpload.id);
      }
      
      this.emit('uploadComplete', savedUpload);
      return savedUpload;
      
    } catch (error) {
      upload.status = 'error';
      upload.error = {
        code: 'UPLOAD_FAILED',
        message: error instanceof Error ? error.message : 'Upload failed',
        details: error
      };
      
      this.emit('uploadError', { upload, error });
      throw error;
      
    } finally {
      this.activeUploads.delete(uploadId);
    }
  }

  /**
   * Upload em chunks para arquivos grandes
   */
  private async uploadInChunks(
    upload: VideoUpload,
    config: UploadConfig,
    signal: AbortSignal
  ): Promise<void> {
    const file = upload.file!;
    const chunkSize = config.chunkSize;
    const totalChunks = Math.ceil(file.size / chunkSize);
    
    let uploadedBytes = 0;
    const startTime = Date.now();

    for (let chunkIndex = 0; chunkIndex < totalChunks; chunkIndex++) {
      if (signal.aborted) {
        throw new Error('Upload cancelled');
      }

      const start = chunkIndex * chunkSize;
      const end = Math.min(start + chunkSize, file.size);
      const chunk = file.slice(start, end);
      
      const chunkStartTime = Date.now();
      
      // Upload do chunk
      await this.uploadChunk(upload.id, chunk, chunkIndex);
      
      uploadedBytes += chunk.size;
      const currentTime = Date.now();
      const elapsedTime = (currentTime - startTime) / 1000;
      const speed = uploadedBytes / elapsedTime;
      const remainingBytes = file.size - uploadedBytes;
      const estimatedTimeRemaining = remainingBytes / speed;
      
      // Atualizar progresso
      upload.uploadProgress = {
        uploadedBytes,
        totalBytes: file.size,
        percentage: (uploadedBytes / file.size) * 100,
        speed,
        estimatedTimeRemaining,
        currentChunk: chunkIndex + 1,
        totalChunks
      };
      
      this.emit('uploadProgress', upload);
    }
    
    upload.status = 'completed';
  }

  /**
   * Upload de um chunk individual
   */
  private async uploadChunk(uploadId: string, chunk: Blob, chunkIndex: number): Promise<void> {
    const fileName = `${uploadId}/chunk_${chunkIndex.toString().padStart(6, '0')}`;
    
    const { error } = await this.supabase.storage
      .from('videos')
      .upload(fileName, chunk, {
        cacheControl: '3600',
        upsert: false
      });
    
    if (error) {
      throw new Error(`Failed to upload chunk ${chunkIndex}: ${error.message}`);
    }
  }

  /**
   * Pausa um upload
   */
  pauseUpload(uploadId: string): void {
    const controller = this.activeUploads.get(uploadId);
    if (controller) {
      controller.abort();
      const upload = this.uploadQueue.get(uploadId);
      if (upload) {
        upload.status = 'idle';
        this.emit('uploadPaused', upload);
      }
    }
  }

  /**
   * Cancela um upload
   */
  cancelUpload(uploadId: string): void {
    const controller = this.activeUploads.get(uploadId);
    if (controller) {
      controller.abort();
    }
    
    const upload = this.uploadQueue.get(uploadId);
    if (upload) {
      upload.status = 'cancelled';
      this.uploadQueue.delete(uploadId);
      this.emit('uploadCancelled', upload);
    }
    
    this.activeUploads.delete(uploadId);
  }

  // ============================================================================
  // Video Processing
  // ============================================================================

  /**
   * Inicia o processamento de um vídeo
   */
  private async startProcessing(videoId: string): Promise<void> {
    const upload = await this.getVideo(videoId);
    if (!upload) return;

    upload.status = 'processing';
    upload.processingProgress = {
      status: 'pending',
      percentage: 0,
      currentStep: 'Iniciando processamento...',
      qualitiesProcessed: [],
      qualitiesRemaining: VIDEO_CONSTANTS.DEFAULT_QUALITIES
    };

    this.emit('processingStart', upload);

    try {
      // Gerar thumbnails
      await this.generateThumbnails(upload);
      
      // Processar qualidades
      await this.processQualities(upload);
      
      // Aplicar marca d'água se configurado
      if (upload.watermark?.enabled) {
        await this.applyWatermark(upload);
      }
      
      // Gerar URLs de streaming
      await this.generateStreamingUrls(upload);
      
      upload.status = 'completed';
      upload.processingProgress!.status = 'completed';
      upload.processingProgress!.percentage = 100;
      
      await this.updateVideo(videoId, upload);
      this.emit('processingComplete', upload);
      
    } catch (error) {
      upload.status = 'error';
      upload.error = {
        code: 'PROCESSING_FAILED',
        message: error instanceof Error ? error.message : 'Processing failed',
        details: error
      };
      
      this.emit('processingError', { upload, error });
    }
  }

  /**
   * Gera thumbnails do vídeo
   */
  private async generateThumbnails(upload: VideoUpload): Promise<void> {
    if (!upload.metadata) return;
    
    upload.processingProgress!.currentStep = 'Gerando thumbnails...';
    upload.processingProgress!.status = 'generating_thumbnails';
    
    const duration = upload.metadata.duration;
    const thumbnailCount = VIDEO_CONSTANTS.THUMBNAIL_COUNT;
    const interval = duration / thumbnailCount;
    
    for (let i = 0; i < thumbnailCount; i++) {
      const timestamp = i * interval;
      const thumbnail = await this.generateThumbnailAtTime(upload.id, timestamp);
      upload.thumbnails.push(thumbnail);
      
      upload.processingProgress!.percentage = (i / thumbnailCount) * 20; // 20% do progresso total
      this.emit('processingProgress', upload);
    }
  }

  /**
   * Processa diferentes qualidades do vídeo
   */
  private async processQualities(upload: VideoUpload): Promise<void> {
    upload.processingProgress!.currentStep = 'Processando qualidades...';
    upload.processingProgress!.status = 'transcoding';
    
    const qualities = VIDEO_CONSTANTS.DEFAULT_QUALITIES;
    
    for (let i = 0; i < qualities.length; i++) {
      const quality = qualities[i];
      const variant = await this.transcodeToQuality(upload, quality);
      upload.qualities.push(variant);
      
      upload.processingProgress!.qualitiesProcessed.push(quality);
      upload.processingProgress!.qualitiesRemaining = qualities.slice(i + 1);
      upload.processingProgress!.percentage = 20 + ((i + 1) / qualities.length) * 60; // 60% do progresso total
      
      this.emit('processingProgress', upload);
    }
  }

  // ============================================================================
  // Database Operations
  // ============================================================================

  /**
   * Salva upload no banco de dados
   */
  private async saveToDatabase(upload: VideoUpload): Promise<VideoUpload> {
    const { file, ...uploadData } = upload;
    
    const { data, error } = await this.supabase
      .from('videos')
      .insert(uploadData)
      .select()
      .single();
    
    if (error) {
      throw new Error(`Failed to save video: ${error.message}`);
    }
    
    return data;
  }

  /**
   * Busca um vídeo por ID
   */
  async getVideo(id: string): Promise<VideoUpload> {
    const { data, error } = await this.supabase
      .from('videos')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) {
      throw new Error(`Failed to get video: ${error.message}`);
    }
    
    return data;
  }

  /**
   * Atualiza um vídeo
   */
  async updateVideo(id: string, updates: Partial<VideoUpload>): Promise<VideoUpload> {
    const { data, error } = await this.supabase
      .from('videos')
      .update({ ...updates, updatedAt: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();
    
    if (error) {
      throw new Error(`Failed to update video: ${error.message}`);
    }
    
    return data;
  }

  /**
   * Deleta um vídeo
   */
  async deleteVideo(id: string): Promise<void> {
    // Deletar arquivos do storage
    await this.deleteVideoFiles(id);
    
    // Deletar do banco
    const { error } = await this.supabase
      .from('videos')
      .delete()
      .eq('id', id);
    
    if (error) {
      throw new Error(`Failed to delete video: ${error.message}`);
    }
  }

  /**
   * Busca vídeos com filtros
   */
  async getVideos(filters: VideoFilters = {}): Promise<VideoUpload[]> {
    let query = this.supabase.from('videos').select('*');
    
    if (filters.contentType) {
      query = query.eq('contentType', filters.contentType);
    }
    
    if (filters.privacy) {
      query = query.eq('privacy', filters.privacy);
    }
    
    if (filters.status) {
      query = query.eq('status', filters.status);
    }
    
    if (filters.uploadedBy) {
      query = query.eq('uploadedBy', filters.uploadedBy);
    }
    
    if (filters.search) {
      query = query.or(`title.ilike.%${filters.search}%,description.ilike.%${filters.search}%`);
    }
    
    if (filters.tags && filters.tags.length > 0) {
      query = query.contains('tags', filters.tags);
    }
    
    if (filters.dateRange) {
      query = query
        .gte('createdAt', filters.dateRange.start)
        .lte('createdAt', filters.dateRange.end);
    }
    
    if (filters.sortBy) {
      query = query.order(filters.sortBy, { ascending: filters.sortOrder === 'asc' });
    }
    
    if (filters.limit) {
      query = query.limit(filters.limit);
    }
    
    if (filters.offset) {
      query = query.range(filters.offset, filters.offset + (filters.limit || 10) - 1);
    }
    
    const { data, error } = await query;
    
    if (error) {
      throw new Error(`Failed to get videos: ${error.message}`);
    }
    
    return data || [];
  }

  // ============================================================================
  // Streaming and Security
  // ============================================================================

  /**
   * Gera URL de streaming segura
   */
  async getStreamingUrl(id: string, quality: VideoQuality): Promise<StreamingUrl> {
    const video = await this.getVideo(id);
    const variant = video.qualities.find(q => q.quality === quality);
    
    if (!variant) {
      throw new Error(`Quality ${quality} not available for video ${id}`);
    }
    
    // Gerar token de acesso
    const token = await this.generateAccessToken(id, quality);
    
    const streamingUrl: StreamingUrl = {
      url: `${this.config.cdnUrl}/videos/${id}/${quality}/playlist.m3u8?token=${token}`,
      expiresAt: new Date(Date.now() + VIDEO_CONSTANTS.TOKEN_EXPIRATION * 1000).toISOString(),
      quality,
      isSecure: true,
      token
    };
    
    return streamingUrl;
  }

  // ============================================================================
  // Analytics and Comments
  // ============================================================================

  /**
   * Busca analytics de um vídeo
   */
  async getAnalytics(id: string): Promise<VideoAnalytics> {
    const { data, error } = await this.supabase
      .from('video_analytics')
      .select('*')
      .eq('videoId', id)
      .single();
    
    if (error) {
      throw new Error(`Failed to get analytics: ${error.message}`);
    }
    
    return data;
  }

  /**
   * Adiciona comentário a um vídeo
   */
  async addComment(videoId: string, comment: Omit<VideoComment, 'id' | 'createdAt'>): Promise<VideoComment> {
    const newComment = {
      ...comment,
      id: this.generateCommentId(),
      createdAt: new Date().toISOString(),
      likes: 0,
      isEdited: false
    };
    
    const { data, error } = await this.supabase
      .from('video_comments')
      .insert(newComment)
      .select()
      .single();
    
    if (error) {
      throw new Error(`Failed to add comment: ${error.message}`);
    }
    
    return data;
  }

  /**
   * Busca comentários de um vídeo
   */
  async getComments(videoId: string): Promise<VideoComment[]> {
    const { data, error } = await this.supabase
      .from('video_comments')
      .select('*')
      .eq('videoId', videoId)
      .order('createdAt', { ascending: false });
    
    if (error) {
      throw new Error(`Failed to get comments: ${error.message}`);
    }
    
    return data || [];
  }

  // ============================================================================
  // Utility Methods
  // ============================================================================

  /**
   * Valida arquivo de vídeo
   */
  private validateFile(file: File, config: UploadConfig): void {
    if (file.size > config.maxFileSize) {
      throw new Error(`File size exceeds maximum allowed size of ${config.maxFileSize} bytes`);
    }
    
    const fileExtension = file.name.split('.').pop()?.toLowerCase() as VideoFormat;
    if (!config.allowedFormats.includes(fileExtension)) {
      throw new Error(`File format ${fileExtension} is not supported`);
    }
  }

  /**
   * Extrai metadados do vídeo
   */
  private async extractMetadata(file: File): Promise<VideoMetadata> {
    return new Promise((resolve, reject) => {
      const video = document.createElement('video');
      video.preload = 'metadata';
      
      video.onloadedmetadata = () => {
        const metadata: VideoMetadata = {
          duration: video.duration,
          fileSize: file.size,
          format: file.name.split('.').pop()?.toLowerCase() as VideoFormat,
          resolution: {
            width: video.videoWidth,
            height: video.videoHeight
          },
          bitrate: 0, // Seria calculado no servidor
          frameRate: 0, // Seria calculado no servidor
          hasAudio: true, // Assumindo que tem áudio
          videoCodec: 'unknown',
          aspectRatio: `${video.videoWidth}:${video.videoHeight}`
        };
        
        URL.revokeObjectURL(video.src);
        resolve(metadata);
      };
      
      video.onerror = () => {
        URL.revokeObjectURL(video.src);
        reject(new Error('Failed to extract video metadata'));
      };
      
      video.src = URL.createObjectURL(file);
    });
  }

  /**
   * Gera ID único para upload
   */
  private generateUploadId(): string {
    return `upload_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Gera ID único para comentário
   */
  private generateCommentId(): string {
    return `comment_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Busca ID do usuário atual
   */
  private async getCurrentUserId(): Promise<string> {
    const { data: { user } } = await this.supabase.auth.getUser();
    return user?.id || 'anonymous';
  }

  /**
   * Gera token de acesso para streaming
   */
  private async generateAccessToken(videoId: string, quality: VideoQuality): Promise<string> {
    // Implementação simplificada - em produção seria mais robusta
    const payload = {
      videoId,
      quality,
      userId: await this.getCurrentUserId(),
      expiresAt: Date.now() + VIDEO_CONSTANTS.TOKEN_EXPIRATION * 1000
    };
    
    return btoa(JSON.stringify(payload));
  }

  /**
   * Métodos de processamento (implementação simplificada)
   */
  private async generateThumbnailAtTime(videoId: string, timestamp: number): Promise<VideoThumbnail> {
    // Implementação seria feita no servidor
    return {
      id: `thumb_${Date.now()}`,
      url: `${this.config.cdnUrl}/thumbnails/${videoId}/${timestamp}.jpg`,
      timestamp,
      width: 320,
      height: 180,
      isDefault: timestamp === 0
    };
  }

  private async transcodeToQuality(upload: VideoUpload, quality: VideoQuality): Promise<QualityVariant> {
    // Implementação seria feita no servidor
    return {
      quality,
      url: `${this.config.cdnUrl}/videos/${upload.id}/${quality}/index.m3u8`,
      fileSize: upload.metadata?.fileSize || 0,
      bitrate: 0,
      resolution: upload.metadata?.resolution || { width: 0, height: 0 },
      format: 'mp4',
      isReady: true
    };
  }

  private async applyWatermark(upload: VideoUpload): Promise<void> {
    // Implementação seria feita no servidor
    upload.processingProgress!.currentStep = 'Aplicando marca d\'água...';
    upload.processingProgress!.status = 'applying_watermark';
  }

  private async generateStreamingUrls(upload: VideoUpload): Promise<void> {
    // Implementação seria feita no servidor
    upload.processingProgress!.currentStep = 'Gerando URLs de streaming...';
    upload.processingProgress!.status = 'uploading_to_cdn';
  }

  private async deleteVideoFiles(videoId: string): Promise<void> {
    // Deletar todos os arquivos relacionados ao vídeo
    const { error } = await this.supabase.storage
      .from('videos')
      .remove([`${videoId}/`]);
    
    if (error) {
      console.error('Failed to delete video files:', error);
    }
  }
}

// Instância singleton do serviço
export const videoService = new VideoService();
export default VideoService;