import { supabase } from "@/integrations/supabase/client";
import { logError } from '@/utils/secureLogger';

export interface SharedProposal {
  id: string;
  share_token: string;
  proposal_data: unknown;
  lead_name: string;
  created_by: string | null;
  created_at: string;
  expires_at: string;
  is_active: boolean;
  view_count: number;
  last_viewed_at: string | null;
}

export interface ProposalView {
  id: string;
  shared_proposal_id: string;
  ip_address: string | null;
  user_agent: string | null;
  viewed_at: string;
  session_duration: number | null;
  referrer: string | null;
}

export class ProposalSharingService {
  /**
   * Gera um token único para compartilhamento
   */
  private generateShareToken(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < 32; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }

  /**
   * Cria um link de compartilhamento para uma proposta
   */
  async createSharedProposal(
    proposalData: unknown,
    leadName: string,
    expirationDays: number = 30
  ): Promise<{ shareToken: string; shareUrl: string }> {
    try {
      const shareToken = this.generateShareToken();
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + expirationDays);

      const { data, error } = await supabase
        .from('shared_proposals')
        .insert({
          share_token: shareToken,
          proposal_data: proposalData,
          lead_name: leadName,
          expires_at: expiresAt.toISOString(),
          is_active: true,
          view_count: 0
        })
        .select()
        .single();

      if (error) throw error;

      const shareUrl = `${window.location.origin}/proposta/${shareToken}`;

      return {
        shareToken,
        shareUrl
      };
    } catch (error) {
      logError('Erro ao criar proposta compartilhada', 'ProposalSharingService', { error: error instanceof Error ? error.message : 'Erro desconhecido' });
      throw new Error('Falha ao criar link de compartilhamento');
    }
  }

  /**
   * Busca uma proposta compartilhada pelo token
   */
  async getSharedProposal(shareToken: string): Promise<SharedProposal | null> {
    try {
      const { data, error } = await supabase
        .from('shared_proposals')
        .select('*')
        .eq('share_token', shareToken)
        .eq('is_active', true)
        .gte('expires_at', new Date().toISOString())
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          // No rows returned
          return null;
        }
        throw error;
      }

      return data;
    } catch (error) {
      logError('Erro ao buscar proposta compartilhada', 'ProposalSharingService', { error: error instanceof Error ? error.message : 'Erro desconhecido' });
      return null;
    }
  }

  /**
   * Registra uma visualização da proposta
   */
  async recordView(
    shareToken: string,
    ipAddress?: string,
    userAgent?: string,
    referrer?: string
  ): Promise<void> {
    try {
      // Primeiro, busca a proposta para obter o ID
      const proposal = await this.getSharedProposal(shareToken);
      if (!proposal) {
        throw new Error('Proposta não encontrada');
      }

      // Registra a visualização
      const { error: viewError } = await supabase
        .from('proposal_views')
        .insert({
          shared_proposal_id: proposal.id,
          ip_address: ipAddress || null,
          user_agent: userAgent || null,
          referrer: referrer || null,
          viewed_at: new Date().toISOString()
        });

      if (viewError) throw viewError;

      // Atualiza o contador de visualizações na proposta
      const { error: updateError } = await supabase
        .from('shared_proposals')
        .update({
          view_count: proposal.view_count + 1,
          last_viewed_at: new Date().toISOString()
        })
        .eq('id', proposal.id);

      if (updateError) throw updateError;

    } catch (error) {
      logError('Erro ao registrar visualização', 'ProposalSharingService', { error: error instanceof Error ? error.message : 'Erro desconhecido' });
      // Não lança erro para não quebrar a experiência do usuário
    }
  }

  /**
   * Atualiza a duração da sessão de uma visualização
   */
  async updateSessionDuration(
    shareToken: string,
    sessionDuration: number
  ): Promise<void> {
    try {
      const proposal = await this.getSharedProposal(shareToken);
      if (!proposal) return;

      // Atualiza a última visualização com a duração da sessão
      const { error } = await supabase
        .from('proposal_views')
        .update({ session_duration: sessionDuration })
        .eq('shared_proposal_id', proposal.id)
        .order('viewed_at', { ascending: false })
        .limit(1);

      if (error) throw error;

    } catch (error) {
      logError('Erro ao atualizar duração da sessão', 'ProposalSharingService', { error: error instanceof Error ? error.message : 'Erro desconhecido' });
    }
  }

  /**
   * Lista as propostas compartilhadas do usuário atual
   */
  async getUserSharedProposals(): Promise<SharedProposal[]> {
    try {
      const { data, error } = await supabase
        .from('shared_proposals')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      return data || [];
    } catch (error) {
      logError('Erro ao buscar propostas compartilhadas', 'ProposalSharingService', { error: error instanceof Error ? error.message : 'Erro desconhecido' });
      return [];
    }
  }

  /**
   * Busca as visualizações de uma proposta específica
   */
  async getProposalViews(shareToken: string): Promise<ProposalView[]> {
    try {
      const proposal = await this.getSharedProposal(shareToken);
      if (!proposal) return [];

      const { data, error } = await supabase
        .from('proposal_views')
        .select('*')
        .eq('shared_proposal_id', proposal.id)
        .order('viewed_at', { ascending: false });

      if (error) throw error;

      return data || [];
    } catch (error) {
      logError('Erro ao buscar visualizações', 'ProposalSharingService', { error: error instanceof Error ? error.message : 'Erro desconhecido' });
      return [];
    }
  }

  /**
   * Desativa uma proposta compartilhada
   */
  async deactivateSharedProposal(shareToken: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('shared_proposals')
        .update({ is_active: false })
        .eq('share_token', shareToken);

      if (error) throw error;

    } catch (error) {
      logError('Erro ao desativar proposta', 'ProposalSharingService', { error: error instanceof Error ? error.message : 'Erro desconhecido' });
      throw new Error('Falha ao desativar proposta compartilhada');
    }
  }

  /**
   * Atualiza a data de expiração de uma proposta
   */
  async extendExpiration(shareToken: string, additionalDays: number): Promise<void> {
    try {
      const proposal = await this.getSharedProposal(shareToken);
      if (!proposal) {
        throw new Error('Proposta não encontrada');
      }

      const newExpirationDate = new Date(proposal.expires_at);
      newExpirationDate.setDate(newExpirationDate.getDate() + additionalDays);

      const { error } = await supabase
        .from('shared_proposals')
        .update({ expires_at: newExpirationDate.toISOString() })
        .eq('share_token', shareToken);

      if (error) throw error;

    } catch (error) {
      logError('Erro ao estender expiração', 'ProposalSharingService', { error: error instanceof Error ? error.message : 'Erro desconhecido' });
      throw new Error('Falha ao estender prazo da proposta');
    }
  }

  /**
   * Obtém estatísticas de uma proposta compartilhada
   */
  async getProposalStats(shareToken: string): Promise<{
    totalViews: number;
    uniqueViews: number;
    lastViewed: string | null;
    averageSessionDuration: number;
    viewsByDay: { date: string; views: number }[];
  }> {
    try {
      const proposal = await this.getSharedProposal(shareToken);
      if (!proposal) {
        return {
          totalViews: 0,
          uniqueViews: 0,
          lastViewed: null,
          averageSessionDuration: 0,
          viewsByDay: []
        };
      }

      const views = await this.getProposalViews(shareToken);

      // Calcular estatísticas
      const totalViews = views.length;
      const uniqueIPs = new Set(views.map(v => v.ip_address).filter(Boolean));
      const uniqueViews = uniqueIPs.size;
      const lastViewed = proposal.last_viewed_at;
      
      const sessionsWithDuration = views.filter(v => v.session_duration !== null);
      const averageSessionDuration = sessionsWithDuration.length > 0
        ? sessionsWithDuration.reduce((sum, v) => sum + (v.session_duration || 0), 0) / sessionsWithDuration.length
        : 0;

      // Agrupar visualizações por dia
      const viewsByDay = views.reduce((acc, view) => {
        const date = new Date(view.viewed_at).toISOString().split('T')[0];
        const existing = acc.find(item => item.date === date);
        if (existing) {
          existing.views++;
        } else {
          acc.push({ date, views: 1 });
        }
        return acc;
      }, [] as { date: string; views: number }[]);

      return {
        totalViews,
        uniqueViews,
        lastViewed,
        averageSessionDuration,
        viewsByDay: viewsByDay.sort((a, b) => a.date.localeCompare(b.date))
      };

    } catch (error) {
      logError('Erro ao obter estatísticas', 'ProposalSharingService', { error: error instanceof Error ? error.message : 'Erro desconhecido' });
      return {
        totalViews: 0,
        uniqueViews: 0,
        lastViewed: null,
        averageSessionDuration: 0,
        viewsByDay: []
      };
    }
  }

  /**
   * Limpa propostas expiradas (função utilitária)
   */
  async cleanupExpiredProposals(): Promise<number> {
    try {
      const { data, error } = await supabase
        .from('shared_proposals')
        .delete()
        .lt('expires_at', new Date().toISOString())
        .select('id');

      if (error) throw error;

      return data?.length || 0;
    } catch (error) {
      logError('Erro ao limpar propostas expiradas', 'ProposalSharingService', { error: error instanceof Error ? error.message : 'Erro desconhecido' });
      return 0;
    }
  }
}

// Export singleton instance
export const proposalSharingService = new ProposalSharingService();