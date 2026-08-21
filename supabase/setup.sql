-- =============================================================================
-- Inkarp Social Dashboard · complete database setup
--
-- GENERATED FILE — do not edit. Regenerate with: npm run build:setup
-- Source of truth: supabase/migrations/
--
-- Apply this once, in the Supabase dashboard:
--   1. Open your project -> SQL Editor -> New query
--   2. Paste this entire file
--   3. Run
--
-- Safe to run more than once: every statement is idempotent (create ... if not
-- exists, create or replace, drop policy if exists before create).
--
-- Concatenated from:
--   0001_core_schema.sql
--   0002_row_level_security.sql
--   0003_dashboard_rollup.sql
--   0004_realtime.sql
-- =============================================================================

-- >>> 0001_core_schema.sql >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>

-- =============================================================================
-- 0001 · Core schema
--
-- Inkarp social media marketing dashboard. April–March financial year.
--
-- Two rules are enforced here rather than trusted to application code:
--
--   1. `posts.fy` and `posts.quarter` are GENERATED columns. The client cannot
--      supply them, cannot disagree with them, and cannot drift from them.
--      They mirror src/lib/fy.ts exactly — change one, change both.
--
--   2. Deleting a principal must never delete its posts. `posts.principal_id`
--      is ON DELETE RESTRICT, so a hard delete is refused outright while any
--      post references the brand. Removal is a soft delete: is_active = false.
-- =============================================================================

-- No extensions required: gen_random_uuid() has been in Postgres core since 13,
-- so this schema needs nothing beyond a stock database.

-- -----------------------------------------------------------------------------
-- Product managers
-- -----------------------------------------------------------------------------

create table if not exists public.product_managers (
  id         uuid primary key default gen_random_uuid(),
  -- A plain UNIQUE constraint rather than a unique index on lower(name):
  -- PostgREST's upsert takes column names for its conflict target, so an
  -- expression index cannot be used as one and scripts/seed.ts could not be
  -- made idempotent against it.
  name       text not null unique check (length(btrim(name)) > 0),
  -- Nullable on purpose: a manager is a person responsible for brands, not a
  -- login. Editor accounts live in auth.users and are unrelated. UNIQUE still
  -- prevents duplicates, and Postgres permits many NULLs under a unique index.
  email      text unique,
  created_at timestamptz not null default now()
);

comment on table public.product_managers is
  'People responsible for a brand''s marketing. One manager may hold several principals.';

-- -----------------------------------------------------------------------------
-- Principals (brands)
-- -----------------------------------------------------------------------------

create table if not exists public.principals (
  id                 uuid primary key default gen_random_uuid(),
  name               text not null unique check (length(btrim(name)) > 0),
  group_name         text not null check (length(btrim(group_name)) > 0),
  product_manager_id uuid references public.product_managers (id) on delete set null,
  country            text,
  -- Per-brand identifier colour. Used only as a 3px accent bar, never as a fill.
  brand_color        text check (brand_color ~ '^#[0-9A-Fa-f]{6}$'),
  -- Soft delete. Inactive principals vanish from pickers but stay visible in
  -- historical breakdowns, which is what makes post retention meaningful.
  is_active          boolean not null default true,
  created_at         timestamptz not null default now()
);

create index if not exists principals_group_idx   on public.principals (group_name);
create index if not exists principals_manager_idx on public.principals (product_manager_id);
create index if not exists principals_active_idx  on public.principals (is_active) where is_active;

comment on column public.principals.is_active is
  'Soft delete flag. Never hard-delete a principal that has posts — the FK refuses it.';

-- -----------------------------------------------------------------------------
-- Financial years
-- -----------------------------------------------------------------------------

create table if not exists public.financial_years (
  id         int primary key,                      -- the starting year, e.g. 2025
  label      text not null,                        -- '2025-26'
  is_current boolean not null default false
);

-- At most one current year, enforced by the database rather than by care.
create unique index if not exists financial_years_single_current
  on public.financial_years ((is_current)) where is_current;

