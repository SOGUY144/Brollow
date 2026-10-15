"use client";

import { createContext, useContext, useState, type ReactNode } from "react";
import { LocateFixed } from "lucide-react";
import type { Coordinates } from "@/lib/domain/location";

const LocationContext = createContext<{
  origin: Coordinates | null; busy: boolean; message: string; locate: () => void; clear: () => void;
} | null>(null);

export function LocationProvider({ children }: { children: ReactNode }) {
  const [origin, setOrigin] = useState<Coordinates | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  function locate() {
    if (!navigator.geolocation) { setMessage("Location is unavailable. Choose an area instead."); return; }
    setBusy(true);
    setMessage("");
    navigator.geolocation.getCurrentPosition(({ coords }) => {
      setOrigin({ latitude: coords.latitude, longitude: coords.longitude });
      setMessage("Location ready. Distances are approximate, in a straight line.");
      setBusy(false);
    }, () => {
      setOrigin(null);
      setMessage("Couldn't access your location. Choose an area instead.");
      setBusy(false);
    }, { timeout: 10000, maximumAge: 60000 });
  }
  return <LocationContext.Provider value={{ origin, busy, message, locate, clear: () => { setOrigin(null); setMessage(""); } }}>{children}</LocationContext.Provider>;
}

export function useLocation() {
  const value = useContext(LocationContext);
  if (!value) throw new Error("LocationProvider is required");
  return value;
}

export function LocateButton() {
  const { locate, busy, message, origin, clear } = useLocation();
  return <div className="space-y-1 text-xs">
    <button type="button" onClick={locate} disabled={busy} className="inline-flex min-h-9 items-center gap-1.5 font-medium text-primary disabled:opacity-50"><LocateFixed className="size-4" />{busy ? "Locating…" : "Use my current location"}</button>
    {origin && <button type="button" onClick={clear} className="ml-3 underline">Clear location</button>}
    {message && <p role="status" className="text-muted-foreground">{message}</p>}
  </div>;
}
