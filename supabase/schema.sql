-- Siam Empire: Supabase schema (run in SQL Editor)
-- Safe re-run: uses IF NOT EXISTS where possible

-- Optional helper extension
create extension if not exists pgcrypto;

-- =====================================================
-- 1) Core reference tables
-- =====================================================
create table if not exists public.cities (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  group_code text not null unique, -- student login code (e.g. city1)
  description text not null default '',       -- คำอธิบายเมือง
  laws text not null default '',              -- กฎหมายของเมือง
  materials text not null default '',         -- วัสดุ/ทรัพยากรพิเศษ
  culture text not null default '',           -- วัฒนธรรม/ประเพณี
  leader_name text not null default '',       -- ชื่อผู้นำเมือง
  defense_score integer not null default 0 check (defense_score >= 0),
  stability_score integer not null default 100 check (stability_score >= 0),
  negotiation_goal text default '',
  created_at timestamptz not null default now()
);

create table if not exists public.resource_types (
  id uuid primary key default gen_random_uuid(),
  key text not null unique, -- rice, weapons, gold, soldiers, etc.
  label text not null,
  icon text,
  sort_order integer not null default 0,
  is_active boolean not null default true,
  war_effect text check (war_effect is null or war_effect in ('attack', 'defense')),
  war_multiplier numeric not null default 1 check (war_multiplier >= 0),
  created_at timestamptz not null default now()
);

create table if not exists public.city_resources (
  id uuid primary key default gen_random_uuid(),
  city_id uuid not null references public.cities(id) on delete cascade,
  resource_type_id uuid not null references public.resource_types(id) on delete cascade,
  amount integer not null default 0 check (amount >= 0),
  updated_at timestamptz not null default now(),
  unique (city_id, resource_type_id)
);

-- สินค้าที่ครูกำหนดให้แต่ละกลุ่ม (กลุ่มละ 2 อย่าง) สำหรับไปเจรจากับกลุ่มอื่น
create table if not exists public.city_assigned_products (
  city_id uuid not null references public.cities(id) on delete cascade,
  resource_type_id uuid not null references public.resource_types(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (city_id, resource_type_id)
);

-- =====================================================
-- 2) Game flow tables
-- =====================================================
create table if not exists public.trades (
  id uuid primary key default gen_random_uuid(),
  from_city_id uuid not null references public.cities(id) on delete cascade,
  to_city_id uuid not null references public.cities(id) on delete cascade,
  offer_resource_type_id uuid not null references public.resource_types(id),
  offer_amount integer not null check (offer_amount > 0),
  request_resource_type_id uuid references public.resource_types(id),
  request_amount integer check (request_amount is null or request_amount > 0),
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  note text,
  reviewed_by uuid references auth.users(id),
  reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (from_city_id <> to_city_id)
);

create table if not exists public.wars (
  id uuid primary key default gen_random_uuid(),
  attacker_city_id uuid not null references public.cities(id) on delete cascade,
  defender_city_id uuid not null references public.cities(id) on delete cascade,
  attack_power integer not null check (attack_power >= 0),
  defense_power integer not null check (defense_power >= 0),
  result text check (result in ('attacker_win', 'defender_win', 'draw')),
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected', 'resolved')),
  resolution_note text,
  reviewed_by uuid references auth.users(id),
  reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (attacker_city_id <> defender_city_id)
);

create table if not exists public.war_resources (
  id uuid primary key default gen_random_uuid(),
  war_id uuid not null references public.wars(id) on delete cascade,
  resource_type_id uuid not null references public.resource_types(id),
  amount integer not null check (amount >= 0),
  unique (war_id, resource_type_id)
);

create table if not exists public.laws (
  id uuid primary key default gen_random_uuid(),
  city_id uuid not null references public.cities(id) on delete cascade,
  title text not null,
  description text not null,
  bonus_type text,
  bonus_value integer,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  reviewed_by uuid references auth.users(id),
  reviewed_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.logs (
  id uuid primary key default gen_random_uuid(),
  message text not null,
  city_id uuid references public.cities(id) on delete set null,
  created_at timestamptz not null default now()
);

create table if not exists public.settings (
  id integer primary key default 1,
  is_war_active boolean not null default false,
  is_trade_active boolean not null default true,
  current_phase text not null default 'peace' check (current_phase in ('peace', 'war')),
  war_reparation_percent integer not null default 10 check (war_reparation_percent >= 0 and war_reparation_percent <= 100),
  updated_at timestamptz not null default now(),
  check (id = 1)
);

create table if not exists public.admin_accounts (
  id uuid primary key default gen_random_uuid(),
  username text not null unique,
  password_hash text not null,
  display_name text,
  created_at timestamptz not null default now()
);

-- =====================================================
-- 4) Sample admin account (teacher)
-- =====================================================
-- Insert a sample admin account with username 'teacher' and password 'teacher2024'
-- Password is hashed using crypt() with a salt
insert into public.admin_accounts (username, password_hash, display_name)
values (
  'teacher',
  crypt('teacher2024', gen_salt('bf')),
  'ครูผู้สอน'
) on conflict (username) do nothing;

