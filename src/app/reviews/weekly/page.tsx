import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { startOfWeek, endOfWeek, formatISO } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { upsertWeeklyReview } from "@/app/actions";

type PageProps = { searchParams?: { week?: string } };

export default async function WeeklyReviewPage({ searchParams }: PageProps) {
  const queryWeek = searchParams?.week;
  const selectedWeek = queryWeek || formatISO(startOfWeek(new Date(), { weekStartsOn: 1 }), {
    representation: "date",
  });
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/auth");

  const weekStart = startOfWeek(new Date(selectedWeek), { weekStartsOn: 1 });
  const weekEnd = endOfWeek(weekStart, { weekStartsOn: 1 });

  const startDate = formatISO(weekStart, { representation: "date" });
  const endDate = formatISO(weekEnd, { representation: "date" });

  const { data: tasksDone } = await supabase
    .from("tasks")
    .select("id")
    .eq("status", "done")
    .gte("done_at", startDate)
    .lte("done_at", endDate);

  const { data: movedFocus } = await supabase
    .from("daily_focus_items")
    .select("id")
    .eq("outcome", "moved")
    .gte("date", startDate)
    .lte("date", endDate)
    .eq("user_id", user.id);

  const { data: unexpectedFocus } = await supabase
    .from("daily_focus_items")
    .select("id")
    .eq("unexpected", true)
    .gte("date", startDate)
    .lte("date", endDate)
    .eq("user_id", user.id);

  const { data: review } = await supabase
    .from("weekly_reviews")
    .select("*")
    .eq("week_start", startDate)
    .eq("user_id", user.id)
    .maybeSingle();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-neutral-500">Weekly review</p>
          <h1 className="text-2xl font-semibold">{startDate}</h1>
        </div>
        <form action="/reviews/weekly" method="get" className="flex items-center gap-2">
          <Label>Week start</Label>
          <Input type="date" name="week" defaultValue={startDate} />
          <Button type="submit" variant="outline">
            Go
          </Button>
        </form>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Stats</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <Stat label="Tasks completed" value={tasksDone?.length || 0} />
          <Stat label="Focus items moved" value={movedFocus?.length || 0} />
          <Stat label="Unexpected focus items" value={unexpectedFocus?.length || 0} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Review</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={upsertWeeklyReview} className="grid grid-cols-1 gap-3 md:grid-cols-3">
            <input type="hidden" name="week_start" value={startDate} />
            <div className="space-y-1">
              <Label>Rating (1-5)</Label>
              <Input
                type="number"
                name="rating"
                min={1}
                max={5}
                defaultValue={review?.rating ?? ""}
              />
            </div>
            <div className="md:col-span-2 space-y-1">
              <Label>Comment</Label>
              <Textarea name="comment" defaultValue={review?.comment ?? ""} />
            </div>
            <Button type="submit" variant="outline">
              Save review
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-md border p-4">
      <p className="text-sm text-neutral-500">{label}</p>
      <p className="text-2xl font-semibold">{value}</p>
    </div>
  );
}
