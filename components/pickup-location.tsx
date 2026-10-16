"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  CheckCircle2,
  Clock,
  ExternalLink,
  Heart,
  LifeBuoy,
  LocateFixed,
  Map,
  MessageCircle,
} from "lucide-react";
import { useLocation } from "@/components/location-context";
import { RatingList, ReputationLine } from "@/components/reputation";
import {
   type Coordinates,
  distanceKm,
  resolveItemCoordinates,
  validCoordinates,
} from "@/lib/domain/location";
import { reputationOf } from "@/lib/domain/ratings";
import { formatDate } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { ItemSummary, UserRating } from "@/lib/types";

export function PickupLocation({
  item,
  ownerRatings = [],
}: {
  item: ItemSummary;
  ownerRatings?: UserRating[];
}) {
  const { origin, busy, locate } = useLocation();
  const staticCoords = resolveItemCoordinates(item.location, item.coordinates);
  const [geocoded, setGeocoded] = useState<{
    query: string;
    coords: Coordinates;
  } | null>(null);

  const hasExplicitValidCoords =
    validCoordinates(item.coordinates) &&
    !(
      Math.abs(item.coordinates.latitude) < 0.001 &&
      Math.abs(item.coordinates.longitude) < 0.001
    );

  // If no explicit coords, also try live Nominatim geocoding for custom place names
  useEffect(() => {
    if (hasExplicitValidCoords) return;
    const query = item.location.trim();
    if (!query) return;

    let active = true;
    const controller = new AbortController();

    fetch(
      `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(
        query
      )}`,
      {
        signal: controller.signal,
        headers: { "Accept-Language": "en,th" },
      }
    )
      .then((res) => (res.ok ? res.json() : []))
      .then((data: Array<{ lat?: string; lon?: string }>) => {
        if (!active || !Array.isArray(data) || data.length === 0) return;
        const lat = Number(data[0]?.lat);
        const lon = Number(data[0]?.lon);
        if (Number.isFinite(lat) && Number.isFinite(lon)) {
          setGeocoded({
            query,
            coords: { latitude: lat, longitude: lon },
          });
        }
      })
      .catch(() => {
        // Fallback to static coordinates silently
      });

    return () => {
      active = false;
      controller.abort();
    };
  }, [item.location, hasExplicitValidCoords]);

  const point =
    !hasExplicitValidCoords && geocoded?.query === item.location.trim()
      ? geocoded.coords
      : staticCoords;

  const distance = distanceKm(origin, point);

  // Zoomed neighborhood bounding box without default marker pin
  const bbox = [
    Math.max(-180, point.longitude - 0.022),
    Math.max(-90, point.latitude - 0.015),
    Math.min(180, point.longitude + 0.022),
    Math.min(90, point.latitude + 0.015),
  ].join(",");

  const ownerName = item.owner?.displayName ?? "Verified Owner";
  const ownerRep = reputationOf(item.ownerId, ownerRatings).asOwner;
  const displayScore =
    ownerRep.average !== null
      ? ownerRep.average
      : item.rating !== null
        ? item.rating
        : 5;
  const filledHearts = Math.max(1, Math.min(5, Math.round(displayScore)));

  const handleMessageClick = () => {
    const messageInput = document.getElementById(
      "booking-message-input"
    ) as HTMLTextAreaElement | null;
    const bookingPanel = document.getElementById("booking-panel");
    if (bookingPanel) {
      bookingPanel.scrollIntoView({ behavior: "smooth", block: "center" });
    }
    if (messageInput) {
      setTimeout(() => messageInput.focus(), 350);
    }
  };

  return (
    <section
      aria-label="Owner and pickup location"
      className="space-y-3"
    >
      <div className="grid overflow-hidden rounded-2xl border border-zinc-800 bg-[#18191e] text-white shadow-xl md:grid-cols-[1.1fr_1fr]">
        {/* Left Column: Hygglo-style Owner & Trust Info */}
        <div className="flex flex-col justify-between p-6 sm:p-7">
          <div>
            {/* Owner Header */}
            <div className="flex items-center gap-4">
              <div
                className="flex size-14 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-emerald-500 to-teal-700 text-xl font-bold text-white shadow-md ring-2 ring-white/15"
                aria-hidden="true"
              >
                {ownerName.slice(0, 1).toUpperCase()}
              </div>
              <div className="min-w-0">
                <h2 className="truncate text-xl font-bold tracking-tight sm:text-2xl">
                  Owned by{" "}
                  <span className="text-[#a855f7]">{ownerName}</span>
                </h2>
                <div className="mt-1 flex items-center gap-2">
                  <span
                    className="flex items-center gap-1"
                    aria-label={`Rated ${displayScore.toFixed(1)} out of 5`}
                  >
                    {Array.from({ length: 5 }, (_, i) => (
                      <Heart
                        key={i}
                        className={cn(
                          "size-4",
                          i < filledHearts
                            ? "fill-rose-500 text-rose-500"
                            : "fill-zinc-700 text-zinc-700"
                        )}
                        aria-hidden="true"
                      />
                    ))}
                  </span>
                  <span className="text-sm font-medium text-zinc-400">
                    {Number.isInteger(displayScore)
                      ? `${displayScore}/5`
                      : `${displayScore.toFixed(1)}/5`}
                  </span>
                  {item.owner?.isDemo && (
                    <span className="rounded-full bg-amber-500/20 px-2 py-0.5 text-[11px] font-medium text-amber-300">
                      Demo profile
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* 5 Trust & Location Checklist Rows */}
            <ul className="mt-6 space-y-3.5 text-[15px] text-zinc-100">
              <li className="flex items-center gap-3">
                <CheckCircle2
                  className="size-5 shrink-0 text-emerald-400"
                  aria-hidden="true"
                />
                <span>
                  Identified
                  {item.owner?.memberSince && (
                    <span className="text-zinc-400">
                      {" "}
                      · Member since{" "}
                      {formatDate(item.owner.memberSince, {
                        month: "short",
                        year: "numeric",
                      })}
                    </span>
                  )}
                </span>
              </li>

              <li className="flex items-center gap-3">
                <Clock
                  className="size-5 shrink-0 text-zinc-300"
                  aria-hidden="true"
                />
                <span>Usually responds within a few hours</span>
              </li>

              <li className="flex items-center gap-3">
                <MessageCircle
                  className="size-5 shrink-0 text-zinc-300"
                  aria-hidden="true"
                />
                <span>98% response rate</span>
              </li>

              <li className="flex flex-wrap items-center gap-x-3 gap-y-1">
                <div className="flex items-center gap-3">
                  <Map
                    className="size-5 shrink-0 text-zinc-300"
                    aria-hidden="true"
                  />
                  <span>
                    {item.location}{" "}
                    {distance !== null && (
                      <strong className="font-bold text-white">
                        {distance.toFixed(1)} km
                      </strong>
                    )}
                  </span>
                </div>
                {distance === null && (
                  <button
                    type="button"
                    onClick={locate}
                    disabled={busy}
                    className="inline-flex items-center gap-1 rounded-full bg-white/10 px-2.5 py-0.5 text-xs font-medium text-zinc-200 transition hover:bg-white/20 disabled:opacity-50"
                  >
                    <LocateFixed className="size-3" aria-hidden="true" />
                    {busy ? "Locating…" : "Show distance"}
                  </button>
                )}
              </li>

              <li className="flex items-start gap-3">
                <LifeBuoy
                  className="mt-0.5 size-5 shrink-0 text-zinc-300"
                  aria-hidden="true"
                />
                <span>
                  Protected by Brollow Escrow without excess.{" "}
                  <Link
                    href={`/search?location=${encodeURIComponent(item.location)}`}
                    className="font-medium text-[#a855f7] underline underline-offset-2 hover:text-[#c084fc]"
                  >
                    Browse area
                  </Link>
                </span>
              </li>
            </ul>

            {item.owner?.bio && (
              <p className="mt-4 border-t border-white/10 pt-3 text-xs leading-relaxed text-zinc-400">
                “{item.owner.bio}”
              </p>
            )}
          </div>

          {/* Bottom Full-Width Pill Button */}
          <div className="mt-6">
            <button
              type="button"
              onClick={handleMessageClick}
              className="w-full rounded-full border border-[#a855f7]/60 bg-transparent px-5 py-2.5 text-sm font-semibold text-[#c084fc] transition hover:border-[#a855f7] hover:bg-[#a855f7]/15"
            >
              Send message
            </button>
          </div>
        </div>

        {/* Right Column: Full-Bleed Map with Shaded Radius Circle */}
        <div className="relative min-h-[280px] w-full overflow-hidden bg-[#e5e9ec] md:min-h-full">
          <iframe
            title={`Pickup map: ${item.location}`}
            loading="lazy"
            referrerPolicy="no-referrer"
            className="h-full min-h-[280px] w-full border-0"
            src={`https://www.openstreetmap.org/export/embed.html?bbox=${encodeURIComponent(
              bbox
            )}&layer=mapnik`}
          />

          {/* Translucent Approximate Pickup Radius Circle (Hygglo style) */}
          <div
            className="pointer-events-none absolute inset-0 flex items-center justify-center"
            aria-hidden="true"
          >
            <div className="flex size-44 items-center justify-center rounded-full border-2 border-[#9333ea]/45 bg-[#9333ea]/22 shadow-inner sm:size-52">
              <div className="size-3 rounded-full bg-[#7e22ce] ring-4 ring-white/80" />
            </div>
          </div>

          {/* Floating Open Map Link */}
          <a
            href={`https://www.openstreetmap.org/?mlat=${point.latitude}&mlon=${point.longitude}#map=15/${point.latitude}/${point.longitude}`}
            target="_blank"
            rel="noreferrer"
            className="absolute left-3 top-3 inline-flex items-center gap-1.5 rounded-full bg-zinc-900/80 px-3 py-1 text-xs font-medium text-white backdrop-blur-xs transition hover:bg-zinc-900"
          >
            Open pickup map
            <ExternalLink className="size-3" aria-hidden="true" />
          </a>
        </div>
      </div>

      {/* Verified Renter Ratings Summary (if any exist) */}
      {ownerRatings.some((r) => r.role === "owner") && (
        <div className="rounded-xl border bg-card p-4 text-sm">
          <ReputationLine rep={ownerRep} role="owner" className="mb-2" />
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            What renters say about {ownerName}
          </p>
          <div className="mt-2">
            <RatingList ratings={ownerRatings} role="owner" />
          </div>
        </div>
      )}
    </section>
  );
}
