-- Phase 1: public conference info, committees, and registration (applications).

-- ---------------------------------------------------------------------------
-- Public info on the edition
-- ---------------------------------------------------------------------------

alter table public.editions
  add column tagline text,
  add column location text,
  add column description text,
  add column registration_closes_on date,
  add column max_delegates_per_school int not null default 30
    check (max_delegates_per_school between 1 and 200);

-- ---------------------------------------------------------------------------
-- Committees
-- ---------------------------------------------------------------------------

create table public.committees (
  id              uuid primary key default gen_random_uuid(),
  edition_id      uuid not null references public.editions (id) on delete cascade,
  name            text not null check (length(trim(name)) between 2 and 120),
  abbreviation    text not null check (length(trim(abbreviation)) between 1 and 20),
  topics          text[] not null default '{}',
  description     text,
  study_guide_url text check (study_guide_url is null or study_guide_url ~ '^https?://'),
  sort_order      int not null default 0,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  unique (edition_id, abbreviation)
);

create index committees_edition_idx on public.committees (edition_id, sort_order);

create trigger committees_set_updated_at
  before update on public.committees
  for each row execute function private.set_updated_at();

alter table public.committees enable row level security;

create policy "committees are public once the edition is"
  on public.committees for select
  to anon, authenticated
  using (
    exists (select 1 from public.editions e where e.id = edition_id and e.phase <> 'setup')
    or private.is_edition_admin(edition_id)
  );

create policy "edition admins manage committees"
  on public.committees for all
  to authenticated
  using (private.is_edition_admin(edition_id))
  with check (private.is_edition_admin(edition_id));

-- ---------------------------------------------------------------------------
-- Applications
-- ---------------------------------------------------------------------------

create type public.application_kind as enum ('school', 'individual');

create type public.application_status as enum (
  'submitted',
  'accepted',
  'waitlisted',
  'rejected',
  'withdrawn'
);

create table public.applications (
  id               uuid primary key default gen_random_uuid(),
  edition_id       uuid not null references public.editions (id) on delete cascade,
  applicant_id     uuid not null references public.profiles (id) on delete cascade,
  kind             public.application_kind not null,
  status           public.application_status not null default 'submitted',
  contact_name     text not null check (length(trim(contact_name)) between 2 and 120),
  contact_phone    text check (contact_phone is null or length(contact_phone) <= 40),
  school_name      text check (school_name is null or length(trim(school_name)) between 2 and 160),
  school_city      text check (school_city is null or length(school_city) <= 120),
  school_country   text check (school_country is null or length(school_country) <= 120),
  motivation       text check (motivation is null or length(motivation) <= 2000),
  decision_message text check (decision_message is null or length(decision_message) <= 2000),
  reviewed_by      uuid references public.profiles (id) on delete set null,
  reviewed_at      timestamptz,
  submitted_at     timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
  unique (edition_id, applicant_id),
  constraint applications_school_needs_name check (kind <> 'school' or school_name is not null)
);

create index applications_edition_status_idx on public.applications (edition_id, status);

create table public.application_delegates (
  id                    uuid primary key default gen_random_uuid(),
  application_id        uuid not null references public.applications (id) on delete cascade,
  position              int not null,
  full_name             text not null check (length(trim(full_name)) between 2 and 120),
  email                 text not null check (email ~ '^[^\s@]+@[^\s@]+\.[^\s@]+$'),
  grade                 text check (grade is null or length(grade) <= 40),
  mun_experience        int not null default 0 check (mun_experience between 0 and 100),
  committee_preferences uuid[] not null default '{}' check (cardinality(committee_preferences) <= 3),
  country_preferences   text[] not null default '{}' check (cardinality(country_preferences) <= 3),
  notes                 text check (notes is null or length(notes) <= 1000),
  created_at            timestamptz not null default now(),
  unique (application_id, position)
);

create index application_delegates_app_idx on public.application_delegates (application_id);

create trigger applications_set_updated_at
  before update on public.applications
  for each row execute function private.set_updated_at();

-- Applicants may edit their application only while it is submitted and
-- registration is open, and may only change its status to "withdrawn".
-- Review fields are managed by edition admins.
create function private.protect_application()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  v_is_admin boolean;
  v_phase public.edition_phase;
