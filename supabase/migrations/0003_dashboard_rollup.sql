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
