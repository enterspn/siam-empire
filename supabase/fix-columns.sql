-- =====================================================
-- Siam Empire: Fix columns + Seed data
-- รันไฟล์นี้ใน Supabase SQL Editor
-- =====================================================

-- 1) เพิ่มคอลัมน์ที่อาจขาดใน cities
alter table public.cities add column if not exists description text not null default '';
alter table public.cities add column if not exists laws text not null default '';
alter table public.cities add column if not exists materials text not null default '';
alter table public.cities add column if not exists culture text not null default '';
alter table public.cities add column if not exists leader_name text not null default '';
alter table public.cities add column if not exists negotiation_goal text default '';
alter table public.cities add column if not exists story_log text not null default '';

-- 2) ตรวจสอบว่า resource_types มีข้อมูลครบ
insert into public.resource_types (key, label, icon, sort_order, is_active, war_effect, war_multiplier)
values
  ('rice',     'ข้าว',   '🌾', 1, true, null,      1),
  ('weapons',  'อาวุธ',  '⚔️', 2, true, 'attack',  2),
  ('gold',     'ทอง',    '🪙', 3, true, null,      1),
  ('soldiers', 'ทหาร',  '🛡️', 4, true, 'defense', 3)
on conflict (key) do update
  set label = excluded.label,
      icon  = excluded.icon;

-- 3) ตรวจสอบ settings
insert into public.settings (id, is_war_active, is_trade_active, current_phase, war_reparation_percent)
values (1, false, true, 'peace', 10)
on conflict (id) do nothing;

-- 4) Seed เมืองตัวอย่าง 4 กลุ่ม
insert into public.cities (name, group_code, description, laws, materials, culture, leader_name)
values
  ('สุโขทัย',           'sukhothai',  'เมืองแห่งรุ่งอรุณแห่งความสุข',           'ห้ามโจรกรรม ห้ามทำลายทรัพย์ผู้อื่น', 'ทองคำ งาช้าง ผ้าไหม',     'ประเพณีลอยกระทง บูชาพระแม่คงคา', 'พ่อขุนรามคำแหง'),
  ('อยุธยา',            'ayutthaya',  'อาณาจักรที่รุ่งเรืองที่สุดแห่งสยาม',      'กฎหมายตราสามดวง',                      'ทองคำ ข้าว เครื่องเทศ',   'ประเพณีแห่เรือพระ งานช้าง',      'สมเด็จพระนเรศวร'),
  ('ล้านนา',            'lanna',      'อาณาจักรล้านช้างแห่งภาคเหนือ',            'กฎหมายมังรายศาสตร์',                    'ไม้สัก เงิน ชา',           'ประเพณียี่เป็ง ทานข้าวใหม่',     'พระเจ้าติโลกราช'),
  ('นครศรีธรรมราช',    'nakhon',     'เมืองท่าแห่งคาบสมุทรสยาม',               'กฎหมายสงขลา',                          'ดีบุก ยาง มะพร้าว',        'ประเพณีชักพระ บุญสารทเดือนสิบ', 'เจ้าเมืองนคร')
on conflict (name) do nothing;

-- 5) สร้างทรัพยากรเริ่มต้นสำหรับทุกเมือง
insert into public.city_resources (city_id, resource_type_id, amount)
select
  c.id,
  rt.id,
  case rt.key
    when 'rice'     then 150
    when 'weapons'  then 80
    when 'gold'     then 100
    when 'soldiers' then 50
    else 100
  end
from public.cities c
cross join public.resource_types rt
where rt.is_active = true
on conflict (city_id, resource_type_id) do nothing;

-- 6) กำหนดสินค้า 2 อย่างต่อเมือง (city_assigned_products)
--    ล้าง + ใส่ใหม่เฉพาะเมืองที่ยังไม่มี
insert into public.city_assigned_products (city_id, resource_type_id)
select c.id, rt.id
from public.cities c
join public.resource_types rt on rt.key = 'rice'
where c.group_code = 'sukhothai'
on conflict do nothing;

insert into public.city_assigned_products (city_id, resource_type_id)
select c.id, rt.id
from public.cities c
join public.resource_types rt on rt.key = 'gold'
where c.group_code = 'sukhothai'
on conflict do nothing;

insert into public.city_assigned_products (city_id, resource_type_id)
select c.id, rt.id
from public.cities c
join public.resource_types rt on rt.key = 'weapons'
where c.group_code = 'ayutthaya'
on conflict do nothing;

insert into public.city_assigned_products (city_id, resource_type_id)
select c.id, rt.id
from public.cities c
join public.resource_types rt on rt.key = 'soldiers'
where c.group_code = 'ayutthaya'
on conflict do nothing;

insert into public.city_assigned_products (city_id, resource_type_id)
select c.id, rt.id
from public.cities c
join public.resource_types rt on rt.key = 'gold'
where c.group_code = 'lanna'
on conflict do nothing;

insert into public.city_assigned_products (city_id, resource_type_id)
select c.id, rt.id
from public.cities c
join public.resource_types rt on rt.key = 'rice'
where c.group_code = 'lanna'
on conflict do nothing;

insert into public.city_assigned_products (city_id, resource_type_id)
select c.id, rt.id
from public.cities c
join public.resource_types rt on rt.key = 'rice'
where c.group_code = 'nakhon'
on conflict do nothing;

insert into public.city_assigned_products (city_id, resource_type_id)
select c.id, rt.id
from public.cities c
join public.resource_types rt on rt.key = 'weapons'
where c.group_code = 'nakhon'
on conflict do nothing;
