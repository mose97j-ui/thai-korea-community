-- Let Google-logged-in members upsert their own row when Vercel service role sync is unavailable.
create policy "Authenticated users insert own member_registry"
  on public.member_registry
  for insert
  to authenticated
  with check (lower(gmail) = lower((auth.jwt() ->> 'email')));

create policy "Authenticated users update own member_registry"
  on public.member_registry
  for update
  to authenticated
  using (lower(gmail) = lower((auth.jwt() ->> 'email')))
  with check (lower(gmail) = lower((auth.jwt() ->> 'email')));
