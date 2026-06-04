-- Shared operator menu configuration (category order, labels, hidden flags, etc.).
create table if not exists public.site_operator_menus (
  id text primary key default 'default',
  payload jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now(),
  updated_by text
);

insert into public.site_operator_menus (id, payload)
values ('default', '{}'::jsonb)
on conflict (id) do nothing;

alter table public.site_operator_menus enable row level security;

create policy "Operator menus are viewable by everyone"
  on public.site_operator_menus for select
  using (true);

alter table public.site_operator_menus replica identity full;

do $$
begin
  alter publication supabase_realtime add table public.site_operator_menus;
exception
  when duplicate_object then null;
end $$;
