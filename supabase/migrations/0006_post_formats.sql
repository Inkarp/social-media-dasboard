-- Preserve existing posts as unclassified; all new posts require a format.
 alter table public.posts add column if not exists format text;
 alter table public.posts drop constraint if exists posts_format_check;
 alter table public.posts add constraint posts_format_check
   check (format in ('static', 'carousel', 'reel', 'video'));
 create index if not exists posts_format_date_idx on public.posts (format, post_date);

 create or replace function public.require_post_format() returns trigger
 language plpgsql set search_path = public as $$
 begin
   if new.format is null and (TG_OP = 'INSERT' or old.format is not null) then
     raise exception 'Choose a post format: Static, Carousel, Reel or Video.';
   end if;
   return new;
 end;
 $$;
 drop trigger if exists posts_require_format on public.posts;
 create trigger posts_require_format before insert or update on public.posts
 for each row execute function public.require_post_format();

 drop function if exists public.dashboard_rollup(int, int, text, uuid, text, date, date);
create or replace function public.dashboard_rollup(
  p_fy      int,
  p_quarter int   default null,
  p_group   text  default null,
  p_pm      uuid  default null,
  p_status  text  default null,
  p_from    date  default null,
  p_to      date  default null,
  p_format  text  default null
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
      and (p_format is null or coalesce(po.format, 'unclassified') = p_format)
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

comment on function public.dashboard_rollup(int, int, text, uuid, text, date, date, text) is
  'Server-side aggregation for the dashboard breakdown tables. See migration 0003 for the definition of planned/implemented/pending and the date-range caveat.';

-- Readable by everyone, exactly like the tables it reads.
grant execute on function public.dashboard_rollup(int, int, text, uuid, text, date, date, text)
  to anon, authenticated;

create or replace function public.post_format_rollup(
 p_fy int, p_quarter int default null, p_group text default null,
 p_pm uuid default null, p_status text default null,
 p_from date default null, p_to date default null, p_format text default null
) returns table (principal_id uuid, principal_name text, format text, implemented int, pending int)
language sql stable security invoker set search_path = public as $$
 select pr.id, pr.name, coalesce(po.format, 'unclassified'),
 count(*) filter (where po.status = 'published')::int,
 count(*) filter (where po.status <> 'published')::int
 from public.posts po join public.principals pr on pr.id = po.principal_id
 where po.fy = p_fy and (p_quarter is null or po.quarter = p_quarter)
 and (p_group is null or pr.group_name = p_group)
 and (p_pm is null or pr.product_manager_id = p_pm)
 and (p_status is null or po.status = p_status)
 and (p_from is null or po.post_date >= p_from)
 and (p_to is null or po.post_date <= p_to)
 and (p_format is null or coalesce(po.format, 'unclassified') = p_format)
 group by pr.id, pr.name, coalesce(po.format, 'unclassified');
$$;
grant execute on function public.post_format_rollup(int, int, text, uuid, text, date, date, text) to anon, authenticated;
notify pgrst, 'reload schema';
