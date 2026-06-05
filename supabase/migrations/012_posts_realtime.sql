-- Cross-device post sync and realtime updates.
create table if not exists public.posts (
  id uuid primary key,
  category_id text not null,
  sub_id text not null,
  store_name text not null default '',
  address text not null default '',
  address_key text not null default '',
  road_address text,
  jibun_address text,
  display_address text,
  map_lat double precision,
  map_lng double precision,
  author_id text not null,
  author_nickname text not null default '',
  author_profile_image text,
  title text not null default '',
  content text not null default '',
  directions text,
  business_hours text,
  images jsonb not null default '[]'::jsonb,
  video_url text,
  source_locale text,
  localized jsonb,
  is_secret boolean not null default false,
  secret_password_hash text,
  is_hidden_by_author boolean not null default false,
  place_review jsonb,
  purchase_agency jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists posts_category_sub_updated_idx
  on public.posts (category_id, sub_id, updated_at desc);

create index if not exists posts_updated_idx
  on public.posts (updated_at desc);

alter table public.posts enable row level security;

create policy "Posts are viewable by everyone"
  on public.posts for select
  using (true);

alter table public.posts replica identity full;

do $$
begin
  alter publication supabase_realtime add table public.posts;
exception
  when duplicate_object then null;
end $$;
