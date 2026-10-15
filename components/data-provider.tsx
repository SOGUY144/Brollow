"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, useSyncExternalStore, type ReactNode } from "react";
import { toast } from "sonner";
import { DataError, type DataApi, type DataMode, type Viewer } from "@/lib/data/api";
import { createDemoApi } from "@/lib/data/demo";
import { createLiveApi, liveConfig } from "@/lib/data/live";

interface DataContextValue {
  api: DataApi;
  mode: DataMode;
  viewer: Viewer | null;
  viewerReady: boolean;
  refreshViewer: () => Promise<void>;
  favorites: Set<string>;
  toggleFavorite: (itemId: string) => Promise<void>;
}

const DataContext = createContext<DataContextValue | null>(null);

let singleton: DataApi | null = null;
function getApi(): DataApi {
  if (!singleton) {
    const config = liveConfig();
    singleton = config ? createLiveApi(config.url, config.key) : createDemoApi();
  }
  return singleton;
}

export function DataProvider({ children }: { children: ReactNode }) {
  const api = getApi();
  const [viewer, setViewer] = useState<Viewer | null>(null);
  const [viewerReady, setViewerReady] = useState(false);
  const [favorites, setFavorites] = useState<Set<string>>(new Set());

  const refreshViewer = useCallback(async () => {
    try {
      const next = await api.getViewer();
      setViewer(next);
      setFavorites(new Set(next ? await api.listFavoriteIds() : []));
    } catch (err) {
      toast.error(err instanceof DataError ? err.message : "Couldn't load your account.");
    } finally {
      setViewerReady(true);
    }
  }, [api]);

  useEffect(() => {
    const t = setTimeout(() => void refreshViewer(), 0);
    return () => clearTimeout(t);
  }, [refreshViewer]);

  const toggleFavorite = useCallback(
    async (itemId: string) => {
      if (!viewer) {
        toast.info("Log in to save items.");
        return;
      }
      const next = !favorites.has(itemId);
      // Optimistic update, rolled back if the save fails.
      setFavorites((prev) => {
        const copy = new Set(prev);
        if (next) copy.add(itemId);
        else copy.delete(itemId);
        return copy;
      });
      try {
        await api.setFavorite(itemId, next);
      } catch (err) {
        setFavorites((prev) => {
          const copy = new Set(prev);
          if (next) copy.delete(itemId);
          else copy.add(itemId);
          return copy;
        });
        toast.error(err instanceof DataError ? err.message : "Couldn't update your saved items.");
      }
    },
    [api, favorites, viewer],
  );

  const value = useMemo(
    () => ({ api, mode: api.mode, viewer, viewerReady, refreshViewer, favorites, toggleFavorite }),
    [api, viewer, viewerReady, refreshViewer, favorites, toggleFavorite],
  );
  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
}

const NO_FAVORITES = new Set<string>();
const noopSubscribe = () => () => {};

export function useData(): DataContextValue {
  const ctx = useContext(DataContext);
  if (!ctx) throw new Error("useData must be used inside DataProvider");
  // Components inside a later-hydrating Suspense boundary must render exactly
  // what the server rendered (no viewer yet), then update after hydration.
  const hydrated = useSyncExternalStore(noopSubscribe, () => true, () => false);
  return hydrated ? ctx : { ...ctx, viewer: null, viewerReady: false, favorites: NO_FAVORITES };
}

/** Shared message for unexpected failures in components. */
export function errorMessage(err: unknown, fallback = "Something went wrong. Please try again."): string {
  return err instanceof DataError ? err.message : fallback;
}
