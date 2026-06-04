-- One-time backfill: existing Google profiles → member_registry (local signups use /api/members/sync).
insert into public.member_registry (
  id,
  name,
  nickname,
  gender,
  profile_image,
  birth_date,
  hometown,
  gmail,
  korean_phone,
  personal_code,
  referred_by,
  role,
  premium_until,
  restriction,
  auth_provider,
  created_at,
  updated_at
)
select
  p.id,
  p.name,
  p.nickname,
  p.gender,
  p.profile_image,
  p.birth_date,
  p.hometown,
  lower(p.gmail),
  p.korean_phone,
  p.personal_code,
  p.referred_by,
  p.role,
  p.premium_until,
  p.restriction,
  'google',
  p.created_at,
  now()
from public.profiles p
where not exists (
  select 1 from public.member_registry m where lower(m.gmail) = lower(p.gmail)
)
on conflict (id) do update set
  name = excluded.name,
  nickname = excluded.nickname,
  gender = excluded.gender,
  profile_image = excluded.profile_image,
  birth_date = excluded.birth_date,
  hometown = excluded.hometown,
  gmail = excluded.gmail,
  korean_phone = excluded.korean_phone,
  personal_code = excluded.personal_code,
  referred_by = excluded.referred_by,
  role = excluded.role,
  premium_until = excluded.premium_until,
  restriction = excluded.restriction,
  auth_provider = excluded.auth_provider,
  updated_at = now();
