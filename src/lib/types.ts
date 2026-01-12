export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: {
      year_plans: {
        Row: {
          id: string;
          user_id: string;
          year: number;
          theme: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          year: number;
          theme?: string | null;
          created_at?: string;
        };
      };
      categories: {
        Row: {
          id: string;
          year_plan_id: string;
          name: string;
          sort_order: number;
        };
        Insert: {
          id?: string;
          year_plan_id: string;
          name: string;
          sort_order: number;
        };
      };
      goals: {
        Row: {
          id: string;
          year_plan_id: string;
          category_id: string;
          title: string;
          smart_specific: string | null;
          smart_measurable: string | null;
          smart_achievable: string | null;
          smart_relevant: string | null;
          smart_timebound: string | null;
          why_important: string | null;
          result_of_achieving: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          year_plan_id: string;
          category_id: string;
          title: string;
          smart_specific?: string | null;
          smart_measurable?: string | null;
          smart_achievable?: string | null;
          smart_relevant?: string | null;
          smart_timebound?: string | null;
          why_important?: string | null;
          result_of_achieving?: string | null;
          created_at?: string;
        };
      };
      macro_tasks: {
        Row: {
          id: string;
          goal_id: string;
          title: string;
          description: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          goal_id: string;
          title: string;
          description?: string | null;
          created_at?: string;
        };
      };
      unexpected_macros: {
        Row: {
          id: string;
          year_plan_id: string;
          user_id: string;
          title: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          year_plan_id: string;
          user_id: string;
          title: string;
          created_at?: string;
        };
      };
      tasks: {
        Row: {
          id: string;
          title: string;
          notes: string | null;
          status: "not_started" | "in_progress" | "done" | "dropped";
          done_at: string | null;
          done_rating: number | null;
          macro_task_id: string | null;
          goal_id: string | null;
          unexpected_macro_id: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          title: string;
          notes?: string | null;
          status?: "not_started" | "in_progress" | "done" | "dropped";
          done_at?: string | null;
          done_rating?: number | null;
          macro_task_id?: string | null;
          goal_id?: string | null;
          unexpected_macro_id?: string | null;
          created_at?: string;
        };
      };
      daily_logs: {
        Row: {
          id: string;
          user_id: string;
          date: string;
          day_rating: number | null;
          note: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          date: string;
          day_rating?: number | null;
          note?: string | null;
          created_at?: string;
        };
      };
      daily_focus_items: {
        Row: {
          id: string;
          user_id: string;
          date: string;
          task_id: string;
          urgent: boolean;
          important: boolean;
          outcome: "done" | "not_done" | "moved";
          moved_to_date: string | null;
          unexpected: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          date: string;
          task_id: string;
          urgent?: boolean;
          important?: boolean;
          outcome?: "done" | "not_done" | "moved";
          moved_to_date?: string | null;
          unexpected?: boolean;
          created_at?: string;
        };
      };
      weekly_reviews: {
        Row: {
          id: string;
          user_id: string;
          week_start: string;
          rating: number | null;
          comment: string | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          week_start: string;
          rating?: number | null;
          comment?: string | null;
        };
      };
      monthly_reviews: {
        Row: {
          id: string;
          user_id: string;
          month: string;
          rating: number | null;
          comment: string | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          month: string;
          rating?: number | null;
          comment?: string | null;
        };
      };
    };
  };
};

export type YearPlan = Database["public"]["Tables"]["year_plans"]["Row"];
export type Category = Database["public"]["Tables"]["categories"]["Row"];
export type Goal = Database["public"]["Tables"]["goals"]["Row"];
export type MacroTask = Database["public"]["Tables"]["macro_tasks"]["Row"];
export type Task = Database["public"]["Tables"]["tasks"]["Row"];
export type DailyFocusItem =
  Database["public"]["Tables"]["daily_focus_items"]["Row"];
export type DailyLog = Database["public"]["Tables"]["daily_logs"]["Row"];
export type UnexpectedMacro =
  Database["public"]["Tables"]["unexpected_macros"]["Row"];
export type WeeklyReview = Database["public"]["Tables"]["weekly_reviews"]["Row"];
export type MonthlyReview =
  Database["public"]["Tables"]["monthly_reviews"]["Row"];
