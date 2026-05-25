create extension if not exists pgcrypto;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc'::text, now());
  return new;
end;
$$;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text unique,
  display_name text,
  avatar_url text,
  created_at timestamptz not null default timezone('utc'::text, now()),
  updated_at timestamptz not null default timezone('utc'::text, now())
);

create table if not exists public.pets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  breed text,
  personality text,
  favorite_food text,
  daily_habits text,
  image_url text,
  voice_id text,
  system_prompt text,
  created_at timestamptz not null default timezone('utc'::text, now()),
  updated_at timestamptz not null default timezone('utc'::text, now())
);

alter table public.profiles add column if not exists default_pet_id uuid;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'profiles_default_pet_id_fkey'
  ) then
    alter table public.profiles
      add constraint profiles_default_pet_id_fkey
      foreign key (default_pet_id) references public.pets(id) on delete set null;
  end if;
end
$$;

create table if not exists public.conversations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  pet_id uuid references public.pets(id) on delete cascade,
  role text not null check (role in ('user', 'assistant', 'system')),
  content text not null,
  emotion_tag text,
  created_at timestamptz not null default timezone('utc'::text, now())
);

create table if not exists public.memories (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  pet_id uuid references public.pets(id) on delete cascade,
  type text not null check (type in ('profile', 'fact', 'emotion', 'preference')),
  content text not null,
  importance integer not null default 1 check (importance between 1 and 5),
  last_used_at timestamptz,
  created_at timestamptz not null default timezone('utc'::text, now()),
  updated_at timestamptz not null default timezone('utc'::text, now())
);

create table if not exists public.memory_summaries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  pet_id uuid not null references public.pets(id) on delete cascade,
  summary text not null default '',
  memory_count integer not null default 0,
  window_days integer not null default 30,
  created_at timestamptz not null default timezone('utc'::text, now()),
  updated_at timestamptz not null default timezone('utc'::text, now()),
  unique (user_id, pet_id)
);

create table if not exists public.usage_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  usage_date date not null,
  message_count integer not null default 0,
  created_at timestamptz not null default timezone('utc'::text, now()),
  updated_at timestamptz not null default timezone('utc'::text, now()),
  unique (user_id, usage_date)
);

create table if not exists public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  plan text not null default 'free' check (plan in ('free', 'vip')),
  status text not null default 'inactive',
  stripe_customer_id text unique,
  stripe_subscription_id text unique,
  stripe_price_id text,
  current_period_start timestamptz,
  current_period_end timestamptz,
  cancel_at_period_end boolean not null default false,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc'::text, now()),
  updated_at timestamptz not null default timezone('utc'::text, now())
);

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'pet-images',
  'pet-images',
  true,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update
set public = excluded.public,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

create or replace function public.consume_free_chat_quota(p_user_id uuid, p_limit integer default 10)
returns table(allowed boolean, used integer, remaining integer, limit_count integer)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_today date := timezone('utc'::text, now())::date;
  v_current integer := 0;
  v_new_count integer := 0;
begin
  insert into public.usage_logs (user_id, usage_date, message_count)
  values (p_user_id, v_today, 0)
  on conflict (user_id, usage_date) do nothing;

  select message_count into v_current
  from public.usage_logs
  where user_id = p_user_id and usage_date = v_today
  limit 1;

  if v_current >= p_limit then
    allowed := false;
    used := v_current;
    remaining := 0;
    limit_count := p_limit;
    return next;
    return;
  end if;

  update public.usage_logs
  set message_count = message_count + 1,
      updated_at = timezone('utc'::text, now())
  where user_id = p_user_id and usage_date = v_today
  returning message_count into v_new_count;

  allowed := true;
  used := v_new_count;
  remaining := greatest(p_limit - v_new_count, 0);
  limit_count := p_limit;
  return next;
end;
$$;

create index if not exists idx_profiles_default_pet_id on public.profiles(default_pet_id);
create index if not exists idx_pets_user_id on public.pets(user_id);
create index if not exists idx_conversations_user_id_created_at on public.conversations(user_id, created_at desc);
create index if not exists idx_memories_user_id_created_at on public.memories(user_id, created_at desc);
create index if not exists idx_memories_pet_id on public.memories(pet_id);
create index if not exists idx_memory_summaries_user_pet on public.memory_summaries(user_id, pet_id);
create index if not exists idx_usage_logs_user_id_usage_date on public.usage_logs(user_id, usage_date desc);
create index if not exists idx_subscriptions_user_id on public.subscriptions(user_id);
create index if not exists idx_subscriptions_customer_id on public.subscriptions(stripe_customer_id);
create index if not exists idx_subscriptions_subscription_id on public.subscriptions(stripe_subscription_id);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, display_name)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'display_name', split_part(new.email, '@', 1))
  )
  on conflict (id) do update
  set email = excluded.email,
      display_name = coalesce(excluded.display_name, public.profiles.display_name),
      updated_at = timezone('utc'::text, now());

  insert into public.subscriptions (user_id, plan, status)
  values (new.id, 'free', 'inactive')
  on conflict do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

