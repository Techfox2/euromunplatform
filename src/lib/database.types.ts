// Generated from the Supabase schema (`npm run db:types`, or the Supabase MCP
// generate_typescript_types tool). Aliases at the bottom are hand-written.

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
    PostgrestVersion: "17.1"
  }
  public: {
    Tables: {
      application_delegates: {
        Row: {
          application_id: string
          committee_preferences: string[]
          country_preferences: string[]
          created_at: string
          email: string
          full_name: string
          grade: string | null
          id: string
          mun_experience: number
          notes: string | null
          position: number
        }
        Insert: {
          application_id: string
          committee_preferences?: string[]
          country_preferences?: string[]
          created_at?: string
          email: string
          full_name: string
          grade?: string | null
          id?: string
          mun_experience?: number
          notes?: string | null
          position: number
        }
        Update: {
          application_id?: string
          committee_preferences?: string[]
          country_preferences?: string[]
          created_at?: string
          email?: string
          full_name?: string
          grade?: string | null
          id?: string
          mun_experience?: number
          notes?: string | null
          position?: number
        }
        Relationships: [
          {
            foreignKeyName: "application_delegates_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "applications"
            referencedColumns: ["id"]
          },
        ]
      }
      applications: {
        Row: {
          applicant_id: string
          contact_name: string
          contact_phone: string | null
          decision_message: string | null
          edition_id: string
          id: string
          kind: Database["public"]["Enums"]["application_kind"]
          motivation: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          school_city: string | null
          school_country: string | null
          school_name: string | null
          status: Database["public"]["Enums"]["application_status"]
          submitted_at: string
          updated_at: string
        }
        Insert: {
          applicant_id: string
          contact_name: string
          contact_phone?: string | null
          decision_message?: string | null
          edition_id: string
          id?: string
          kind: Database["public"]["Enums"]["application_kind"]
          motivation?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          school_city?: string | null
          school_country?: string | null
          school_name?: string | null
          status?: Database["public"]["Enums"]["application_status"]
          submitted_at?: string
          updated_at?: string
        }
        Update: {
          applicant_id?: string
          contact_name?: string
          contact_phone?: string | null
          decision_message?: string | null
          edition_id?: string
          id?: string
          kind?: Database["public"]["Enums"]["application_kind"]
          motivation?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          school_city?: string | null
          school_country?: string | null
          school_name?: string | null
          status?: Database["public"]["Enums"]["application_status"]
          submitted_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "applications_applicant_id_fkey"
            columns: ["applicant_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "applications_edition_id_fkey"
            columns: ["edition_id"]
            isOneToOne: false
            referencedRelation: "editions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "applications_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      committees: {
        Row: {
          abbreviation: string
          created_at: string
          description: string | null
          edition_id: string
          id: string
          name: string
          sort_order: number
          study_guide_url: string | null
          topics: string[]
          updated_at: string
        }
        Insert: {
          abbreviation: string
          created_at?: string
          description?: string | null
          edition_id: string
          id?: string
          name: string
          sort_order?: number
          study_guide_url?: string | null
          topics?: string[]
          updated_at?: string
        }
        Update: {
          abbreviation?: string
          created_at?: string
          description?: string | null
          edition_id?: string
          id?: string
          name?: string
          sort_order?: number
          study_guide_url?: string | null
          topics?: string[]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "committees_edition_id_fkey"
            columns: ["edition_id"]
            isOneToOne: false
            referencedRelation: "editions"
            referencedColumns: ["id"]
          },
        ]
      }
      edition_roles: {
        Row: {
          created_at: string
          edition_id: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          edition_id: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          edition_id?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "edition_roles_edition_id_fkey"
            columns: ["edition_id"]
            isOneToOne: false
            referencedRelation: "editions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "edition_roles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      editions: {
        Row: {
          created_at: string
          description: string | null
          ends_on: string | null
          id: string
          is_current: boolean
          location: string | null
          max_delegates_per_school: number
          name: string
          phase: Database["public"]["Enums"]["edition_phase"]
          registration_closes_on: string | null
          slug: string
          starts_on: string | null
          tagline: string | null
          updated_at: string
          year: number
        }
        Insert: {
          created_at?: string
          description?: string | null
          ends_on?: string | null
          id?: string
          is_current?: boolean
          location?: string | null
          max_delegates_per_school?: number
          name: string
          phase?: Database["public"]["Enums"]["edition_phase"]
          registration_closes_on?: string | null
          slug: string
          starts_on?: string | null
          tagline?: string | null
          updated_at?: string
          year: number
        }
        Update: {
          created_at?: string
          description?: string | null
          ends_on?: string | null
          id?: string
          is_current?: boolean
          location?: string | null
          max_delegates_per_school?: number
          name?: string
          phase?: Database["public"]["Enums"]["edition_phase"]
          registration_closes_on?: string | null
          slug?: string
          starts_on?: string | null
          tagline?: string | null
          updated_at?: string
          year?: number
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          email: string
          full_name: string | null
          id: string
          is_superadmin: boolean
          updated_at: string
        }
        Insert: {
          created_at?: string
          email: string
          full_name?: string | null
          id: string
          is_superadmin?: boolean
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string
          full_name?: string | null
          id?: string
          is_superadmin?: boolean
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      review_application: {
        Args: {
          p_application_id: string
          p_message: string
          p_status: Database["public"]["Enums"]["application_status"]
        }
        Returns: undefined
      }
      save_application: {
        Args: {
          p_contact_name: string
          p_contact_phone: string
          p_delegates: Json
          p_edition_id: string
          p_kind: Database["public"]["Enums"]["application_kind"]
          p_motivation: string
          p_school_city: string
          p_school_country: string
          p_school_name: string
        }
        Returns: string
      }
    }
    Enums: {
      app_role: "admin" | "advisor" | "chair" | "delegate"
      application_kind: "school" | "individual"
      application_status:
        | "submitted"
        | "accepted"
        | "waitlisted"
        | "rejected"
        | "withdrawn"
      edition_phase:
        | "setup"
        | "registration"
        | "allocation"
        | "preparation"
        | "conference"
        | "wrap_up"
        | "archived"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type PublicSchema = Database["public"]

export type Tables<T extends keyof PublicSchema["Tables"]> =
  PublicSchema["Tables"][T]["Row"]
export type Enums<T extends keyof PublicSchema["Enums"]> = PublicSchema["Enums"][T]

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "advisor", "chair", "delegate"],
      application_kind: ["school", "individual"],
      application_status: [
        "submitted",
        "accepted",
        "waitlisted",
        "rejected",
        "withdrawn",
      ],
      edition_phase: [
        "setup",
        "registration",
        "allocation",
        "preparation",
        "conference",
        "wrap_up",
        "archived",
      ],
    },
  },
} as const

// Hand-written aliases used across the app.
export type AppRole = Enums<"app_role">
export type EditionPhase = Enums<"edition_phase">
export type ApplicationKind = Enums<"application_kind">
export type ApplicationStatus = Enums<"application_status">
export type Edition = Tables<"editions">
export type Committee = Tables<"committees">
export type Application = Tables<"applications">
export type ApplicationDelegate = Tables<"application_delegates">
