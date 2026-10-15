"use client";

import Link from "next/link";
import { LocateButton, useLocation } from "@/components/location-context";
import { distanceKm, validCoordinates } from "@/lib/domain/location";
import type { Item } from "@/lib/types";

export function PickupLocation({ item }: { item: Item }) {
  const { origin } = useLocation();
  const point = validCoordinates(item.coordinates) ? item.coordinates : null;
  const distance = distanceKm(origin, point);
  const bbox = point ? [Math.max(-180, point.longitude - .015), Math.max(-90, point.latitude - .01), Math.min(180, point.longitude + .015), Math.min(90, point.latitude + .01)].join(",") : "";
  return <section className="space-y-3 rounded-2xl border bg-card p-5">
    <h2 className="text-lg font-semibold">Pickup area</h2>
    <p>{item.location}</p>
    {distance !== null && <p className="text-sm font-medium text-primary">Approximately {distance.toFixed(1)} km from you · straight-line distance</p>}
    {point ? <>
      <iframe title={`Pickup map: ${item.location}`} loading="lazy" referrerPolicy="no-referrer" className="h-60 w-full rounded-xl border" src={`https://www.openstreetmap.org/export/embed.html?bbox=${encodeURIComponent(bbox)}&layer=mapnik&marker=${point.latitude},${point.longitude}`} />
      <a href={`https://www.openstreetmap.org/?mlat=${point.latitude}&mlon=${point.longitude}#map=15/${point.latitude}/${point.longitude}`} target="_blank" rel="noreferrer" className="text-sm text-primary underline">Open pickup map</a>
    </> : <p className="text-sm text-muted-foreground">The owner has provided an area only. A map and distance will appear when pickup coordinates are available.</p>}
    <LocateButton />
    <Link href={`/search?location=${encodeURIComponent(item.location)}`} className="inline-block text-sm font-medium text-primary underline">Browse this area</Link>
  </section>;
}
