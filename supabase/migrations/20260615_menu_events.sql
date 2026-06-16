create table if not exists public.menu_events (
  id uuid primary key default gen_random_uuid(),
  event_type text not null check (event_type in ('page_view', 'dish_feedback')),
  event_date date not null default current_date,
  session_id text not null,
  meal text,
  work_area text,
  floor text,
  station text,
  dish_name text,
  vote text check (vote in ('up', 'down') or vote is null),
  payload jsonb not null default '{}'::jsonb,
  user_agent text,
  created_at timestamptz not null default now()
);

alter table public.menu_events enable row level security;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'menu_events'
      and policyname = 'menu_events_insert_from_edge'
  ) then
    create policy menu_events_insert_from_edge
      on public.menu_events
      for insert
      to anon, authenticated
      with check (true);
  end if;
end
$$;

create index if not exists menu_events_type_created_idx
  on public.menu_events (event_type, created_at desc);

create index if not exists menu_events_feedback_idx
  on public.menu_events (dish_name, vote, created_at desc)
  where event_type = 'dish_feedback';

create index if not exists menu_events_meal_area_idx
  on public.menu_events (meal, work_area, floor, created_at desc);
