-- =============================================================================
-- Inkarp Social Dashboard · seed data
--
-- GENERATED FILE — do not edit. Regenerate with: npm run build:seed-sql
-- Source of truth: data/principals.seed.json
--
-- Run supabase/setup.sql FIRST, then paste this into:
--   Supabase dashboard -> SQL Editor -> New query -> Run
--
-- Loads 46 principals and 14 product managers, plus 5 financial years.
--
-- Safe to run more than once. Names, groups, countries and manager assignments
-- are refreshed from the source sheet; brand colours and is_active flags are set
-- only on first insert, so changes you make in the app are not overwritten.
-- Targets are never touched.
-- =============================================================================

begin;

-- -----------------------------------------------------------------------------
-- Financial years
-- -----------------------------------------------------------------------------
-- Inserted as not-current first: a partial unique index permits only one current
-- row, so switching the new one on while an old one is still true would violate
-- it mid-statement.

insert into public.financial_years (id, label, is_current) values
  (2023, '2023-24', false),
  (2024, '2024-25', false),
  (2025, '2025-26', false),
  (2026, '2026-27', false),
  (2027, '2027-28', false)
on conflict (id) do update set label = excluded.label;

update public.financial_years set is_current = false where id <> 2026;
update public.financial_years set is_current = true  where id = 2026;

-- -----------------------------------------------------------------------------
-- Product managers
-- -----------------------------------------------------------------------------
-- Emails are unknown — they appear in neither the source sheet nor the brief —
-- and are deliberately left null rather than invented. The column is nullable
-- and unique; fill them in from the Principals page when you have them.

insert into public.product_managers (name, email) values
  ('Anantha Chakravarthi', null),
  ('B Krishna', null),
  ('Durga Prasad', null),
  ('K Natesh', null),
  ('K Pavan Kumar', null),
  ('K Sreedhar', null),
  ('M S Reddy', null),
  ('Madhusudhan', null),
  ('Praveen Reddy', null),
  ('R LakshmiNarayanan', null),
  ('Saravanan Natarajan', null),
  ('Sivakumar Ganapathy', null),
  ('Stanley Thomas', null),
  ('Varun Bajpai', null)
on conflict (name) do nothing;

-- -----------------------------------------------------------------------------
-- Principals
-- -----------------------------------------------------------------------------
-- product_manager_id is resolved by name so this file carries no UUIDs and stays
-- readable and re-runnable against any database.