comment on column public.financial_years.id is
  'The starting calendar year. FY 2025 runs 1 Apr 2025 to 31 Mar 2026.';

-- -----------------------------------------------------------------------------
-- Targets
-- -----------------------------------------------------------------------------

create table if not exists public.targets (
  id            uuid primary key default gen_random_uuid(),
  principal_id  uuid not null references public.principals (id) on delete cascade,
  fy            int  not null references public.financial_years (id) on delete restrict,
  yearly_target int  not null default 0 check (yearly_target >= 0),
  -- NULL means "derive by splitting the yearly target evenly, remainder to Q4".
  -- An explicit 0 is a real target of zero and is honoured as an override.
  q1_target     int check (q1_target >= 0),
  q2_target     int check (q2_target >= 0),
  q3_target     int check (q3_target >= 0),
  q4_target     int check (q4_target >= 0),
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  unique (principal_id, fy)
);

create index if not exists targets_fy_idx on public.targets (fy);

comment on column public.targets.q1_target is
  'NULL = derive from yearly_target. Non-NULL = explicit override, including 0.';

-- -----------------------------------------------------------------------------
-- Posts
-- -----------------------------------------------------------------------------

create table if not exists public.posts (
  id           uuid primary key default gen_random_uuid(),
  name         text not null check (length(btrim(name)) > 0),
  description  text,
  -- RESTRICT is the retention guarantee the brief asks for: the database will
  -- refuse to delete a brand that has posts. Use is_active = false instead.
  principal_id uuid not null references public.principals (id) on delete restrict,
  product_name text,
  channels     text[] not null default '{}' check (
    channels <@ array['facebook','instagram','linkedin','twitter','youtube']::text[]
  ),
  post_date    date not null,
  status       text not null check (status in ('planned','in_progress','in_review','published')),

  -- Generated, never supplied. fy = month >= 4 ? year : year - 1.
  fy int generated always as (
    case
      when extract(month from post_date)::int >= 4 then extract(year from post_date)::int
      else extract(year from post_date)::int - 1
    end
  ) stored,

  -- Generated, never supplied. Q1 Apr–Jun, Q2 Jul–Sep, Q3 Oct–Dec, Q4 Jan–Mar.
  quarter int generated always as (
    (((extract(month from post_date)::int - 4 + 12) % 12) / 3) + 1
  ) stored,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists posts_fy_principal_idx on public.posts (fy, principal_id);
create index if not exists posts_fy_status_idx    on public.posts (fy, status);
create index if not exists posts_date_idx         on public.posts (post_date);
create index if not exists posts_principal_idx    on public.posts (principal_id);

comment on column public.posts.fy is
  'Generated from post_date. Mirrors fyOf() in src/lib/fy.ts. Never write to this.';
comment on column public.posts.quarter is
  'Generated from post_date. Mirrors quarterOf() in src/lib/fy.ts. Never write to this.';

-- -----------------------------------------------------------------------------
-- updated_at maintenance
-- -----------------------------------------------------------------------------

create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists posts_touch_updated_at on public.posts;
create trigger posts_touch_updated_at
  before update on public.posts
  for each row execute function public.touch_updated_at();

drop trigger if exists targets_touch_updated_at on public.targets;
create trigger targets_touch_updated_at
  before update on public.targets
  for each row execute function public.touch_updated_at();


-- >>> 0002_row_level_security.sql >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>

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


-- >>> 0003_dashboard_rollup.sql >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>

-- =============================================================================
-- 0003 · dashboard_rollup
--
-- Every figure on the dashboard comes out of this one function. The alternative
-- — fetching posts into the browser and reducing them in JavaScript — ships
-- thousands of rows across the wire on every filter change with 50 brands over
-- a full year, and gets slower every month the company operates.
--
-- Returns one row per entity per dimension:
--   'principal' | 'group' | 'manager' | 'product' | 'campaign'
--
-- Definitions, fixed by the brief:
--   implemented = posts with status 'published'. Nothing else counts.
--   pending     = every post in scope that is not published.
--   planned     = the target from `targets`, respecting the quarter filter.
--
-- Two behaviours worth knowing before you read a number off this:
--
--   · Targets exist per principal, so `planned` is 0 on the product and
--     campaign dimensions. Inkarp does not plan at that grain.
--
--   · A custom date range (p_from / p_to) narrows which POSTS are counted but
--     does not prorate `planned` — a target for a quarter cannot be
--     meaningfully sliced into "the 12th to the 19th". Compare implemented
--     against planned only when the range is a whole year or a whole quarter.
-- =============================================================================

create or replace function public.dashboard_rollup(
  p_fy      int,
  p_quarter int   default null,
  p_group   text  default null,
  p_pm      uuid  default null,
  p_status  text  default null,
  p_from    date  default null,
  p_to      date  default null
)
returns table (
  dimension   text,
  key         text,
  label       text,
  accent      text,
  planned     int,
  implemented int,
  pending     int
)
language plpgsql
stable
security invoker
set search_path = public
as $$
declare
  v_period_start date;
  v_period_end   date;
  v_from         date;
  v_to           date;
begin
  if p_quarter is not null and p_quarter not between 1 and 4 then
    raise exception 'quarter must be between 1 and 4, got %', p_quarter;
  end if;

  -- The financial year, or one quarter of it. Mirrors periodRange() in fy.ts.
  if p_quarter is null then
    v_period_start := make_date(p_fy, 4, 1);
    v_period_end   := make_date(p_fy + 1, 3, 31);
  else
    v_period_start := (make_date(p_fy, 4, 1) + make_interval(months => (p_quarter - 1) * 3))::date;
    v_period_end   := (v_period_start + interval '3 months' - interval '1 day')::date;
  end if;

  -- A custom range narrows the period; it can never widen it past the year.
  v_from := greatest(v_period_start, coalesce(p_from, v_period_start));
  v_to   := least(v_period_end,   coalesce(p_to,   v_period_end));

  return query
  with
  -- Note: no is_active filter. Retired brands keep appearing in historical
  -- breakdowns; they are hidden from pickers, not from history.
  scoped_principals as (
    select pr.id, pr.name, pr.group_name, pr.product_manager_id, pr.brand_color
    from public.principals pr
    where (p_group is null or pr.group_name = p_group)
      and (p_pm    is null or pr.product_manager_id = p_pm)
  ),

  scoped_posts as (
    select po.id, po.name, po.principal_id, po.product_name, po.status
    from public.posts po
    join scoped_principals sp on sp.id = po.principal_id
    where po.post_date between v_from and v_to
      and (p_status is null or po.status = p_status)
  ),

  -- The even split with the remainder landing on Q4, matching
  -- deriveQuarterTargets(). Integer division floors because targets are >= 0.
  scoped_targets as (
    select
      t.principal_id,
      case
        when p_quarter is null then t.yearly_target
        when p_quarter = 1 then coalesce(t.q1_target, t.yearly_target / 4)
        when p_quarter = 2 then coalesce(t.q2_target, t.yearly_target / 4)
        when p_quarter = 3 then coalesce(t.q3_target, t.yearly_target / 4)
        else                    coalesce(t.q4_target, t.yearly_target - (t.yearly_target / 4) * 3)
      end as planned
    from public.targets t
    join scoped_principals sp on sp.id = t.principal_id
    where t.fy = p_fy
  ),

  post_counts as (
    select
      principal_id,
      count(*) filter (where status =  'published')::int as implemented,
      count(*) filter (where status <> 'published')::int as pending
    from scoped_posts
    group by principal_id
  ),

  per_principal as (
    select
      sp.id, sp.name, sp.group_name, sp.product_manager_id, sp.brand_color,
      coalesce(st.planned, 0)     as planned,
      coalesce(pc.implemented, 0) as implemented,
      coalesce(pc.pending, 0)     as pending
    from scoped_principals sp
    left join scoped_targets st on st.principal_id = sp.id
    left join post_counts    pc on pc.principal_id = sp.id
    -- A brand earns a row by having a plan or having activity. Brands with
    -- neither are noise on a 50-row table.
    where coalesce(st.planned, 0) > 0
       or coalesce(pc.implemented, 0) > 0
       or coalesce(pc.pending, 0) > 0
  )

  select * from (
    -- By Principal ------------------------------------------------------------
    select
      'principal'::text as dimension,
      pp.id::text       as key,
      pp.name           as label,
      pp.brand_color    as accent,
      pp.planned, pp.implemented, pp.pending
    from per_principal pp

    union all

    -- By Group ----------------------------------------------------------------
    select
      'group'::text,
      pp.group_name,
      pp.group_name,
      null::text,
      sum(pp.planned)::int,
      sum(pp.implemented)::int,
      sum(pp.pending)::int
    from per_principal pp
    group by pp.group_name

    union all

    -- By Product Manager ------------------------------------------------------
    select
      'manager'::text,
      coalesce(pm.id::text, 'unassigned'),
      coalesce(pm.name, 'Unassigned'),
      null::text,
      sum(pp.planned)::int,
      sum(pp.implemented)::int,
      sum(pp.pending)::int
    from per_principal pp
    left join public.product_managers pm on pm.id = pp.product_manager_id
    group by pm.id, pm.name

    union all

    -- By Product --------------------------------------------------------------
    -- No target exists at this grain, so planned is 0 by definition.
    select
      'product'::text,
      spo.product_name,
      spo.product_name,
      null::text,
      0,
      count(*) filter (where spo.status =  'published')::int,
      count(*) filter (where spo.status <> 'published')::int
    from scoped_posts spo
    where spo.product_name is not null
      and length(btrim(spo.product_name)) > 0
    group by spo.product_name

    union all

    -- By Campaign -------------------------------------------------------------
    select
      'campaign'::text,
      spo.name,
      spo.name,
      null::text,
      0,
      count(*) filter (where spo.status =  'published')::int,
      count(*) filter (where spo.status <> 'published')::int
    from scoped_posts spo
    group by spo.name
  ) rollup
  order by rollup.dimension, rollup.implemented desc, rollup.label;
end;
$$;

comment on function public.dashboard_rollup is
  'Server-side aggregation for the dashboard breakdown tables. See migration 0003 for the definition of planned/implemented/pending and the date-range caveat.';

-- Readable by everyone, exactly like the tables it reads.
grant execute on function public.dashboard_rollup(int, int, text, uuid, text, date, date)
  to anon, authenticated;


-- >>> 0004_realtime.sql >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>

-- =============================================================================
-- 0004 · Realtime
--
-- Supabase streams row changes only for tables added to the `supabase_realtime`
-- publication. Miss this step and the subscription in
-- src/components/realtime/realtime-refresh.tsx connects successfully, reports no
-- error, and never fires — a second editor's changes simply never appear, with
-- nothing anywhere to indicate why.
--
-- Realtime respects row-level security, so viewers receive these events under
-- the same "anyone can read" policy that lets them load the page. No extra
-- exposure: nothing streams that a viewer could not already select.
-- =============================================================================

do $$
declare
  t text;
begin
  -- The publication exists only on Supabase. Skip cleanly elsewhere so the
  -- migrations still apply to a plain Postgres (which is how they are tested).
  if not exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    raise notice 'supabase_realtime publication not found — skipping (not a Supabase database)';
    return;
  end if;

  foreach t in array array['posts', 'principals', 'targets']
  loop
    -- Adding a table twice is an error, so check membership first and keep this
    -- migration safe to re-run.
    if not exists (
      select 1 from pg_publication_tables
      where pubname = 'supabase_realtime'
        and schemaname = 'public'
        and tablename = t
    ) then
      execute format('alter publication supabase_realtime add table public.%I', t);
      raise notice 'added public.% to supabase_realtime', t;
    end if;
  end loop;
end;
$$;

