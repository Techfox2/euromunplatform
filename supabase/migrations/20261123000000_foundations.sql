-- Phase 0 foundations: editions, profiles and per-edition roles.
-- Every later table hangs off an edition and is protected by the role helpers below.

-- ---------------------------------------------------------------------------
-- Types
-- ---------------------------------------------------------------------------

create type public.edition_phase as enum (
  'setup',
  'registration',
  'allocation',
  'preparation',
  'conference',
  'wrap_up',
  'archived'
);

create type public.app_role as enum (
  'admin',     -- secretariat
  'advisor',   -- faculty advisor of a school
  'chair',     -- committee dais
  'delegate'
);

-- ---------------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------------

create table public.editions (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  slug        text not null unique,
  year        int  not null,
  phase       public.edition_phase not null default 'setup',
  starts_on   date,
  ends_on     date,
  is_current  boolean not null default false,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  constraint editions_dates_check check (ends_on is null or starts_on is null or ends_on >= starts_on)
);

-- At most one edition is "current" (the one the public site shows).
create unique index editions_one_current on public.editions (is_current) where is_current;

create table public.profiles (
  id          uuid primary key references auth.users (id) on delete cascade,
  email       text not null,
  full_name   text,
  is_superadmin boolean not null default false,  -- platform owner; can manage every edition
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create table public.edition_roles (
  id          uuid primary key default gen_random_uuid(),
  edition_id  uuid not null references public.editions (id) on delete cascade,
  user_id     uuid not null references public.profiles (id) on delete cascade,
  role        public.app_role not null,
  created_at  timestamptz not null default now(),
  unique (edition_id, user_id, role)
);

create index edition_roles_user_idx on public.edition_roles (user_id);

-- ---------------------------------------------------------------------------
-- updated_at triggers
-- ---------------------------------------------------------------------------

create function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create trigger editions_set_updated_at
  before update on public.editions
  for each row execute function public.set_updated_at();

create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Create a profile automatically when someone signs up
-- ---------------------------------------------------------------------------

create function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, email, full_name)
  values (new.id, new.email, new.raw_user_meta_data ->> 'full_name');
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------------
-- Role helpers (security definer so they can be used inside RLS policies
-- without recursing into edition_roles' own policies)
-- ---------------------------------------------------------------------------

create function public.is_superadmin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(
    (select p.is_superadmin from public.profiles p where p.id = (select auth.uid())),
    false
  );
$$;

create function public.has_edition_role(p_edition_id uuid, p_role public.app_role)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.edition_roles r
    where r.edition_id = p_edition_id
      and r.user_id = (select auth.uid())
      and r.role = p_role
  );
$$;

create function public.is_edition_admin(p_edition_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select public.is_superadmin() or public.has_edition_role(p_edition_id, 'admin');
$$;

-- Users must not be able to promote themselves.
create function public.protect_profile_flags()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  -- Direct database access (SQL editor, migrations, service role) has no auth.uid().
  if (select auth.uid()) is null then
    return new;
  end if;
  if new.is_superadmin is distinct from old.is_superadmin and not public.is_superadmin() then
    raise exception 'only a superadmin can change is_superadmin';
  end if;
  if new.email is distinct from old.email and not public.is_superadmin() then
    raise exception 'email is managed by auth';
  end if;
  return new;
end;
$$;

create trigger profiles_protect_flags
  before update on public.profiles
  for each row execute function public.protect_profile_flags();

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------

alter table public.editions      enable row level security;
alter table public.profiles      enable row level security;
alter table public.edition_roles enable row level security;

-- editions: public can read anything that is past setup; admins see their own drafts.
create policy "editions are publicly readable once out of setup"
  on public.editions for select
  to anon, authenticated
  using (phase <> 'setup' or public.is_edition_admin(id));

create policy "superadmins create editions"
  on public.editions for insert
  to authenticated
  with check (public.is_superadmin());

create policy "edition admins update their edition"
  on public.editions for update
  to authenticated
  using (public.is_edition_admin(id))
  with check (public.is_edition_admin(id));

create policy "superadmins delete editions"
  on public.editions for delete
  to authenticated
  using (public.is_superadmin());

-- profiles: you see and edit yourself; admins of an edition see the people in it.
create policy "users read their own profile"
  on public.profiles for select
  to authenticated
  using (id = (select auth.uid()));

create policy "edition admins read profiles of their edition members"
  on public.profiles for select
  to authenticated
  using (
    public.is_superadmin()
    or exists (
      select 1 from public.edition_roles r
      where r.user_id = profiles.id
        and public.has_edition_role(r.edition_id, 'admin')
    )
  );

create policy "users update their own profile"
  on public.profiles for update
  to authenticated
  using (id = (select auth.uid()))
  with check (id = (select auth.uid()));

-- edition_roles: you see your own roles; edition admins manage roles in their edition.
create policy "users read their own roles"
  on public.edition_roles for select
  to authenticated
  using (user_id = (select auth.uid()));

create policy "edition admins read roles in their edition"
  on public.edition_roles for select
  to authenticated
  using (public.is_edition_admin(edition_id));

create policy "edition admins grant roles"
  on public.edition_roles for insert
  to authenticated
  with check (public.is_edition_admin(edition_id));

create policy "edition admins revoke roles"
  on public.edition_roles for delete
  to authenticated
  using (public.is_edition_admin(edition_id));
