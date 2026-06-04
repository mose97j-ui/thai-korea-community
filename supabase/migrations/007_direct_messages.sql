-- Cross-device direct messages (Gmail/password + operator inbox).
create table if not exists public.direct_messages (
  id uuid primary key,
  conversation_id text not null,
  sender_id text not null,
  recipient_id text not null,
  sender_gmail text not null,
  recipient_gmail text not null,
  content text not null default '',
  send_mode text check (send_mode in ('nickname', 'anonymous')),
  sender_display_name text,
  images jsonb,
  video_url text,
  related_post_id text,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists direct_messages_conversation_idx
  on public.direct_messages (conversation_id, created_at);

create index if not exists direct_messages_recipient_gmail_idx
  on public.direct_messages (lower(recipient_gmail), created_at desc);

create index if not exists direct_messages_sender_gmail_idx
  on public.direct_messages (lower(sender_gmail), created_at desc);

alter table public.direct_messages enable row level security;

create policy "Direct messages are viewable by everyone"
  on public.direct_messages for select
  using (true);
