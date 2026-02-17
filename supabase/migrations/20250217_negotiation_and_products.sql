-- เป้าหมายการเจรจา (ครูกำหนด), สินค้าที่กลุ่มมี (2 อย่าง), ค่าชดใช้เมื่อแพ้สงคราม

alter table public.cities
  add column if not exists negotiation_goal text default '';

alter table public.settings
  add column if not exists war_reparation_percent integer not null default 10
  check (war_reparation_percent >= 0 and war_reparation_percent <= 100);

create table if not exists public.city_assigned_products (
  city_id uuid not null references public.cities(id) on delete cascade,
  resource_type_id uuid not null references public.resource_types(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (city_id, resource_type_id)
);

create index if not exists idx_city_assigned_products_city on public.city_assigned_products(city_id);
