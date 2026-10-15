"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { errorMessage, useData } from "@/components/data-provider";
import type { BlockedRange, ItemSummary } from "@/lib/types";

export type Loadable<T> = { status: "loading" } | { status: "error"; message: string } | { status: "ready"; data: T };

/**
 * Loads something from the data API with loading/error/ready states and a retry.
 * `deps` work like effect dependencies: when they change, the data reloads.
 */
export function useLoad<T>(load: () => Promise<T>, deps: unknown[]): Loadable<T> & { reload: () => void } {
  const [state, setState] = useState<Loadable<T>>({ status: "loading" });
  const [tick, setTick] = useState(0);
  const loadRef = useRef(load);
  useEffect(() => {
    loadRef.current = load;
  });
  const [depsKey, setDepsKey] = useState(deps);
  if (deps.length !== depsKey.length || deps.some((d, i) => !Object.is(d, depsKey[i]))) {
    // Dependencies changed: show loading again while the new data arrives.
    setDepsKey(deps);
    setState({ status: "loading" });
  }
  useEffect(() => {
    let cancelled = false;
    loadRef.current().then(
      (data) => !cancelled && setState({ status: "ready", data }),
      (err) => !cancelled && setState({ status: "error", message: errorMessage(err, "We couldn't load this right now.") }),
    );
    return () => {
      cancelled = true;
    };
  }, [depsKey, tick]);
  const reload = useCallback(() => {
    setState({ status: "loading" });
    setTick((t) => t + 1);
  }, []);
  return { ...state, reload };
}

export function useCatalog(): Loadable<{ items: ItemSummary[]; blocked: BlockedRange[] }> & { reload: () => void } {
  const { api } = useData();
  return useLoad(async () => {
    const [items, blocked] = await Promise.all([api.listItems(), api.getBlockedRanges()]);
    return { items, blocked };
  }, [api]);
}
