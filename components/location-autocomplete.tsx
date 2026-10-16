"use client";

import { useEffect, useRef, useState } from "react";
import {
  CheckCircle2,
  ChevronDown,
  Loader2,
  LocateFixed,
  MapPin,
  X,
} from "lucide-react";
import type { Coordinates } from "@/lib/domain/location";
import { cn } from "@/lib/utils";

export interface PlaceSuggestion {
  id: string;
  name: string;
  subtitle: string;
  coordinates: Coordinates;
  isPopular?: boolean;
}

// Curated popular hubs across Bangkok & Thailand for instant (0ms) matching
const POPULAR_THAI_HUBS: PlaceSuggestion[] = [
  {
    id: "hub-siam",
    name: "Siam (สยาม / BTS Siam)",
    subtitle: "Pathum Wan, Bangkok",
    coordinates: { latitude: 13.7462, longitude: 100.5347 },
    isPopular: true,
  },
  {
    id: "hub-asok",
    name: "Asok (อโศก / BTS Asok / MRT Sukhumvit)",
    subtitle: "Khlong Toei / Watthana, Bangkok",
    coordinates: { latitude: 13.737, longitude: 100.5604 },
    isPopular: true,
  },
  {
    id: "hub-thonglor",
    name: "Thonglor (ทองหล่อ / Sukhumvit 55)",
    subtitle: "Watthana, Bangkok",
    coordinates: { latitude: 13.7246, longitude: 100.5785 },
    isPopular: true,
  },
  {
    id: "hub-ari",
    name: "Ari (อารีย์ / Phahonyothin)",
    subtitle: "Phaya Thai, Bangkok",
    coordinates: { latitude: 13.7796, longitude: 100.5446 },
    isPopular: true,
  },
  {
    id: "hub-chatuchak",
    name: "Chatuchak (จตุจักร / BTS Mo Chit)",
    subtitle: "Chatuchak, Bangkok",
    coordinates: { latitude: 13.8025, longitude: 100.5538 },
    isPopular: true,
  },
  {
    id: "hub-rama9",
    name: "Rama 9 (พระราม 9 / Central Rama 9)",
    subtitle: "Huai Khwang, Bangkok",
    coordinates: { latitude: 13.7582, longitude: 100.5665 },
    isPopular: true,
  },
  {
    id: "hub-silom",
    name: "Silom / Sathorn (สีลม / สาทร)",
    subtitle: "Bang Rak, Bangkok",
    coordinates: { latitude: 13.7248, longitude: 100.5318 },
    isPopular: true,
  },
  {
    id: "hub-kmitl",
    name: "KMITL / Lat Krabang (สจล. / ลาดกระบัง)",
    subtitle: "Lat Krabang, Bangkok",
    coordinates: { latitude: 13.7298, longitude: 100.7782 },
    isPopular: true,
  },
  {
    id: "hub-chula",
    name: "Chulalongkorn University (จุฬาลงกรณ์มหาวิทยาลัย)",
    subtitle: "Pathum Wan, Bangkok",
    coordinates: { latitude: 13.7384, longitude: 100.5321 },
    isPopular: true,
  },
  {
    id: "hub-kasetsart",
    name: "Kasetsart University (มหาวิทยาลัยเกษตรศาสตร์)",
    subtitle: "Chatuchak, Bangkok",
    coordinates: { latitude: 13.8479, longitude: 100.5714 },
    isPopular: true,
  },
  {
    id: "hub-thammasat",
    name: "Thammasat Rangsit (ม.ธรรมศาสตร์ รังสิต)",
    subtitle: "Khlong Luang, Pathum Thani",
    coordinates: { latitude: 14.0725, longitude: 100.6058 },
    isPopular: true,
  },
  {
    id: "hub-bangna",
    name: "Bang Na (บางนา / Mega Bangna)",
    subtitle: "Bang Na, Bangkok / Samut Prakan",
    coordinates: { latitude: 13.6682, longitude: 100.614 },
    isPopular: true,
  },
  {
    id: "hub-chiangmai",
    name: "Chiang Mai City (เมืองเชียงใหม่ / นิมมาน)",
    subtitle: "Mueang Chiang Mai, Chiang Mai",
    coordinates: { latitude: 18.7883, longitude: 98.9853 },
    isPopular: true,
  },
  {
    id: "hub-phuket",
    name: "Phuket Town / Patong (ภูเก็ต)",
    subtitle: "Mueang Phuket, Phuket",
    coordinates: { latitude: 7.8804, longitude: 98.3923 },
    isPopular: true,
  },
];

interface LocationAutocompleteProps {
  value: string;
  coordinates?: Coordinates | null;
  onChange: (locationName: string) => void;
  onCoordinatesChange: (coords: Coordinates | null) => void;
  placeholder?: string;
  hasError?: boolean;
  className?: string;
}

