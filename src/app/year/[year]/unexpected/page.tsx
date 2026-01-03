import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { loadYearPlanBundle } from "@/lib/data";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { createTask, renameUnexpected, updateTaskStatus } from "@/app/actions";
import { Badge } from "@/components/ui/badge";
import { progressFromTasks } from "@/lib/utils";
import { Progress } from "@/components/ui/progress";

type PageProps = { params: { year: string } };

export default async function UnexpectedPage({ params }: PageProps) {
  const { year } = params;
  const numericYear = Number(year);
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/auth");

  const bundle = await loadYearPlanBundle(numericYear, user.id);
  if (!bundle || !bundle.unexpectedMacro) {
    redirect("/");
  }

  const unexpected = bundle.unexpectedMacro;
  const tasks = bundle.unexpectedTasks;
  const progress = progressFromTasks(tasks);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-neutral-500">Year {bundle.plan.year}</p>
          <h1 className="text-2xl font-semibold">{unexpected.title}</h1>
          <p className="text-neutral-600">Capture unexpected work without tying to a goal.</p>
        </div>
        <Button asChild variant="outline">
          <a href={`/year/${bundle.plan.year}`}>Back to dashboard</a>
        </Button>
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
            <CardTitle>Rename bucket</CardTitle>
          </CardHeader>
          <CardContent>
            <form action={renameUnexpected} className="space-y-3">
              <input type="hidden" name="unexpected_macro_id" value={unexpected.id} />
              <input type="hidden" name="year" value={bundle.plan.year} />
              <div className="space-y-1">
                <Label>Title</Label>
                <Input name="title" defaultValue={unexpected.title} />
              </div>
              <Button type="submit" variant="outline">
                Save name
              </Button>
            </form>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Add unexpected task</CardTitle>
          </CardHeader>
          <CardContent>
            <form action={createTask} className="space-y-3">
              <input type="hidden" name="unexpected_macro_id" value={unexpected.id} />
              <input type="hidden" name="year" value={bundle.plan.year} />
              <div className="space-y-1">
                <Label>Title</Label>
                <Input name="title" placeholder="Unexpected task" required />
              </div>
              <div className="space-y-1">
                <Label>Notes</Label>
                <Textarea name="notes" placeholder="Details" />
              </div>
              <Button type="submit">Add task</Button>
            </form>
          </CardContent>
        </Card>
      </div>

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
              <input type="hidden" name="unexpected_macro_id" value={unexpected.id} />
              <input type="hidden" name="year" value={bundle.plan.year} />
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">{task.title}</p>
                  {task.notes && <p className="text-sm text-neutral-600">{task.notes}</p>}
                </div>
                <Badge variant="secondary">{task.status}</Badge>
              </div>
              <div className="grid grid-cols-3 gap-2">
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
                  <Label>Done rating</Label>
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
              </div>
              <Button type="submit" variant="outline" size="sm">
                Update
              </Button>
            </form>
          ))}
          {tasks.length === 0 && (
            <p className="text-sm text-neutral-500">No unexpected tasks yet.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
