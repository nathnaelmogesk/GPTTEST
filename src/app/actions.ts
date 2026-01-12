"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { DEFAULT_CATEGORIES } from "@/lib/utils";
import { requireUser } from "@/lib/auth";
import {
  authSchema,
  dailyLogSchema,
  focusItemSchema,
  focusOutcomeSchema,
  goalSchema,
  macroTaskSchema,
  reviewSchema,
  taskSchema,
  yearPlanSchema,
} from "@/lib/validation";

export async function signIn(formData: FormData) {
  const parsed = authSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) {
    return { error: parsed.error.flatten().fieldErrors };
  }

  const supabase = createClient();
  const { error } = await supabase.auth.signInWithPassword(parsed.data);
  if (error) {
    return { error: { form: error.message } };
  }
  redirect("/");
}

export async function signUp(formData: FormData) {
  const parsed = authSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) {
    return { error: parsed.error.flatten().fieldErrors };
  }

  const supabase = createClient();
  const { error } = await supabase.auth.signUp(parsed.data);
  if (error) {
    return { error: { form: error.message } };
  }
  redirect("/");
}

export async function signOut() {
  const supabase = createClient();
  await supabase.auth.signOut();
  redirect("/auth");
}

export async function createYearPlan(formData: FormData) {
  const parsed = yearPlanSchema.safeParse({
    year: formData.get("year"),
    theme: formData.get("theme"),
  });
  if (!parsed.success) {
    return { error: parsed.error.flatten().fieldErrors };
  }

  const { supabase, user } = await requireUser();

  const existing = await supabase
    .from("year_plans")
    .select("id")
    .eq("user_id", user.id)
    .eq("year", parsed.data.year)
    .maybeSingle();

  let yearPlanId = existing.data?.id;

  if (!yearPlanId) {
    const { data, error } = await supabase
      .from("year_plans")
      .insert({
        user_id: user.id,
        year: parsed.data.year,
        theme: parsed.data.theme || null,
      })
      .select()
      .single();
    if (error) return { error: { form: error.message } };
    yearPlanId = data.id;

    await supabase.from("categories").insert(
      DEFAULT_CATEGORIES.map((name, index) => ({
        year_plan_id: yearPlanId,
        name,
        sort_order: index,
      })),
    );

    await supabase.from("unexpected_macros").insert({
      year_plan_id: yearPlanId,
      user_id: user.id,
      title: "Unexpected",
    });
  } else if (parsed.data.theme) {
    await supabase
      .from("year_plans")
      .update({ theme: parsed.data.theme })
      .eq("id", yearPlanId)
      .eq("user_id", user.id);
  }

  revalidatePath("/");
  revalidatePath(`/year/${parsed.data.year}`);
}

export async function createGoal(formData: FormData) {
  const parsed = goalSchema.safeParse({
    title: formData.get("title"),
    smart_specific: formData.get("smart_specific"),
    smart_measurable: formData.get("smart_measurable"),
    smart_achievable: formData.get("smart_achievable"),
    smart_relevant: formData.get("smart_relevant"),
    smart_timebound: formData.get("smart_timebound"),
    why_important: formData.get("why_important"),
    result_of_achieving: formData.get("result_of_achieving"),
  });
  if (!parsed.success) return { error: parsed.error.flatten().fieldErrors };

  const goalMeta = {
    year_plan_id: formData.get("year_plan_id")?.toString(),
    category_id: formData.get("category_id")?.toString(),
    year: formData.get("year")?.toString(),
  };

  const { supabase } = await requireUser();
  const { count } = await supabase
    .from("goals")
    .select("id", { count: "exact", head: true })
    .eq("category_id", goalMeta.category_id);
  if ((count || 0) >= 3) {
    return { error: { form: "Category already has 3 goals" } };
  }

  const { error } = await supabase.from("goals").insert({
    ...parsed.data,
    year_plan_id: goalMeta.year_plan_id!,
    category_id: goalMeta.category_id!,
  });
  if (error) return { error: { form: error.message } };

  revalidatePath(`/year/${goalMeta.year}`);
  revalidatePath(`/year/${goalMeta.year}/categories`);
}

