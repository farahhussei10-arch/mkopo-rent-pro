alter table public.clients add column if not exists archived boolean not null default false;
alter table public.clients add column if not exists payment_method text;
alter table public.clients add column if not exists business_type text;
alter table public.profiles add column if not exists reminder_template text;

create table if not exists public.payments (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.clients(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  amount numeric not null,
  payment_method text not null,
  paid_at timestamptz not null default now()
);

alter table public.payments enable row level security;
create policy "Users can manage their payments" on public.payments for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
