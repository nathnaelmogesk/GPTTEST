import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import {
  addFocusItem,
  quickAddUnexpectedFocus,
  toggleFocusFlags,
  updateFocusOutcome,
  upsertDailyLog,
} from "../actions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils";
import { DailyFocusItem } from "@/lib/types";

type PageProps = {
  searchParams?: { q?: string };
};

export default async function TodayPage({ searchParams }: PageProps) {
  const searchTerm = (searchParams?.q || "").toLowerCase();
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/auth");

  const today = new Date().toISOString().slice(0, 10);

  const { data: plans } = await supabase
    .from("year_plans")
    .select("*")
    .eq("user_id", user.id)
    .order("year", { ascending: false });
  const planIds = plans?.map((p) => p.id) || [];

  const { data: goals } =
    planIds.length > 0
      ? await supabase.from("goals").select("*").in("year_plan_id", planIds)
      : { data: [] };
  const goalIds = goals?.map((g) => g.id) || [];

  const { data: macros } =
    goalIds.length > 0
      ? await supabase.from("macro_tasks").select("*").in("goal_id", goalIds)
      : { data: [] };
  const macroIds = macros?.map((m) => m.id) || [];

  const { data: unexpectedMacros } =
    planIds.length > 0
      ? await supabase.from("unexpected_macros").select("*").in("year_plan_id", planIds)
      : { data: [] };
  const unexpectedIds = unexpectedMacros?.map((u) => u.id) || [];

  const { data: macroTasks } =
    macroIds.length > 0
      ? await supabase.from("tasks").select("*").in("macro_task_id", macroIds)
      : { data: [] };
  const { data: unexpectedTasks } =
    unexpectedIds.length > 0
      ? await supabase.from("tasks").select("*").in("unexpected_macro_id", unexpectedIds)
      : { data: [] };

  const allTasks = [...(macroTasks || []), ...(unexpectedTasks || [])];
  const taskOptions = allTasks
    .map((task) => {
      const macro = macros?.find((m) => m.id === task.macro_task_id);
      const goal = goals?.find((g) => g.id === macro?.goal_id);
      const plan = plans?.find((p) => p.id === goal?.year_plan_id);
      const unexpected = unexpectedMacros?.find((u) => u.id === task.unexpected_macro_id);
      const unexpectedPlan = plans?.find((p) => p.id === unexpected?.year_plan_id);
      const sourceYear = plan?.year || unexpectedPlan?.year || "";
      return {
        task,
        label: `${task.title} ${goal ? `• ${goal.title}` : ""} ${
          macro ? `• ${macro.title}` : ""
        }`.trim(),
        year: sourceYear,
        unexpected: Boolean(unexpected),
      };
    })
    .filter((item) => item.label.toLowerCase().includes(searchTerm));

  const { data: focusItems } = await supabase
    .from("daily_focus_items")
    .select("*, tasks(*)")
    .eq("user_id", user.id)
    .eq("date", today)
    .order("created_at", { ascending: true });

  const focusWithTasks =
    (focusItems || []) as Array<DailyFocusItem & { tasks: { title: string } | null }>;

  const { data: dailyLog } = await supabase
    .from("daily_logs")
    .select("*")
    .eq("user_id", user.id)
    .eq("date", today)
    .maybeSingle();

  const defaultUnexpected = unexpectedMacros?.[0];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-neutral-500">Daily focus</p>
          <h1 className="text-2xl font-semibold">{today}</h1>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Search tasks to focus</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <form className="flex flex-col gap-2 md:flex-row" action="/today" method="get">
            <Input
              name="q"
              placeholder="Search tasks"
              defaultValue={searchTerm}
              className="md:w-64"
            />
            <Button type="submit" variant="outline">
              Search
            </Button>
          </form>
          <div className="space-y-2">
            {taskOptions.slice(0, 10).map((option) => (
              <form
                key={option.task.id}
                action={addFocusItem}
                className="flex flex-wrap items-center justify-between gap-2 rounded-md border p-3"
              >
                <input type="hidden" name="task_id" value={option.task.id} />
                <input type="hidden" name="date" value={today} />
                <input type="hidden" name="urgent" value="false" />
                <input type="hidden" name="important" value="false" />
                <div>
                  <p className="font-medium">{option.label}</p>
                  <p className="text-xs text-neutral-500">
                    {option.unexpected ? "Unexpected" : "Planned"} • Year {option.year}
                  </p>
                </div>
                <Button type="submit" size="sm" variant="outline">
                  Add to today
                </Button>
              </form>
            ))}
            {taskOptions.length === 0 && (
              <p className="text-sm text-neutral-500">No tasks matched your search.</p>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Quick add unexpected task</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={quickAddUnexpectedFocus} className="space-y-3">
            <input type="hidden" name="date" value={today} />
            <input type="hidden" name="unexpected_macro_id" value={defaultUnexpected?.id || ""} />
            <div className="space-y-1">
              <Label>Task title</Label>
              <Input
                name="title"
                placeholder="Add a quick unexpected task"
                required
                disabled={!defaultUnexpected}
              />
            </div>
            <Button type="submit" disabled={!defaultUnexpected}>
              Add & attach to focus
            </Button>
            {!defaultUnexpected && (
              <p className="text-sm text-orange-600">
                Create a year plan first to get an Unexpected bucket.
              </p>
            )}
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Today&apos;s focus</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {focusWithTasks.map((item) => (
            <div key={item.id} className="space-y-2 rounded-md border p-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">{item.tasks?.title}</p>
                  <p className="text-xs text-neutral-500">
                    Outcome: {item.outcome}
                    {item.moved_to_date && ` → ${item.moved_to_date}`}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {item.urgent && <Badge variant="secondary">Urgent</Badge>}
                  {item.important && <Badge variant="secondary">Important</Badge>}
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                <form action={toggleFocusFlags}>
                  <input type="hidden" name="focus_id" value={item.id} />
                  <input type="hidden" name="urgent" value={String(!item.urgent)} />
                  <input type="hidden" name="important" value={String(item.important)} />
                  <Button type="submit" variant="outline" size="sm">
                    Toggle urgent
                  </Button>
                </form>
                <form action={toggleFocusFlags}>
                  <input type="hidden" name="focus_id" value={item.id} />
                  <input type="hidden" name="urgent" value={String(item.urgent)} />
                  <input type="hidden" name="important" value={String(!item.important)} />
                  <Button type="submit" variant="outline" size="sm">
                    Toggle important
                  </Button>
                </form>
                <form action={updateFocusOutcome} className="flex flex-wrap items-center gap-2">
                  <input type="hidden" name="focus_id" value={item.id} />
                  <Label className="text-xs">Outcome</Label>
                  <select
                    name="outcome"
                    defaultValue={item.outcome}
                    className="h-9 rounded-md border border-neutral-300 px-2 text-sm"
                  >
                    <option value="not_done">Not done</option>
                    <option value="done">Done</option>
                    <option value="moved">Moved</option>
                  </select>
                  <Input
                    name="moved_to_date"
                    type="date"
                    defaultValue={item.moved_to_date ?? ""}
                    className="h-9"
                  />
                  <Button type="submit" size="sm" variant="outline">
                    Save
                  </Button>
                </form>
              </div>
            </div>
          ))}
          {focusWithTasks.length === 0 && (
            <p className="text-sm text-neutral-500">No focus items yet.</p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Daily log</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={upsertDailyLog} className="grid grid-cols-1 gap-3 md:grid-cols-3">
            <input type="hidden" name="date" value={today} />
            <div className="space-y-1">
              <Label>Rating (1-5)</Label>
              <Input
                name="day_rating"
                type="number"
                min={1}
                max={5}
                defaultValue={dailyLog?.day_rating ?? ""}
              />
            </div>
            <div className="md:col-span-2">
              <Label>Note</Label>
              <Input name="note" defaultValue={dailyLog?.note ?? ""} />
            </div>
            <Button type="submit" variant="outline">
              Save daily log
            </Button>
          </form>
          {dailyLog && (
            <p className="mt-2 text-sm text-neutral-500">
              Last saved on {formatDate(dailyLog.created_at)}
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
