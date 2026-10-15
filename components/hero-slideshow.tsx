"use client";

import { useEffect, useState } from "react";
import { Pause, Play } from "lucide-react";
import { ItemImage } from "@/components/item-image";
import type { CategorySlug } from "@/lib/types";

const PHOTOS: { src: string; alt: string; category: CategorySlug }[] = [
  { src: "/images/items/cam-01-1.jpg", alt: "Camera and lens", category: "cameras-photography" },
  { src: "/images/items/camp-01-1.jpg", alt: "Camping tent", category: "camping-outdoors" },
  { src: "/images/items/tool-02-1.jpg", alt: "DIY equipment", category: "tools-diy" },
  { src: "/images/items/mus-04-1.jpg", alt: "DJ controller", category: "music-equipment" },
];

export function HeroSlideshow() {
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);
  useEffect(() => {
    if (paused) return;
    const timer = window.setInterval(() => {
      if (!document.hidden) setActive(index => (index + 1) % PHOTOS.length);
    }, 4500);
    return () => window.clearInterval(timer);
  }, [paused, active]);

  return (
    <div className="relative min-h-48 overflow-hidden sm:min-h-72" role="region" aria-label="Equipment inspiration" aria-roledescription="carousel">
      {PHOTOS.map((photo, index) => (
        <div key={photo.src} aria-hidden={index !== active}
          className={`absolute inset-0 transition-opacity duration-1000 ease-in-out motion-reduce:transition-none ${index === active ? "opacity-100" : "pointer-events-none opacity-0"}`}>
          <ItemImage {...photo} className="h-full rounded-none aspect-auto" eager />
        </div>
      ))}
      {(
        <button type="button" onClick={() => setPaused(value => !value)}
          aria-label={paused ? "Play equipment slideshow" : "Pause equipment slideshow"}
          className="absolute right-3 top-3 flex size-9 items-center justify-center rounded-full bg-background/90 text-primary shadow-sm hover:bg-background">
          {paused ? <Play className="size-4" /> : <Pause className="size-4" />}
        </button>
      )}
      <div className="absolute bottom-2 left-2 right-2 flex flex-wrap items-center justify-between gap-1">
        <div className="flex rounded-full bg-background/90 px-1" aria-label="Choose equipment photo">
          {PHOTOS.map((photo, index) => (
            <button key={photo.src} type="button" onClick={() => setActive(index)}
              aria-label={`Show ${photo.alt.toLowerCase()}`} aria-pressed={index === active}
              className="flex size-8 items-center justify-center rounded-full">
              <span className={`size-1.5 rounded-full ${index === active ? "bg-primary" : "bg-primary/30"}`} />
            </button>
          ))}
        </div>
        <span className="rounded-lg bg-background/95 px-2 py-1 text-[9px] sm:text-xs">Illustrative equipment photo</span>
      </div>
    </div>
  );
}
