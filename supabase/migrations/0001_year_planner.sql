-- Year Planner schema and RLS
create extension if not exists "uuid-ossp";

create table if not exists year_plans (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  year int not null,
  theme text null,
  created_at timestamptz not null default now(),
  unique (user_id, year)
);

create table if not exists categories (
  id uuid primary key default uuid_generate_v4(),
  year_plan_id uuid not null references year_plans(id) on delete cascade,
  name text not null,
  sort_order int not null default 0
);

create table if not exists goals (
  id uuid primary key default uuid_generate_v4(),
  year_plan_id uuid not null references year_plans(id) on delete cascade,
  category_id uuid not null references categories(id) on delete cascade,
  title text not null,
  smart_specific text null,
  smart_measurable text null,
  smart_achievable text null,
  smart_relevant text null,
  smart_timebound text null,
  why_important text null,
  result_of_achieving text null,
  created_at timestamptz not null default now()
);

create table if not exists macro_tasks (
  id uuid primary key default uuid_generate_v4(),
  goal_id uuid not null references goals(id) on delete cascade,
  title text not null,
  description text null,
  created_at timestamptz not null default now()
);

create table if not exists unexpected_macros (
  id uuid primary key default uuid_generate_v4(),
  year_plan_id uuid not null references year_plans(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null default 'Unexpected',
  created_at timestamptz not null default now()
);

create table if not exists tasks (
  id uuid primary key default uuid_generate_v4(),
  title text not null,
  notes text null,
  status text not null default 'not_started' check (status in ('not_started','in_progress','done','dropped')),
  done_at timestamptz null,
  done_rating int null check (done_rating between 1 and 5),
  macro_task_id uuid null references macro_tasks(id) on delete cascade,
  goal_id uuid null references goals(id) on delete cascade,
  unexpected_macro_id uuid null references unexpected_macros(id) on delete cascade,
  created_at timestamptz not null default now(),
  check (
    (macro_task_id is not null and goal_id is not null and unexpected_macro_id is null)
    or (macro_task_id is null and goal_id is null and unexpected_macro_id is not null)
  )
);

create table if not exists daily_logs (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  date date not null,
  day_rating int null check (day_rating between 1 and 5),
  note text null,
  created_at timestamptz not null default now(),
  unique (user_id, date)
);

create table if not exists daily_focus_items (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  date date not null,
  task_id uuid not null references tasks(id) on delete cascade,
  urgent boolean not null default false,
  important boolean not null default false,
  outcome text not null default 'not_done' check (outcome in ('done','not_done','moved')),
  moved_to_date date null,
  unexpected boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists weekly_reviews (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  week_start date not null,
  rating int null check (rating between 1 and 5),
  comment text null,
  unique (user_id, week_start)
);

create table if not exists monthly_reviews (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  month date not null,
  rating int null check (rating between 1 and 5),
  comment text null,
  unique (user_id, month)
);

-- Limit 3 goals per category
create or replace function limit_goals_per_category()
returns trigger as $$
declare
  goal_count int;
begin
  select count(*) into goal_count from goals where category_id = new.category_id;
  if goal_count >= 3 then
    raise exception 'Each category can only have 3 goals';
  end if;
  return new;
end;
$$ language plpgsql;

drop trigger if exists check_goal_limit on goals;
create trigger check_goal_limit before insert on goals
for each row execute function limit_goals_per_category();

-- RLS
alter table year_plans enable row level security;
alter table categories enable row level security;
alter table goals enable row level security;
alter table macro_tasks enable row level security;
alter table unexpected_macros enable row level security;
alter table tasks enable row level security;
alter table daily_logs enable row level security;
alter table daily_focus_items enable row level security;
alter table weekly_reviews enable row level security;
alter table monthly_reviews enable row level security;

create policy "Users access their year plans" on year_plans
  for all using (user_id = auth.uid());

create policy "Users access categories through plan" on categories
  for all using (
    exists (
      select 1 from year_plans yp
      where yp.id = categories.year_plan_id and yp.user_id = auth.uid()
    )
  );

create policy "Users access goals through plan" on goals
  for all using (
    exists (
      select 1 from year_plans yp
      where yp.id = goals.year_plan_id and yp.user_id = auth.uid()
    )
  );

create policy "Users access macro tasks through goals" on macro_tasks
  for all using (
    exists (
      select 1 from goals g
      join year_plans yp on yp.id = g.year_plan_id
      where g.id = macro_tasks.goal_id and yp.user_id = auth.uid()
    )
  );

create policy "Users access unexpected macros through plan" on unexpected_macros
  for all using (
    user_id = auth.uid()
  );

create policy "Users access tasks through ownership" on tasks
  for all using (
    (macro_task_id is not null and exists (
      select 1 from macro_tasks m
      join goals g on g.id = m.goal_id
      join year_plans yp on yp.id = g.year_plan_id
      where m.id = tasks.macro_task_id and yp.user_id = auth.uid()
    )) or
    (unexpected_macro_id is not null and exists (
      select 1 from unexpected_macros um
      where um.id = tasks.unexpected_macro_id and um.user_id = auth.uid()
    ))
  );

create policy "Users access their daily logs" on daily_logs
  for all using (user_id = auth.uid());

create policy "Users access their focus items" on daily_focus_items
  for all using (user_id = auth.uid());

create policy "Users access their weekly reviews" on weekly_reviews
  for all using (user_id = auth.uid());

create policy "Users access their monthly reviews" on monthly_reviews
  for all using (user_id = auth.uid());

-- Helpful indexes
create index if not exists idx_goals_category on goals(category_id);
create index if not exists idx_macro_tasks_goal on macro_tasks(goal_id);
create index if not exists idx_tasks_macro on tasks(macro_task_id);
create index if not exists idx_tasks_unexpected on tasks(unexpected_macro_id);
create index if not exists idx_focus_items_date on daily_focus_items(date);
create index if not exists idx_daily_logs_date on daily_logs(date);
