-- Local development seed data. Runs on `supabase db reset`.

insert into public.editions (name, slug, year, phase, starts_on, ends_on, is_current)
values ('EUROMUN 2027', 'euromun-2027', 2027, 'registration', '2027-05-14', '2027-05-17', true);

-- To make yourself a superadmin locally after signing in once:
--   update public.profiles set is_superadmin = true where email = 'you@example.com';
