create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
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
  created_at timestamptz not null default now()
);

create unique index if not exists profiles_personal_code_key on public.profiles (personal_code);
create index if not exists profiles_gmail_idx on public.profiles (lower(gmail));

alter table public.profiles enable row level security;

create policy "Profiles are viewable by everyone"
  on public.profiles for select
  using (true);

create policy "Users can insert their own profile"
  on public.profiles for insert
  with check (auth.uid() = id);

create policy "Users can update their own profile"
  on public.profiles for update
  using (auth.uid() = id);