-- =====================================================
-- 4.1) Helper function for password verification
-- =====================================================
create or replace function public.verify_password(plain_password text, hashed_password text)
returns boolean
language plpgsql
security definer
as $$
begin
  return (hashed_password = crypt(plain_password, hashed_password));
end;
$$;

-- Login admin: verify username + password in one step
create or replace function public.login_admin(input_username text, input_password text)
returns table(id uuid, username text, display_name text)
language plpgsql
security definer
as $$
begin
  return query
    select a.id, a.username, a.display_name
    from public.admin_accounts a
    where a.username = input_username
      and a.password_hash = crypt(input_password, a.password_hash);
end;
$$;

-- =====================================================
-- 5) Legacy compatibility view (from initial requirement)
-- cities: rice, weapons, gold, soldiers
-- =====================================================
create or replace view public.cities_legacy as
select
  c.id,
  c.name,
  coalesce(sum(case when rt.key = 'rice' then cr.amount end), 0)::integer as rice,
  coalesce(sum(case when rt.key = 'weapons' then cr.amount end), 0)::integer as weapons,
  coalesce(sum(case when rt.key = 'gold' then cr.amount end), 0)::integer as gold,
  coalesce(sum(case when rt.key = 'soldiers' then cr.amount end), 0)::integer as soldiers,
  c.defense_score,
  c.stability_score
from public.cities c
left join public.city_resources cr on cr.city_id = c.id
left join public.resource_types rt on rt.id = cr.resource_type_id
group by c.id, c.name, c.defense_score, c.stability_score;

-- =====================================================
-- 4) Triggers for updated_at
-- =====================================================
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_city_resources_updated_at on public.city_resources;
create trigger trg_city_resources_updated_at
before update on public.city_resources
for each row execute procedure public.set_updated_at();

drop trigger if exists trg_trades_updated_at on public.trades;
create trigger trg_trades_updated_at
before update on public.trades
for each row execute procedure public.set_updated_at();

drop trigger if exists trg_wars_updated_at on public.wars;
create trigger trg_wars_updated_at
before update on public.wars
for each row execute procedure public.set_updated_at();

-- =====================================================
-- 5) Seed default records
-- =====================================================
insert into public.resource_types (key, label, icon, sort_order)
values
  ('rice', 'Rice', '🌾', 1),
  ('weapons', 'Weapons', '⚔️', 2),
  ('gold', 'Gold', '🪙', 3),
  ('soldiers', 'Soldiers', '🛡️', 4)
on conflict (key) do nothing;

insert into public.settings (id, is_war_active, is_trade_active, current_phase)
values (1, false, true, 'peace')
on conflict (id) do nothing;

-- =====================================================
-- 6) Indexes
-- =====================================================
create index if not exists idx_city_resources_city on public.city_resources(city_id);
create index if not exists idx_trades_status on public.trades(status);
create index if not exists idx_trades_from_city on public.trades(from_city_id);
create index if not exists idx_trades_to_city on public.trades(to_city_id);
create index if not exists idx_wars_status on public.wars(status);
create index if not exists idx_logs_created_at on public.logs(created_at desc);

-- =====================================================
-- 7) Realtime publication
-- =====================================================
alter publication supabase_realtime add table public.city_resources;
alter publication supabase_realtime add table public.trades;
alter publication supabase_realtime add table public.wars;
alter publication supabase_realtime add table public.logs;
alter publication supabase_realtime add table public.settings;

-- =====================================================
-- 8) RLS + baseline policies
-- Note: refine these when authentication flow is finalized.
-- =====================================================
alter table public.cities enable row level security;
alter table public.resource_types enable row level security;
alter table public.city_resources enable row level security;
alter table public.trades enable row level security;
alter table public.wars enable row level security;
alter table public.laws enable row level security;
alter table public.logs enable row level security;
alter table public.settings enable row level security;
alter table public.admin_accounts enable row level security;