insert into public.principals (name, group_name, product_manager_id, country, brand_color, is_active) values
  ('Advion Interchim Scientific', 'Group 1', (select id from public.product_managers where name = 'K Natesh'), 'United States of America & France', '#B6542B', true),
  ('Bruker', 'Group 1', (select id from public.product_managers where name = 'B Krishna'), 'Germany', '#2A7959', true),
  ('Heidolph', 'Group 1', (select id from public.product_managers where name = 'Praveen Reddy'), 'Germany', '#C938DC', true),
  ('Polyscience', 'Group 1', (select id from public.product_managers where name = 'Praveen Reddy'), 'United States of America', '#9DB62B', true),
  ('Radleys', 'Group 1', (select id from public.product_managers where name = 'Praveen Reddy'), 'United Kingdom', '#2A5479', true),
  ('Rotzmeier', 'Group 1', (select id from public.product_managers where name = 'Praveen Reddy'), 'Germany', '#DC5238', true),
  ('Sp Genevac', 'Group 1', (select id from public.product_managers where name = 'K Sreedhar'), 'United Kingdom', '#2BB632', true),
  ('ThalesNano', 'Group 1', (select id from public.product_managers where name = 'K Sreedhar'), 'Hungary', '#452A79', true),
  ('Vacuubrand', 'Group 1', (select id from public.product_managers where name = 'Praveen Reddy'), 'Germany', '#DCA038', true),
  ('Ametek Brookfield', 'Group 2', (select id from public.product_managers where name = 'Varun Bajpai'), 'United States of America', '#2BB6AB', true),
  ('ECOM', 'Group 2', (select id from public.product_managers where name = 'Madhusudhan'), 'Czech Republic', '#792A68', true),
  ('Labomatic', 'Group 2', (select id from public.product_managers where name = 'Madhusudhan'), 'Switzerland', '#88DC38', true),
  ('Nanalysis', 'Group 2', (select id from public.product_managers where name = 'Madhusudhan'), 'Canada', '#2B46B6', true),
  ('FOM Technologies', 'Group 3', (select id from public.product_managers where name = 'K Sreedhar'), 'Denmark', '#79512A', true),
  ('Hohsen Corp', 'Group 3', (select id from public.product_managers where name = 'K Sreedhar'), 'Japan', '#38DC77', true),
  ('Labstation i', 'Group 3', (select id from public.product_managers where name = 'K Natesh'), 'India', '#892BB6', true),
  ('Maccor', 'Group 3', (select id from public.product_managers where name = 'K Sreedhar'), 'United States of America', '#79762A', true),
  ('Bandelin', 'Group 4', (select id from public.product_managers where name = 'K Pavan Kumar'), 'Germany', '#38B1DC', true),
  ('Dara-Lyo', 'Group 4', (select id from public.product_managers where name = 'K Pavan Kumar'), 'Spain', '#B62B69', true),
  ('Jeio Tech', 'Group 4', (select id from public.product_managers where name = 'K Pavan Kumar'), 'South Korea', '#37792A', true),
  ('Kubota', 'Group 4', (select id from public.product_managers where name = 'K Pavan Kumar'), 'Japan', '#4E38DC', true),
  ('Luzchem', 'Group 4', (select id from public.product_managers where name = 'K Pavan Kumar'), 'Canada', '#B6662B', true),
  ('Robot Coupe', 'Group 4', (select id from public.product_managers where name = 'K Pavan Kumar'), 'France', '#2A7963', true),
  ('Sonics & Materials', 'Group 4', (select id from public.product_managers where name = 'K Pavan Kumar'), 'United States of America', '#DC38DA', true),
  ('Zeiss', 'Group 4', (select id from public.product_managers where name = 'K Pavan Kumar'), 'Germany', '#8CB62B', true),
  ('Affinite Instruments', 'Group 5', (select id from public.product_managers where name = 'R LakshmiNarayanan'), 'Canada', '#2A4A79', true),
  ('BWB Technologies', 'Group 5', (select id from public.product_managers where name = 'R LakshmiNarayanan'), 'United Kingdom', '#DC6738', true),
  ('Implen', 'Group 5', (select id from public.product_managers where name = 'R LakshmiNarayanan'), 'Germany', '#2BB643', true),
  ('Lumicks', 'Group 5', (select id from public.product_managers where name = 'R LakshmiNarayanan'), 'Netherlands', '#4F2A79', true),
  ('Nanosurf', 'Group 5', (select id from public.product_managers where name = 'R LakshmiNarayanan'), 'Switzerland', '#DCB538', true),
  ('NenoVision s.r.o.', 'Group 5', (select id from public.product_managers where name = 'R LakshmiNarayanan'), 'Czech Republic', '#2BAEB6', true),
  ('Photon ETC', 'Group 5', (select id from public.product_managers where name = 'R LakshmiNarayanan'), 'Canada', '#792A5E', true),
  ('Reichert Technologies', 'Group 5', (select id from public.product_managers where name = 'R LakshmiNarayanan'), 'United States of America', '#73DC38', true),
  ('SBT Instruments', 'Group 5', (select id from public.product_managers where name = 'R LakshmiNarayanan'), 'Denmark', '#2B34B6', true),
  ('Evonik', 'Group 6', (select id from public.product_managers where name = 'M S Reddy'), 'Canada', '#793C2A', true),
  ('Gea', 'Group 6', (select id from public.product_managers where name = 'M S Reddy'), 'Italy', '#38DC8C', true),
  ('Hitachi', 'Group 6', (select id from public.product_managers where name = 'Sivakumar Ganapathy'), 'Japan', '#9B2BB6', true),
  ('ProScientific', 'Group 6', (select id from public.product_managers where name = 'M S Reddy'), 'United States of America', '#71792A', true),
  ('ThermoFisher Scientific', 'Group 6', (select id from public.product_managers where name = 'Sivakumar Ganapathy'), 'Germany', '#389CDC', true),
  ('Chemspeed', 'Group 7', (select id from public.product_managers where name = 'Stanley Thomas'), 'Switzerland', '#B62B57', true),
  ('Buchi', 'Group 8', (select id from public.product_managers where name = 'Anantha Chakravarthi'), 'Switzerland', '#2D792A', true),
  ('DLAB', 'Group 8', (select id from public.product_managers where name = 'Anantha Chakravarthi'), 'China', '#6338DC', true),
  ('Inkarp USB', 'Group 8', (select id from public.product_managers where name = 'Saravanan Natarajan'), 'India', '#B6782B', true),
  ('Mettler Toledo', 'Group 8', (select id from public.product_managers where name = 'Durga Prasad'), 'Switzerland', '#2A796D', true),
  ('Sartorius', 'Group 8', (select id from public.product_managers where name = 'Anantha Chakravarthi'), 'Germany', '#DC38C5', true),
  ('Waters', 'Group 8', (select id from public.product_managers where name = 'Anantha Chakravarthi'), 'United States of America', '#7AB62B', true)
on conflict (name) do update set
  group_name         = excluded.group_name,
  product_manager_id = excluded.product_manager_id,
  country            = excluded.country;
-- Note: brand_color and is_active are intentionally absent from the update list.

commit;

-- -----------------------------------------------------------------------------
-- What landed
-- -----------------------------------------------------------------------------
select
  (select count(*) from public.principals)       as principals,
  (select count(*) from public.product_managers) as product_managers,
  (select count(*) from public.financial_years)  as financial_years,
  (select label from public.financial_years where is_current) as current_fy;
