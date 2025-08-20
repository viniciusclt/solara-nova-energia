// =====================================================================================
// SERVIÇO DE STREAMING PROTEGIDO - SOLARA NOVA ENERGIA
// =====================================================================================

import { 
  VideoStreamingToken, 
  StreamingPermission, 
  VideoSecurityConfig,
  WatermarkConfig,
  VideoMetadata,
  VideoError
} from '../types/video';
import { supabase } from '../integrations/supabase/client';

class SecureStreamingService {
  private readonly VPS_ENDPOINT = import.meta.env.VITE_VPS_VIDEO_ENDPOINT || 'https://videos.solara.com.br';
  private readonly SECURITY_TOKEN = import.meta.env.VITE_VPS_SECURITY_TOKEN || '';
  private readonly API_KEY = import.meta.env.VITE_VPS_API_KEY || '';
  
  private tokenCache = new Map<string, VideoStreamingToken>();
  private permissionCache = new Map<string, StreamingPermission>();

  /**
   * Gerar token de streaming seguro
   */
  async generateStreamingToken(
    videoId: string,
    userId: string,
    permissions: StreamingPermission
  ): Promise<VideoStreamingToken> {
    try {
      // Verificar se o usuário tem permissão para acessar o vídeo
      const hasPermission = await this.checkUserPermission(videoId, userId);
      if (!hasPermission) {
        throw new Error('Usuário não tem permissão para acessar este vídeo');
      }

      // Gerar token no servidor VPS
      const response = await fetch(`${this.VPS_ENDPOINT}/api/auth/generate-token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.SECURITY_TOKEN}`,
          'X-API-Key': this.API_KEY
        },
        body: JSON.stringify({
          videoId,
          userId,
          permissions,
          expiresIn: permissions.expiresIn || 3600, // 1 hora por padrão
          watermark: permissions.watermark
        })
      });

      if (!response.ok) {
        throw new Error(`Erro ao gerar token: ${response.statusText}`);
      }

      const tokenData = await response.json();
      
      const streamingToken: VideoStreamingToken = {
        token: tokenData.token,
        videoId,
        userId,
        permissions,
        expiresAt: new Date(tokenData.expiresAt),
        createdAt: new Date(),
        isRevoked: false,
        streamingUrl: tokenData.streamingUrl,
        watermarkConfig: tokenData.watermarkConfig
      };

      // Cache do token
      this.tokenCache.set(tokenData.token, streamingToken);
      
      // Salvar no banco para auditoria
      await this.saveTokenToDatabase(streamingToken);