export async function createMacroTask(formData: FormData) {
  const parsed = macroTaskSchema.safeParse({
    title: formData.get("title"),
    description: formData.get("description"),
  });
  if (!parsed.success) return { error: parsed.error.flatten().fieldErrors };

  const goalId = formData.get("goal_id")?.toString();
  const year = formData.get("year")?.toString();

  const { supabase } = await requireUser();
  const { error } = await supabase.from("macro_tasks").insert({
    ...parsed.data,
    goal_id: goalId!,
  });
  if (error) return { error: { form: error.message } };
  revalidatePath(`/year/${year}/goals/${goalId}`);
}

export async function createTask(formData: FormData) {
  const parsed = taskSchema.safeParse({
    title: formData.get("title"),
    notes: formData.get("notes"),
    status: formData.get("status") || "not_started",
    done_rating: formData.get("done_rating"),
    done_at: formData.get("done_at"),
  });
  if (!parsed.success) return { error: parsed.error.flatten().fieldErrors };

  const macroTaskId = formData.get("macro_task_id")?.toString();
  const goalId = formData.get("goal_id")?.toString();
  const unexpectedMacroId = formData.get("unexpected_macro_id")?.toString();
  const year = formData.get("year")?.toString();

  const { supabase } = await requireUser();
  const { error } = await supabase.from("tasks").insert({
    ...parsed.data,
    macro_task_id: macroTaskId || null,
    goal_id: goalId || null,
    unexpected_macro_id: unexpectedMacroId || null,
  });
  if (error) return { error: { form: error.message } };

  if (macroTaskId) {
    revalidatePath(`/year/${year}/goals/${goalId}`);
    revalidatePath(`/year/${year}/goals/${goalId}/macros/${macroTaskId}`);
  }
  if (unexpectedMacroId) {
    revalidatePath(`/year/${year}/unexpected`);
  }
}

export async function updateTaskStatus(formData: FormData) {
  const parsed = taskSchema.pick({ status: true, done_rating: true, done_at: true }).safeParse({
    status: formData.get("status"),
    done_rating: formData.get("done_rating"),
    done_at: formData.get("done_at"),
  });
  if (!parsed.success) return { error: parsed.error.flatten().fieldErrors };

  const taskId = formData.get("task_id")?.toString();
  const year = formData.get("year")?.toString();
  const goalId = formData.get("goal_id")?.toString();
  const macroId = formData.get("macro_task_id")?.toString();
  const unexpectedMacroId = formData.get("unexpected_macro_id")?.toString();

  const { supabase } = await requireUser();
  const { error } = await supabase
    .from("tasks")
    .update({
      status: parsed.data.status || "not_started",
      done_rating: parsed.data.done_rating || null,
      done_at: parsed.data.done_at || null,
    })
    .eq("id", taskId!);
  if (error) return { error: { form: error.message } };

  if (macroId && goalId) {
    revalidatePath(`/year/${year}/goals/${goalId}/macros/${macroId}`);
  }
  if (unexpectedMacroId) {
    revalidatePath(`/year/${year}/unexpected`);
  }
}

export async function renameUnexpected(formData: FormData) {
  const title = formData.get("title")?.toString() || "Unexpected";
  const unexpectedId = formData.get("unexpected_macro_id")?.toString();
  const year = formData.get("year")?.toString();
  const { supabase } = await requireUser();
  await supabase
    .from("unexpected_macros")
    .update({ title })
    .eq("id", unexpectedId!);
  revalidatePath(`/year/${year}/unexpected`);
}

export async function addFocusItem(formData: FormData) {
  const urgentValue = formData.get("urgent");
  const importantValue = formData.get("important");
  const parsed = focusItemSchema.safeParse({
    task_id: formData.get("task_id"),
    date: formData.get("date"),
    urgent: urgentValue === "on" || urgentValue === "true",
    important: importantValue === "on" || importantValue === "true",
  });
  if (!parsed.success) return { error: parsed.error.flatten().fieldErrors };

  const { supabase, user } = await requireUser();
  const { error } = await supabase.from("daily_focus_items").insert({
    ...parsed.data,
    user_id: user.id,
  });
  if (error) return { error: { form: error.message } };
  revalidatePath("/today");
}

