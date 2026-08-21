-- =============================================================================
-- 0002 · Row-level security
--
-- This IS the access model, not a supplement to it.
--
-- The brief: anyone with the link may view without logging in; only authorised
-- people may edit. Both halves are enforced here, in the database. Once these
-- policies exist, the anon key the browser holds physically cannot write to any
-- table — no matter what the UI does, what a bug allows, or what someone types
-- into a console.
--
-- Gating the interface is therefore purely cosmetic: it is about not showing
-- people buttons that would fail, never about security.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- Grants. RLS filters rows; grants decide whether the role may attempt the
-- statement at all. Both are needed.
-- -----------------------------------------------------------------------------

grant usage on schema public to anon, authenticated;

grant select on
  public.product_managers,
  public.principals,
  public.financial_years,
  public.targets,
  public.posts
to anon, authenticated;

grant insert, update, delete on
  public.product_managers,
  public.principals,
  public.financial_years,
  public.targets,
  public.posts
to authenticated;

-- -----------------------------------------------------------------------------
-- Enable RLS everywhere. A table with RLS enabled and no policy denies all.
-- -----------------------------------------------------------------------------

alter table public.product_managers enable row level security;
alter table public.principals       enable row level security;
alter table public.financial_years  enable row level security;
alter table public.targets          enable row level security;
alter table public.posts            enable row level security;

-- Belt and braces: policies do not apply to the table owner unless forced, and
-- the owner is what migrations run as.
alter table public.product_managers force row level security;
alter table public.principals       force row level security;
alter table public.financial_years  force row level security;
alter table public.targets          force row level security;
alter table public.posts            force row level security;

-- -----------------------------------------------------------------------------
-- Policies. Same shape on all five tables: the world reads, editors write.
-- -----------------------------------------------------------------------------

do $$
declare
  t text;
begin
  foreach t in array array[
    'product_managers', 'principals', 'financial_years', 'targets', 'posts'
  ]
  loop
    execute format('drop policy if exists "anyone can read" on public.%I', t);
    execute format(
      'create policy "anyone can read" on public.%I for select using (true)', t
    );

    execute format('drop policy if exists "editors can write" on public.%I', t);
    execute format(
      'create policy "editors can write" on public.%I for all
         using (auth.role() = ''authenticated'')
         with check (auth.role() = ''authenticated'')', t
    );
  end loop;
end;
$$;
