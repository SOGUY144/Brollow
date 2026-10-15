-- =============================================================================
-- BROLLOW COMBINED MIGRATION (Ratings System + Wallet & Escrow Payouts)
-- Paste this script into your Supabase project's SQL Editor and click RUN.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- PART 1: User Ratings (Two-way rating system by your friend)
-- -----------------------------------------------------------------------------

create table if not exists public.user_ratings (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null references public.bookings (id) on delete cascade,
  rater_id uuid not null references public.profiles (id) on delete cascade,
  ratee_id uuid not null references public.profiles (id) on delete cascade,
  role text not null check (role in ('owner', 'renter')),
  score integer not null check (score between 1 and 5),
  tags text[] not null default '{}',
  comment text not null default '' check (char_length(comment) <= 500),
  created_at timestamptz not null default now(),
  is_demo boolean not null default false,
  unique (booking_id, rater_id),
  check (rater_id <> ratee_id),
  check (
    (role = 'owner' and tags <@ array['on_time', 'as_described', 'fair_charges', 'communicative']) or
    (role = 'renter' and tags <@ array['returned_on_time', 'good_care', 'communicative'])
  )
);

create index if not exists user_ratings_ratee_idx on public.user_ratings (ratee_id);

alter table public.user_ratings enable row level security;

drop policy if exists "Ratings are public" on public.user_ratings;
create policy "Ratings are public" on public.user_ratings for select using (true);

create or replace function public.submit_rating(p_booking_id uuid, p_score integer, p_tags text[], p_comment text default '')
returns public.user_ratings
language plpgsql security definer set search_path = public as $$
declare
  v_uid uuid := auth.uid();
  v_booking public.bookings;
  v_role text;
  v_ratee uuid;
  v_rating public.user_ratings;
begin
  if v_uid is null then raise exception 'Please log in to rate.'; end if;
  select * into v_booking from public.bookings where id = p_booking_id;
  if not found then raise exception 'Booking not found.'; end if;

  if v_uid = v_booking.renter_id then
    v_role := 'owner'; v_ratee := v_booking.owner_id;
  elsif v_uid = v_booking.owner_id then
    v_role := 'renter'; v_ratee := v_booking.renter_id;
  else
    raise exception 'Only the renter and owner can rate this rental.';
  end if;

  if v_booking.status <> 'confirmed' and v_booking.status <> 'completed' and v_booking.status <> 'picked_up' then
    raise exception 'Only active or finished rentals can be rated.';
  end if;
  if v_booking.end_date >= public.app_today() then raise exception 'You can rate after the return date.'; end if;
  if public.app_today() > v_booking.end_date + 30 then raise exception 'The rating period for this rental has ended.'; end if;
  if p_score is null or p_score not between 1 and 5 then raise exception 'Choose a score from 1 to 5 stars.'; end if;

  begin
    insert into public.user_ratings (booking_id, rater_id, ratee_id, role, score, tags, comment)
    values (p_booking_id, v_uid, v_ratee, v_role, p_score, coalesce(p_tags, '{}'), left(trim(coalesce(p_comment, '')), 500))
    returning * into v_rating;
  exception
    when unique_violation then raise exception 'You''ve already rated this rental.';
    when check_violation then raise exception 'One of the selected tags doesn''t apply here.';
  end;
  return v_rating;
end $$;

revoke all on function public.submit_rating(uuid, integer, text[], text) from public, anon;
grant execute on function public.submit_rating(uuid, integer, text[], text) to authenticated;


-- -----------------------------------------------------------------------------
-- PART 2: Wallet & Escrow Payouts (Wallet Balance, Transactions & Handover Payout)
-- -----------------------------------------------------------------------------

-- 1. Add wallet balance column to profiles
alter table public.profiles
  add column if not exists wallet_balance_satang bigint not null default 0 check (wallet_balance_satang >= 0);

-- 2. Create wallet transactions table
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
  for select to authenticated
  using (user_id = auth.uid());

-- 3. Deposit RPC function
create or replace function public.deposit_wallet(p_amount_satang bigint)
returns bigint
language plpgsql security definer set search_path = public as $$
declare
  v_uid uuid := auth.uid();
  v_new_balance bigint;
begin
  if v_uid is null then raise exception 'Not authenticated'; end if;
  if p_amount_satang <= 0 then raise exception 'Deposit must be greater than zero'; end if;
  if p_amount_satang > 10000000 then raise exception 'Deposit amount exceeds limit (฿100,000)'; end if;

  update public.profiles
  set wallet_balance_satang = wallet_balance_satang + p_amount_satang
  where id = v_uid
  returning wallet_balance_satang into v_new_balance;

  insert into public.wallet_transactions (user_id, amount_satang, type, description)
  values (v_uid, p_amount_satang, 'deposit', 'Deposit via Mock PromptPay / Card');

  return v_new_balance;
end $$;

-- 4. Withdraw RPC function
create or replace function public.withdraw_wallet(p_amount_satang bigint, p_destination text default 'Bank Account')
returns bigint
language plpgsql security definer set search_path = public as $$
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

  update public.profiles
  set wallet_balance_satang = wallet_balance_satang - p_amount_satang
  where id = v_uid
  returning wallet_balance_satang into v_new_balance;

  insert into public.wallet_transactions (user_id, amount_satang, type, description)
  values (v_uid, -p_amount_satang, 'withdrawal', 'Withdrawal to ' || coalesce(nullif(trim(p_destination), ''), 'Bank Account'));

  return v_new_balance;
end $$;

-- 5. Updated set_booking_status RPC (Escrow release & photo handover)
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
  v_item_title text;
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

    select title into v_item_title from public.items where id = v_booking.item_id;

    insert into public.wallet_transactions (user_id, amount_satang, type, reference_id, description)
    values (
      v_booking.owner_id,
      v_booking.total_satang,
      'escrow_payout',
      p_booking_id,
      'Rental payout for ' || coalesce(v_item_title, 'equipment')
    );
  end if;

  return v_booking;
end $$;

-- 6. Updated item_blocked_ranges to block items during active rental lifecycle
create or replace function public.item_blocked_ranges(p_item_ids uuid[] default null)
returns table (item_id uuid, start_date date, end_date date)
language sql stable security definer set search_path = public as $$
  select b.item_id, b.start_date, b.end_date
  from public.bookings b
  where b.status in ('confirmed', 'approved', 'escrow_held', 'picked_up')
    and b.end_date >= public.app_today()
    and (p_item_ids is null or b.item_id = any (p_item_ids))
$$;

grant execute on function public.deposit_wallet(bigint) to authenticated;
grant execute on function public.withdraw_wallet(bigint, text) to authenticated;
grant execute on function public.item_blocked_ranges(uuid[]) to anon, authenticated;
