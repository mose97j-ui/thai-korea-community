-- Keep member_registry in sync when Google profiles are saved (operator realtime).
create or replace function public.sync_profile_to_member_registry()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
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
  values (
    new.id,
    new.name,
    new.nickname,
    new.gender,
    new.profile_image,
    new.birth_date,
    new.hometown,
    new.gmail,
    new.korean_phone,
    new.personal_code,
    new.referred_by,
    new.role,
    new.premium_until,
    new.restriction,
    'google',
    new.created_at,
    now()
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
    auth_provider = 'google',
    updated_at = now();

  return new;
end;
$$;

drop trigger if exists profiles_sync_member_registry on public.profiles;

create trigger profiles_sync_member_registry
after insert or update on public.profiles
for each row
execute function public.sync_profile_to_member_registry();
