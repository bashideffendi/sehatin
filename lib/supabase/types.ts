/**
 * Supabase Database types — match the schema from supabase/migrations/001_initial.sql
 *
 * You can also auto-generate this via:
 *   npx supabase gen types typescript --project-id <project-id> > lib/supabase/types.ts
 */

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
      profiles: {
        Row: {
          user_id: string;
          name: string | null;
          sex: "m" | "f" | null;
          age: number | null;
          age_bracket: string | null;
          weight_kg: number | null;
          height_cm: number | null;
          target_weight_kg: number | null;
          body_fat_pct: number | null;
          current_body_type: string | null;
          target_body_type: string | null;
          target_zones: string[] | null;
          weight_goal_magnitude: string | null;
          goal: string | null;
          main_motivation: string | null;
          special_occasion: string | null;
          target_event_date: string | null;
          body_image_satisfaction: string | null;
          activity: string | null;
          uses_fitness_tracker: boolean | null;
          sleep_duration: string | null;
          water_consumption: string | null;
          eat_locations: string[] | null;
          diet_method: string | null;
          preferences: Json;
          eating_psychology: Json | null;
          emotional_triggers: string[] | null;
          trigger_awareness: string | null;
          after_emotional_eating: string | null;
          past_food_trauma: string[] | null;
          snack_time: string | null;
          underlying_motivation: string | null;
          readiness_level: string | null;
          barriers: string[] | null;
          habit_anchor: string | null;
          pace_preference: string | null;
          life_events: string[] | null;
          medical_conditions: string[] | null;
          food_allergies: string[] | null;
          allergies_other: string | null;
          budget_idr_per_day: number | null;
          province_id: string | null;
          equipment_available: string[] | null;
          active_modes: string[] | null;
          completed_at: string | null;
          updated_at: string;
          created_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["profiles"]["Row"]> & {
          user_id: string;
        };
        Update: Partial<Database["public"]["Tables"]["profiles"]["Row"]>;
      };
      food_log: {
        Row: {
          id: string;
          user_id: string;
          date: string;
          meal_slot: "sarapan" | "makan_siang" | "makan_malam" | "snack";
          food_code: string | null;
          food_name: string;
          portion_g: number;
          kcal: number;
          protein_g: number | null;
          fat_g: number | null;
          carb_g: number | null;
          source: "search" | "plan" | "photo" | "manual";
          notes: string | null;
          created_at: string;
        };
        Insert: Omit<
          Database["public"]["Tables"]["food_log"]["Row"],
          "id" | "created_at"
        > & {
          id?: string;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["food_log"]["Row"]>;
      };
      weight_log: {
        Row: {
          id: string;
          user_id: string;
          date: string;
          weight_kg: number;
          notes: string | null;
          created_at: string;
        };
        Insert: Omit<
          Database["public"]["Tables"]["weight_log"]["Row"],
          "id" | "created_at"
        > & {
          id?: string;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["weight_log"]["Row"]>;
      };
      meal_plans: {
        Row: {
          id: string;
          user_id: string;
          start_date: string;
          days: number;
          diet_method: string | null;
          budget_idr_per_day: number | null;
          context_notes: string | null;
          targets: Json;
          plan: Json;
          generated_at: string;
          is_active: boolean;
        };
        Insert: Omit<
          Database["public"]["Tables"]["meal_plans"]["Row"],
          "id" | "generated_at"
        > & {
          id?: string;
          generated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["meal_plans"]["Row"]>;
      };
      workout_plans: {
        Row: {
          id: string;
          user_id: string;
          start_date: string;
          level: string;
          goal: string;
          split: string;
          days_per_week: number;
          session_minutes: number;
          weeks: number;
          context_notes: string | null;
          injuries_or_limitations: string[] | null;
          program: Json;
          generated_at: string;
          is_active: boolean;
        };
        Insert: Omit<
          Database["public"]["Tables"]["workout_plans"]["Row"],
          "id" | "generated_at"
        > & {
          id?: string;
          generated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["workout_plans"]["Row"]>;
      };
      workout_logs: {
        Row: {
          id: string;
          user_id: string;
          date: string;
          plan_id: string | null;
          week_idx: number | null;
          session_idx: number | null;
          day_label: string | null;
          focus: string | null;
          exercises: Json;
          duration_min: number | null;
          notes: string | null;
          created_at: string;
        };
        Insert: Omit<
          Database["public"]["Tables"]["workout_logs"]["Row"],
          "id" | "created_at"
        > & {
          id?: string;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["workout_logs"]["Row"]>;
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
  };
}
