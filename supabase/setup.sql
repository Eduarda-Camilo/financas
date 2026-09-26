create table if not exists public.finance_data (
  user_id uuid primary key references auth.users (id) on delete cascade,
  data jsonb not null,
  updated_at timestamptz not null default now()
);
alter table public.finance_data enable row level security;
revoke all on public.finance_data from anon;
revoke all on public.finance_data from authenticated;
grant select, insert, update on public.finance_data to authenticated;
drop policy if exists "Users can access their own financial data" on public.finance_data;
create policy "Users can access their own financial data" on public.finance_data
  for all to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