export async function updateFocusOutcome(formData: FormData) {
  const parsed = focusOutcomeSchema.safeParse({
    outcome: formData.get("outcome"),
    moved_to_date: formData.get("moved_to_date"),
  });
  if (!parsed.success) return { error: parsed.error.flatten().fieldErrors };

  const focusId = formData.get("focus_id")?.toString();
  const { supabase } = await requireUser();
  await supabase
    .from("daily_focus_items")
    .update({
      outcome: parsed.data.outcome,
      moved_to_date: parsed.data.moved_to_date || null,
    })
    .eq("id", focusId!);
  revalidatePath("/today");
}

export async function toggleFocusFlags(formData: FormData) {
  const focusId = formData.get("focus_id")?.toString();
  const urgent = formData.get("urgent") === "true";
  const important = formData.get("important") === "true";
  const { supabase } = await requireUser();
  await supabase
    .from("daily_focus_items")
    .update({ urgent, important })
    .eq("id", focusId!);
  revalidatePath("/today");
}

export async function upsertDailyLog(formData: FormData) {
  const parsed = dailyLogSchema.safeParse({
    date: formData.get("date"),
    day_rating: formData.get("day_rating"),
    note: formData.get("note"),
  });
  if (!parsed.success) return { error: parsed.error.flatten().fieldErrors };

  const { supabase, user } = await requireUser();
  await supabase.from("daily_logs").upsert({
    ...parsed.data,
    user_id: user.id,
    day_rating: parsed.data.day_rating ? Number(parsed.data.day_rating) : null,
  });
  revalidatePath("/today");
}

export async function quickAddUnexpectedFocus(formData: FormData) {
  const parsedTask = taskSchema.pick({ title: true }).safeParse({
    title: formData.get("title"),
  });
  if (!parsedTask.success) return { error: parsedTask.error.flatten().fieldErrors };

  const unexpectedMacroId = formData.get("unexpected_macro_id")?.toString();
  const date = formData.get("date")?.toString();
  const { supabase, user } = await requireUser();

  const { data: task, error } = await supabase
    .from("tasks")
    .insert({
      title: parsedTask.data.title,
      unexpected_macro_id: unexpectedMacroId!,
    })
    .select()
    .single();
  if (error) return { error: { form: error.message } };

  await supabase.from("daily_focus_items").insert({
    user_id: user.id,
    task_id: task.id,
    date: date || new Date().toISOString().slice(0, 10),
    unexpected: true,
    outcome: "not_done",
  });
  revalidatePath("/today");
}

export async function upsertWeeklyReview(formData: FormData) {
  const parsed = reviewSchema.safeParse({
    rating: formData.get("rating"),
    comment: formData.get("comment"),
  });
  if (!parsed.success) return { error: parsed.error.flatten().fieldErrors };
  const week_start = formData.get("week_start")?.toString();

  const { supabase, user } = await requireUser();
  await supabase.from("weekly_reviews").upsert({
    week_start: week_start!,
    user_id: user.id,
    rating: parsed.data.rating ? Number(parsed.data.rating) : null,
    comment: parsed.data.comment || null,
  });
  revalidatePath("/reviews/weekly");
}

export async function upsertMonthlyReview(formData: FormData) {
  const parsed = reviewSchema.safeParse({
    rating: formData.get("rating"),
    comment: formData.get("comment"),
  });
  if (!parsed.success) return { error: parsed.error.flatten().fieldErrors };
  const month = formData.get("month")?.toString();

  const { supabase, user } = await requireUser();
  await supabase.from("monthly_reviews").upsert({
    month: month!,
    user_id: user.id,
    rating: parsed.data.rating ? Number(parsed.data.rating) : null,
    comment: parsed.data.comment || null,
  });
  revalidatePath("/reviews/monthly");
}
