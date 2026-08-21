-- =============================================================================
-- 0005 · Admin-only writes
--
-- The brief for this pass: no scoped "manager" role for now — a signed-in
-- account gets write access only if it has been explicitly, manually added to
-- `admin_users` (via the Supabase dashboard's table editor, by design — see
-- the comment on that table below). Everyone else who can sign in still reads
-- everything, exactly like an anonymous visitor, and writes nothing.
--
-- Before this migration, `editors can write` on every table checked only
-- `auth.role() = 'authenticated'` — true for ANY signed-in account, with no
-- per-user distinction at all. That is the gap this closes: once this is
-- applied, being logged in is no longer sufficient on its own.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- admin_users
--
-- Deliberately bare: no in-app UI reads or writes this table, and no grants
-- are given to anon/authenticated at all. The only way in is the Supabase
-- dashboard's SQL Editor or Table Editor (which connects as the table owner),
-- or the `is_admin()` function below, which is SECURITY DEFINER precisely so
-- it can check membership without the calling role needing any privilege on
-- this table itself.
--
-- RLS is enabled but NOT forced — forcing it would apply RLS to the table
-- owner too, and with zero policies defined that would make `is_admin()`
-- (which runs as the owner) unable to see any row, denying every admin. Do
-- not "belt and braces" this one the way 0002 does for the data tables.
-- -----------------------------------------------------------------------------

create table if not exists public.admin_users (
  user_id    uuid primary key references auth.users (id) on delete cascade,
  created_at timestamptz not null default now()
);

comment on table public.admin_users is
  'Manually maintained allowlist of Supabase Auth users with write access. Add/remove rows via the Supabase dashboard only — there is no in-app UI for this by design.';

alter table public.admin_users enable row level security;
-- No policies: anon and authenticated get zero rows, zero writes, full stop.

-- -----------------------------------------------------------------------------
-- is_admin()
--
-- The single source of truth every write policy below defers to. SECURITY
-- DEFINER so it can read admin_users regardless of the caller's own grants —
-- see the comment on that table for why that's safe here.
-- -----------------------------------------------------------------------------

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.admin_users where user_id = auth.uid()
  );
$$;

comment on function public.is_admin() is
  'True only for a signed-in user whose id has been added to admin_users. Every write policy in this project checks this, not auth.role().';

grant execute on function public.is_admin() to anon, authenticated;

-- -----------------------------------------------------------------------------
-- Replace "editors can write" on every table: admin, not merely authenticated.
--
-- The "anyone can read" policy from 0002 is untouched — public read access is
-- not part of this change.
-- -----------------------------------------------------------------------------

do $$
declare
  t text;
begin
  foreach t in array array[
    'product_managers', 'principals', 'financial_years', 'targets', 'posts'
  ]
  loop
    execute format('drop policy if exists "editors can write" on public.%I', t);
    execute format(
      'create policy "editors can write" on public.%I for all
         using (public.is_admin())
         with check (public.is_admin())', t
    );
  end loop;
end;
$$;
