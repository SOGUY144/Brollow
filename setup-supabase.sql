-- Brollow marketplace schema (live mode)
-- Target: Supabase (PostgreSQL)

create extension if not exists btree_gist;

create or replace function public.app_today() returns date
language sql stable as $$ select (now() at time zone 'Asia/Bangkok')::date $$;

-- Profiles ------------------------------------------------------------------
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text not null check (char_length(display_name) between 1 and 60),
  area text not null default '' check (char_length(area) <= 80),
  bio text not null default '' check (char_length(bio) <= 500),
  member_since date not null default public.app_today(),
  is_demo boolean not null default false
);

create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, coalesce(nullif(trim(new.raw_user_meta_data ->> 'display_name'), ''), split_part(new.email, '@', 1)))
  on conflict (id) do nothing;
  return new;
end $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

-- Items ---------------------------------------------------------------------
create table if not exists public.items (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles (id) on delete cascade,
  title text not null check (char_length(title) between 5 and 80),
  description text not null check (char_length(description) between 20 and 2000),
  category text not null check (category in (
    'cameras-photography', 'electronics', 'camping-outdoors', 'tools-diy',
    'music-equipment', 'sports-equipment', 'party-equipment')),
  daily_price_satang integer not null check (daily_price_satang between 2000 and 2000000),
  location text not null check (char_length(location) between 2 and 80),
  condition text not null check (condition in ('like_new', 'good', 'fair')),
  rules text[] not null default '{}',
  images text[] not null default '{}' check (cardinality(images) <= 5),
  available_from date,
  available_until date,
  pickup_latitude double precision,
  pickup_longitude double precision,
  status text not null default 'active' check (status in ('active', 'paused')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (available_from is null or available_until is null or available_until >= available_from),
  constraint items_pickup_coordinates_valid check (
    (pickup_latitude is null and pickup_longitude is null) or
    (pickup_latitude is not null and pickup_longitude is not null and
     pickup_latitude between -90 and 90 and pickup_longitude between -180 and 180)
  )
);
create index if not exists items_owner_idx on public.items (owner_id);

create or replace function public.touch_updated_at() returns trigger
language plpgsql as $$ begin new.updated_at = now(); return new; end $$;

drop trigger if exists items_touch on public.items;
create trigger items_touch before update on public.items
  for each row execute function public.touch_updated_at();

-- Reviews -------------------------------------------------------------------
create table if not exists public.reviews (
  id uuid primary key default gen_random_uuid(),
  item_id uuid not null references public.items (id) on delete cascade,
  author_name text not null,
  rating integer not null check (rating between 1 and 5),
  comment text not null default '',
  created_at date not null default public.app_today(),
  is_demo boolean not null default false
);
create index if not exists reviews_item_idx on public.reviews (item_id);

-- Favorites -----------------------------------------------------------------
create table if not exists public.favorites (
  user_id uuid not null references public.profiles (id) on delete cascade,
  item_id uuid not null references public.items (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, item_id)
);
alter table public.favorites enable row level security;
drop policy if exists "Users manage their own favorites" on public.favorites;
create policy "Users manage their own favorites" on public.favorites for all to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());

-- Bookings with Escrow & Handover support ------------------------------------
create table if not exists public.bookings (
  id uuid primary key default gen_random_uuid(),
  item_id uuid not null references public.items (id) on delete restrict,
  renter_id uuid not null references public.profiles (id) on delete cascade,
  owner_id uuid not null references public.profiles (id) on delete cascade,
  start_date date not null,
  end_date date not null,
  days integer not null check (days >= 1),
  daily_price_satang integer not null check (daily_price_satang >= 0),
  total_satang integer not null check (total_satang >= 0),
  status text not null default 'pending' check (status in (
    'pending', 'confirmed', 'approved', 'escrow_held', 'picked_up', 'returned', 'completed', 'declined', 'cancelled'
  )),
  message text not null default '' check (char_length(message) <= 500),
  pickup_photo_url text,
  pickup_note text,
  picked_up_at timestamptz,
  payout_status text default 'held',
  return_photo_url text,
  returned_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (end_date >= start_date),
  check (renter_id <> owner_id),
  constraint bookings_no_overlap exclude using gist (
    item_id with =, daterange(start_date, end_date, '[]') with &&
  ) where (status in ('confirmed', 'approved', 'escrow_held', 'picked_up'))
);
create index if not exists bookings_item_idx on public.bookings (item_id);
create index if not exists bookings_renter_idx on public.bookings (renter_id);
create index if not exists bookings_owner_idx on public.bookings (owner_id);

-- Blocked ranges function
create or replace function public.item_blocked_ranges(p_item_ids uuid[] default null)
returns table (item_id uuid, start_date date, end_date date)
language sql stable security definer set search_path = public as $$
  select b.item_id, b.start_date, b.end_date
  from public.bookings b
  where b.status in ('confirmed', 'approved', 'escrow_held', 'picked_up')
    and (p_item_ids is null or b.item_id = any (p_item_ids))
$$;

