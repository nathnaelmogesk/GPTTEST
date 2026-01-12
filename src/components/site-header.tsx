import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Button } from "./ui/button";
import { signOut } from "@/app/actions";

export async function SiteHeader() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <header className="border-b bg-white">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <Link href="/" className="text-lg font-semibold">
          Year Planner
        </Link>
        <div className="flex items-center gap-3 text-sm">
          <Link href="/today" className="text-neutral-600 hover:text-black">
            Today
          </Link>
          <Link href="/reviews/weekly" className="text-neutral-600 hover:text-black">
            Weekly Review
          </Link>
          <Link href="/reviews/monthly" className="text-neutral-600 hover:text-black">
            Monthly Review
          </Link>
          {user ? (
            <form action={signOut}>
              <Button type="submit" variant="outline" size="sm">
                Sign out
              </Button>
            </form>
          ) : (
            <Link href="/auth" className="text-neutral-600 hover:text-black">
              Sign in
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