begin
  if (select auth.uid()) is null then
    return new;
  end if;

  if new.edition_id is distinct from old.edition_id or new.applicant_id is distinct from old.applicant_id then
    raise exception 'edition and applicant cannot be changed';
  end if;

  v_is_admin := private.is_edition_admin(old.edition_id);

  if v_is_admin and old.applicant_id <> (select auth.uid()) then
    if new.status is distinct from old.status then
      new.reviewed_by := (select auth.uid());
      new.reviewed_at := now();
    end if;
    return new;
  end if;

  -- Applicant path.
  if new.decision_message is distinct from old.decision_message
     or new.reviewed_by is distinct from old.reviewed_by
     or new.reviewed_at is distinct from old.reviewed_at
     or new.submitted_at is distinct from old.submitted_at then
    raise exception 'review fields are managed by the secretariat';
  end if;

  if new.status is distinct from old.status then
    if new.status = 'withdrawn' and old.status in ('submitted', 'waitlisted', 'accepted') then
      return new;
    end if;
    raise exception 'you can only withdraw your application';
  end if;

  select e.phase into v_phase from public.editions e where e.id = old.edition_id;
  if old.status <> 'submitted' or v_phase <> 'registration' then
    raise exception 'this application can no longer be edited';
  end if;

  return new;
end;
$$;

create trigger applications_protect
  before update on public.applications
  for each row execute function private.protect_application();

-- Withdrawing an accepted application removes the role it granted.
create function private.revoke_role_on_withdraw()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.status = 'withdrawn' and old.status = 'accepted' then
    delete from public.edition_roles
    where edition_id = new.edition_id
      and user_id = new.applicant_id
      and role = case new.kind when 'school' then 'advisor'::public.app_role else 'delegate'::public.app_role end;
  end if;
  return new;
end;
$$;

revoke execute on function private.revoke_role_on_withdraw() from public, anon, authenticated;

create trigger applications_revoke_role_on_withdraw
  after update of status on public.applications
  for each row execute function private.revoke_role_on_withdraw();

alter table public.applications          enable row level security;
alter table public.application_delegates enable row level security;

create policy "applicants and edition admins read applications"
  on public.applications for select
  to authenticated
  using (applicant_id = (select auth.uid()) or private.is_edition_admin(edition_id));

create policy "users apply while registration is open"
  on public.applications for insert
  to authenticated
  with check (
    applicant_id = (select auth.uid())
    and status = 'submitted'
    and decision_message is null
    and reviewed_by is null
    and exists (select 1 from public.editions e where e.id = edition_id and e.phase = 'registration')
  );

create policy "applicants and edition admins update applications"
  on public.applications for update
  to authenticated
  using (applicant_id = (select auth.uid()) or private.is_edition_admin(edition_id))
  with check (applicant_id = (select auth.uid()) or private.is_edition_admin(edition_id));

create policy "delegates are visible with their application"
  on public.application_delegates for select
  to authenticated
  using (exists (select 1 from public.applications a where a.id = application_id));

create policy "applicants manage delegates of an open application"
  on public.application_delegates for all
  to authenticated
  using (
    exists (
      select 1 from public.applications a
      join public.editions e on e.id = a.edition_id
      where a.id = application_id
        and a.applicant_id = (select auth.uid())
        and a.status = 'submitted'
        and e.phase = 'registration'
    )
  )
  with check (
    exists (
      select 1 from public.applications a
      join public.editions e on e.id = a.edition_id
      where a.id = application_id
        and a.applicant_id = (select auth.uid())
        and a.status = 'submitted'
        and e.phase = 'registration'
    )
  );