export function LocationAutocomplete({
  value,
  coordinates,
  onChange,
  onCoordinatesChange,
  placeholder = "Search area, street, or landmark (e.g. Siam, Sukhumvit)",
  hasError,
  className,
}: LocationAutocompleteProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [apiResults, setApiResults] = useState<PlaceSuggestion[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);

  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Click outside listener
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Filter local popular hubs
  const cleanQuery = value.trim().toLowerCase();
  const matchedHubs = cleanQuery
    ? POPULAR_THAI_HUBS.filter(
        (h) =>
          h.name.toLowerCase().includes(cleanQuery) ||
          h.subtitle.toLowerCase().includes(cleanQuery)
      ).slice(0, 4)
    : POPULAR_THAI_HUBS.slice(0, 6);

  const displayApiResults = cleanQuery.length >= 2 ? apiResults : [];

  // Fetch live OSM geocoding with debounce
  useEffect(() => {
    if (cleanQuery.length < 2) return;

    let isSubscribed = true;
    const controller = new AbortController();

    const timer = setTimeout(() => {
      setIsSearching(true);
      fetch(
        `https://nominatim.openstreetmap.org/search?format=json&limit=5&countrycodes=th&addressdetails=1&q=${encodeURIComponent(
          cleanQuery
        )}`,
        {
          signal: controller.signal,
          headers: {
            "Accept-Language": "en,th",
          },
        }
      )
        .then((res) => (res.ok ? res.json() : []))
        .then(
          (
            data: Array<{
              place_id: number;
              display_name: string;
              lat: string;
              lon: string;
              name?: string;
              address?: Record<string, string>;
            }>
          ) => {
            if (!isSubscribed) return;
            setIsSearching(false);
            if (!Array.isArray(data)) return;

            const parsed: PlaceSuggestion[] = data.map((item) => {
              const parts = item.display_name.split(",").map((p) => p.trim());
              const title = parts[0] || item.name || cleanQuery;
              const subtitle = parts.slice(1, 4).join(", ") || "Thailand";
              return {
                id: `osm-${item.place_id}`,
                name: title,
                subtitle,
                coordinates: {
                  latitude: parseFloat(item.lat),
                  longitude: parseFloat(item.lon),
                },
              };
            });
            setApiResults(parsed);
          }
        )
        .catch(() => {
          if (isSubscribed) setIsSearching(false);
        });
    }, 320);

    return () => {
      isSubscribed = false;
      controller.abort();
      clearTimeout(timer);
    };
  }, [cleanQuery]);

  const allSuggestions = [
    ...matchedHubs,
    ...displayApiResults.filter(
      (api) =>
        !matchedHubs.some(
          (hub) =>
            Math.abs(hub.coordinates.latitude - api.coordinates.latitude) <
              0.005 &&
            Math.abs(hub.coordinates.longitude - api.coordinates.longitude) <
              0.005
        )
    ),
  ];

  const handleSelect = (suggestion: PlaceSuggestion) => {
    const formatted = `${suggestion.name}, ${suggestion.subtitle.split(",")[0] || ""}`.replace(
      /, $/,
      ""
    );
    onChange(formatted);
    onCoordinatesChange(suggestion.coordinates);
    setIsOpen(false);
  };

  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser");
      return;
    }
    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const coords: Coordinates = {
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
        };

        // Reverse geocode to get a readable district name
        fetch(
          `https://nominatim.openstreetmap.org/reverse?format=json&lat=${coords.latitude}&lon=${coords.longitude}&addressdetails=1`,
          {
            headers: { "Accept-Language": "en,th" },
          }
        )
          .then((res) => (res.ok ? res.json() : null))
          .then((data) => {
            setIsLocating(false);
            const district =
              data?.address?.suburb ||
              data?.address?.city_district ||
              data?.address?.city ||
              data?.address?.state ||
              "Current Location";
            const locationName = `${district}, Bangkok`;
            onChange(locationName);
            onCoordinatesChange(coords);
            setIsOpen(false);
          })
          .catch(() => {
            setIsLocating(false);
            const fallback = "Current Location, Bangkok";
            onChange(fallback);
            onCoordinatesChange(coords);
            setIsOpen(false);
          });
      },
      () => {
        setIsLocating(false);
        alert("Could not access your location. Please type your area name.");
      },
      { timeout: 8000 }
    );
  };

  const handleClear = () => {
    onChange("");
    onCoordinatesChange(null);
    inputRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen) {
      if (e.key === "ArrowDown" || e.key === "Enter") {
        setIsOpen(true);
      }
      return;
    }

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((prev) =>
        prev < allSuggestions.length - 1 ? prev + 1 : 0
      );
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((prev) =>
        prev > 0 ? prev - 1 : allSuggestions.length - 1
      );
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (activeIndex >= 0 && activeIndex < allSuggestions.length) {
        handleSelect(allSuggestions[activeIndex]);
      } else if (allSuggestions.length > 0) {
        handleSelect(allSuggestions[0]);
      }
    } else if (e.key === "Escape") {
      setIsOpen(false);
    }
  };

  return (
    <div ref={containerRef} className={cn("relative w-full", className)}>
      <div className="relative">
        <MapPin
          className={cn(
            "pointer-events-none absolute left-3 top-3.5 size-4 transition-colors",
            coordinates ? "text-[#124e3b]" : "text-muted-foreground"
          )}
          aria-hidden="true"
        />

        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={(e) => {
            onChange(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className={cn(
            "h-11 w-full rounded-lg border bg-background pl-9 pr-16 text-sm outline-none transition",
            "focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/30",
            hasError ? "border-destructive" : "border-input"
          )}
          autoComplete="off"
        />

        <div className="absolute right-2 top-2.5 flex items-center gap-1">
          {isSearching && (
            <Loader2 className="size-4 animate-spin text-muted-foreground" />
          )}
          {value && (
            <button
              type="button"
              onClick={handleClear}
              className="rounded-full p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
              aria-label="Clear location"
            >
              <X className="size-3.5" />
            </button>
          )}
          <button
            type="button"
            onClick={() => setIsOpen((prev) => !prev)}
            className="rounded-full p-1 text-muted-foreground hover:bg-muted"
            aria-label="Toggle location list"
          >
            <ChevronDown className="size-3.5" />
          </button>
        </div>
      </div>

      {/* Pinned Coordinates Confirmation Badge */}
      {coordinates && (
        <div className="mt-1 flex items-center gap-1.5 text-xs font-medium text-[#124e3b]">
          <CheckCircle2 className="size-3.5 text-[#15803d]" />
          <span>
            Pinned coordinates: {coordinates.latitude.toFixed(4)},{" "}
            {coordinates.longitude.toFixed(4)}
          </span>
        </div>
      )}

      {/* Dropdown Menu (Grab / Bolt Style) */}
      {isOpen && (
        <div className="absolute left-0 right-0 top-full z-50 mt-1 max-h-80 overflow-y-auto rounded-xl border border-[#d6e2c4] bg-white p-1.5 text-[#17281f] shadow-2xl animate-in fade-in zoom-in-95 duration-150">
          {/* Quick Action: Use Current Location */}
          <button
            type="button"
            onClick={handleUseCurrentLocation}
            disabled={isLocating}
            className="flex w-full items-center gap-3 rounded-lg border-b border-[#e5ecd9] px-3 py-2.5 text-left text-sm font-semibold text-[#124e3b] transition hover:bg-[#f4f8ed] disabled:opacity-60"
          >
            <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-[#e3edc8] text-[#124e3b]">
              {isLocating ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <LocateFixed className="size-4" />
              )}
            </div>
            <div className="min-w-0 flex-1">
              <div className="font-semibold">
                {isLocating ? "Getting current GPS…" : "Use current location"}
              </div>
              <div className="text-xs font-normal text-[#566c5f]">
                {isLocating
                  ? "Resolving nearest neighborhood…"
                  : "Tap to pin where you are right now"}
              </div>
            </div>
          </button>

          {/* Popular Hubs / Suggestions Header */}
          <div className="px-3 pt-2 pb-1 text-[11px] font-bold uppercase tracking-wider text-[#698072]">
            {cleanQuery ? "Suggested places" : "Popular rental hubs (Bangkok & Thailand)"}
          </div>

          {allSuggestions.length === 0 && !isSearching && (
            <div className="p-4 text-center text-xs text-muted-foreground">
              No matching locations found. Press enter to use your custom text.
            </div>
          )}

          {allSuggestions.map((suggestion, index) => {
            const isSelected = activeIndex === index;
            return (
              <button
                key={suggestion.id}
                type="button"
                onClick={() => handleSelect(suggestion)}
                onMouseEnter={() => setActiveIndex(index)}
                className={cn(
                  "flex w-full items-start gap-3 rounded-lg px-3 py-2 text-left transition",
                  isSelected
                    ? "bg-[#f1f6e8] text-[#124e3b]"
                    : "text-[#17281f] hover:bg-[#f7faf2]"
                )}
              >
                <div className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-full bg-[#f4f8ed] text-[#124e3b]">
                  <MapPin className="size-3.5" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-medium text-[#17281f]">
                    {suggestion.name}
                  </div>
                  <div className="truncate text-xs text-[#566c5f]">
                    {suggestion.subtitle}
                  </div>
                </div>
                {suggestion.isPopular && !cleanQuery && (
                  <span className="mt-0.5 rounded-full bg-[#e3edc8] px-2 py-0.5 text-[10px] font-semibold text-[#124e3b]">
                    Popular
                  </span>
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
