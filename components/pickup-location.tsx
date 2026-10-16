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

  // Check if staticCoords came from the default fallback because the location string is custom
  const isCustomLocation =
    staticCoords.latitude === 13.7563 &&
    staticCoords.longitude === 100.5018 &&
    !item.location.toLowerCase().includes("bangkok") &&
    !item.location.includes("กรุงเทพ");

  useEffect(() => {
    if (!isCustomLocation) return;
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
  }, [item.location, isCustomLocation]);

  const point =
    isCustomLocation && geocoded?.query === item.location.trim()
      ? geocoded.coords
      : staticCoords;

  const distance = distanceKm(origin, point);

  // Neighborhood street-level bounding box (minLon, minLat, maxLon, maxLat)
  const bbox = [
    Math.max(-180, point.longitude - 0.018),
    Math.max(-90, point.latitude - 0.012),
    Math.min(180, point.longitude + 0.018),
    Math.min(90, point.latitude + 0.012),
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
    <section aria-label="Owner and pickup location" className="space-y-3">
      <div className="grid overflow-hidden rounded-2xl border border-[#d6e2c4] bg-gradient-to-br from-[#ffffff] via-[#f8fbf3] to-[#f1f6e8] text-[#17281f] shadow-sm md:grid-cols-[1.1fr_1fr]">
        {/* Left Column: Brollow Forest & Sage Owner Card */}
        <div className="flex flex-col justify-between p-6 sm:p-7">
          <div>
            {/* Owner Header */}
            <div className="flex items-center gap-4">
              <div
                className="flex size-14 shrink-0 items-center justify-center rounded-full bg-[#124e3b] text-xl font-bold text-[#e3edc8] shadow-xs ring-4 ring-[#e3edc8]/70"
                aria-hidden="true"
              >
                {ownerName.slice(0, 1).toUpperCase()}
              </div>
              <div className="min-w-0">
                <h2 className="truncate text-xl font-bold tracking-tight text-[#17281f] sm:text-2xl">
                  Owned by{" "}
                  <span className="text-[#124e3b] underline decoration-[#c5db9b] decoration-2 underline-offset-4">
                    {ownerName}
                  </span>
                </h2>
                <div className="mt-1.5 flex items-center gap-2">
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
                            ? "fill-[#166534] text-[#166534]"
                            : "fill-[#dce6cf] text-[#dce6cf]"
                        )}
                        aria-hidden="true"
                      />
                    ))}
                  </span>
                  <span className="text-sm font-semibold text-[#475d50]">
                    {Number.isInteger(displayScore)
                      ? `${displayScore}/5`
                      : `${displayScore.toFixed(1)}/5`}
                  </span>
                  {item.owner?.isDemo && (
                    <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-medium text-amber-900">
                      Demo profile
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* 5 Trust & Location Checklist Rows */}
            <ul className="mt-6 space-y-3.5 text-[15px] text-[#22352b]">
              <li className="flex items-center gap-3">
                <CheckCircle2
                  className="size-5 shrink-0 text-[#15803d]"
                  aria-hidden="true"
                />
                <span>
                  <strong className="font-medium text-[#17281f]">
                    Identified
                  </strong>
                  {item.owner?.memberSince && (
                    <span className="text-[#566c5f]">
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
                  className="size-5 shrink-0 text-[#124e3b]"
                  aria-hidden="true"
                />
                <span>Usually responds within a few hours</span>
              </li>

              <li className="flex items-center gap-3">
                <MessageCircle
                  className="size-5 shrink-0 text-[#124e3b]"
                  aria-hidden="true"
                />
                <span>98% response rate</span>
              </li>

              <li className="flex flex-wrap items-center gap-x-3 gap-y-1">
                <div className="flex items-center gap-3">
                  <Map
                    className="size-5 shrink-0 text-[#124e3b]"
                    aria-hidden="true"
                  />
                  <span>
                    <strong className="font-medium text-[#17281f]">
                      {item.location}
                    </strong>{" "}
                    {distance !== null && (
                      <strong className="font-bold text-[#124e3b]">
                        · {distance.toFixed(1)} km
                      </strong>
                    )}
                  </span>
                </div>
                {distance === null && (
                  <button
                    type="button"
                    onClick={locate}
                    disabled={busy}
                    className="inline-flex items-center gap-1 rounded-full border border-[#c7d9b0] bg-[#e3edc8]/60 px-2.5 py-0.5 text-xs font-medium text-[#124e3b] transition hover:bg-[#d8e8b5] disabled:opacity-50"
                  >
                    <LocateFixed className="size-3" aria-hidden="true" />
                    {busy ? "Locating…" : "Show distance"}
                  </button>
                )}
              </li>

              <li className="flex items-start gap-3">
                <LifeBuoy
                  className="mt-0.5 size-5 shrink-0 text-[#124e3b]"
                  aria-hidden="true"
                />
                <span>
                  Protected by Brollow Escrow without excess.{" "}
                  <Link
                    href={`/search?location=${encodeURIComponent(item.location)}`}
                    className="font-semibold text-[#124e3b] underline decoration-[#124e3b]/40 underline-offset-2 hover:decoration-[#124e3b]"
                  >
                    Browse area
                  </Link>
                </span>
              </li>
            </ul>

            {item.owner?.bio && (
              <p className="mt-4 border-t border-[#dce6cf] pt-3 text-xs leading-relaxed text-[#52685b]">
                “{item.owner.bio}”
              </p>
            )}
          </div>

          {/* Bottom Full-Width Pill Button */}
          <div className="mt-6">
            <button
              type="button"
              onClick={handleMessageClick}
              className="w-full rounded-full border-2 border-[#124e3b] bg-white px-5 py-2.5 text-sm font-semibold text-[#124e3b] shadow-2xs transition hover:bg-[#124e3b] hover:text-white"
            >
              Send message
            </button>
          </div>
        </div>

        {/* Right Column: Full-Bleed Map with Brollow Emerald Radius Circle */}
        <div className="relative min-h-[280px] w-full overflow-hidden border-t border-[#d6e2c4] bg-[#e5ece0] md:min-h-full md:border-t-0 md:border-l">
          <iframe
            title={`Pickup map: ${item.location}`}
            loading="lazy"
            referrerPolicy="no-referrer"
            className="h-full min-h-[280px] w-full border-0"
            src={`https://www.openstreetmap.org/export/embed.html?bbox=${encodeURIComponent(
              bbox
            )}&layer=mapnik`}
          />

          {/* Translucent Approximate Pickup Radius Circle (Brollow Emerald/Sage style) */}
          <div
            className="pointer-events-none absolute inset-0 flex items-center justify-center"
            aria-hidden="true"
          >
            <div className="flex size-44 items-center justify-center rounded-full border-2 border-[#124e3b]/55 bg-[#124e3b]/18 shadow-inner sm:size-52">
              <div className="size-3.5 rounded-full bg-[#124e3b] ring-4 ring-white/90" />
            </div>
          </div>

          {/* Floating Open Map Link */}
          <a
            href={`https://www.openstreetmap.org/?mlat=${point.latitude}&mlon=${point.longitude}#map=15/${point.latitude}/${point.longitude}`}
            target="_blank"
            rel="noreferrer"
            className="absolute left-3 top-3 inline-flex items-center gap-1.5 rounded-full border border-[#d6e2c4] bg-white/95 px-3 py-1 text-xs font-semibold text-[#124e3b] shadow-xs backdrop-blur-xs transition hover:bg-[#f4f8ed]"
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
