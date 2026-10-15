-- Optional owner-provided pickup point; existing listings keep their area-only fallback.
alter table public.items
  add column pickup_latitude double precision,
  add column pickup_longitude double precision,
  add constraint items_pickup_coordinates_valid check (
    (pickup_latitude is null and pickup_longitude is null) or
    (pickup_latitude is not null and pickup_longitude is not null and
     pickup_latitude between -90 and 90 and pickup_longitude between -180 and 180)
  );
