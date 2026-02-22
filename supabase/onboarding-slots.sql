-- =====================================================
-- Siam Empire: Onboarding Slots Migration
-- รันใน Supabase SQL Editor
-- =====================================================

-- 1) เพิ่มคอลัมน์ใหม่ใน cities
alter table public.cities add column if not exists passcode text not null default '';
alter table public.cities add column if not exists is_registered boolean not null default false;
alter table public.cities add column if not exists resources_released boolean not null default false;
alter table public.cities add column if not exists unique_asset text not null default '';
alter table public.cities add column if not exists slot_number integer;

-- 2) สร้าง 5 city slots (safe to re-run)
insert into public.cities (name, group_code, slot_number, is_registered, resources_released)
values
  ('ช่อง 1', 'slot-1', 1, false, false),
  ('ช่อง 2', 'slot-2', 2, false, false),
  ('ช่อง 3', 'slot-3', 3, false, false),
  ('ช่อง 4', 'slot-4', 4, false, false),
  ('ช่อง 5', 'slot-5', 5, false, false)
on conflict (group_code) do update
  set slot_number = excluded.slot_number
  where public.cities.slot_number is null;

-- 3) เปิด real-time บนตาราง cities
alter publication supabase_realtime add table public.cities;
