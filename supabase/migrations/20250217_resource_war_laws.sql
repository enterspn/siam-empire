-- Add war-related columns to resource_types and war_resources table
-- Run this if your DB was created before these changes

alter table public.resource_types
  add column if not exists war_effect text check (war_effect is null or war_effect in ('attack', 'defense'));
alter table public.resource_types
  add column if not exists war_multiplier numeric not null default 1 check (war_multiplier >= 0);

create table if not exists public.war_resources (
  id uuid primary key default gen_random_uuid(),
  war_id uuid not null references public.wars(id) on delete cascade,
  resource_type_id uuid not null references public.resource_types(id),
  amount integer not null check (amount >= 0),
  unique (war_id, resource_type_id)
);

create index if not exists idx_war_resources_war on public.war_resources(war_id);