-- Read access for authenticated users
drop policy if exists "Authenticated read cities" on public.cities;
create policy "Authenticated read cities" on public.cities
for select to authenticated using (true);

drop policy if exists "Authenticated read resource_types" on public.resource_types;
create policy "Authenticated read resource_types" on public.resource_types
for select to authenticated using (true);

drop policy if exists "Authenticated read city_resources" on public.city_resources;
create policy "Authenticated read city_resources" on public.city_resources
for select to authenticated using (true);

drop policy if exists "Authenticated read trades" on public.trades;
create policy "Authenticated read trades" on public.trades
for select to authenticated using (true);

drop policy if exists "Authenticated read wars" on public.wars;
create policy "Authenticated read wars" on public.wars
for select to authenticated using (true);

drop policy if exists "Authenticated read laws" on public.laws;
create policy "Authenticated read laws" on public.laws
for select to authenticated using (true);

drop policy if exists "Authenticated read logs" on public.logs;
create policy "Authenticated read logs" on public.logs
for select to authenticated using (true);

drop policy if exists "Authenticated read settings" on public.settings;
create policy "Authenticated read settings" on public.settings
for select to authenticated using (true);

-- Students can create trade/war/law requests
drop policy if exists "Authenticated insert trades" on public.trades;
create policy "Authenticated insert trades" on public.trades
for insert to authenticated with check (true);

drop policy if exists "Authenticated insert wars" on public.wars;
create policy "Authenticated insert wars" on public.wars
for insert to authenticated with check (true);

drop policy if exists "Authenticated insert laws" on public.laws;
create policy "Authenticated insert laws" on public.laws
for insert to authenticated with check (true);

--- Admin full access (disabled - using session-based auth instead of RLS)
-- create policy if not exists "Admin full cities" on public.cities
-- for all to authenticated
-- using (exists (select 1 from public.admin_accounts a where a.id = auth.uid()))
-- with check (exists (select 1 from public.admin_accounts a where a.id = auth.uid()));

-- create policy if not exists "Admin full resource_types" on public.resource_types
-- for all to authenticated
-- using (exists (select 1 from public.admin_accounts a where a.id = auth.uid()))
-- with check (exists (select 1 from public.admin_accounts a where a.id = auth.uid()));

-- create policy if not exists "Admin full city_resources" on public.city_resources
-- for all to authenticated
-- using (exists (select 1 from public.admin_accounts a where a.id = auth.uid()))
-- with check (exists (select 1 from public.admin_accounts a where a.id = auth.uid()));

-- create policy if not exists "Admin full trades" on public.trades
-- for all to authenticated
-- using (exists (select 1 from public.admin_accounts a where a.id = auth.uid()))
-- with check (exists (select 1 from public.admin_accounts a where a.id = auth.uid()));

-- create policy if not exists "Admin full wars" on public.wars
-- for all to authenticated
-- using (exists (select 1 from public.admin_accounts a where a.id = auth.uid()))
-- with check (exists (select 1 from public.admin_accounts a where a.id = auth.uid()));

-- create policy if not exists "Admin full laws" on public.laws
-- for all to authenticated
-- using (exists (select 1 from public.admin_accounts a where a.id = auth.uid()))
-- with check (exists (select 1 from public.admin_accounts a where a.id = auth.uid()));

-- create policy if not exists "Admin full logs" on public.logs
-- for all to authenticated
-- using (exists (select 1 from public.admin_accounts a where a.id = auth.uid()))
-- with check (exists (select 1 from public.admin_accounts a where a.id = auth.uid()));

-- create policy if not exists "Admin full settings" on public.settings
-- for all to authenticated
-- using (exists (select 1 from public.admin_accounts a where a.id = auth.uid()))
-- with check (exists (select 1 from public.admin_accounts a where a.id = auth.uid()));

-- create policy if not exists "Admin read admin_accounts" on public.admin_accounts
-- for select to authenticated
-- using (exists (select 1 from public.admin_accounts a where a.id = auth.uid()));

-- create policy if not exists "Admin insert admin_accounts" on public.admin_accounts
-- for insert to authenticated
-- with check (exists (select 1 from public.admin_accounts a where a.id = auth.uid()));

-- Alternative: Use service role key for admin operations
-- Admin APIs will use service role key to bypass RLS
