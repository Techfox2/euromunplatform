-- Move SECURITY DEFINER helpers out of the API-exposed `public` schema so they
-- can't be called via /rest/v1/rpc. RLS policies reference functions by OID,
-- so existing policies keep working after the move.

create schema if not exists private;
grant usage on schema private to anon, authenticated;

alter function public.is_superadmin() set schema private;
alter function public.has_edition_role(uuid, public.app_role) set schema private;
alter function public.is_edition_admin(uuid) set schema private;
alter function public.handle_new_user() set schema private;
alter function public.protect_profile_flags() set schema private;
alter function public.set_updated_at() set schema private;

-- is_edition_admin calls the other helpers by name.
create or replace function private.is_edition_admin(p_edition_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select private.is_superadmin() or private.has_edition_role(p_edition_id, 'admin');
$$;

create or replace function private.protect_profile_flags()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  -- Direct database access (SQL editor, migrations, service role) has no auth.uid().
  if (select auth.uid()) is null then
    return new;
  end if;
  if new.is_superadmin is distinct from old.is_superadmin and not private.is_superadmin() then
    raise exception 'only a superadmin can change is_superadmin';
  end if;
  if new.email is distinct from old.email and not private.is_superadmin() then
    raise exception 'email is managed by auth';
  end if;
  return new;
end;
$$;

-- Trigger-only function: nobody needs to call it directly.
revoke execute on function private.handle_new_user() from public, anon, authenticated;
