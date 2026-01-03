import { createClient } from "./supabase/server";
import {
  Category,
  Goal,
  MacroTask,
  Task,
  UnexpectedMacro,
  YearPlan,
} from "./types";

export type YearPlanBundle = {
  plan: YearPlan;
  categories: Category[];
  goals: Goal[];
  macros: MacroTask[];
  tasks: Task[];
  unexpectedMacro?: UnexpectedMacro | null;
  unexpectedTasks: Task[];
};

export async function loadYearPlanBundle(
  year: number,
  userId: string,
): Promise<YearPlanBundle | null> {
  const supabase = createClient();
  const { data: plan } = await supabase
    .from("year_plans")
    .select("*")
    .eq("user_id", userId)
    .eq("year", year)
    .maybeSingle();
  if (!plan) return null;

  const [{ data: categories }, { data: goals }] = await Promise.all([
    supabase.from("categories").select("*").eq("year_plan_id", plan.id).order("sort_order"),
    supabase
      .from("goals")
      .select("*")
      .eq("year_plan_id", plan.id)
      .order("created_at", { ascending: true }),
  ]);

  const goalIds = goals?.map((g) => g.id) || [];
  const { data: macros } =
    goalIds.length > 0
      ? await supabase.from("macro_tasks").select("*").in("goal_id", goalIds)
      : { data: [] as MacroTask[] };

  const macroIds = macros?.map((m) => m.id) || [];
  const { data: tasks } =
    macroIds.length > 0
      ? await supabase.from("tasks").select("*").in("macro_task_id", macroIds)
      : { data: [] as Task[] };

  const { data: unexpectedMacro } = await supabase
    .from("unexpected_macros")
    .select("*")
    .eq("year_plan_id", plan.id)
    .maybeSingle();
  const { data: unexpectedTasks } =
    unexpectedMacro?.id
      ? await supabase
          .from("tasks")
          .select("*")
          .eq("unexpected_macro_id", unexpectedMacro.id)
      : { data: [] as Task[] };

  return {
    plan,
    categories: categories || [],
    goals: goals || [],
    macros: macros || [],
    tasks: tasks || [],
    unexpectedMacro,
    unexpectedTasks: unexpectedTasks || [],
  };
}
