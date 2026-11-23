// Database types for the Supabase client.
// Hand-written for phase 0. Once a Supabase project is linked, regenerate with:
//   npm run db:types
// which overwrites this file with the generated version.

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type EditionPhase =
  | "setup"
  | "registration"
  | "allocation"
  | "preparation"
  | "conference"
  | "wrap_up"
  | "archived";

export type AppRole = "admin" | "advisor" | "chair" | "delegate";

export type Database = {
  public: {
    Tables: {
      editions: {
        Row: {
          id: string;
          name: string;
          slug: string;
          year: number;
          phase: EditionPhase;
          starts_on: string | null;
          ends_on: string | null;
          is_current: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          slug: string;
          year: number;
          phase?: EditionPhase;
          starts_on?: string | null;
          ends_on?: string | null;
          is_current?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["editions"]["Insert"]>;
        Relationships: [];
      };
      profiles: {
        Row: {
          id: string;
          email: string;
          full_name: string | null;
          is_superadmin: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email: string;
          full_name?: string | null;
          is_superadmin?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["profiles"]["Insert"]>;
        Relationships: [];
      };
      edition_roles: {
        Row: {
          id: string;
          edition_id: string;
          user_id: string;
          role: AppRole;
          created_at: string;
        };
        Insert: {
          id?: string;
          edition_id: string;
          user_id: string;
          role: AppRole;
          created_at?: string;
        };
        Update: Partial<
          Database["public"]["Tables"]["edition_roles"]["Insert"]
        >;
        Relationships: [
          {
            foreignKeyName: "edition_roles_edition_id_fkey";
            columns: ["edition_id"];
            isOneToOne: false;
            referencedRelation: "editions";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "edition_roles_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: { [_ in never]: never };
    Functions: { [_ in never]: never };
    Enums: {
      edition_phase: EditionPhase;
      app_role: AppRole;
    };
    CompositeTypes: { [_ in never]: never };
  };
};
