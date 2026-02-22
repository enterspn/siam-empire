-- =====================================================
-- Siam Empire: Global Cooperative Missions
-- รันใน Supabase SQL Editor
-- =====================================================

create table if not exists public.global_missions (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text not null default '',
  target_resource_type text not null,
  target_amount integer not null default 0 check (target_amount > 0),
  current_amount integer not null default 0 check (current_amount >= 0),
  is_active boolean not null default false,
  created_at timestamptz not null default now()
);

-- เปิด real-time บนตาราง global_missions
alter publication supabase_realtime add table public.global_missions;

-- ตัวอย่างภารกิจ
insert into public.global_missions (title, description, target_resource_type, target_amount, is_active)
values (
  'พระราชโองการ: รวมพลทหารป้องกันอาณาจักร',
  'ทุกเมืองต้องร่วมกันบริจาคข้าวเพื่อเลี้ยงทัพหลวง หากสำเร็จ ทุกเมืองจะได้รับโบนัสเสถียรภาพ',
  'rice',
  500,
  false
);
