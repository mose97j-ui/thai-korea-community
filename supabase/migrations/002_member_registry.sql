-- Shared member directory for Gmail/password signups (not tied to auth.users).
create table if not exists public.member_registry (
  id uuid primary key,
  name text not null default '',
  nickname text not null default '',
  gender text check (gender in ('male', 'female')),
  profile_image text,
  birth_date text not null default '',
  hometown text not null default '',
  gmail text not null,
  korean_phone text not null default '',
  personal_code text not null,
  referred_by text,
  role text not null default 'user' check (role in ('user', 'operator')),
  premium_until timestamptz,
  restriction jsonb,
  auth_provider text not null default 'local',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists member_registry_gmail_key on public.member_registry (lower(gmail));
create unique index if not exists member_registry_personal_code_key on public.member_registry (personal_code);
create index if not exists member_registry_created_at_idx on public.member_registry (created_at desc);

alter table public.member_registry enable row level security;

create policy "Member registry is viewable by everyone"
  on public.member_registry for select
  using (true);
