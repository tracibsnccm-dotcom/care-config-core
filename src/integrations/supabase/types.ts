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
      assignment_audit_log: {
        Row: {
          assigned_attorney_id: string
          assigned_by: string
          assigned_timestamp: string
          assignment_method: string
          case_id: string
          created_at: string
          id: string
          metadata: Json | null
          reviewed_by: string | null
        }
        Insert: {
          assigned_attorney_id: string
          assigned_by?: string
          assigned_timestamp?: string
          assignment_method?: string
          case_id: string
          created_at?: string
          id?: string
          metadata?: Json | null
          reviewed_by?: string | null
        }
        Update: {
          assigned_attorney_id?: string
          assigned_by?: string
          assigned_timestamp?: string
          assignment_method?: string
          case_id?: string
          created_at?: string
          id?: string
          metadata?: Json | null
          reviewed_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "assignment_audit_log_case_id_fkey"
            columns: ["case_id"]
            isOneToOne: false
            referencedRelation: "cases"
            referencedColumns: ["id"]
          },
        ]
      }
      assignment_offers: {
        Row: {
          attorney_id: string
          case_id: string
          created_at: string
          created_by: string | null
          decline_note: string | null
          decline_reason: string | null
          expires_at: string
          id: string
          offered_at: string
          responded_at: string | null
          status: Database["public"]["Enums"]["assignment_offer_status"]
          updated_at: string
        }
        Insert: {
          attorney_id: string
          case_id: string
          created_at?: string
          created_by?: string | null
          decline_note?: string | null
          decline_reason?: string | null
          expires_at?: string
          id?: string
          offered_at?: string
          responded_at?: string | null
          status?: Database["public"]["Enums"]["assignment_offer_status"]
          updated_at?: string
        }
        Update: {
          attorney_id?: string
          case_id?: string
          created_at?: string
          created_by?: string | null
          decline_note?: string | null
          decline_reason?: string | null
          expires_at?: string
          id?: string
          offered_at?: string
          responded_at?: string | null
          status?: Database["public"]["Enums"]["assignment_offer_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "assignment_offers_case_id_fkey"
            columns: ["case_id"]
            isOneToOne: false
            referencedRelation: "cases"
            referencedColumns: ["id"]
          },
        ]
      }
      attorney_metadata: {
        Row: {
          capacity_available: number
          capacity_limit: number
          created_at: string
          id: string
          last_assigned_date: string | null
          plan_price: number | null
          renewal_date: string | null
          status: string
          tier: string
          updated_at: string
          user_id: string
        }
        Insert: {
          capacity_available?: number
          capacity_limit?: number
          created_at?: string
          id?: string
          last_assigned_date?: string | null
          plan_price?: number | null
          renewal_date?: string | null
          status?: string
          tier?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          capacity_available?: number
          capacity_limit?: number
          created_at?: string
          id?: string
          last_assigned_date?: string | null
          plan_price?: number | null
          renewal_date?: string | null
          status?: string
          tier?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      attorney_performance: {
        Row: {
          accepted: number | null
          attorney_code: string
          avg_response_time_hours: number | null
          conversion_rate: number | null
          declined: number | null
          id: string
          last_updated: string | null
          total_referrals: number | null
        }
        Insert: {
          accepted?: number | null
          attorney_code: string
          avg_response_time_hours?: number | null
          conversion_rate?: number | null
          declined?: number | null
          id?: string
          last_updated?: string | null
          total_referrals?: number | null
        }
        Update: {
          accepted?: number | null
          attorney_code?: string
          avg_response_time_hours?: number | null
          conversion_rate?: number | null
          declined?: number | null
          id?: string
          last_updated?: string | null
          total_referrals?: number | null
        }
        Relationships: []
      }
      attorney_rn_messages: {
        Row: {
          attachments: Json | null
          case_id: string
          created_at: string
          id: string
          is_important: boolean | null
          message_text: string
          sender_id: string
          sender_role: string
          updated_at: string
        }
        Insert: {
          attachments?: Json | null
          case_id: string
          created_at?: string
          id?: string
          is_important?: boolean | null
          message_text: string
          sender_id: string
          sender_role: string
          updated_at?: string
        }
        Update: {
          attachments?: Json | null
          case_id?: string
          created_at?: string
          id?: string
          is_important?: boolean | null
          message_text?: string
          sender_id?: string
          sender_role?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "attorney_rn_messages_case_id_fkey"
            columns: ["case_id"]
            isOneToOne: false
            referencedRelation: "cases"
            referencedColumns: ["id"]
          },
        ]
      }
      attorney_sla: {
        Row: {
          attorney_code: string
          auto_accept: boolean | null
          created_at: string | null
          fee_amount: number | null
          id: string
          is_active: boolean | null
          response_time_hours: number
          updated_at: string | null
        }
        Insert: {
          attorney_code: string
          auto_accept?: boolean | null
          created_at?: string | null
          fee_amount?: number | null
          id?: string
          is_active?: boolean | null
          response_time_hours?: number
          updated_at?: string | null
        }
        Update: {
          attorney_code?: string
          auto_accept?: boolean | null
          created_at?: string | null
          fee_amount?: number | null
          id?: string
          is_active?: boolean | null
          response_time_hours?: number
          updated_at?: string | null
        }
        Relationships: []
      }
      attorney_wallet: {
        Row: {
          attorney_id: string
          balance: number
          created_at: string
          id: string
          updated_at: string
        }
        Insert: {
          attorney_id: string
          balance?: number
          created_at?: string
          id?: string
          updated_at?: string
        }
        Update: {
          attorney_id?: string
          balance?: number
          created_at?: string
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
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
      billing_transactions: {
        Row: {
          amount: number
          attorney_id: string
          created_at: string
          id: string
          metadata: Json | null
          payment_method: string | null
          payment_status: Database["public"]["Enums"]["payment_status"]
          processing_fee: number
          referral_id: string
          stripe_payment_id: string | null
          tax: number
          total_amount: number
          transaction_date: string
        }
        Insert: {
          amount: number
          attorney_id: string
          created_at?: string
          id?: string
          metadata?: Json | null
          payment_method?: string | null
          payment_status?: Database["public"]["Enums"]["payment_status"]
          processing_fee?: number
          referral_id: string
          stripe_payment_id?: string | null
          tax?: number
          total_amount: number
          transaction_date?: string
        }
        Update: {
          amount?: number
          attorney_id?: string
          created_at?: string
          id?: string
          metadata?: Json | null
          payment_method?: string | null
          payment_status?: Database["public"]["Enums"]["payment_status"]
          processing_fee?: number
          referral_id?: string
          stripe_payment_id?: string | null
          tax?: number
          total_amount?: number
          transaction_date?: string
        }
        Relationships: [
          {
            foreignKeyName: "billing_transactions_referral_id_fkey"
            columns: ["referral_id"]
            isOneToOne: false
            referencedRelation: "referrals"
            referencedColumns: ["id"]
          },
        ]
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
      case_notes: {
        Row: {
          case_id: string
          created_at: string
          created_by: string
          id: string
          note_text: string
          updated_at: string
          visibility: string
        }
        Insert: {
          case_id: string
          created_at?: string
          created_by: string
          id?: string
          note_text: string
          updated_at?: string
          visibility?: string
        }
        Update: {
          case_id?: string
          created_at?: string
          created_by?: string
          id?: string
          note_text?: string
          updated_at?: string
          visibility?: string
        }
        Relationships: []
      }
      case_summaries: {
        Row: {
          case_id: string
          edited_at: string | null
          edited_content: string | null
          generated_at: string
          generated_by: string
          id: string
          metadata: Json | null
          summary_content: string
          summary_type: string
        }
        Insert: {
          case_id: string
          edited_at?: string | null
          edited_content?: string | null
          generated_at?: string
          generated_by: string
          id?: string
          metadata?: Json | null
          summary_content: string
          summary_type?: string
        }
        Update: {
          case_id?: string
          edited_at?: string | null
          edited_content?: string | null
          generated_at?: string
          generated_by?: string
          id?: string
          metadata?: Json | null
          summary_content?: string
          summary_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "case_summaries_case_id_fkey"
            columns: ["case_id"]
            isOneToOne: false
            referencedRelation: "cases"
            referencedColumns: ["id"]
          },
        ]
      }
      case_tasks: {
        Row: {
          assigned_role: string | null
          assigned_to: string | null
          case_id: string
          completed_at: string | null
          created_at: string
          created_by: string
          description: string | null
          due_date: string | null
          id: string
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          assigned_role?: string | null
          assigned_to?: string | null
          case_id: string
          completed_at?: string | null
          created_at?: string
          created_by: string
          description?: string | null
          due_date?: string | null
          id?: string
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          assigned_role?: string | null
          assigned_to?: string | null
          case_id?: string
          completed_at?: string | null
          created_at?: string
          created_by?: string
          description?: string | null
          due_date?: string | null
          id?: string
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      cases: {
        Row: {
          attorney_code: string | null
          atty_ref: string | null
          client_label: string | null
          client_number: string | null
          client_type: string | null
          consent: Json | null
          converted_at: string | null
          created_at: string | null
          created_by: string | null
          documentation: Json | null
          flags: string[] | null
          fourps: Json | null
          id: string
          incident: Json | null
          last_pain_diary_at: string | null
          odg_benchmarks: Json | null
          original_intake_id: string | null
          pain_diary_count_30d: number | null
          provider_routed: boolean | null
          sdoh: Json | null
          sdoh_resolved: Json | null
          specialist_report_uploaded: boolean | null
          status: string | null
        }
        Insert: {
          attorney_code?: string | null
          atty_ref?: string | null
          client_label?: string | null
          client_number?: string | null
          client_type?: string | null
          consent?: Json | null
          converted_at?: string | null
          created_at?: string | null
          created_by?: string | null
          documentation?: Json | null
          flags?: string[] | null
          fourps?: Json | null
          id?: string
          incident?: Json | null
          last_pain_diary_at?: string | null
          odg_benchmarks?: Json | null
          original_intake_id?: string | null
          pain_diary_count_30d?: number | null
          provider_routed?: boolean | null
          sdoh?: Json | null
          sdoh_resolved?: Json | null
          specialist_report_uploaded?: boolean | null
          status?: string | null
        }
        Update: {
          attorney_code?: string | null
          atty_ref?: string | null
          client_label?: string | null
          client_number?: string | null
          client_type?: string | null
          consent?: Json | null
          converted_at?: string | null
          created_at?: string | null
          created_by?: string | null
          documentation?: Json | null
          flags?: string[] | null
          fourps?: Json | null
          id?: string
          incident?: Json | null
          last_pain_diary_at?: string | null
          odg_benchmarks?: Json | null
          original_intake_id?: string | null
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
      client_communications: {
        Row: {
          channel: string
          client_id: string | null
          created_at: string | null
          delivered_at: string | null
          id: string
          message_content: string | null
          metadata: Json | null
          sent_at: string | null
          status: string
          type: string
        }
        Insert: {
          channel: string
          client_id?: string | null
          created_at?: string | null
          delivered_at?: string | null
          id?: string
          message_content?: string | null
          metadata?: Json | null
          sent_at?: string | null
          status?: string
          type: string
        }
        Update: {
          channel?: string
          client_id?: string | null
          created_at?: string | null
          delivered_at?: string | null
          id?: string
          message_content?: string | null
          metadata?: Json | null
          sent_at?: string | null
          status?: string
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "client_communications_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "cases"
            referencedColumns: ["id"]
          },
        ]
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
      complaint_timeline: {
        Row: {
          complaint_id: string
          created_at: string
          event_type: string
          id: string
          notes: string | null
          performed_by: string | null
          performed_by_role: string | null
          status: string
        }
        Insert: {
          complaint_id: string
          created_at?: string
          event_type: string
          id?: string
          notes?: string | null
          performed_by?: string | null
          performed_by_role?: string | null
          status: string
        }
        Update: {
          complaint_id?: string
          created_at?: string
          event_type?: string
          id?: string
          notes?: string | null
          performed_by?: string | null
          performed_by_role?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "complaint_timeline_complaint_id_fkey"
            columns: ["complaint_id"]
            isOneToOne: false
            referencedRelation: "complaints"
            referencedColumns: ["id"]
          },
        ]
      }
      complaints: {
        Row: {
          archived_at: string | null
          assigned_to: string | null
          complaint_about: string
          complaint_description: string
          created_at: string
          id: string
          resolution_notes: string | null
          resolved_at: string | null
          status: string
          status_changed_at: string | null
          updated_at: string
        }
        Insert: {
          archived_at?: string | null
          assigned_to?: string | null
          complaint_about: string
          complaint_description: string
          created_at?: string
          id?: string
          resolution_notes?: string | null
          resolved_at?: string | null
          status?: string
          status_changed_at?: string | null
          updated_at?: string
        }
        Update: {
          archived_at?: string | null
          assigned_to?: string | null
          complaint_about?: string
          complaint_description?: string
          created_at?: string
          id?: string
          resolution_notes?: string | null
          resolved_at?: string | null
          status?: string
          status_changed_at?: string | null
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
      concern_timeline: {
        Row: {
          concern_id: string
          created_at: string
          event_type: string
          id: string
          notes: string | null
          performed_by: string | null
          performed_by_role: string | null
          status: string
        }
        Insert: {
          concern_id: string
          created_at?: string
          event_type: string
          id?: string
          notes?: string | null
          performed_by?: string | null
          performed_by_role?: string | null
          status: string
        }
        Update: {
          concern_id?: string
          created_at?: string
          event_type?: string
          id?: string
          notes?: string | null
          performed_by?: string | null
          performed_by_role?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "concern_timeline_concern_id_fkey"
            columns: ["concern_id"]
            isOneToOne: false
            referencedRelation: "concerns"
            referencedColumns: ["id"]
          },
        ]
      }
      concerns: {
        Row: {
          archived_at: string | null
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
          status_changed_at: string | null
          updated_at: string
          visit_date: string | null
        }
        Insert: {
          archived_at?: string | null
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
          status_changed_at?: string | null
          updated_at?: string
          visit_date?: string | null
        }
        Update: {
          archived_at?: string | null
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
          status_changed_at?: string | null
          updated_at?: string
          visit_date?: string | null
        }
        Relationships: []
      }
      data_retention_policy: {
        Row: {
          client_record_years: number | null
          export_before_purge: boolean | null
          id: string
          purged_data_backup_days: number | null
          updated_at: string | null
        }
        Insert: {
          client_record_years?: number | null
          export_before_purge?: boolean | null
          id?: string
          purged_data_backup_days?: number | null
          updated_at?: string | null
        }
        Update: {
          client_record_years?: number | null
          export_before_purge?: boolean | null
          id?: string
          purged_data_backup_days?: number | null
          updated_at?: string | null
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
      document_activity_log: {
        Row: {
          action_type: string
          created_at: string
          document_id: string
          id: string
          metadata: Json | null
          performed_by: string
          performed_by_name: string | null
          performed_by_role: string | null
        }
        Insert: {
          action_type: string
          created_at?: string
          document_id: string
          id?: string
          metadata?: Json | null
          performed_by: string
          performed_by_name?: string | null
          performed_by_role?: string | null
        }
        Update: {
          action_type?: string
          created_at?: string
          document_id?: string
          id?: string
          metadata?: Json | null
          performed_by?: string
          performed_by_name?: string | null
          performed_by_role?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "document_activity_log_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "documents"
            referencedColumns: ["id"]
          },
        ]
      }
      documents: {
        Row: {
          activity_log: Json | null
          case_id: string
          category: string | null
          created_at: string | null
          document_type: string
          file_name: string
          file_path: string
          file_size: number | null
          id: string
          is_sensitive: boolean | null
          metadata: Json | null
          mime_type: string | null
          mirror_to_case_notes: boolean | null
          note: string | null
          read_by: string[] | null
          requires_attention: boolean | null
          shared_with: string[] | null
          status: string
          updated_at: string | null
          uploaded_by: string | null
        }
        Insert: {
          activity_log?: Json | null
          case_id: string
          category?: string | null
          created_at?: string | null
          document_type: string
          file_name: string
          file_path: string
          file_size?: number | null
          id?: string
          is_sensitive?: boolean | null
          metadata?: Json | null
          mime_type?: string | null
          mirror_to_case_notes?: boolean | null
          note?: string | null
          read_by?: string[] | null
          requires_attention?: boolean | null
          shared_with?: string[] | null
          status?: string
          updated_at?: string | null
          uploaded_by?: string | null
        }
        Update: {
          activity_log?: Json | null
          case_id?: string
          category?: string | null
          created_at?: string | null
          document_type?: string
          file_name?: string
          file_path?: string
          file_size?: number | null
          id?: string
          is_sensitive?: boolean | null
          metadata?: Json | null
          mime_type?: string | null
          mirror_to_case_notes?: boolean | null
          note?: string | null
          read_by?: string[] | null
          requires_attention?: boolean | null
          shared_with?: string[] | null
          status?: string
          updated_at?: string | null
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
      e_sign_audit_logs: {
        Row: {
          created_at: string
          event_type: string
          id: string
          ip_address: string | null
          metadata: Json | null
          request_id: string
          user_agent: string | null
        }
        Insert: {
          created_at?: string
          event_type: string
          id?: string
          ip_address?: string | null
          metadata?: Json | null
          request_id: string
          user_agent?: string | null
        }
        Update: {
          created_at?: string
          event_type?: string
          id?: string
          ip_address?: string | null
          metadata?: Json | null
          request_id?: string
          user_agent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "e_sign_audit_logs_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: false
            referencedRelation: "e_sign_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      e_sign_requests: {
        Row: {
          audit_trail: Json | null
          case_id: string
          created_at: string
          declined_at: string | null
          document_path: string | null
          expired_at: string | null
          id: string
          pdf_hash: string | null
          requested_by: string
          sent_at: string
          signed_at: string | null
          signer_id: string
          status: string
          template_id: string
          updated_at: string
          viewed_at: string | null
        }
        Insert: {
          audit_trail?: Json | null
          case_id: string
          created_at?: string
          declined_at?: string | null
          document_path?: string | null
          expired_at?: string | null
          id?: string
          pdf_hash?: string | null
          requested_by: string
          sent_at?: string
          signed_at?: string | null
          signer_id: string
          status?: string
          template_id: string
          updated_at?: string
          viewed_at?: string | null
        }
        Update: {
          audit_trail?: Json | null
          case_id?: string
          created_at?: string
          declined_at?: string | null
          document_path?: string | null
          expired_at?: string | null
          id?: string
          pdf_hash?: string | null
          requested_by?: string
          sent_at?: string
          signed_at?: string | null
          signer_id?: string
          status?: string
          template_id?: string
          updated_at?: string
          viewed_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "e_sign_requests_case_id_fkey"
            columns: ["case_id"]
            isOneToOne: false
            referencedRelation: "cases"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "e_sign_requests_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "e_sign_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      e_sign_templates: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          merge_fields: Json | null
          name: string
          template_content: string
          template_type: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          merge_fields?: Json | null
          name: string
          template_content: string
          template_type: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          merge_fields?: Json | null
          name?: string
          template_content?: string
          template_type?: string
          updated_at?: string
        }
        Relationships: []
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
      message_drafts: {
        Row: {
          case_id: string | null
          context: string
          created_at: string
          draft_content: string
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          case_id?: string | null
          context: string
          created_at?: string
          draft_content: string
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          case_id?: string | null
          context?: string
          created_at?: string
          draft_content?: string
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      message_reminders: {
        Row: {
          case_id: string | null
          created_at: string
          id: string
          message_id: string
          remind_at: string
          reminded: boolean
          reminded_at: string | null
          user_id: string
        }
        Insert: {
          case_id?: string | null
          created_at?: string
          id?: string
          message_id: string
          remind_at: string
          reminded?: boolean
          reminded_at?: string | null
          user_id: string
        }
        Update: {
          case_id?: string | null
          created_at?: string
          id?: string
          message_id?: string
          remind_at?: string
          reminded?: boolean
          reminded_at?: string | null
          user_id?: string
        }
        Relationships: []
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
      notifications: {
        Row: {
          created_at: string
          id: string
          link: string | null
          message: string
          metadata: Json | null
          read: boolean
          read_at: string | null
          title: string
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          link?: string | null
          message: string
          metadata?: Json | null
          read?: boolean
          read_at?: string | null
          title: string
          type?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          link?: string | null
          message?: string
          metadata?: Json | null
          read?: boolean
          read_at?: string | null
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      pinned_cases: {
        Row: {
          case_id: string
          created_at: string
          id: string
          position: number
          user_id: string
        }
        Insert: {
          case_id: string
          created_at?: string
          id?: string
          position?: number
          user_id: string
        }
        Update: {
          case_id?: string
          created_at?: string
          id?: string
          position?: number
          user_id?: string
        }
        Relationships: []
      }
      policy_acceptances: {
        Row: {
          accepted_at: string
          attorney_id: string
          attorney_name: string
          checksum: string
          created_at: string
          firm: string | null
          id: string
          ip_address: string | null
          policy_version: string
          signature_blob: string | null
          signature_type: string
          title: string | null
          typed_signature_text: string | null
          user_agent: string | null
        }
        Insert: {
          accepted_at?: string
          attorney_id: string
          attorney_name: string
          checksum: string
          created_at?: string
          firm?: string | null
          id?: string
          ip_address?: string | null
          policy_version?: string
          signature_blob?: string | null
          signature_type: string
          title?: string | null
          typed_signature_text?: string | null
          user_agent?: string | null
        }
        Update: {
          accepted_at?: string
          attorney_id?: string
          attorney_name?: string
          checksum?: string
          created_at?: string
          firm?: string | null
          id?: string
          ip_address?: string | null
          policy_version?: string
          signature_blob?: string | null
          signature_type?: string
          title?: string | null
          typed_signature_text?: string | null
          user_agent?: string | null
        }
        Relationships: []
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
      provider_contact_requests: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          case_id: string
          completed_at: string | null
          created_at: string
          id: string
          notes: string | null
          provider_id: string
          reason: string
          requested_by: string
          status: string
          updated_at: string
          urgency: string
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          case_id: string
          completed_at?: string | null
          created_at?: string
          id?: string
          notes?: string | null
          provider_id: string
          reason: string
          requested_by: string
          status?: string
          updated_at?: string
          urgency?: string
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          case_id?: string
          completed_at?: string | null
          created_at?: string
          id?: string
          notes?: string | null
          provider_id?: string
          reason?: string
          requested_by?: string
          status?: string
          updated_at?: string
          urgency?: string
        }
        Relationships: [
          {
            foreignKeyName: "provider_contact_requests_case_id_fkey"
            columns: ["case_id"]
            isOneToOne: false
            referencedRelation: "cases"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "provider_contact_requests_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "providers"
            referencedColumns: ["id"]
          },
        ]
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
      referrals: {
        Row: {
          acceptance_status: Database["public"]["Enums"]["referral_status"]
          admin_fee_charged: number
          attorney_id: string
          case_id: string
          client_id: string
          created_at: string
          id: string
          notes: string | null
          payment_date: string | null
          payment_status: Database["public"]["Enums"]["payment_status"]
          referral_date: string
          reported_by: string | null
          settlement_amount: number | null
          settlement_date: string | null
          updated_at: string
        }
        Insert: {
          acceptance_status?: Database["public"]["Enums"]["referral_status"]
          admin_fee_charged?: number
          attorney_id: string
          case_id: string
          client_id: string
          created_at?: string
          id?: string
          notes?: string | null
          payment_date?: string | null
          payment_status?: Database["public"]["Enums"]["payment_status"]
          referral_date?: string
          reported_by?: string | null
          settlement_amount?: number | null
          settlement_date?: string | null
          updated_at?: string
        }
        Update: {
          acceptance_status?: Database["public"]["Enums"]["referral_status"]
          admin_fee_charged?: number
          attorney_id?: string
          case_id?: string
          client_id?: string
          created_at?: string
          id?: string
          notes?: string | null
          payment_date?: string | null
          payment_status?: Database["public"]["Enums"]["payment_status"]
          referral_date?: string
          reported_by?: string | null
          settlement_amount?: number | null
          settlement_date?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "referrals_case_id_fkey"
            columns: ["case_id"]
            isOneToOne: false
            referencedRelation: "cases"
            referencedColumns: ["id"]
          },
        ]
      }
      report_documents: {
        Row: {
          case_id: string
          created_at: string
          file_path: string | null
          filed_at: string | null
          filed_by: string | null
          filed_status: string
          generated_at: string
          generated_by: string | null
          id: string
          metadata: Json | null
          report_title: string
          report_type: string
          review_status: string
          reviewed_at: string | null
          reviewed_by: string | null
          updated_at: string
        }
        Insert: {
          case_id: string
          created_at?: string
          file_path?: string | null
          filed_at?: string | null
          filed_by?: string | null
          filed_status?: string
          generated_at?: string
          generated_by?: string | null
          id?: string
          metadata?: Json | null
          report_title: string
          report_type: string
          review_status?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          updated_at?: string
        }
        Update: {
          case_id?: string
          created_at?: string
          file_path?: string | null
          filed_at?: string | null
          filed_by?: string | null
          filed_status?: string
          generated_at?: string
          generated_by?: string | null
          id?: string
          metadata?: Json | null
          report_title?: string
          report_type?: string
          review_status?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      rn_cm_service_requests: {
        Row: {
          acknowledged_at: string | null
          assigned_rn: string | null
          attorney_id: string
          completed_at: string | null
          created_at: string
          delivery_files: Json | null
          form_data: Json
          id: string
          price_cents: number
          service_id: string
          service_title: string
          status: string
          updated_at: string
        }
        Insert: {
          acknowledged_at?: string | null
          assigned_rn?: string | null
          attorney_id: string
          completed_at?: string | null
          created_at?: string
          delivery_files?: Json | null
          form_data?: Json
          id?: string
          price_cents: number
          service_id: string
          service_title: string
          status?: string
          updated_at?: string
        }
        Update: {
          acknowledged_at?: string | null
          assigned_rn?: string | null
          attorney_id?: string
          completed_at?: string | null
          created_at?: string
          delivery_files?: Json | null
          form_data?: Json
          id?: string
          price_cents?: number
          service_id?: string
          service_title?: string
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      round_robin_settings: {
        Row: {
          allow_manual_override: boolean
          check_capacity: boolean
          enabled: boolean
          id: string
          reset_rotation_days: number | null
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          allow_manual_override?: boolean
          check_capacity?: boolean
          enabled?: boolean
          id?: string
          reset_rotation_days?: number | null
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          allow_manual_override?: boolean
          check_capacity?: boolean
          enabled?: boolean
          id?: string
          reset_rotation_days?: number | null
          updated_at?: string
          updated_by?: string | null
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
      user_preferences: {
        Row: {
          created_at: string
          dismissed_tips: Json | null
          id: string
          nav_collapsed: boolean | null
          notification_filter: string | null
          theme: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          dismissed_tips?: Json | null
          id?: string
          nav_collapsed?: boolean | null
          notification_filter?: string | null
          theme?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          dismissed_tips?: Json | null
          id?: string
          nav_collapsed?: boolean | null
          notification_filter?: string | null
          theme?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
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
      wallet_acknowledgments: {
        Row: {
          acknowledged_at: string
          attorney_id: string
          id: string
          ip_address: string | null
          message_hash: string
          user_agent: string | null
        }
        Insert: {
          acknowledged_at?: string
          attorney_id: string
          id?: string
          ip_address?: string | null
          message_hash: string
          user_agent?: string | null
        }
        Update: {
          acknowledged_at?: string
          attorney_id?: string
          id?: string
          ip_address?: string | null
          message_hash?: string
          user_agent?: string | null
        }
        Relationships: []
      }
      wallet_transactions: {
        Row: {
          amount: number
          attorney_id: string
          case_id: string | null
          created_at: string
          description: string
          id: string
          metadata: Json | null
          payment_method: string | null
          processing_fee: number
          status: string
          tax: number
          total_amount: number
          transaction_type: string
        }
        Insert: {
          amount: number
          attorney_id: string
          case_id?: string | null
          created_at?: string
          description: string
          id?: string
          metadata?: Json | null
          payment_method?: string | null
          processing_fee?: number
          status?: string
          tax?: number
          total_amount: number
          transaction_type: string
        }
        Update: {
          amount?: number
          attorney_id?: string
          case_id?: string | null
          created_at?: string
          description?: string
          id?: string
          metadata?: Json | null
          payment_method?: string | null
          processing_fee?: number
          status?: string
          tax?: number
          total_amount?: number
          transaction_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "wallet_transactions_case_id_fkey"
            columns: ["case_id"]
            isOneToOne: false
            referencedRelation: "cases"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      accept_assignment_offer: { Args: { p_offer_id: string }; Returns: Json }
      add_complaint_timeline_entry: {
        Args: {
          p_complaint_id: string
          p_event_type: string
          p_notes?: string
          p_status: string
        }
        Returns: undefined
      }
      add_concern_timeline_entry: {
        Args: {
          p_concern_id: string
          p_event_type: string
          p_notes?: string
          p_status: string
        }
        Returns: undefined
      }
      assign_attorney_round_robin: {
        Args: { p_case_id: string; p_reviewed_by: string }
        Returns: string
      }
      convert_to_attorney_case: {
        Args: { p_attorney_code: string; p_internal_case_id: string }
        Returns: Json
      }
      decline_assignment_offer: {
        Args: { p_note?: string; p_offer_id: string; p_reason: string }
        Returns: Json
      }
      expire_assignment_offers: { Args: never; Returns: undefined }
      generate_client_id: {
        Args: { p_attorney_code: string; p_client_type: string }
        Returns: string
      }
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
      get_client_initials: { Args: { client_uuid: string }; Returns: string }
      get_latest_policy_acceptance: {
        Args: { p_attorney_id: string }
        Returns: {
          accepted_at: string
          id: string
          policy_version: string
        }[]
      }
      get_next_client_number: {
        Args: { p_attorney_code: string; p_client_type: string }
        Returns: number
      }
      get_next_round_robin_attorney: { Args: never; Returns: string }
      get_short_case_id: { Args: { case_uuid: string }; Returns: string }
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
      log_document_activity: {
        Args: {
          p_action_type: string
          p_document_id: string
          p_metadata?: Json
        }
        Returns: undefined
      }
      notify_roles: {
        Args: {
          notification_link?: string
          notification_message: string
          notification_metadata?: Json
          notification_title: string
          notification_type?: string
          role_names: string[]
        }
        Returns: undefined
      }
      notify_user: {
        Args: {
          notification_link?: string
          notification_message: string
          notification_metadata?: Json
          notification_title: string
          notification_type?: string
          target_user_id: string
        }
        Returns: undefined
      }
      update_attorney_capacity: {
        Args: { p_attorney_id: string; p_new_capacity_available: number }
        Returns: undefined
      }
      update_attorney_performance: {
        Args: { p_attorney_code: string }
        Returns: undefined
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
      assignment_offer_status: "pending" | "accepted" | "declined" | "expired"
      disclosure_scope: "internal" | "minimal" | "full"
      payment_status: "pending" | "paid" | "failed" | "refunded"
      referral_status: "pending" | "accepted" | "declined" | "settled"
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
      assignment_offer_status: ["pending", "accepted", "declined", "expired"],
      disclosure_scope: ["internal", "minimal", "full"],
      payment_status: ["pending", "paid", "failed", "refunded"],
      referral_status: ["pending", "accepted", "declined", "settled"],
    },
  },
} as const
