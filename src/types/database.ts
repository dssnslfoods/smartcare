// Database types matching Supabase schema
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      companies: {
        Row: { id: string; name: string; code: string | null; created_at: string | null };
        Insert: { id?: string; name: string; code?: string | null; created_at?: string | null };
        Update: { id?: string; name?: string; code?: string | null; created_at?: string | null };
      };
      branches: {
        Row: { id: string; company_id: string; name: string; code: string | null; created_at: string | null };
        Insert: { id?: string; company_id: string; name: string; code?: string | null; created_at?: string | null };
        Update: { id?: string; company_id?: string; name?: string; code?: string | null; created_at?: string | null };
      };
      product_groups: {
        Row: { id: string; name: string; code: string | null; created_at: string | null };
        Insert: { id?: string; name: string; code?: string | null; created_at?: string | null };
        Update: { id?: string; name?: string; code?: string | null; created_at?: string | null };
      };
      categories: {
        Row: { id: string; name: string; code: string | null; created_at: string | null };
        Insert: { id?: string; name: string; code?: string | null; created_at?: string | null };
        Update: { id?: string; name?: string; code?: string | null; created_at?: string | null };
      };
      problem_types: {
        Row: { id: string; name: string; code: string | null; category_id: string | null; created_at: string | null };
        Insert: { id?: string; name: string; code?: string | null; category_id?: string | null; created_at?: string | null };
        Update: { id?: string; name?: string; code?: string | null; category_id?: string | null; created_at?: string | null };
      };
      problem_sub_types: {
        Row: { id: string; problem_type_id: string; name: string; code: string | null; created_at: string | null };
        Insert: { id?: string; problem_type_id: string; name: string; code?: string | null; created_at?: string | null };
        Update: { id?: string; problem_type_id?: string; name?: string; code?: string | null; created_at?: string | null };
      };
      callers: {
        Row: { id: string; name: string; phone: string | null; email: string | null; customer_company_name: string | null; created_at: string | null };
        Insert: { id?: string; name: string; phone?: string | null; email?: string | null; customer_company_name?: string | null; created_at?: string | null };
        Update: { id?: string; name?: string; phone?: string | null; email?: string | null; customer_company_name?: string | null; created_at?: string | null };
      };
      complaints: {
        Row: {
          id: string; complaint_number: string | null; complaint_date: string | null;
          company_id: string | null; branch_id: string | null; product_group_id: string | null;
          category_id: string | null; problem_type_id: string | null; problem_sub_type_id: string | null;
          caller_id: string | null; description: string | null; status: string | null;
          priority: string | null; resolution: string | null; resolved_at: string | null;
          created_at: string | null; updated_at: string | null;
        };
        Insert: {
          id?: string; complaint_number?: string | null; complaint_date?: string | null;
          company_id?: string | null; branch_id?: string | null; product_group_id?: string | null;
          category_id?: string | null; problem_type_id?: string | null; problem_sub_type_id?: string | null;
          caller_id?: string | null; description?: string | null; status?: string | null;
          priority?: string | null; resolution?: string | null; resolved_at?: string | null;
          created_at?: string | null; updated_at?: string | null;
        };
        Update: {
          id?: string; complaint_number?: string | null; complaint_date?: string | null;
          company_id?: string | null; branch_id?: string | null; product_group_id?: string | null;
          category_id?: string | null; problem_type_id?: string | null; problem_sub_type_id?: string | null;
          caller_id?: string | null; description?: string | null; status?: string | null;
          priority?: string | null; resolution?: string | null; resolved_at?: string | null;
          created_at?: string | null; updated_at?: string | null;
        };
      };
      statuses: {
        Row: { id: string; name: string; code: string | null; created_at: string | null };
        Insert: { id?: string; name: string; code?: string | null; created_at?: string | null };
        Update: { id?: string; name?: string; code?: string | null; created_at?: string | null };
      };
      priorities: {
        Row: { id: string; name: string; code: string; created_at: string | null };
        Insert: { id?: string; name: string; code: string; created_at?: string | null };
        Update: { id?: string; name?: string; code?: string; created_at?: string | null };
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}

export type Tables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Row'];
export type InsertTables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Insert'];
export type UpdateTables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Update'];
