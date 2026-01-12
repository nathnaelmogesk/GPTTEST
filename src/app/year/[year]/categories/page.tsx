import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { loadYearPlanBundle } from "@/lib/data";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { createGoal } from "@/app/actions";

type PageProps = { params: { year: string } };

export default async function CategoriesPage({ params }: PageProps) {
  const { year } = params;
  const numericYear = Number(year);

  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/auth");

  const bundle = await loadYearPlanBundle(numericYear, user.id);
  if (!bundle) {
    redirect("/");
  }

  const { categories, goals, plan } = bundle;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-neutral-500">Year {plan.year}</p>
          <h1 className="text-2xl font-semibold">Categories & goals</h1>
        </div>
        <Link href={`/year/${plan.year}`} className="text-blue-600">
          Back to dashboard
        </Link>
      </div>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {categories.map((category) => {
          const categoryGoals = goals.filter((g) => g.category_id === category.id);
          const canAdd = categoryGoals.length < 3;
          return (
            <Card key={category.id}>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>{category.name}</span>
                  <span className="text-sm font-normal text-neutral-500">
                    {categoryGoals.length} / 3 goals
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <ul className="space-y-2">
                  {categoryGoals.map((goal) => (
                    <li key={goal.id} className="flex items-center justify-between text-sm">
                      <Link
                        href={`/year/${plan.year}/goals/${goal.id}`}
                        className="text-blue-600"
                      >
                        {goal.title}
                      </Link>
                      <span className="text-neutral-500">
                        {new Date(goal.created_at).toLocaleDateString()}
                      </span>
                    </li>
                  ))}
                </ul>
                {canAdd ? (
                  <form action={createGoal} className="space-y-2 rounded-md border p-3">
                    <input type="hidden" name="year" value={plan.year} />
                    <input type="hidden" name="year_plan_id" value={plan.id} />
                    <input type="hidden" name="category_id" value={category.id} />
                    <div className="space-y-1">
                      <Label>Goal title</Label>
                      <Input name="title" placeholder="New goal" required />
                    </div>
                    <div className="space-y-1">
                      <Label>SMART specific</Label>
                      <Textarea name="smart_specific" placeholder="What exactly do you want?" />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-1">
                        <Label>Measurable</Label>
                        <Input name="smart_measurable" placeholder="How will you measure it?" />
                      </div>
                      <div className="space-y-1">
                        <Label>Achievable</Label>
                        <Input name="smart_achievable" placeholder="Is it realistic?" />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-1">
                        <Label>Relevant</Label>
                        <Input name="smart_relevant" placeholder="Why does it matter?" />
                      </div>
                      <div className="space-y-1">
                        <Label>Time-bound</Label>
                        <Input name="smart_timebound" placeholder="Timeline" />
                      </div>
                    </div>
                    <div className="space-y-1">
                      <Label>Why important</Label>
                      <Textarea name="why_important" placeholder="Motivation" />
                    </div>
                    <div className="space-y-1">
                      <Label>Result of achieving</Label>
                      <Textarea name="result_of_achieving" placeholder="What happens when done?" />
                    </div>
                    <Button type="submit" className="w-full">
                      Add goal
                    </Button>
                  </form>
                ) : (
                  <p className="text-sm text-orange-600">
                    Limit reached. Remove or edit existing goals to add more.
                  </p>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
