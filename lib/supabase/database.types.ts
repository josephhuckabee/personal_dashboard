export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

type Row = Record<string, unknown> & { id: string; user_id: string; created_at: string };
type Insert = Record<string, unknown> & { user_id: string };
type Update = Record<string, unknown>;

export type Database = {
  public: {
    Tables: {
      users: { Row: Omit<Row, 'user_id'> & { display_name: string | null }; Insert: Record<string, unknown> & { id: string }; Update: Update; Relationships: [] };
      profiles: { Row: Omit<Row, 'id'>; Insert: Insert; Update: Update; Relationships: [] };
      user_preferences: { Row: Row; Insert: Insert; Update: Update; Relationships: [] };
      goals: { Row: Row; Insert: Insert; Update: Update; Relationships: [] };
      objectives: { Row: Row; Insert: Insert; Update: Update; Relationships: [] };
      tasks: { Row: Row; Insert: Insert; Update: Update; Relationships: [] };
      habits: { Row: Row; Insert: Insert; Update: Update; Relationships: [] };
      habit_logs: { Row: Row; Insert: Insert; Update: Update; Relationships: [] };
      finance_accounts: { Row: Row; Insert: Insert; Update: Update; Relationships: [] };
      transactions: { Row: Row; Insert: Insert; Update: Update; Relationships: [] };
      income: { Row: Row; Insert: Insert; Update: Update; Relationships: [] };
      receipt_uploads: { Row: Row; Insert: Insert; Update: Update; Relationships: [] };
      travel_plans: { Row: Row; Insert: Insert; Update: Update; Relationships: [] };
      content_items: { Row: Row; Insert: Insert; Update: Update; Relationships: [] };
      content_projects: { Row: Row; Insert: Insert; Update: Update; Relationships: [] };
      relationships: { Row: Row; Insert: Insert; Update: Update; Relationships: [] };
      health_metrics: { Row: Row; Insert: Insert; Update: Update; Relationships: [] };
      calendar_events: { Row: Row; Insert: Insert; Update: Update; Relationships: [] };
      ai_briefings: { Row: Row; Insert: Insert; Update: Update; Relationships: [] };
      ai_decisions: { Row: Row; Insert: Insert; Update: Update; Relationships: [] };
      ai_usage_logs: { Row: Row; Insert: Insert; Update: Update; Relationships: [] };
      ai_context_profiles: { Row: Row; Insert: Insert; Update: Update; Relationships: [] };
      ai_recommendations: { Row: Row; Insert: Insert; Update: Update; Relationships: [] };
      daily_checkins: { Row: Row; Insert: Insert; Update: Update; Relationships: [] };
      finance_categories: { Row: Row; Insert: Insert; Update: Update; Relationships: [] };
      memories: { Row: Row; Insert: Insert; Update: Update; Relationships: [] };
      memory_relationships: { Row: Row; Insert: Insert; Update: Update; Relationships: [] };
      memory_events: { Row: Row; Insert: Insert; Update: Update; Relationships: [] };
      weekly_reviews: { Row: Row; Insert: Insert; Update: Update; Relationships: [] };
    };
    Views: Record<string, never>;
    Functions: {
      complete_onboarding: { Args: { p_payload: Json }; Returns: undefined };
      reserve_ai_request: { Args: { p_feature: string }; Returns: Row };
    };
    Enums: Record<string, string>;
    CompositeTypes: Record<string, never>;
  };
};
