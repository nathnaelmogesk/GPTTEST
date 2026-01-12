import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { loadYearPlanBundle } from "@/lib/data";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { progressFromTasks } from "@/lib/utils";
import { Button } from "@/components/ui/button";

type PageProps = {
  params: { year: string };
};

export default async function YearDashboard({ params }: PageProps) {
  const { year } = params;
  const numericYear = Number(year);
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/auth");

  const bundle = await loadYearPlanBundle(numericYear, user.id);
  if (!bundle) {
    notFound();
  }

  const { plan, categories, goals, macros, tasks, unexpectedTasks, unexpectedMacro } = bundle;

  const goalTaskMap = new Map<string, typeof tasks>();
  for (const goal of goals) {
    const macroIds = macros.filter((m) => m.goal_id === goal.id).map((m) => m.id);
    goalTaskMap.set(
      goal.id,
      tasks.filter((t) => t.macro_task_id && macroIds.includes(t.macro_task_id)),
    );
  }

  const categoryProgress = categories.map((cat) => {
    const goalIds = goals.filter((g) => g.category_id === cat.id).map((g) => g.id);
    const relevantTasks = tasks.filter((t) =>
      macros
        .filter((m) => goalIds.includes(m.goal_id))
        .map((m) => m.id)
        .includes(t.macro_task_id || ""),
    );
    const progress = progressFromTasks(relevantTasks);
    return { ...cat, progress };
  });

  const overall = progressFromTasks([...tasks, ...unexpectedTasks]);
  const unexpectedProgress = progressFromTasks(unexpectedTasks);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm text-neutral-500">Dashboard</p>
          <h1 className="text-2xl font-semibold">{plan.year}</h1>
          {plan.theme && <p className="text-neutral-600">Theme: {plan.theme}</p>}
        </div>
        <div className="flex gap-2">
          <Link href={`/year/${plan.year}/categories`}>
            <Button variant="outline">Manage categories & goals</Button>
          </Link>
          {unexpectedMacro && (
            <Link href={`/year/${plan.year}/unexpected`}>
              <Button variant="outline">Unexpected</Button>
            </Link>
          )}
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Year progress</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between text-sm text-neutral-600">
            <span>Overall</span>
            <span>{overall.percent}%</span>
          </div>
          <Progress value={overall.percent} />
          <div className="flex items-center justify-between text-sm text-neutral-600">
            <span>Unexpected</span>
            <span>{unexpectedProgress.percent}%</span>
          </div>
          <Progress value={unexpectedProgress.percent} />
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {categoryProgress.map((cat) => (
          <Card key={cat.id}>
            <CardHeader>
              <CardTitle>{cat.name}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm text-neutral-600">
                  <span>Progress</span>
                  <span>{cat.progress.percent}%</span>
                </div>
                <Progress value={cat.progress.percent} />
              </div>
              <div className="space-y-2">
                <p className="text-sm text-neutral-500">Goals</p>
                <ul className="space-y-2 text-sm">
                  {goals
                    .filter((g) => g.category_id === cat.id)
                    .map((goal) => {
                      const goalProgress = progressFromTasks(goalTaskMap.get(goal.id) || []);
                      return (
                        <li key={goal.id} className="flex items-center justify-between">
                          <Link
                            href={`/year/${plan.year}/goals/${goal.id}`}
                            className="text-blue-600"
                          >
                            {goal.title}
                          </Link>
                          <span className="text-neutral-500">{goalProgress.percent}%</span>
                        </li>
                      );
                    })}
                </ul>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
