-- Cross-device operator support / member requests (건의·문의).
create table if not exists public.support_requests (
  id uuid primary key,
  user_id text not null,
  user_gmail text not null,
  user_nickname text not null default '',
  user_profile_image text,
  category text not null check (category in ('board', 'feature', 'qa', 'other')),
  title text not null default '',
  status text not null default 'open' check (status in ('open', 'answered', 'closed')),
  messages jsonb not null default '[]'::jsonb,
  unread_by_user boolean not null default false,
  unread_by_operator boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists support_requests_user_gmail_idx
  on public.support_requests (lower(user_gmail), updated_at desc);

create index if not exists support_requests_operator_unread_idx
  on public.support_requests (unread_by_operator, updated_at desc)
  where unread_by_operator = true;

alter table public.support_requests enable row level security;

create policy "Support requests are viewable by everyone"
  on public.support_requests for select
  using (true);

alter table public.support_requests replica identity full;

do $$
begin
  alter publication supabase_realtime add table public.support_requests;
exception
  when duplicate_object then null;
end $$;
