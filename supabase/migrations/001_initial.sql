-- Sehatin initial schema migration
-- Run this in Supabase SQL Editor (Project → SQL Editor → New query → paste → Run)
--
-- Strategy:
-- - All app tables linked to auth.users via user_id (uuid FK)
-- - Row-Level Security (RLS) enabled — each user only sees their own data
-- - Policies: SELECT, INSERT, UPDATE, DELETE all gated on auth.uid() = user_id

-- ============================================================
-- profiles — 1:1 with auth.users, stores all quiz answers
-- ============================================================
create table public.profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  name text,
  sex text check (sex in ('m', 'f')),
  age int,
  age_bracket text,
  weight_kg numeric(5,2),
  height_cm numeric(5,2),
  target_weight_kg numeric(5,2),
  body_fat_pct numeric(4,1),
  current_body_type text,
  target_body_type text,
  target_zones text[],
  weight_goal_magnitude text,
  goal text,
  main_motivation text,
  special_occasion text,
  target_event_date date,
  body_image_satisfaction text,
  activity text,
  uses_fitness_tracker boolean,
  sleep_duration text,
  water_consumption text,
  eat_locations text[],
  diet_method text,
  preferences jsonb default '{}'::jsonb,
  eating_psychology jsonb,
  emotional_triggers text[],
  trigger_awareness text,
  after_emotional_eating text,
  past_food_trauma text[],
  snack_time text,
  underlying_motivation text,
  readiness_level text,
  barriers text[],
  habit_anchor text,
  pace_preference text,
  life_events text[],
  medical_conditions text[],
  food_allergies text[],
  allergies_other text,
  budget_idr_per_day int,
  province_id text,
  equipment_available text[],
  active_modes text[],
  completed_at timestamptz,
  updated_at timestamptz default now(),
  created_at timestamptz default now()
);

alter table public.profiles enable row level security;

create policy "profiles_select_own"
  on public.profiles for select
  using (auth.uid() = user_id);

create policy "profiles_insert_own"
  on public.profiles for insert
  with check (auth.uid() = user_id);

create policy "profiles_update_own"
  on public.profiles for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "profiles_delete_own"
  on public.profiles for delete
  using (auth.uid() = user_id);

-- ============================================================
-- food_log — every meal logged by user
-- ============================================================
create table public.food_log (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  date date not null,
  meal_slot text not null check (meal_slot in ('sarapan', 'makan_siang', 'makan_malam', 'snack')),
  food_code text,
  food_name text not null,
  portion_g numeric(7,2) not null,
  kcal numeric(7,1) not null,
  protein_g numeric(6,1),
  fat_g numeric(6,1),
  carb_g numeric(6,1),
  source text not null check (source in ('search', 'plan', 'photo', 'manual')),
  notes text,
  created_at timestamptz default now()
);

create index food_log_user_date_idx on public.food_log(user_id, date);
create index food_log_user_created_idx on public.food_log(user_id, created_at desc);

alter table public.food_log enable row level security;

create policy "food_log_select_own"  on public.food_log for select using (auth.uid() = user_id);
create policy "food_log_insert_own"  on public.food_log for insert with check (auth.uid() = user_id);
create policy "food_log_update_own"  on public.food_log for update using (auth.uid() = user_id);
create policy "food_log_delete_own"  on public.food_log for delete using (auth.uid() = user_id);

-- ============================================================
-- weight_log — daily weight check-ins
-- ============================================================
create table public.weight_log (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  date date not null,
  weight_kg numeric(5,2) not null,
  notes text,
  created_at timestamptz default now(),
  unique (user_id, date)
);

create index weight_log_user_date_idx on public.weight_log(user_id, date desc);

alter table public.weight_log enable row level security;

create policy "weight_log_select_own"  on public.weight_log for select using (auth.uid() = user_id);
create policy "weight_log_insert_own"  on public.weight_log for insert with check (auth.uid() = user_id);
create policy "weight_log_update_own"  on public.weight_log for update using (auth.uid() = user_id);
create policy "weight_log_delete_own"  on public.weight_log for delete using (auth.uid() = user_id);

-- ============================================================
-- meal_plans — AI-generated meal plans (1 active plan per user)
-- ============================================================
create table public.meal_plans (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  start_date date not null,
  days int not null,
  diet_method text,
  budget_idr_per_day int,
  context_notes text,
  targets jsonb not null,
  plan jsonb not null,
  generated_at timestamptz default now(),
  is_active boolean default true
);

create index meal_plans_user_active_idx on public.meal_plans(user_id, is_active, generated_at desc);

alter table public.meal_plans enable row level security;

create policy "meal_plans_select_own"  on public.meal_plans for select using (auth.uid() = user_id);
create policy "meal_plans_insert_own"  on public.meal_plans for insert with check (auth.uid() = user_id);
create policy "meal_plans_update_own"  on public.meal_plans for update using (auth.uid() = user_id);
create policy "meal_plans_delete_own"  on public.meal_plans for delete using (auth.uid() = user_id);

-- ============================================================
-- workout_plans — AI-generated workout programs
-- ============================================================
create table public.workout_plans (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  start_date date not null,
  level text not null,
  goal text not null,
  split text not null,
  days_per_week int not null,
  session_minutes int not null,
  weeks int not null,
  context_notes text,
  injuries_or_limitations text[],
  program jsonb not null,
  generated_at timestamptz default now(),
  is_active boolean default true
);

create index workout_plans_user_active_idx on public.workout_plans(user_id, is_active, generated_at desc);

alter table public.workout_plans enable row level security;

create policy "workout_plans_select_own"  on public.workout_plans for select using (auth.uid() = user_id);
create policy "workout_plans_insert_own"  on public.workout_plans for insert with check (auth.uid() = user_id);
create policy "workout_plans_update_own"  on public.workout_plans for update using (auth.uid() = user_id);
create policy "workout_plans_delete_own"  on public.workout_plans for delete using (auth.uid() = user_id);

-- ============================================================
-- workout_logs — actual completed sessions
-- ============================================================
create table public.workout_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  date date not null,
  plan_id uuid references public.workout_plans(id) on delete set null,
  week_idx int,
  session_idx int,
  day_label text,
  focus text,
  exercises jsonb not null,
  duration_min int,
  notes text,
  created_at timestamptz default now()
);

create index workout_logs_user_date_idx on public.workout_logs(user_id, date desc);
create index workout_logs_plan_idx on public.workout_logs(plan_id);

alter table public.workout_logs enable row level security;

create policy "workout_logs_select_own"  on public.workout_logs for select using (auth.uid() = user_id);
create policy "workout_logs_insert_own"  on public.workout_logs for insert with check (auth.uid() = user_id);
create policy "workout_logs_update_own"  on public.workout_logs for update using (auth.uid() = user_id);
create policy "workout_logs_delete_own"  on public.workout_logs for delete using (auth.uid() = user_id);

-- ============================================================
-- Trigger: auto-create profile row when user signs up
-- ============================================================
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (user_id)
  values (new.id)
  on conflict (user_id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ============================================================
-- Trigger: auto-update profiles.updated_at on changes
-- ============================================================
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();
