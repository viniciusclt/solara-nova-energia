// =====================================================================================
// SERVIÇO DE UPLOAD DE VÍDEOS VPS - SOLARA NOVA ENERGIA
// =====================================================================================

import { 
  VideoMetadata, 
  UploadProgress, 
  VideoFormat, 
  VideoValidationResult,
  VideoError,
  VIDEO_CONSTANTS,
  VideoProcessingJob,
  ProcessedVideoFile
} from '../types/video';
import { supabase } from '../integrations/supabase/client';

class VideoUploadService {
  private readonly VPS_ENDPOINT = import.meta.env.VITE_VPS_VIDEO_ENDPOINT || 'https://videos.solara.com.br';
  private readonly SECURITY_TOKEN = import.meta.env.VITE_VPS_SECURITY_TOKEN || '';
  private readonly API_KEY = import.meta.env.VITE_VPS_API_KEY || '';
  
  private uploadAbortController: AbortController | null = null;
  private uploadStartTime: number = 0;
  private uploadedBytes: number = 0;

  /**
   * Upload de vídeo com drag-and-drop e compressão automática
   */
  async uploadVideo(
    file: File,
    metadata: Partial<VideoMetadata>,
    onProgress?: (progress: UploadProgress) => void,
    onError?: (error: VideoError) => void
  ): Promise<VideoMetadata> {
    try {
      // Validação do arquivo
      const validation = this.validateFile(file);
      if (!validation.isValid) {
        throw new Error(validation.errors[0]?.message || 'Arquivo inválido');
      }

      // Inicializar controle de upload
      this.uploadAbortController = new AbortController();
      this.uploadStartTime = Date.now();
      this.uploadedBytes = 0;

      // Gerar thumbnails localmente
      const thumbnails = await this.generateThumbnails(file);
      
      // Criar registro no banco
      const videoRecord = await this.createVideoRecord({
        ...metadata,
        size: file.size,
        format: this.getFileFormat(file),
        thumbnails,
        status: 'uploading'
      });

      // Upload em chunks para VPS
      const uploadResult = await this.uploadToVPS(file, videoRecord.id, onProgress);
      
      // Iniciar processamento no servidor
      const processingJob = await this.startVideoProcessing(videoRecord.id, uploadResult.url);
      
      // Atualizar registro com URL e status
      const updatedVideo = await this.updateVideoRecord(videoRecord.id, {
        url: uploadResult.url,
        status: 'processing'
      });

      return updatedVideo;
    } catch (error) {
      const videoError: VideoError = {
        code: 'UPLOAD_FAILED',
        message: error instanceof Error ? error.message : 'Erro desconhecido no upload',
        timestamp: new Date()
      };
      
      if (onError) {
        onError(videoError);
      }
      
      throw error;
    }
  }

  /**
   * Cancelar upload em andamento
   */
  cancelUpload(): void {
    if (this.uploadAbortController) {
      this.uploadAbortController.abort();
      this.uploadAbortController = null;
    }
  }

