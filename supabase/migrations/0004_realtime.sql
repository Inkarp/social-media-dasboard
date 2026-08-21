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
