-- Realtime: operator dashboards receive member updates immediately.
alter table public.member_registry replica identity full;

do $$
begin
  alter publication supabase_realtime add table public.member_registry;
exception
  when duplicate_object then null;
end $$;
