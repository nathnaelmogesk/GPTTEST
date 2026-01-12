import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { loadYearPlanBundle } from "@/lib/data";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { createMacroTask } from "@/app/actions";
import { progressFromTasks } from "@/lib/utils";

type PageProps = { params: { year: string; goalId: string } };

export default async function GoalDetail({ params }: PageProps) {
  const { year, goalId } = params;
  const numericYear = Number(year);

  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/auth");

  const bundle = await loadYearPlanBundle(numericYear, user.id);
  if (!bundle) notFound();

  const goal = bundle.goals.find((g) => g.id === goalId);
  if (!goal) notFound();

  const macros = bundle.macros.filter((m) => m.goal_id === goal.id);
  const tasks = bundle.tasks.filter((t) =>
    macros.map((m) => m.id).includes(t.macro_task_id || ""),
  );
  const goalProgress = progressFromTasks(tasks);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-neutral-500">Year {bundle.plan.year}</p>
          <h1 className="text-2xl font-semibold">{goal.title}</h1>
          <p className="text-sm text-neutral-600">
            Category:{" "}
            {bundle.categories.find((c) => c.id === goal.category_id)?.name || "Unknown"}
          </p>
        </div>
        <Link href={`/year/${bundle.plan.year}/categories`} className="text-blue-600">
          Back to categories
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Progress</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="flex items-center justify-between text-sm text-neutral-600">
            <span>Done tasks</span>
            <span>{goalProgress.percent}%</span>
          </div>
          <Progress value={goalProgress.percent} />
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>SMART details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-neutral-700">
            <Detail label="Specific" value={goal.smart_specific} />
            <Detail label="Measurable" value={goal.smart_measurable} />
            <Detail label="Achievable" value={goal.smart_achievable} />
            <Detail label="Relevant" value={goal.smart_relevant} />
            <Detail label="Time-bound" value={goal.smart_timebound} />
            <Detail label="Why important" value={goal.why_important} />
            <Detail label="Result of achieving" value={goal.result_of_achieving} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Add macro task</CardTitle>
          </CardHeader>
          <CardContent>
            <form action={createMacroTask} className="space-y-3">
              <input type="hidden" name="goal_id" value={goal.id} />
              <input type="hidden" name="year" value={bundle.plan.year} />
              <div className="space-y-1">
                <Label>Title</Label>
                <Input name="title" placeholder="Macro task title" required />
              </div>
              <div className="space-y-1">
                <Label>Description</Label>
                <Textarea name="description" placeholder="Optional details" />
              </div>
              <Button type="submit">Add macro task</Button>
            </form>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {macros.map((macro) => {
          const macroTasks = bundle.tasks.filter((t) => t.macro_task_id === macro.id);
          const macroProgress = progressFromTasks(macroTasks);
          return (
            <Card key={macro.id}>
              <CardHeader className="flex items-center justify-between">
                <CardTitle>{macro.title}</CardTitle>
                <Link
                  href={`/year/${bundle.plan.year}/goals/${goal.id}/macros/${macro.id}`}
                  className="text-sm text-blue-600"
                >
                  Open
                </Link>
              </CardHeader>
              <CardContent className="space-y-2">
                {macro.description && (
                  <p className="text-sm text-neutral-600">{macro.description}</p>
                )}
                <div className="flex items-center justify-between text-sm text-neutral-600">
                  <span>Progress</span>
                  <span>{macroProgress.percent}%</span>
                </div>
                <Progress value={macroProgress.percent} />
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

function Detail({ label, value }: { label: string; value: string | null }) {
  return (
    <div>
      <p className="text-xs uppercase text-neutral-400">{label}</p>
      <p className="text-neutral-700">{value || "Not set"}</p>
    </div>
  );
}
