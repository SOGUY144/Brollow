export interface Coordinates { latitude: number; longitude: number }

export function validCoordinates(value: Coordinates | null | undefined): value is Coordinates {
  return !!value && Number.isFinite(value.latitude) && Number.isFinite(value.longitude)
    && Math.abs(value.latitude) <= 90 && Math.abs(value.longitude) <= 180;
}

/** Great-circle distance, not a road route or travel time. Missing coordinates stay unknown. */
export function distanceKm(a: Coordinates | null | undefined, b: Coordinates | null | undefined): number | null {
  if (!validCoordinates(a) || !validCoordinates(b)) return null;
  const radians = (v: number) => v * Math.PI / 180;
  const h = Math.sin(radians(b.latitude - a.latitude) / 2) ** 2
    + Math.cos(radians(a.latitude)) * Math.cos(radians(b.latitude)) * Math.sin(radians(b.longitude - a.longitude) / 2) ** 2;
  return 6371 * 2 * Math.asin(Math.sqrt(Math.min(1, h)));
}
