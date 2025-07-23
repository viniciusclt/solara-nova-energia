export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instanciate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "12.2.3 (519615d)"
  }
  public: {
    Tables: {
      audit_logs: {
        Row: {
          action: string
          created_at: string
          details: Json | null
          id: string
          ip_address: unknown | null
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string
          details?: Json | null
          id?: string
          ip_address?: unknown | null
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string
          details?: Json | null
          id?: string
          ip_address?: unknown | null
          user_id?: string | null
        }
        Relationships: []
      }
      companies: {
        Row: {
          address: string | null
          cnpj: string
          created_at: string
          id: string
          name: string
          num_employees: number | null
          updated_at: string
        }
        Insert: {
          address?: string | null
          cnpj: string
          created_at?: string
          id?: string
          name: string
          num_employees?: number | null
          updated_at?: string
        }
        Update: {
          address?: string | null
          cnpj?: string
          created_at?: string
          id?: string
          name?: string
          num_employees?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      financial_kits: {
        Row: {
          ativo: boolean
          categoria: string | null
          created_at: string
          descricao: string | null
          fabricante: string | null
          id: string
          nome: string
          potencia: number
          preco: number
          preco_wp: number
          updated_at: string
        }
        Insert: {
          ativo?: boolean
          categoria?: string | null
          created_at?: string
          descricao?: string | null
          fabricante?: string | null
          id?: string
          nome: string
          potencia: number
          preco: number
          preco_wp: number
          updated_at?: string
        }
        Update: {
          ativo?: boolean
          categoria?: string | null
          created_at?: string
          descricao?: string | null
          fabricante?: string | null
          id?: string
          nome?: string
          potencia?: number
          preco?: number
          preco_wp?: number
          updated_at?: string
        }
        Relationships: []
      }
      import_logs: {
        Row: {
          company_id: string
          completed_at: string | null
          error_details: Json | null
          failed_imports: number | null
          id: string
          import_settings: Json | null
          source_type: string
          source_url: string | null
          started_at: string
          status: string | null
          successful_imports: number | null
          total_records: number | null
          user_id: string
        }
        Insert: {
          company_id: string
          completed_at?: string | null
          error_details?: Json | null
          failed_imports?: number | null
          id?: string
          import_settings?: Json | null
          source_type: string
          source_url?: string | null
          started_at?: string
          status?: string | null
          successful_imports?: number | null
          total_records?: number | null
          user_id: string
        }
        Update: {
          company_id?: string
          completed_at?: string | null
          error_details?: Json | null
          failed_imports?: number | null
          id?: string
          import_settings?: Json | null
          source_type?: string
          source_url?: string | null
          started_at?: string
          status?: string | null
          successful_imports?: number | null
          total_records?: number | null
          user_id?: string
        }
        Relationships: []
      }
      integration_settings: {
        Row: {
          company_id: string
          created_at: string
          id: string
          integration_type: string
          is_active: boolean | null
          settings: Json
          updated_at: string
          user_id: string
        }
        Insert: {
          company_id: string
          created_at?: string
          id?: string
          integration_type: string
          is_active?: boolean | null
          settings: Json
          updated_at?: string
          user_id: string
        }
        Update: {
          company_id?: string
          created_at?: string
          id?: string
          integration_type?: string
          is_active?: boolean | null
          settings?: Json
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      leads: {
        Row: {
          address: Json | null
          birth_date: string | null
          cdd: number | null
          comentarios: string | null
          company_id: string
          concessionaria: string | null
          consumo_medio: number | null
          consumo_mensal: Json | null
          cpf_cnpj: string | null
          created_at: string
          email: string | null
          grupo: string | null
          id: string
          incremento_consumo: number | null
          modalidade_tarifaria: string | null
          name: string
          numero_cliente: string | null
          numero_instalacao: string | null
          phone: string | null
          rg: string | null
          source: string | null
          source_ref: string | null
          tensao_alimentacao: string | null
          tipo_fornecimento: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          address?: Json | null
          birth_date?: string | null
          cdd?: number | null
          comentarios?: string | null
          company_id: string
          concessionaria?: string | null
          consumo_medio?: number | null
          consumo_mensal?: Json | null
          cpf_cnpj?: string | null
          created_at?: string
          email?: string | null
          grupo?: string | null
          id?: string
          incremento_consumo?: number | null
          modalidade_tarifaria?: string | null
          name: string
          numero_cliente?: string | null
          numero_instalacao?: string | null
          phone?: string | null
          rg?: string | null
          source?: string | null
          source_ref?: string | null
          tensao_alimentacao?: string | null
          tipo_fornecimento?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          address?: Json | null
          birth_date?: string | null
          cdd?: number | null
          comentarios?: string | null
          company_id?: string
          concessionaria?: string | null
          consumo_medio?: number | null
          consumo_mensal?: Json | null
          cpf_cnpj?: string | null
          created_at?: string
          email?: string | null
          grupo?: string | null
          id?: string
          incremento_consumo?: number | null
          modalidade_tarifaria?: string | null
          name?: string
          numero_cliente?: string | null
          numero_instalacao?: string | null
          phone?: string | null
          rg?: string | null
          source?: string | null
          source_ref?: string | null
          tensao_alimentacao?: string | null
          tipo_fornecimento?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          access_type: Database["public"]["Enums"]["user_access_type"]
          company_id: string | null
          created_at: string
          email: string
          id: string
          last_login: string | null
          name: string
          two_factor_secret: string | null
          updated_at: string
        }
        Insert: {
          access_type?: Database["public"]["Enums"]["user_access_type"]
          company_id?: string | null
          created_at?: string
          email: string
          id: string
          last_login?: string | null
          name: string
          two_factor_secret?: string | null
          updated_at?: string
        }
        Update: {
          access_type?: Database["public"]["Enums"]["user_access_type"]
          company_id?: string | null
          created_at?: string
          email?: string
          id?: string
          last_login?: string | null
          name?: string
          two_factor_secret?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      proposal_views: {
        Row: {
          id: string
          shared_proposal_id: string
          ip_address: unknown | null
          user_agent: string | null
          viewed_at: string
          session_duration: number | null
          referrer: string | null
        }
        Insert: {
          id?: string
          shared_proposal_id: string
          ip_address?: unknown | null
          user_agent?: string | null
          viewed_at?: string
          session_duration?: number | null
          referrer?: string | null
        }
        Update: {
          id?: string
          shared_proposal_id?: string
          ip_address?: unknown | null
          user_agent?: string | null
          viewed_at?: string
          session_duration?: number | null
          referrer?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "proposal_views_shared_proposal_id_fkey"
            columns: ["shared_proposal_id"]
            isOneToOne: false
            referencedRelation: "shared_proposals"
            referencedColumns: ["id"]
          },
        ]
      }
      shared_proposals: {
        Row: {
          id: string
          share_token: string
          proposal_data: Json
          lead_name: string
          created_by: string | null
          created_at: string
          expires_at: string
          is_active: boolean
          view_count: number
          last_viewed_at: string | null
        }
        Insert: {
          id?: string
          share_token: string
          proposal_data: Json
          lead_name: string
          created_by?: string | null
          created_at?: string
          expires_at: string
          is_active?: boolean
          view_count?: number
          last_viewed_at?: string | null
        }
        Update: {
          id?: string
          share_token?: string
          proposal_data?: Json
          lead_name?: string
          created_by?: string | null
          created_at?: string
          expires_at?: string
          is_active?: boolean
          view_count?: number
          last_viewed_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "shared_proposals_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      subscriptions: {
        Row: {
          authorized_employees: number
          company_id: string
          created_at: string
          end_date: string | null
          id: string
          is_free: boolean | null
          monthly_value: number | null
          start_date: string
          status: Database["public"]["Enums"]["subscription_status"]
          stripe_subscription_id: string | null
          updated_at: string
        }
        Insert: {
          authorized_employees?: number
          company_id: string
          created_at?: string
          end_date?: string | null
          id?: string
          is_free?: boolean | null
          monthly_value?: number | null
          start_date?: string
          status?: Database["public"]["Enums"]["subscription_status"]
          stripe_subscription_id?: string | null
          updated_at?: string
        }
        Update: {
          authorized_employees?: number
          company_id?: string
          created_at?: string
          end_date?: string | null
          id?: string
          is_free?: boolean | null
          monthly_value?: number | null
          start_date?: string
          status?: Database["public"]["Enums"]["subscription_status"]
          stripe_subscription_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "subscriptions_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      change_user_access_type: {
        Args: {
          target_user_id: string
          new_access_type: Database["public"]["Enums"]["user_access_type"]
        }
        Returns: boolean
      }
      check_user_subscription: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      get_current_user_access_type: {
        Args: Record<PropertyKey, never>
        Returns: Database["public"]["Enums"]["user_access_type"]
      }
      get_current_user_company_id: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      log_security_event: {
        Args: {
          event_type: string
          event_details?: Json
          target_user_id?: string
        }
        Returns: undefined
      }
      validate_cnpj: {
        Args: { cnpj: string }
        Returns: boolean
      }
      validate_email: {
        Args: { email: string }
        Returns: boolean
      }
    }
    Enums: {
      subscription_status: "ativa" | "expirada" | "gratuita" | "cancelada"
      user_access_type: "vendedor" | "engenheiro" | "admin" | "super_admin"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      subscription_status: ["ativa", "expirada", "gratuita", "cancelada"],
      user_access_type: ["vendedor", "engenheiro", "admin", "super_admin"],
    },
  },
} as const
