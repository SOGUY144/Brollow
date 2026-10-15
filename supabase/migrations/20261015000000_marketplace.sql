-- Brollow marketplace schema (live mode).
-- Rental dates are calendar dates in Europe/London; money is Thai baht stored as integer satang (1 baht = 100 satang).

create extension if not exists btree_gist;

create or replace function public.app_today() returns date
language sql stable as $$ select (now() at time zone 'Europe/London')::date $$;

-- Profiles ------------------------------------------------------------------
create table public.profiles (
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
  values (new.id, coalesce(nullif(trim(new.raw_user_meta_data ->> 'display_name'), ''), split_part(new.email, '@', 1)));
  return new;
end $$;

create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

-- Items ---------------------------------------------------------------------
create table public.items (
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
  status text not null default 'active' check (status in ('active', 'paused')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (available_from is null or available_until is null or available_until >= available_from)
);
create index items_owner_idx on public.items (owner_id);

create or replace function public.touch_updated_at() returns trigger
language plpgsql as $$ begin new.updated_at = now(); return new; end $$;
create trigger items_touch before update on public.items
  for each row execute function public.touch_updated_at();

-- Owners may not reassign a listing to someone else.
create or replace function public.items_keep_owner() returns trigger
language plpgsql as $$
begin
  if new.owner_id <> old.owner_id then raise exception 'Listings cannot change owner.'; end if;
  return new;
end $$;
create trigger items_keep_owner before update on public.items
  for each row execute function public.items_keep_owner();

-- Reviews (read-only from the app in this version) ---------------------------
create table public.reviews (
  id uuid primary key default gen_random_uuid(),
  item_id uuid not null references public.items (id) on delete cascade,
  author_name text not null,
  rating integer not null check (rating between 1 and 5),
  comment text not null default '',
  created_at date not null default public.app_today(),
  is_demo boolean not null default false
);
create index reviews_item_idx on public.reviews (item_id);

-- Bookings ------------------------------------------------------------------
create table public.bookings (
  id uuid primary key default gen_random_uuid(),
  item_id uuid not null references public.items (id) on delete restrict,
  renter_id uuid not null references public.profiles (id) on delete cascade,
  owner_id uuid not null references public.profiles (id) on delete cascade,
  start_date date not null,
  end_date date not null,
  days integer not null check (days >= 1),
  daily_price_satang integer not null check (daily_price_satang >= 0),
  total_satang integer not null check (total_satang >= 0),
  status text not null default 'pending' check (status in ('pending', 'confirmed', 'declined', 'cancelled')),
  message text not null default '' check (char_length(message) <= 500),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (end_date >= start_date),
  check (renter_id <> owner_id),
  -- The database itself refuses two confirmed bookings that share a day.
  constraint bookings_no_overlap exclude using gist (
    item_id with =, daterange(start_date, end_date, '[]') with &&
  ) where (status = 'confirmed')
);
create index bookings_renter_idx on public.bookings (renter_id);
create index bookings_owner_idx on public.bookings (owner_id);

-- Favorites -----------------------------------------------------------------
create table public.favorites (
  user_id uuid not null references public.profiles (id) on delete cascade,
  item_id uuid not null references public.items (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, item_id)
);

-- Row Level Security --------------------------------------------------------
alter table public.profiles enable row level security;
alter table public.items enable row level security;
alter table public.reviews enable row level security;
alter table public.bookings enable row level security;
alter table public.favorites enable row level security;

create policy "Profiles are public" on public.profiles for select using (true);
create policy "Users update their own profile" on public.profiles for update
  using (id = auth.uid()) with check (id = auth.uid());

create policy "Active items are public; owners see their own" on public.items for select
  using (status = 'active' or owner_id = auth.uid());
create policy "Owners create their own items" on public.items for insert to authenticated
  with check (owner_id = auth.uid());
create policy "Owners update their own items" on public.items for update to authenticated
  using (owner_id = auth.uid()) with check (owner_id = auth.uid());

create policy "Reviews are public" on public.reviews for select using (true);

-- Bookings are private to the two people involved. There are no insert/update
-- policies: changes go only through the functions below.
create policy "Renter and owner read a booking" on public.bookings for select to authenticated
  using (auth.uid() in (renter_id, owner_id));

create policy "Users manage their own favorites" on public.favorites for all to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());

-- Booking functions -----------------------------------------------------------
-- Availability for search without exposing who booked.
create or replace function public.item_blocked_ranges(p_item_ids uuid[] default null)
returns table (item_id uuid, start_date date, end_date date)
language sql stable security definer set search_path = public as $$
  select b.item_id, b.start_date, b.end_date
  from public.bookings b
  where b.status = 'confirmed'
    and b.end_date >= public.app_today()
    and (p_item_ids is null or b.item_id = any (p_item_ids))
$$;

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
  if exists (select 1 from public.bookings b where b.item_id = p_item_id and b.status = 'confirmed'
             and daterange(b.start_date, b.end_date, '[]') && daterange(p_start, p_end, '[]')) then
    raise exception 'The item isn''t available for those dates.';
  end if;
  if exists (select 1 from public.bookings b where b.item_id = p_item_id and b.renter_id = v_uid
             and b.status in ('pending', 'confirmed')
             and daterange(b.start_date, b.end_date, '[]') && daterange(p_start, p_end, '[]')) then
    raise exception 'You already have a request for this item on overlapping dates.';
  end if;

  -- Price comes from the stored listing, never from the client.
  insert into public.bookings (item_id, renter_id, owner_id, start_date, end_date, days, daily_price_satang, total_satang, message)
  values (p_item_id, v_uid, v_item.owner_id, p_start, p_end, v_days, v_item.daily_price_satang,
          v_item.daily_price_satang * v_days, left(coalesce(p_message, ''), 500))
  returning * into v_booking;
  return v_booking;
end $$;

create or replace function public.set_booking_status(p_booking_id uuid, p_status text)
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

  if v_booking.status = 'pending' and p_status in ('confirmed', 'declined') then
    if not v_is_owner then raise exception 'Only the owner can accept or decline a request.'; end if;
  elsif v_booking.status = 'pending' and p_status = 'cancelled' then
    if not v_is_renter then raise exception 'Owners decline requests rather than cancelling them.'; end if;
  elsif v_booking.status = 'confirmed' and p_status = 'cancelled' then
    if v_booking.start_date <= public.app_today() then
      raise exception 'Bookings can only be cancelled before the start date.';
    end if;
  else
    raise exception 'A % booking can''t become %.', v_booking.status, p_status;
  end if;

  begin
    update public.bookings set status = p_status, updated_at = now()
    where id = p_booking_id returning * into v_booking;
  exception when exclusion_violation then
    raise exception 'Another confirmed booking already covers these dates. Decline this request instead.';
  end;
  return v_booking;
end $$;

revoke all on function public.request_booking(uuid, date, date, text) from public, anon;
revoke all on function public.set_booking_status(uuid, text) from public, anon;
grant execute on function public.request_booking(uuid, date, date, text) to authenticated;
grant execute on function public.set_booking_status(uuid, text) to authenticated;
grant execute on function public.item_blocked_ranges(uuid[]) to anon, authenticated;

-- Storage: public listing photos, writable only inside the user's own folder.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('item-images', 'item-images', true, 5242880, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do nothing;

create policy "Listing photos are public" on storage.objects for select
  using (bucket_id = 'item-images');
create policy "Users upload to their own folder" on storage.objects for insert to authenticated
  with check (bucket_id = 'item-images' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "Users delete their own photos" on storage.objects for delete to authenticated
  using (bucket_id = 'item-images' and (storage.foldername(name))[1] = auth.uid()::text);
