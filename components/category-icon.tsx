import { Bike, Camera, Drill, Guitar, PartyPopper, Projector, Tent, type LucideProps } from "lucide-react";
import type { CategorySlug } from "@/lib/types";

const ICONS: Record<CategorySlug, React.ComponentType<LucideProps>> = {
  "cameras-photography": Camera,
  electronics: Projector,
  "camping-outdoors": Tent,
  "tools-diy": Drill,
  "music-equipment": Guitar,
  "sports-equipment": Bike,
  "party-equipment": PartyPopper,
};

export function CategoryIcon({ category, ...props }: { category: CategorySlug } & LucideProps) {
  const Icon = ICONS[category] ?? Camera;
  return <Icon aria-hidden="true" {...props} />;
}
