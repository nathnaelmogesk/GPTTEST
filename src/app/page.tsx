import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { createYearPlan } from "./actions";
import { progressFromTasks } from "@/lib/utils";
import { Database } from "@/lib/types";

type PlanSummary = {
  plan: Database["public"]["Tables"]["year_plans"]["Row"];
  progressPercent: number;
};

async function getPlanSummaries(userId: string): Promise<PlanSummary[]> {
  const supabase = createClient();
  const { data: plans } = await supabase
    .from("year_plans")
    .select("*")
    .eq("user_id", userId)
    .order("year", { ascending: false });

  if (!plans) return [];

  const summaries: PlanSummary[] = [];
  for (const plan of plans) {
    const { data: goals } = await supabase
      .from("goals")
      .select("id")
      .eq("year_plan_id", plan.id);
    const goalIds = goals?.map((g) => g.id) || [];

    const { data: macros } =
      goalIds.length > 0
        ? await supabase.from("macro_tasks").select("id").in("goal_id", goalIds)
        : { data: [] };
    const macroIds = macros?.map((m) => m.id) || [];

    const { data: tasks } =
      macroIds.length > 0
        ? await supabase.from("tasks").select("*").in("macro_task_id", macroIds)
        : { data: [] };

    const { data: unexpected } = await supabase
      .from("unexpected_macros")
      .select("id")
      .eq("year_plan_id", plan.id)
      .maybeSingle();
    const { data: unexpectedTasks } =
      unexpected?.id
        ? await supabase
            .from("tasks")
            .select("*")
            .eq("unexpected_macro_id", unexpected.id)
        : { data: [] };

    const progress = progressFromTasks([...(tasks || []), ...(unexpectedTasks || [])]);
    summaries.push({ plan, progressPercent: progress.percent });
  }

  return summaries;
}

export default async function HomePage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect("/auth");
  }

  const plans = await getPlanSummaries(user.id);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-sm text-neutral-500">Welcome back</p>
          <h1 className="text-2xl font-semibold">Your Year Plans</h1>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {plans.map((item) => (
          <Card key={item.plan.id}>
            <CardHeader className="flex items-start justify-between">
              <div>
                <CardTitle>{item.plan.year}</CardTitle>
                {item.plan.theme && (
                  <p className="text-sm text-neutral-500">Theme: {item.plan.theme}</p>
                )}
              </div>
              <Link href={`/year/${item.plan.year}`} className="text-sm text-blue-600">
                Open
              </Link>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between text-sm text-neutral-600">
                <span>Overall progress</span>
                <span>{item.progressPercent}%</span>
              </div>
              <Progress value={item.progressPercent} />
            </CardContent>
          </Card>
        ))}
        <Card>
          <CardHeader>
            <CardTitle>Create a Year Plan</CardTitle>
            <p className="text-sm text-neutral-500">
              We will seed the default 8 categories and an Unexpected bucket.
            </p>
          </CardHeader>
          <CardContent>
            <form action={createYearPlan} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="year">Year</Label>
                <Input name="year" id="year" type="number" placeholder="2024" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="theme">Theme (optional)</Label>
                <Input
                  name="theme"
                  id="theme"
                  placeholder="Year of healthy habits"
                  maxLength={120}
                />
              </div>
              <Button type="submit" className="w-full">
                Create plan
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
