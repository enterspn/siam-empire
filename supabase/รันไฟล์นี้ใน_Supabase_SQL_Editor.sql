-- ============================================================
-- รันไฟล์นี้ใน Supabase → SQL Editor แล้วกด Run
-- ใช้ครั้งเดียวเพื่อเพิ่มคอลัมน์/ตารางและทรัพยากรใหม่ (รันซ้ำได้)
-- ============================================================

-- 1) คอลัมน์ cities.negotiation_goal
alter table public.cities
  add column if not exists negotiation_goal text default '';

-- 2) คอลัมน์ resource_types สำหรับสงคราม
alter table public.resource_types
  add column if not exists war_effect text check (war_effect is null or war_effect in ('attack', 'defense'));
alter table public.resource_types
  add column if not exists war_multiplier numeric not null default 1 check (war_multiplier >= 0);

-- 3) คอลัมน์ settings สำหรับค่าชดใช้สงคราม
alter table public.settings
  add column if not exists war_reparation_percent integer not null default 10
  check (war_reparation_percent >= 0 and war_reparation_percent <= 100);

-- 4) ตาราง city_assigned_products (สินค้า 2 อย่างต่อกลุ่ม)
create table if not exists public.city_assigned_products (
  city_id uuid not null references public.cities(id) on delete cascade,
  resource_type_id uuid not null references public.resource_types(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (city_id, resource_type_id)
);
create index if not exists idx_city_assigned_products_city on public.city_assigned_products(city_id);

-- 5) ตาราง war_resources (ทรัพยากรที่ส่งเข้ารบ)
create table if not exists public.war_resources (
  id uuid primary key default gen_random_uuid(),
  war_id uuid not null references public.wars(id) on delete cascade,
  resource_type_id uuid not null references public.resource_types(id),
  amount integer not null check (amount >= 0),
  unique (war_id, resource_type_id)
);
create index if not exists idx_war_resources_war on public.war_resources(war_id);

-- 6) เพิ่มทรัพยากรเดิม 4 อัน (ถ้ายังไม่มี) + ทรัพยากรใหม่ 8 อัน
insert into public.resource_types (key, label, icon, sort_order)
values
  ('rice', 'Rice', '🌾', 1),
  ('weapons', 'Weapons', '⚔️', 2),
  ('gold', 'Gold', '🪙', 3),
  ('soldiers', 'Soldiers', '🛡️', 4),
  ('cannon', 'ปืนใหญ่', '🔫', 5),
  ('bricks', 'อิฐสร้างเมือง', '🧱', 6),
  ('teak_caravan', 'กองคาราวานไม้สักทอง', '🪵', 7),
  ('rangers', 'กองกำลังพรานป่า', '🏹', 8),
  ('gold_spices', 'ทองคำและเครื่องเทศ', '🌶️', 9),
  ('merchant_junk', 'เรือสำเภาค้าขาย', '⛵', 10),
  ('warship', 'เรือรบติดปืนใหญ่', '🚢', 11),
  ('dried_seafood', 'เสบียงอาหารทะเลแห้ง', '🐟', 12)
on conflict (key) do nothing;

-- หมายเหตุ: หลังรันแล้ว ครูไปที่แท็บ เมือง → แต่ละเมืองมีช่องกำหนดจำนวนทรัพยากรทุกประเภท (รวม 12 แบบ) แล้วกด "บันทึกทรัพยากร" ได้เลย
