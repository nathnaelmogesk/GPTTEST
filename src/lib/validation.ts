import { z } from "zod";

export const authSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export const yearPlanSchema = z.object({
  year: z.coerce.number().int().min(2000).max(2100),
  theme: z.string().max(120).optional().or(z.literal("")),
});

export const goalSchema = z.object({
  title: z.string().min(2).max(120),
  smart_specific: z.string().max(500).optional().or(z.literal("")),
  smart_measurable: z.string().max(500).optional().or(z.literal("")),
  smart_achievable: z.string().max(500).optional().or(z.literal("")),
  smart_relevant: z.string().max(500).optional().or(z.literal("")),
  smart_timebound: z.string().max(500).optional().or(z.literal("")),
  why_important: z.string().max(500).optional().or(z.literal("")),
  result_of_achieving: z.string().max(500).optional().or(z.literal("")),
});

export const macroTaskSchema = z.object({
  title: z.string().min(2).max(160),
  description: z.string().max(500).optional().or(z.literal("")),
});

export const taskSchema = z.object({
  title: z.string().min(2).max(160),
  notes: z.string().max(500).optional().or(z.literal("")),
  status: z
    .enum(["not_started", "in_progress", "done", "dropped"])
    .optional()
    .default("not_started"),
  done_rating: z.coerce.number().int().min(1).max(5).optional().or(z.literal("")),
  done_at: z.string().optional().or(z.literal("")),
});

export const focusItemSchema = z.object({
  task_id: z.string().uuid(),
  date: z.string(),
  urgent: z.coerce.boolean().optional(),
  important: z.coerce.boolean().optional(),
});

export const focusOutcomeSchema = z.object({
  outcome: z.enum(["done", "not_done", "moved"]),
  moved_to_date: z.string().optional().or(z.literal("")),
});

export const reviewSchema = z.object({
  rating: z.coerce.number().min(1).max(5).optional().or(z.literal("")),
  comment: z.string().max(500).optional().or(z.literal("")),
});

export const dailyLogSchema = z.object({
  date: z.string(),
  day_rating: z.coerce.number().min(1).max(5).optional().or(z.literal("")),
  note: z.string().max(500).optional().or(z.literal("")),
});