  /**
   * Validação de arquivo
   */
  private validateFile(file: File): VideoValidationResult {
    const errors: VideoError[] = [];
    const warnings: VideoError[] = [];

    // Verificar tamanho
    if (file.size > VIDEO_CONSTANTS.MAX_FILE_SIZE) {
      errors.push({
        code: 'FILE_TOO_LARGE',
        message: `Arquivo muito grande. Máximo: ${VIDEO_CONSTANTS.MAX_FILE_SIZE / (1024 * 1024 * 1024)}GB`,
        timestamp: new Date()
      });
    }

    // Verificar formato
    const format = this.getFileFormat(file);
    if (!VIDEO_CONSTANTS.SUPPORTED_FORMATS.includes(format)) {
      errors.push({
        code: 'UNSUPPORTED_FORMAT',
        message: `Formato não suportado. Formatos aceitos: ${VIDEO_CONSTANTS.SUPPORTED_FORMATS.join(', ')}`,
        timestamp: new Date()
      });
    }

    // Avisos para arquivos grandes
    if (file.size > 500 * 1024 * 1024) { // 500MB
      warnings.push({
        code: 'LARGE_FILE',
        message: 'Arquivo grande detectado. O upload pode demorar mais tempo.',
        timestamp: new Date()
      });
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Upload para VPS em chunks
   */
  private async uploadToVPS(
    file: File,
    videoId: string,
    onProgress?: (progress: UploadProgress) => void
  ): Promise<{ url: string; key: string }> {
    const totalChunks = Math.ceil(file.size / VIDEO_CONSTANTS.CHUNK_SIZE);
    const uploadId = await this.initializeMultipartUpload(videoId, file);
    const parts: { ETag: string; PartNumber: number }[] = [];

    for (let i = 0; i < totalChunks; i++) {
      if (this.uploadAbortController?.signal.aborted) {
        throw new Error('Upload cancelado pelo usuário');
      }

      const start = i * VIDEO_CONSTANTS.CHUNK_SIZE;
      const end = Math.min(start + VIDEO_CONSTANTS.CHUNK_SIZE, file.size);
      const chunk = file.slice(start, end);

      const part = await this.uploadChunk(uploadId, chunk, i + 1);
      parts.push(part);
      
      this.uploadedBytes = end;

      // Callback de progresso
      if (onProgress) {
        const progress = this.calculateProgress(end, file.size);
        onProgress({
          ...progress,
          currentChunk: i + 1,
          totalChunks
        });
      }
    }

    return await this.completeMultipartUpload(uploadId, parts);
  }

  /**
   * Inicializar upload multipart
   */
  private async initializeMultipartUpload(videoId: string, file: File): Promise<string> {
    const response = await fetch(`${this.VPS_ENDPOINT}/api/upload/initialize`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.SECURITY_TOKEN}`,
        'X-API-Key': this.API_KEY
      },
      body: JSON.stringify({
        videoId,
        fileName: file.name,
        fileSize: file.size,
        contentType: file.type
      }),
      signal: this.uploadAbortController?.signal
    });

    if (!response.ok) {
      throw new Error(`Erro ao inicializar upload: ${response.statusText}`);
    }

    const data = await response.json();
    return data.uploadId;
  }

  /**
   * Upload de chunk individual
   */
  private async uploadChunk(
    uploadId: string,
    chunk: Blob,
    partNumber: number
  ): Promise<{ ETag: string; PartNumber: number }> {
    const formData = new FormData();
    formData.append('chunk', chunk);
    formData.append('uploadId', uploadId);
    formData.append('partNumber', partNumber.toString());

    const response = await fetch(`${this.VPS_ENDPOINT}/api/upload/chunk`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.SECURITY_TOKEN}`,
        'X-API-Key': this.API_KEY
      },
      body: formData,
      signal: this.uploadAbortController?.signal
    });

    if (!response.ok) {
      throw new Error(`Erro no upload do chunk ${partNumber}: ${response.statusText}`);
    }