      return streamingToken;
    } catch (error) {
      throw new Error(`Falha ao gerar token de streaming: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    }
  }

  /**
   * Validar token de streaming
   */
  async validateStreamingToken(token: string): Promise<VideoStreamingToken | null> {
    try {
      // Verificar cache primeiro
      const cachedToken = this.tokenCache.get(token);
      if (cachedToken) {
        if (this.isTokenValid(cachedToken)) {
          return cachedToken;
        } else {
          this.tokenCache.delete(token);
        }
      }

      // Validar no servidor VPS
      const response = await fetch(`${this.VPS_ENDPOINT}/api/auth/validate-token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.SECURITY_TOKEN}`,
          'X-API-Key': this.API_KEY
        },
        body: JSON.stringify({ token })
      });

      if (!response.ok) {
        return null;
      }

      const tokenData = await response.json();
      
      if (!tokenData.valid) {
        return null;
      }

      const streamingToken: VideoStreamingToken = {
        token: tokenData.token,
        videoId: tokenData.videoId,
        userId: tokenData.userId,
        permissions: tokenData.permissions,
        expiresAt: new Date(tokenData.expiresAt),
        createdAt: new Date(tokenData.createdAt),
        isRevoked: tokenData.isRevoked,
        streamingUrl: tokenData.streamingUrl,
        watermarkConfig: tokenData.watermarkConfig
      };

      // Atualizar cache
      this.tokenCache.set(token, streamingToken);

      return streamingToken;
    } catch (error) {
      console.error('Erro ao validar token:', error);
      return null;
    }
  }

  /**
   * Revogar token de streaming
   */
  async revokeStreamingToken(token: string): Promise<void> {
    try {
      // Revogar no servidor VPS
      await fetch(`${this.VPS_ENDPOINT}/api/auth/revoke-token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.SECURITY_TOKEN}`,
          'X-API-Key': this.API_KEY
        },
        body: JSON.stringify({ token })
      });

      // Remover do cache
      this.tokenCache.delete(token);

      // Atualizar no banco
      await supabase
        .from('video_streaming_tokens')
        .update({ is_revoked: true, revoked_at: new Date().toISOString() })
        .eq('token', token);

    } catch (error) {
      throw new Error(`Erro ao revogar token: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    }
  }

  /**
   * Obter URL de streaming segura
   */
  async getSecureStreamingUrl(
    videoId: string,
    userId: string,
    quality: string = 'auto',
    watermarkText?: string
  ): Promise<string> {
    try {
      // Verificar permissões do usuário
      const permissions = await this.getUserPermissions(videoId, userId);
      
      // Configurar watermark
      const watermarkConfig: WatermarkConfig = {
        text: watermarkText || `${userId} - ${new Date().toLocaleDateString()}`,
        position: 'bottom-right',
        opacity: 0.7,
        fontSize: 14,
        color: '#ffffff'
      };

      // Gerar token de streaming
      const streamingToken = await this.generateStreamingToken(videoId, userId, {
        ...permissions,
        watermark: watermarkConfig
      });

      // Construir URL com parâmetros de segurança
      const url = new URL(streamingToken.streamingUrl);
      url.searchParams.set('token', streamingToken.token);
      url.searchParams.set('quality', quality);
      url.searchParams.set('user', userId);
      url.searchParams.set('timestamp', Date.now().toString());

      return url.toString();
    } catch (error) {
      throw new Error(`Erro ao obter URL de streaming: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    }
  }

  /**
   * Configurar watermark dinâmico
   */
  async configureWatermark(
    videoId: string,
    config: WatermarkConfig
  ): Promise<void> {
    try {
      await fetch(`${this.VPS_ENDPOINT}/api/video/${videoId}/watermark`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.SECURITY_TOKEN}`,
          'X-API-Key': this.API_KEY
        },
        body: JSON.stringify(config)
      });
    } catch (error) {
      throw new Error(`Erro ao configurar watermark: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    }
  }

  /**
   * Verificar permissão do usuário
   */
  private async checkUserPermission(videoId: string, userId: string): Promise<boolean> {
    try {
      // Verificar se o usuário é o proprietário do vídeo
      const { data: video } = await supabase
        .from('training_videos')
        .select('uploaded_by')
        .eq('id', videoId)
        .single();

      if (video?.uploaded_by === userId) {
        return true;
      }

      // Verificar permissões específicas
      const { data: permission } = await supabase
        .from('video_permissions')
        .select('*')
        .eq('video_id', videoId)
        .eq('user_id', userId)
        .eq('is_active', true)
        .single();

      return !!permission;
    } catch (error) {
      console.error('Erro ao verificar permissão:', error);
      return false;
    }
  }

  /**
   * Obter permissões do usuário
   */
  private async getUserPermissions(videoId: string, userId: string): Promise<StreamingPermission> {
    try {
      const { data: permission } = await supabase
        .from('video_permissions')
        .select('*')
        .eq('video_id', videoId)
        .eq('user_id', userId)
        .eq('is_active', true)
        .single();

      if (permission) {
        return {
          canView: permission.can_view,
          canDownload: permission.can_download,
          canShare: permission.can_share,
          expiresIn: permission.expires_in,
          maxViews: permission.max_views,
          allowedIPs: permission.allowed_ips,
          watermark: permission.watermark_config
        };
      }

      // Permissões padrão para proprietário
      return {
        canView: true,
        canDownload: false,
        canShare: true,
        expiresIn: 3600,
        maxViews: undefined,
        allowedIPs: undefined,
        watermark: {
          text: `${userId} - ${new Date().toLocaleDateString()}`,
          position: 'bottom-right',
          opacity: 0.7,
          fontSize: 14,
          color: '#ffffff'
        }
      };
    } catch (error) {
      throw new Error(`Erro ao obter permissões: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    }
  }

  /**
   * Verificar se token é válido
   */
  private isTokenValid(token: VideoStreamingToken): boolean {
    if (token.isRevoked) {
      return false;
    }

    if (token.expiresAt < new Date()) {
      return false;
    }

    return true;
  }

  /**
   * Salvar token no banco para auditoria
   */
  private async saveTokenToDatabase(token: VideoStreamingToken): Promise<void> {
    try {
      await supabase
        .from('video_streaming_tokens')
        .insert({
          token: token.token,
          video_id: token.videoId,
          user_id: token.userId,
          permissions: token.permissions,
          expires_at: token.expiresAt.toISOString(),
          created_at: token.createdAt.toISOString(),
          is_revoked: token.isRevoked,
          streaming_url: token.streamingUrl,
          watermark_config: token.watermarkConfig
        });
    } catch (error) {
      console.error('Erro ao salvar token no banco:', error);
    }
  }

  /**
   * Registrar acesso ao vídeo
   */
  async logVideoAccess(
    videoId: string,
    userId: string,
    token: string,
    metadata: {
      ip?: string;
      userAgent?: string;
      quality?: string;
      duration?: number;
    }
  ): Promise<void> {
    try {
      await supabase
        .from('video_access_logs')
        .insert({
          video_id: videoId,
          user_id: userId,
          token,
          ip_address: metadata.ip,
          user_agent: metadata.userAgent,
          quality: metadata.quality,
          duration: metadata.duration,
          accessed_at: new Date().toISOString()
        });
    } catch (error) {
      console.error('Erro ao registrar acesso:', error);
    }
  }

  /**
   * Obter estatísticas de acesso
   */
  async getAccessStats(videoId: string): Promise<{
    totalViews: number;
    uniqueViewers: number;
    averageDuration: number;
    topQualities: { quality: string; count: number }[];
  }> {
    try {
      const { data: logs } = await supabase
        .from('video_access_logs')
        .select('*')
        .eq('video_id', videoId);

      if (!logs || logs.length === 0) {
        return {
          totalViews: 0,
          uniqueViewers: 0,
          averageDuration: 0,
          topQualities: []
        };
      }

      const totalViews = logs.length;
      const uniqueViewers = new Set(logs.map(log => log.user_id)).size;
      const averageDuration = logs.reduce((sum, log) => sum + (log.duration || 0), 0) / logs.length;
      
      const qualityCounts = logs.reduce((acc, log) => {
        const quality = log.quality || 'unknown';
        acc[quality] = (acc[quality] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      const topQualities = Object.entries(qualityCounts)
        .map(([quality, count]) => ({ quality, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);

      return {
        totalViews,
        uniqueViewers,
        averageDuration,
        topQualities
      };
    } catch (error) {
      console.error('Erro ao obter estatísticas:', error);
      return {
        totalViews: 0,
        uniqueViewers: 0,
        averageDuration: 0,
        topQualities: []
      };
    }
  }

  /**
   * Limpar tokens expirados
   */
  async cleanupExpiredTokens(): Promise<void> {
    try {
      // Limpar cache
      for (const [token, tokenData] of this.tokenCache.entries()) {
        if (!this.isTokenValid(tokenData)) {
          this.tokenCache.delete(token);
        }
      }

      // Marcar tokens expirados no banco
      await supabase
        .from('video_streaming_tokens')
        .update({ is_revoked: true, revoked_at: new Date().toISOString() })
        .lt('expires_at', new Date().toISOString())
        .eq('is_revoked', false);
    } catch (error) {
      console.error('Erro ao limpar tokens expirados:', error);
    }
  }

  /**
   * Configurar segurança do vídeo
   */
  async configureVideoSecurity(
    videoId: string,
    config: VideoSecurityConfig
  ): Promise<void> {
    try {
      await fetch(`${this.VPS_ENDPOINT}/api/video/${videoId}/security`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.SECURITY_TOKEN}`,
          'X-API-Key': this.API_KEY
        },
        body: JSON.stringify(config)
      });

      // Salvar configuração no banco
      await supabase
        .from('video_security_configs')
        .upsert({
          video_id: videoId,
          config,
          updated_at: new Date().toISOString()
        });
    } catch (error) {
      throw new Error(`Erro ao configurar segurança: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    }
  }
}

export const secureStreamingService = new SecureStreamingService();
export default SecureStreamingService;