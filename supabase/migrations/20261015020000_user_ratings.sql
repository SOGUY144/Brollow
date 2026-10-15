-- Two-way ratings after a finished rental.
-- The renter rates the owner (role = 'owner'); the owner rates the renter (role = 'renter').
-- One rating per person per booking, only for confirmed bookings whose return
-- date has passed, within 30 days of it. Ratings are public; writes go only
-- through submit_rating().

create table public.user_ratings (
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
create index user_ratings_ratee_idx on public.user_ratings (ratee_id);

alter table public.user_ratings enable row level security;
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

  if v_booking.status <> 'confirmed' then raise exception 'Only confirmed rentals can be rated.'; end if;
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