-- Request booking function
create or replace function public.request_booking(p_item_id uuid, p_start date, p_end date, p_message text default '')
returns public.bookings
language plpgsql security definer set search_path = public as $$
declare
  v_uid uuid := auth.uid();
  v_item public.items;
  v_days integer;
  v_booking public.bookings;
begin
  if v_uid is null then raise exception 'Please log in to request a rental.'; end if;
  if p_start is null or p_end is null then raise exception 'Choose a start and end date.'; end if;
  if p_start < public.app_today() then raise exception 'The start date can''t be in the past.'; end if;
  if p_end < p_start then raise exception 'The end date can''t be before the start date.'; end if;
  v_days := p_end - p_start + 1;
  if v_days > 30 then raise exception 'Rentals can be at most 30 days.'; end if;

  select * into v_item from public.items where id = p_item_id and status = 'active';
  if not found then raise exception 'This item is no longer listed.'; end if;
  if v_item.owner_id = v_uid then raise exception 'You can''t rent your own item.'; end if;
  if (v_item.available_from is not null and p_start < v_item.available_from)
     or (v_item.available_until is not null and p_end > v_item.available_until) then
    raise exception 'The item isn''t available for those dates.';
  end if;
  if exists (select 1 from public.bookings b where b.item_id = p_item_id and b.status in ('confirmed', 'approved', 'escrow_held', 'picked_up')
             and daterange(b.start_date, b.end_date, '[]') && daterange(p_start, p_end, '[]')) then
    raise exception 'The item isn''t available for those dates.';
  end if;

  insert into public.bookings (item_id, renter_id, owner_id, start_date, end_date, days, daily_price_satang, total_satang, message)
  values (p_item_id, v_uid, v_item.owner_id, p_start, p_end, v_days, v_item.daily_price_satang,
          v_item.daily_price_satang * v_days, left(coalesce(p_message, ''), 500))
  returning * into v_booking;
  return v_booking;
end $$;

-- Update status and inspection details
create or replace function public.set_booking_status(
  p_booking_id uuid,
  p_status text,
  p_pickup_photo_url text default null,
  p_pickup_note text default null
)
returns public.bookings
language plpgsql security definer set search_path = public as $$
declare
  v_uid uuid := auth.uid();
  v_booking public.bookings;
  v_is_owner boolean;
  v_is_renter boolean;
begin
  select * into v_booking from public.bookings where id = p_booking_id for update;
  if not found then raise exception 'Booking not found.'; end if;
  v_is_owner := v_uid = v_booking.owner_id;
  v_is_renter := v_uid = v_booking.renter_id;
  if not (v_is_owner or v_is_renter) then raise exception 'You can''t change this booking.'; end if;

  if v_booking.status = 'pending' and p_status in ('approved', 'confirmed', 'declined') then
    if not v_is_owner then raise exception 'Only the owner can accept or decline a request.'; end if;
  elsif v_booking.status = 'pending' and p_status = 'cancelled' then
    if not v_is_renter then raise exception 'Owners decline requests rather than cancelling them.'; end if;
  elsif v_booking.status in ('approved', 'confirmed') and p_status = 'escrow_held' then
    if not v_is_renter then raise exception 'Only the renter can pay.'; end if;
  elsif v_booking.status = 'escrow_held' and p_status = 'picked_up' then
    if not v_is_renter then raise exception 'Only the renter can confirm item inspection and pickup.'; end if;
  elsif v_booking.status = 'picked_up' and p_status in ('returned', 'completed') then
    -- owner or renter
  elsif v_booking.status = 'returned' and p_status = 'completed' then
    -- owner confirms completion
  elsif v_booking.status in ('confirmed', 'approved', 'escrow_held') and p_status = 'cancelled' then
    if v_booking.start_date <= public.app_today() then
      raise exception 'Bookings can only be cancelled before the start date.';
    end if;
  else
    raise exception 'A % booking can''t become %.', v_booking.status, p_status;
  end if;

  update public.bookings
  set status = p_status,
      pickup_photo_url = coalesce(p_pickup_photo_url, pickup_photo_url),
      pickup_note = coalesce(p_pickup_note, pickup_note),
      picked_up_at = case when p_status = 'picked_up' then now() else picked_up_at end,
      payout_status = case when p_status = 'picked_up' then 'released' else payout_status end,
      updated_at = now()
  where id = p_booking_id
  returning * into v_booking;

  -- Auto-credit owner's wallet on inspection confirmation
  if p_status = 'picked_up' then
    update public.profiles
    set wallet_balance_satang = wallet_balance_satang + v_booking.total_satang
    where id = v_booking.owner_id;

    insert into public.wallet_transactions (user_id, amount_satang, type, reference_id, description)
    select v_booking.owner_id, v_booking.total_satang, 'escrow_payout', p_booking_id,
           'Rental payout for ' || coalesce(i.title, 'equipment')
    from public.items i where i.id = v_booking.item_id;
  end if;

  return v_booking;
end $$;

-- Row Level Security (RLS)
alter table public.profiles enable row level security;
alter table public.items enable row level security;
alter table public.reviews enable row level security;
alter table public.bookings enable row level security;

