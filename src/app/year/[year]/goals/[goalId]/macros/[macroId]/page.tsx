import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { loadYearPlanBundle } from "@/lib/data";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { createTask, updateTaskStatus } from "@/app/actions";
import { progressFromTasks, formatDate } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

type PageProps = {
  params: { year: string; goalId: string; macroId: string };
};

export default async function MacroDetail({ params }: PageProps) {
  const { year, goalId, macroId } = params;
  const numericYear = Number(year);
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/auth");

  const bundle = await loadYearPlanBundle(numericYear, user.id);
  if (!bundle) notFound();

  const macro = bundle.macros.find((m) => m.id === macroId);
  if (!macro) notFound();

  const tasks = bundle.tasks.filter((t) => t.macro_task_id === macro.id);
  const progress = progressFromTasks(tasks);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-neutral-500">
            Goal{" "}
            <Link href={`/year/${year}/goals/${goalId}`} className="text-blue-600">
              Back to goal
            </Link>
          </p>
          <h1 className="text-2xl font-semibold">{macro.title}</h1>
          {macro.description && <p className="text-neutral-600">{macro.description}</p>}
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Progress</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="flex items-center justify-between text-sm text-neutral-600">
            <span>Completed</span>
            <span>{progress.percent}%</span>
          </div>
          <Progress value={progress.percent} />
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Add task</CardTitle>
          </CardHeader>
          <CardContent>
            <form action={createTask} className="space-y-3">
              <input type="hidden" name="macro_task_id" value={macro.id} />
              <input type="hidden" name="goal_id" value={goalId} />
              <input type="hidden" name="year" value={year} />
              <div className="space-y-1">
                <Label>Title</Label>
                <Input name="title" placeholder="Task title" required />
              </div>
              <div className="space-y-1">
                <Label>Notes</Label>
                <Textarea name="notes" placeholder="Optional notes" />
              </div>
              <Button type="submit">Add task</Button>
            </form>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Tasks</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {tasks.map((task) => (
              <form
                key={task.id}
                action={updateTaskStatus}
                className="space-y-2 rounded-md border p-3"
              >
                <input type="hidden" name="task_id" value={task.id} />
                <input type="hidden" name="goal_id" value={goalId} />
                <input type="hidden" name="macro_task_id" value={macro.id} />
                <input type="hidden" name="year" value={year} />
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">{task.title}</p>
                    {task.notes && <p className="text-sm text-neutral-600">{task.notes}</p>}
                  </div>
                  <Badge variant="secondary">{task.status}</Badge>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <Label>Status</Label>
                    <select
                      name="status"
                      defaultValue={task.status}
                      className="h-10 w-full rounded-md border border-neutral-300 bg-white px-3 text-sm"
                    >
                      <option value="not_started">Not started</option>
                      <option value="in_progress">In progress</option>
                      <option value="done">Done</option>
                      <option value="dropped">Dropped</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <Label>Done rating (1-5)</Label>
                    <Input
                      name="done_rating"
                      type="number"
                      min={1}
                      max={5}
                      defaultValue={task.done_rating ?? ""}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label>Done at</Label>
                    <Input
                      name="done_at"
                      type="date"
                      defaultValue={task.done_at ? task.done_at.slice(0, 10) : ""}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label>Created</Label>
                    <Input value={formatDate(task.created_at)} disabled />
                  </div>
                </div>
                <Button type="submit" variant="outline" size="sm">
                  Save
                </Button>
              </form>
            ))}
            {tasks.length === 0 && (
              <p className="text-sm text-neutral-500">No tasks yet. Add your first one.</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
