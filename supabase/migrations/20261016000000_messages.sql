-- Messages between renter and owner for booking coordination
create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null references public.bookings (id) on delete cascade,
  sender_id uuid not null references public.profiles (id) on delete cascade,
  sender_name text not null default '',
  sender_role text not null check (sender_role in ('renter', 'owner')),
  text text not null check (char_length(text) > 0 and char_length(text) <= 1000),
  created_at timestamptz not null default now()
);

create index if not exists messages_booking_idx on public.messages (booking_id);

alter table public.messages enable row level security;

-- Policy: Only renter and owner of the booking can view messages
drop policy if exists "Renter and owner view messages" on public.messages;
create policy "Renter and owner view messages" on public.messages
  for select to authenticated
  using (
    auth.uid() = sender_id or
    exists (
      select 1 from public.bookings b
      where b.id = messages.booking_id
        and (b.renter_id = auth.uid() or b.owner_id = auth.uid())
    )
  );

-- Policy: Only renter or owner can insert messages for that booking, and sender_id must be themselves
drop policy if exists "Renter and owner send messages" on public.messages;
create policy "Renter and owner send messages" on public.messages
  for insert to authenticated
  with check (
    sender_id = auth.uid()
    and exists (
      select 1 from public.bookings b
      where b.id = messages.booking_id
        and auth.uid() in (b.renter_id, b.owner_id)
    )
  );
