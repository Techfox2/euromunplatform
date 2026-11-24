-- Edition admins need the applicant's email to review an application,
-- even before the applicant has a role in the edition.
create policy "edition admins read profiles of applicants"
  on public.profiles for select
  to authenticated
  using (
    exists (
      select 1 from public.applications a
      where a.applicant_id = profiles.id
        and private.is_edition_admin(a.edition_id)
    )
  );
