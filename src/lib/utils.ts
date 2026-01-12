import { Task } from "./types";

export function progressFromTasks(tasks: Task[]) {
  const total = tasks.length;
  const done = tasks.filter((t) => t.status === "done").length;
  return { done, total, percent: total === 0 ? 0 : Math.round((done / total) * 100) };
}

export function formatPercent(percent: number) {
  return `${percent}%`;
}

export function formatDate(date: string | null | undefined) {
  if (!date) return "";
  return new Date(date).toLocaleDateString();
}

export const DEFAULT_CATEGORIES = [
  "Physical",
  "Mental",
  "Lifestyle",
  "Spiritual",
  "Family",
  "Relationship",
  "Business",
  "Financial",
];
