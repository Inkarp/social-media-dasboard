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