-- ---------------------------------------------------------------------------
-- RPCs (SECURITY INVOKER: they run with the caller's rights, so RLS applies)
-- ---------------------------------------------------------------------------

-- Create or update the caller's application for an edition, replacing its
-- delegate list, in one transaction.
create function public.save_application(
  p_edition_id     uuid,
  p_kind           public.application_kind,
  p_contact_name   text,
  p_contact_phone  text,
  p_school_name    text,
  p_school_city    text,
  p_school_country text,
  p_motivation     text,
  p_delegates      jsonb
)
returns uuid
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_uid uuid := (select auth.uid());
  v_app_id uuid;
  v_count int;
  v_max int;
  v_bad int;
begin
  if v_uid is null then
    raise exception 'not signed in';
  end if;

  if jsonb_typeof(p_delegates) <> 'array' then
    raise exception 'delegates must be a list';
  end if;
  v_count := jsonb_array_length(p_delegates);

  select e.max_delegates_per_school into v_max
  from public.editions e
  where e.id = p_edition_id and e.phase = 'registration';
  if not found then
    raise exception 'registration is not open';
  end if;

  if p_kind = 'individual' and v_count <> 1 then
    raise exception 'an individual application has exactly one delegate';
  end if;
  if p_kind = 'school' and (v_count < 1 or v_count > v_max) then
    raise exception 'a school delegation needs between 1 and % delegates', v_max;
  end if;

  -- Committee preferences must belong to this edition.
  select count(*) into v_bad
  from jsonb_array_elements(p_delegates) d,
       jsonb_array_elements_text(coalesce(d -> 'committee_preferences', '[]'::jsonb)) pref
  where not exists (
    select 1 from public.committees c
    where c.id = pref::uuid and c.edition_id = p_edition_id
  );
  if v_bad > 0 then
    raise exception 'unknown committee in preferences';
  end if;

  select a.id into v_app_id
  from public.applications a
  where a.edition_id = p_edition_id and a.applicant_id = v_uid;

  if v_app_id is null then
    insert into public.applications (
      edition_id, applicant_id, kind, contact_name, contact_phone,
      school_name, school_city, school_country, motivation
    ) values (
      p_edition_id, v_uid, p_kind, p_contact_name, nullif(p_contact_phone, ''),
      nullif(p_school_name, ''), nullif(p_school_city, ''), nullif(p_school_country, ''),
      nullif(p_motivation, '')
    )
    returning id into v_app_id;
  else
    update public.applications set
      kind = p_kind,
      contact_name = p_contact_name,
      contact_phone = nullif(p_contact_phone, ''),
      school_name = nullif(p_school_name, ''),
      school_city = nullif(p_school_city, ''),
      school_country = nullif(p_school_country, ''),
      motivation = nullif(p_motivation, '')
    where id = v_app_id;
    delete from public.application_delegates where application_id = v_app_id;
  end if;

  insert into public.application_delegates (
    application_id, position, full_name, email, grade, mun_experience,
    committee_preferences, country_preferences, notes
  )
  select
    v_app_id,
    d.ord::int,
    trim(d.value ->> 'full_name'),
    lower(trim(d.value ->> 'email')),
    nullif(trim(d.value ->> 'grade'), ''),
    coalesce((d.value ->> 'mun_experience')::int, 0),
    coalesce(array(select jsonb_array_elements_text(d.value -> 'committee_preferences'))::uuid[], '{}'),
    coalesce(array(select jsonb_array_elements_text(d.value -> 'country_preferences')), '{}'),
    nullif(trim(d.value ->> 'notes'), '')
  from jsonb_array_elements(p_delegates) with ordinality as d(value, ord);

  return v_app_id;
end;
$$;

-- Secretariat decision on an application. Accepting grants the applicant a
-- role in the edition (advisor for a school, delegate for an individual);
-- moving away from "accepted" removes it again.
create function public.review_application(
  p_application_id uuid,
  p_status         public.application_status,
  p_message        text
)
returns void
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_app public.applications;
  v_role public.app_role;
begin
  select * into v_app from public.applications where id = p_application_id;
  if not found or not private.is_edition_admin(v_app.edition_id) then
    raise exception 'application not found';
  end if;
  if p_status = 'withdrawn' then
    raise exception 'only the applicant can withdraw';
  end if;

  update public.applications
  set status = p_status, decision_message = nullif(trim(p_message), '')
  where id = p_application_id;

  v_role := case v_app.kind when 'school' then 'advisor'::public.app_role else 'delegate'::public.app_role end;

  if p_status = 'accepted' then
    insert into public.edition_roles (edition_id, user_id, role)
    values (v_app.edition_id, v_app.applicant_id, v_role)
    on conflict do nothing;
  elsif v_app.status = 'accepted' then
    delete from public.edition_roles
    where edition_id = v_app.edition_id and user_id = v_app.applicant_id and role = v_role;
  end if;
end;
$$;

revoke execute on function public.save_application(uuid, public.application_kind, text, text, text, text, text, text, jsonb) from public, anon;
revoke execute on function public.review_application(uuid, public.application_status, text) from public, anon;
grant execute on function public.save_application(uuid, public.application_kind, text, text, text, text, text, text, jsonb) to authenticated;
grant execute on function public.review_application(uuid, public.application_status, text) to authenticated;