drop trigger if exists set_profiles_updated_at on public.profiles;
create trigger set_profiles_updated_at before update on public.profiles
for each row execute procedure public.set_updated_at();

drop trigger if exists set_pets_updated_at on public.pets;
create trigger set_pets_updated_at before update on public.pets
for each row execute procedure public.set_updated_at();

drop trigger if exists set_memories_updated_at on public.memories;
create trigger set_memories_updated_at before update on public.memories
for each row execute procedure public.set_updated_at();

drop trigger if exists set_memory_summaries_updated_at on public.memory_summaries;
create trigger set_memory_summaries_updated_at before update on public.memory_summaries
for each row execute procedure public.set_updated_at();

drop trigger if exists set_usage_logs_updated_at on public.usage_logs;
create trigger set_usage_logs_updated_at before update on public.usage_logs
for each row execute procedure public.set_updated_at();

drop trigger if exists set_subscriptions_updated_at on public.subscriptions;
create trigger set_subscriptions_updated_at before update on public.subscriptions
for each row execute procedure public.set_updated_at();

alter table public.profiles enable row level security;
alter table public.pets enable row level security;
alter table public.conversations enable row level security;
alter table public.memories enable row level security;
alter table public.memory_summaries enable row level security;
alter table public.usage_logs enable row level security;
alter table public.subscriptions enable row level security;

drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own" on public.profiles for select using (auth.uid() = id);
drop policy if exists "profiles_insert_own" on public.profiles;
create policy "profiles_insert_own" on public.profiles for insert with check (auth.uid() = id);
drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own" on public.profiles for update using (auth.uid() = id);

drop policy if exists "pets_select_own" on public.pets;
create policy "pets_select_own" on public.pets for select using (auth.uid() = user_id);
drop policy if exists "pets_insert_own" on public.pets;
create policy "pets_insert_own" on public.pets for insert with check (auth.uid() = user_id);
drop policy if exists "pets_update_own" on public.pets;
create policy "pets_update_own" on public.pets for update using (auth.uid() = user_id);
drop policy if exists "pets_delete_own" on public.pets;
create policy "pets_delete_own" on public.pets for delete using (auth.uid() = user_id);

drop policy if exists "conversations_select_own" on public.conversations;
create policy "conversations_select_own" on public.conversations for select using (auth.uid() = user_id);
drop policy if exists "conversations_insert_own" on public.conversations;
create policy "conversations_insert_own" on public.conversations for insert with check (auth.uid() = user_id);

drop policy if exists "memories_select_own" on public.memories;
create policy "memories_select_own" on public.memories for select using (auth.uid() = user_id);
drop policy if exists "memories_insert_own" on public.memories;
create policy "memories_insert_own" on public.memories for insert with check (auth.uid() = user_id);
drop policy if exists "memories_update_own" on public.memories;
create policy "memories_update_own" on public.memories for update using (auth.uid() = user_id);
drop policy if exists "memories_delete_own" on public.memories;
create policy "memories_delete_own" on public.memories for delete using (auth.uid() = user_id);

drop policy if exists "memory_summaries_select_own" on public.memory_summaries;
create policy "memory_summaries_select_own" on public.memory_summaries for select using (auth.uid() = user_id);
drop policy if exists "memory_summaries_insert_own" on public.memory_summaries;
create policy "memory_summaries_insert_own" on public.memory_summaries for insert with check (auth.uid() = user_id);
drop policy if exists "memory_summaries_update_own" on public.memory_summaries;
create policy "memory_summaries_update_own" on public.memory_summaries for update using (auth.uid() = user_id);

drop policy if exists "usage_logs_select_own" on public.usage_logs;
create policy "usage_logs_select_own" on public.usage_logs for select using (auth.uid() = user_id);
drop policy if exists "usage_logs_insert_own" on public.usage_logs;
create policy "usage_logs_insert_own" on public.usage_logs for insert with check (auth.uid() = user_id);
drop policy if exists "usage_logs_update_own" on public.usage_logs;
create policy "usage_logs_update_own" on public.usage_logs for update using (auth.uid() = user_id);

drop policy if exists "subscriptions_select_own" on public.subscriptions;
create policy "subscriptions_select_own" on public.subscriptions for select using (auth.uid() = user_id);

grant usage on schema public to anon, authenticated, service_role;
grant select, insert, update, delete on public.profiles to authenticated, service_role;
grant select, insert, update, delete on public.pets to authenticated, service_role;
grant select, insert, update on public.conversations to authenticated, service_role;
grant select, insert, update, delete on public.memories to authenticated, service_role;
grant select, insert, update on public.memory_summaries to authenticated, service_role;
grant select, insert, update on public.usage_logs to authenticated, service_role;
grant select on public.subscriptions to authenticated;
grant select, insert, update on public.subscriptions to service_role;
grant execute on function public.consume_free_chat_quota(uuid, integer) to authenticated, service_role;