    const data = await response.json();
    return {
      ETag: data.etag,
      PartNumber: partNumber
    };
  }

  /**
   * Completar upload multipart
   */
  private async completeMultipartUpload(
    uploadId: string,
    parts: { ETag: string; PartNumber: number }[]
  ): Promise<{ url: string; key: string }> {
    const response = await fetch(`${this.VPS_ENDPOINT}/api/upload/complete`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.SECURITY_TOKEN}`,
        'X-API-Key': this.API_KEY
      },
      body: JSON.stringify({
        uploadId,
        parts
      }),
      signal: this.uploadAbortController?.signal
    });

    if (!response.ok) {
      throw new Error(`Erro ao completar upload: ${response.statusText}`);
    }

    return await response.json();
  }

  /**
   * Gerar thumbnails do vídeo
   */
  private async generateThumbnails(file: File): Promise<string[]> {
    return new Promise((resolve, reject) => {
      const video = document.createElement('video');
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      if (!ctx) {
        reject(new Error('Não foi possível criar contexto do canvas'));
        return;
      }

      const thumbnails: string[] = [];
      let processedCount = 0;
      const intervals = [0.1, 0.3, 0.5, 0.7, 0.9]; // 10%, 30%, 50%, 70%, 90%

      video.onloadedmetadata = () => {
        canvas.width = 320;
        canvas.height = (video.videoHeight / video.videoWidth) * 320;
        
        const duration = video.duration;
        
        const processThumbnail = (index: number) => {
          if (index >= intervals.length) {
            resolve(thumbnails);
            return;
          }
          
          video.currentTime = duration * intervals[index];
          
          video.onseeked = () => {
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
            thumbnails.push(canvas.toDataURL('image/jpeg', 0.8));
            processedCount++;
            
            setTimeout(() => processThumbnail(index + 1), 100);
          };
        };
        
        processThumbnail(0);
      };

      video.onerror = () => {
        reject(new Error('Erro ao carregar vídeo para gerar thumbnails'));
      };

      video.src = URL.createObjectURL(file);
    });
  }

  /**
   * Iniciar processamento do vídeo no servidor
   */
  private async startVideoProcessing(videoId: string, videoUrl: string): Promise<VideoProcessingJob> {
    const response = await fetch(`${this.VPS_ENDPOINT}/api/process/start`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.SECURITY_TOKEN}`,
        'X-API-Key': this.API_KEY
      },
      body: JSON.stringify({
        videoId,
        videoUrl,
        compressionQualities: VIDEO_CONSTANTS.COMPRESSION_QUALITIES,
        watermarkConfig: VIDEO_CONSTANTS.DEFAULT_WATERMARK
      })
    });

    if (!response.ok) {
      throw new Error(`Erro ao iniciar processamento: ${response.statusText}`);
    }

    return await response.json();
  }

  /**
   * Criar registro do vídeo no banco
   */
  private async createVideoRecord(metadata: Partial<VideoMetadata>): Promise<VideoMetadata> {
    const { data, error } = await supabase
      .from('training_videos')
      .insert({
        title: metadata.title,
        description: metadata.description,
        size: metadata.size,
        format: metadata.format,
        thumbnails: metadata.thumbnails,
        status: metadata.status,
        uploaded_by: (await supabase.auth.getUser()).data.user?.id,
        uploaded_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Erro ao criar registro: ${error.message}`);
    }

    return this.mapDatabaseToVideoMetadata(data);
  }

  /**
   * Atualizar registro do vídeo
   */
  private async updateVideoRecord(id: string, updates: Partial<VideoMetadata>): Promise<VideoMetadata> {
    const { data, error } = await supabase
      .from('training_videos')
      .update({
        url: updates.url,
        streaming_url: updates.streamingUrl,
        status: updates.status,
        processed_at: updates.processedAt?.toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw new Error(`Erro ao atualizar registro: ${error.message}`);
    }

    return this.mapDatabaseToVideoMetadata(data);
  }

  /**
   * Mapear dados do banco para VideoMetadata
   */
  private mapDatabaseToVideoMetadata(data: Record<string, unknown>): VideoMetadata {
    return {
      id: data.id,
      title: data.title,
      description: data.description,
      duration: data.duration || 0,
      size: data.size,
      format: data.format,
      resolution: data.resolution || '720p',
      thumbnails: data.thumbnails || [],
      uploadedBy: data.uploaded_by,
      uploadedAt: new Date(data.uploaded_at),
      processedAt: data.processed_at ? new Date(data.processed_at) : undefined,
      status: data.status,
      url: data.url,
      streamingUrl: data.streaming_url
    };
  }

  /**
   * Calcular progresso do upload
   */
  private calculateProgress(loaded: number, total: number): UploadProgress {
    const percentage = (loaded / total) * 100;
    const elapsed = (Date.now() - this.uploadStartTime) / 1000; // seconds
    const speed = loaded / elapsed; // bytes per second
    const remaining = (total - loaded) / speed; // seconds

    return {
      loaded,
      total,
      percentage: Math.round(percentage * 100) / 100,
      speed: Math.round(speed),
      timeRemaining: Math.round(remaining)
    };
  }

  /**
   * Obter formato do arquivo
   */
  private getFileFormat(file: File): VideoFormat {
    const extension = file.name.split('.').pop()?.toLowerCase();
    return (extension as VideoFormat) || 'mp4';
  }

  /**
   * Verificar status do processamento
   */
  async getProcessingStatus(videoId: string): Promise<VideoProcessingJob> {
    const response = await fetch(`${this.VPS_ENDPOINT}/api/process/status/${videoId}`, {
      headers: {
        'Authorization': `Bearer ${this.SECURITY_TOKEN}`,
        'X-API-Key': this.API_KEY
      }
    });

    if (!response.ok) {
      throw new Error(`Erro ao verificar status: ${response.statusText}`);
    }

    return await response.json();
  }

  /**
   * Listar vídeos do usuário
   */
  async getUserVideos(userId?: string): Promise<VideoMetadata[]> {
    let query = supabase
      .from('training_videos')
      .select('*')
      .order('uploaded_at', { ascending: false });

    if (userId) {
      query = query.eq('uploaded_by', userId);
    }

    const { data, error } = await query;

    if (error) {
      throw new Error(`Erro ao buscar vídeos: ${error.message}`);
    }

    return data.map(this.mapDatabaseToVideoMetadata);
  }

  /**
   * Deletar vídeo
   */
  async deleteVideo(videoId: string): Promise<void> {
    // Deletar do VPS
    await fetch(`${this.VPS_ENDPOINT}/api/video/${videoId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${this.SECURITY_TOKEN}`,
        'X-API-Key': this.API_KEY
      }
    });

    // Deletar do banco
    const { error } = await supabase
      .from('training_videos')
      .delete()
      .eq('id', videoId);

    if (error) {
      throw new Error(`Erro ao deletar vídeo: ${error.message}`);
    }
  }
}

export const videoUploadService = new VideoUploadService();
export default VideoUploadService;