-- Profiles RLS
drop policy if exists "Profiles are public" on public.profiles;
create policy "Profiles are public" on public.profiles for select using (true);
drop policy if exists "Users edit own profile" on public.profiles;
create policy "Users edit own profile" on public.profiles for update to authenticated
  using (id = auth.uid()) with check (id = auth.uid());

-- Items RLS
drop policy if exists "Active listings are public" on public.items;
create policy "Active listings are public" on public.items for select
  using (status = 'active' or owner_id = auth.uid());
drop policy if exists "Users create listings" on public.items;
create policy "Users create listings" on public.items for insert to authenticated
  with check (owner_id = auth.uid());
drop policy if exists "Users update own listings" on public.items;
create policy "Users update own listings" on public.items for update to authenticated
  using (owner_id = auth.uid()) with check (owner_id = auth.uid());

-- Reviews RLS
drop policy if exists "Reviews are public" on public.reviews;
create policy "Reviews are public" on public.reviews for select using (true);

-- Bookings RLS
drop policy if exists "Bookings visible to parties" on public.bookings;
create policy "Bookings visible to parties" on public.bookings for select to authenticated
  using (renter_id = auth.uid() or owner_id = auth.uid());

-- Permissions
grant execute on function public.request_booking(uuid, date, date, text) to authenticated;
grant execute on function public.set_booking_status(uuid, text, text, text) to authenticated;
grant execute on function public.item_blocked_ranges(uuid[]) to anon, authenticated;

-- Storage: public listing photos & handover inspection photos
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('item-images', 'item-images', true, 5242880, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do nothing;

drop policy if exists "Listing photos are public" on storage.objects;
create policy "Listing photos are public" on storage.objects for select
  using (bucket_id = 'item-images');
drop policy if exists "Users upload to their own folder" on storage.objects;
create policy "Users upload to their own folder" on storage.objects for insert to authenticated
  with check (bucket_id = 'item-images' and (storage.foldername(name))[1] = auth.uid()::text);
drop policy if exists "Users delete their own photos" on storage.objects;
create policy "Users delete their own photos" on storage.objects for delete to authenticated
  using (bucket_id = 'item-images' and (storage.foldername(name))[1] = auth.uid()::text);

-- Wallet additions -----------------------------------------------------------
alter table public.profiles
  add column if not exists wallet_balance_satang bigint not null default 0 check (wallet_balance_satang >= 0);

create table if not exists public.wallet_transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  amount_satang bigint not null,
  type text not null check (type in ('deposit', 'withdrawal', 'escrow_payout', 'rental_payment')),
  reference_id uuid,
  description text not null,
  created_at timestamptz not null default now()
);

create index if not exists wallet_tx_user_idx on public.wallet_transactions (user_id, created_at desc);

alter table public.wallet_transactions enable row level security;
drop policy if exists "Users view own wallet transactions" on public.wallet_transactions;
create policy "Users view own wallet transactions" on public.wallet_transactions
  for select to authenticated using (user_id = auth.uid());

create or replace function public.deposit_wallet(p_amount_satang bigint)
returns bigint language plpgsql security definer set search_path = public as $$
declare
  v_uid uuid := auth.uid();
  v_new_balance bigint;
begin
  if v_uid is null then raise exception 'Not authenticated'; end if;
  if p_amount_satang <= 0 then raise exception 'Deposit must be greater than zero'; end if;
  if p_amount_satang > 10000000 then raise exception 'Deposit amount exceeds limit (฿100,000)'; end if;

  update public.profiles set wallet_balance_satang = wallet_balance_satang + p_amount_satang
  where id = v_uid returning wallet_balance_satang into v_new_balance;

  insert into public.wallet_transactions (user_id, amount_satang, type, description)
  values (v_uid, p_amount_satang, 'deposit', 'Deposit via Mock PromptPay / Card');
  return v_new_balance;
end $$;

create or replace function public.withdraw_wallet(p_amount_satang bigint, p_destination text default 'Bank Account')
returns bigint language plpgsql security definer set search_path = public as $$
declare
  v_uid uuid := auth.uid();
  v_curr bigint;
  v_new_balance bigint;
begin
  if v_uid is null then raise exception 'Not authenticated'; end if;
  if p_amount_satang <= 0 then raise exception 'Withdrawal must be greater than zero'; end if;

  select wallet_balance_satang into v_curr from public.profiles where id = v_uid for update;
  if not found then raise exception 'Profile not found'; end if;
  if v_curr < p_amount_satang then raise exception 'Insufficient wallet balance'; end if;

  update public.profiles set wallet_balance_satang = wallet_balance_satang - p_amount_satang
  where id = v_uid returning wallet_balance_satang into v_new_balance;

  insert into public.wallet_transactions (user_id, amount_satang, type, description)
  values (v_uid, -p_amount_satang, 'withdrawal', 'Withdrawal to ' || coalesce(nullif(trim(p_destination), ''), 'Bank Account'));
  return v_new_balance;
end $$;

grant execute on function public.deposit_wallet(bigint) to authenticated;
grant execute on function public.withdraw_wallet(bigint, text) to authenticated;

