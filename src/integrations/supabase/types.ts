export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      audit_logs: {
        Row: {
          action: string | null
          actor_id: string | null
          actor_role: string | null
          case_id: string | null
          id: number
          meta: Json | null
          ts: string | null
        }
        Insert: {
          action?: string | null
          actor_id?: string | null
          actor_role?: string | null
          case_id?: string | null
          id?: number
          meta?: Json | null
          ts?: string | null
        }
        Update: {
          action?: string | null
          actor_id?: string | null
          actor_role?: string | null
          case_id?: string | null
          id?: number
          meta?: Json | null
          ts?: string | null
        }
        Relationships: []
      }
      care_plans: {
        Row: {
          case_id: string
          created_at: string | null
          created_by: string | null
          id: string
          plan_text: string
          plan_type: string | null
          updated_at: string | null
          version: number | null
        }
        Insert: {
          case_id: string
          created_at?: string | null
          created_by?: string | null
          id?: string
          plan_text: string
          plan_type?: string | null
          updated_at?: string | null
          version?: number | null
        }
        Update: {
          case_id?: string
          created_at?: string | null
          created_by?: string | null
          id?: string
          plan_text?: string
          plan_type?: string | null
          updated_at?: string | null
          version?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "care_plans_case_id_fkey"
            columns: ["case_id"]
            isOneToOne: false
            referencedRelation: "cases"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "care_plans_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      case_access: {
        Row: {
          case_id: string
          granted_at: string | null
          granted_by: string | null
          id: string
          user_id: string
        }
        Insert: {
          case_id: string
          granted_at?: string | null
          granted_by?: string | null
          id?: string
          user_id: string
        }
        Update: {
          case_id?: string
          granted_at?: string | null
          granted_by?: string | null
          id?: string
          user_id?: string
        }
        Relationships: []
      }
      case_alerts: {
        Row: {
          acknowledged_at: string | null
          acknowledged_by: string | null
          alert_type: string
          case_id: string
          created_at: string
          created_by: string | null
          disclosure_scope: Database["public"]["Enums"]["disclosure_scope"]
          id: string
          message: string
          metadata: Json | null
          severity: string
        }
        Insert: {
          acknowledged_at?: string | null
          acknowledged_by?: string | null
          alert_type: string
          case_id: string
          created_at?: string
          created_by?: string | null
          disclosure_scope?: Database["public"]["Enums"]["disclosure_scope"]
          id?: string
          message: string
          metadata?: Json | null
          severity?: string
        }
        Update: {
          acknowledged_at?: string | null
          acknowledged_by?: string | null
          alert_type?: string
          case_id?: string
          created_at?: string
          created_by?: string | null
          disclosure_scope?: Database["public"]["Enums"]["disclosure_scope"]
          id?: string
          message?: string
          metadata?: Json | null
          severity?: string
        }
        Relationships: []
      }
      case_assignments: {
        Row: {
          case_id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          case_id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          case_id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "case_assignments_case_id_fkey"
            columns: ["case_id"]
            isOneToOne: false
            referencedRelation: "cases"
            referencedColumns: ["id"]
          },
        ]
      }
      cases: {
        Row: {
          atty_ref: string | null
          client_label: string | null
          consent: Json | null
          created_at: string | null
          created_by: string | null
          documentation: Json | null
          flags: string[] | null
          fourps: Json | null
          id: string
          incident: Json | null
          last_pain_diary_at: string | null
          odg_benchmarks: Json | null
          pain_diary_count_30d: number | null
          provider_routed: boolean | null
          sdoh: Json | null
          sdoh_resolved: Json | null
          specialist_report_uploaded: boolean | null
          status: string | null
        }
        Insert: {
          atty_ref?: string | null
          client_label?: string | null
          consent?: Json | null
          created_at?: string | null
          created_by?: string | null
          documentation?: Json | null
          flags?: string[] | null
          fourps?: Json | null
          id?: string
          incident?: Json | null
          last_pain_diary_at?: string | null
          odg_benchmarks?: Json | null
          pain_diary_count_30d?: number | null
          provider_routed?: boolean | null
          sdoh?: Json | null
          sdoh_resolved?: Json | null
          specialist_report_uploaded?: boolean | null
          status?: string | null
        }
        Update: {
          atty_ref?: string | null
          client_label?: string | null
          consent?: Json | null
          created_at?: string | null
          created_by?: string | null
          documentation?: Json | null
          flags?: string[] | null
          fourps?: Json | null
          id?: string
          incident?: Json | null
          last_pain_diary_at?: string | null
          odg_benchmarks?: Json | null
          pain_diary_count_30d?: number | null
          provider_routed?: boolean | null
          sdoh?: Json | null
          sdoh_resolved?: Json | null
          specialist_report_uploaded?: boolean | null
          status?: string | null
        }
        Relationships: []
      }
      checkins: {
        Row: {
          case_id: string | null
          created_at: string | null
          id: string
          payload: Json
          user_id: string | null
        }
        Insert: {
          case_id?: string | null
          created_at?: string | null
          id?: string
          payload: Json
          user_id?: string | null
        }
        Update: {
          case_id?: string | null
          created_at?: string | null
          id?: string
          payload?: Json
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "checkins_case_id_fkey"
            columns: ["case_id"]
            isOneToOne: false
            referencedRelation: "cases"
            referencedColumns: ["id"]
          },
        ]
      }
      client_checkins: {
        Row: {
          anxiety_scale: number | null
          case_id: string
          client_id: string
          created_at: string
          created_by_role: string
          depression_scale: number | null
          id: string
          note: string | null
          p_physical: number
          p_psychological: number
          p_psychosocial: number
          p_purpose: number
          pain_scale: number
        }
        Insert: {
          anxiety_scale?: number | null
          case_id: string
          client_id: string
          created_at?: string
          created_by_role?: string
          depression_scale?: number | null
          id?: string
          note?: string | null
          p_physical: number
          p_psychological: number
          p_psychosocial: number
          p_purpose: number
          pain_scale: number
        }
        Update: {
          anxiety_scale?: number | null
          case_id?: string
          client_id?: string
          created_at?: string
          created_by_role?: string
          depression_scale?: number | null
          id?: string
          note?: string | null
          p_physical?: number
          p_psychological?: number
          p_psychosocial?: number
          p_purpose?: number
          pain_scale?: number
        }
        Relationships: []
      }
      client_preferences: {
        Row: {
          attorney_notify_consent: boolean
          client_id: string
          consent_expires_at: string | null
          consent_signed_at: string
          created_at: string
          id: string
          revoked: boolean
          revoked_at: string | null
          updated_at: string
        }
        Insert: {
          attorney_notify_consent?: boolean
          client_id: string
          consent_expires_at?: string | null
          consent_signed_at?: string
          created_at?: string
          id?: string
          revoked?: boolean
          revoked_at?: string | null
          updated_at?: string
        }
        Update: {
          attorney_notify_consent?: boolean
          client_id?: string
          consent_expires_at?: string | null
          consent_signed_at?: string
          created_at?: string
          id?: string
          revoked?: boolean
          revoked_at?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      complaints: {
        Row: {
          assigned_to: string | null
          complaint_about: string
          complaint_description: string
          created_at: string
          id: string
          resolution_notes: string | null
          resolved_at: string | null
          status: string
          updated_at: string
        }
        Insert: {
          assigned_to?: string | null
          complaint_about: string
          complaint_description: string
          created_at?: string
          id?: string
          resolution_notes?: string | null
          resolved_at?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          assigned_to?: string | null
          complaint_about?: string
          complaint_description?: string
          created_at?: string
          id?: string
          resolution_notes?: string | null
          resolved_at?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      concern_attachments: {
        Row: {
          concern_id: string
          created_at: string
          file_name: string
          file_path: string
          file_size: number | null
          id: string
          mime_type: string | null
          uploaded_by: string
        }
        Insert: {
          concern_id: string
          created_at?: string
          file_name: string
          file_path: string
          file_size?: number | null
          id?: string
          mime_type?: string | null
          uploaded_by: string
        }
        Update: {
          concern_id?: string
          created_at?: string
          file_name?: string
          file_path?: string
          file_size?: number | null
          id?: string
          mime_type?: string | null
          uploaded_by?: string
        }
        Relationships: [
          {
            foreignKeyName: "concern_attachments_concern_id_fkey"
            columns: ["concern_id"]
            isOneToOne: false
            referencedRelation: "concerns"
            referencedColumns: ["id"]
          },
        ]
      }
      concerns: {
        Row: {
          assigned_rn: string | null
          care_addressed: string | null
          care_addressed_details: string | null
          case_id: string
          client_id: string
          concern_category: string | null
          concern_description: string
          concern_status: string
          concern_timestamp: string
          created_at: string
          felt_respected: string | null
          felt_respected_details: string | null
          id: string
          provider_name: string
          rn_followup_notes: string | null
          updated_at: string
          visit_date: string | null
        }
        Insert: {
          assigned_rn?: string | null
          care_addressed?: string | null
          care_addressed_details?: string | null
          case_id: string
          client_id: string
          concern_category?: string | null
          concern_description: string
          concern_status?: string
          concern_timestamp?: string
          created_at?: string
          felt_respected?: string | null
          felt_respected_details?: string | null
          id?: string
          provider_name: string
          rn_followup_notes?: string | null
          updated_at?: string
          visit_date?: string | null
        }
        Update: {
          assigned_rn?: string | null
          care_addressed?: string | null
          care_addressed_details?: string | null
          case_id?: string
          client_id?: string
          concern_category?: string | null
          concern_description?: string
          concern_status?: string
          concern_timestamp?: string
          created_at?: string
          felt_respected?: string | null
          felt_respected_details?: string | null
          id?: string
          provider_name?: string
          rn_followup_notes?: string | null
          updated_at?: string
          visit_date?: string | null
        }
        Relationships: []
      }
      disclosure_log: {
        Row: {
          alert_id: string | null
          authorization_id: string | null
          case_id: string
          disclosed_at: string
          disclosed_by: string | null
          disclosed_to_role: string
          disclosed_to_user_id: string
          disclosure_reason: string
          disclosure_scope: Database["public"]["Enums"]["disclosure_scope"]
          id: string
          metadata: Json | null
        }
        Insert: {
          alert_id?: string | null
          authorization_id?: string | null
          case_id: string
          disclosed_at?: string
          disclosed_by?: string | null
          disclosed_to_role: string
          disclosed_to_user_id: string
          disclosure_reason: string
          disclosure_scope: Database["public"]["Enums"]["disclosure_scope"]
          id?: string
          metadata?: Json | null
        }
        Update: {
          alert_id?: string | null
          authorization_id?: string | null
          case_id?: string
          disclosed_at?: string
          disclosed_by?: string | null
          disclosed_to_role?: string
          disclosed_to_user_id?: string
          disclosure_reason?: string
          disclosure_scope?: Database["public"]["Enums"]["disclosure_scope"]
          id?: string
          metadata?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "disclosure_log_alert_id_fkey"
            columns: ["alert_id"]
            isOneToOne: false
            referencedRelation: "case_alerts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "disclosure_log_authorization_id_fkey"
            columns: ["authorization_id"]
            isOneToOne: false
            referencedRelation: "client_preferences"
            referencedColumns: ["id"]
          },
        ]
      }
      documents: {
        Row: {
          case_id: string
          created_at: string | null
          document_type: string
          file_name: string
          file_path: string
          file_size: number | null
          id: string
          metadata: Json | null
          mime_type: string | null
          uploaded_by: string | null
        }
        Insert: {
          case_id: string
          created_at?: string | null
          document_type: string
          file_name: string
          file_path: string
          file_size?: number | null
          id?: string
          metadata?: Json | null
          mime_type?: string | null
          uploaded_by?: string | null
        }
        Update: {
          case_id?: string
          created_at?: string | null
          document_type?: string
          file_name?: string
          file_path?: string
          file_size?: number | null
          id?: string
          metadata?: Json | null
          mime_type?: string | null
          uploaded_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "documents_case_id_fkey"
            columns: ["case_id"]
            isOneToOne: false
            referencedRelation: "cases"
            referencedColumns: ["id"]
          },
        ]
      }
      intakes: {
        Row: {
          case_id: string
          completed: boolean | null
          created_at: string | null
          id: string
          incident_date: string | null
          incident_type: string | null
          initial_treatment: string | null
          injuries: string[] | null
          intake_data: Json | null
          narrative: string | null
          severity_self_score: number | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          case_id: string
          completed?: boolean | null
          created_at?: string | null
          id?: string
          incident_date?: string | null
          incident_type?: string | null
          initial_treatment?: string | null
          injuries?: string[] | null
          intake_data?: Json | null
          narrative?: string | null
          severity_self_score?: number | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          case_id?: string
          completed?: boolean | null
          created_at?: string | null
          id?: string
          incident_date?: string | null
          incident_type?: string | null
          initial_treatment?: string | null
          injuries?: string[] | null
          intake_data?: Json | null
          narrative?: string | null
          severity_self_score?: number | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "intakes_case_id_fkey"
            columns: ["case_id"]
            isOneToOne: false
            referencedRelation: "cases"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          case_id: string
          created_at: string | null
          id: string
          message_text: string
          recipient_role: string
          responded_at: string | null
          responded_by: string | null
          response_text: string | null
          sender_id: string
          status: string | null
          subject: string
        }
        Insert: {
          case_id: string
          created_at?: string | null
          id?: string
          message_text: string
          recipient_role: string
          responded_at?: string | null
          responded_by?: string | null
          response_text?: string | null
          sender_id: string
          status?: string | null
          subject: string
        }
        Update: {
          case_id?: string
          created_at?: string | null
          id?: string
          message_text?: string
          recipient_role?: string
          responded_at?: string | null
          responded_by?: string | null
          response_text?: string | null
          sender_id?: string
          status?: string | null
          subject?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_case_id_fkey"
            columns: ["case_id"]
            isOneToOne: false
            referencedRelation: "cases"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_responded_by_fkey"
            columns: ["responded_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string | null
          display_name: string | null
          email: string
          full_name: string | null
          id: string
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          display_name?: string | null
          email: string
          full_name?: string | null
          id: string
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          display_name?: string | null
          email?: string
          full_name?: string | null
          id?: string
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      providers: {
        Row: {
          accepting_patients: boolean | null
          address: string | null
          created_at: string | null
          email: string | null
          fax: string | null
          id: string
          name: string
          npi: string | null
          phone: string | null
          practice_name: string | null
          specialty: string
          updated_at: string | null
        }
        Insert: {
          accepting_patients?: boolean | null
          address?: string | null
          created_at?: string | null
          email?: string | null
          fax?: string | null
          id?: string
          name: string
          npi?: string | null
          phone?: string | null
          practice_name?: string | null
          specialty: string
          updated_at?: string | null
        }
        Update: {
          accepting_patients?: boolean | null
          address?: string | null
          created_at?: string | null
          email?: string | null
          fax?: string | null
          id?: string
          name?: string
          npi?: string | null
          phone?: string | null
          practice_name?: string | null
          specialty?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      sdoh_assessments: {
        Row: {
          assessed_by: string | null
          case_id: string
          created_at: string | null
          food: boolean | null
          housing: boolean | null
          id: string
          insurance_gap: boolean | null
          notes: string | null
          resolved: Json | null
          transport: boolean | null
          updated_at: string | null
        }
        Insert: {
          assessed_by?: string | null
          case_id: string
          created_at?: string | null
          food?: boolean | null
          housing?: boolean | null
          id?: string
          insurance_gap?: boolean | null
          notes?: string | null
          resolved?: Json | null
          transport?: boolean | null
          updated_at?: string | null
        }
        Update: {
          assessed_by?: string | null
          case_id?: string
          created_at?: string | null
          food?: boolean | null
          housing?: boolean | null
          id?: string
          insurance_gap?: boolean | null
          notes?: string | null
          resolved?: Json | null
          transport?: boolean | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "sdoh_assessments_case_id_fkey"
            columns: ["case_id"]
            isOneToOne: false
            referencedRelation: "cases"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_checkin_trends: {
        Args: {
          p_case_id: string
          p_end_date: string
          p_period: string
          p_start_date: string
        }
        Returns: {
          anxiety_avg: number
          bucket: string
          depression_avg: number
          n: number
          pain_avg: number
          physical_avg: number
          psychological_avg: number
          psychosocial_avg: number
          purpose_avg: number
        }[]
      }
      get_user_roles: {
        Args: { _user_id: string }
        Returns: Database["public"]["Enums"]["app_role"][]
      }
      has_role:
        | { Args: { check_role: string }; Returns: boolean }
        | {
            Args: {
              _role: Database["public"]["Enums"]["app_role"]
              _user_id: string
            }
            Returns: boolean
          }
    }
    Enums: {
      app_role:
        | "CLIENT"
        | "ATTORNEY"
        | "PROVIDER"
        | "RN_CCM"
        | "SUPER_USER"
        | "SUPER_ADMIN"
        | "STAFF"
      disclosure_scope: "internal" | "minimal" | "full"
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
      app_role: [
        "CLIENT",
        "ATTORNEY",
        "PROVIDER",
        "RN_CCM",
        "SUPER_USER",
        "SUPER_ADMIN",
        "STAFF",
      ],
      disclosure_scope: ["internal", "minimal", "full"],
    },
  },
} as const
