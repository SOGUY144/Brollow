"use client";

import { useEffect, useRef, useState } from "react";
import {
  ArrowRight,
  CheckCircle2,
  ExternalLink,
  Layers,
  Loader2,
  RotateCcw,
  X,
} from "lucide-react";
import Link from "next/link";
import { useData } from "@/components/data-provider";
import { ItemImage } from "@/components/item-image";
import { Button } from "@/components/ui/button";
import { generateSmartKit, type SmartKitResult } from "@/lib/domain/ai-kit";
import { formatMoney } from "@/lib/format";
import type { ItemSummary } from "@/lib/types";

interface AiKitModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialPrompt?: string;
  catalog: ItemSummary[];
}

const QUICK_PROMPTS = [
  {
    label: "Solo Outdoor Vlog (฿800)",
    prompt: "Solo outdoor vlog / YouTube video, budget ฿800",
  },
  {
    label: "2-Person Podcast (฿1,200)",
    prompt: "2-Person Podcast Recording with studio mics, budget ฿1,200",
  },
  {
    label: "Workshop Seminar (฿1,500)",
    prompt: "Workshop seminar 30 people with slides and presentation, budget ฿1,500",
  },
  {
    label: "Portrait Photoshoot (฿900)",
    prompt: "Graduation portrait photoshoot outdoor, budget ฿900",
  },
  {
    label: "Camping & Outdoor (฿1,000)",
    prompt: "Weekend camping and outdoor gear, budget ฿1,000",
  },
];

export function AiKitModal({
  isOpen,
  onClose,
  initialPrompt = "",
  catalog,
}: AiKitModalProps) {
  const { api } = useData();
  const [activeCatalog, setActiveCatalog] = useState<ItemSummary[]>(catalog);
  const [prompt, setPrompt] = useState(initialPrompt);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<SmartKitResult | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  // Sync catalog prop or fetch if empty
  useEffect(() => {
    if (catalog && catalog.length > 0) {
      setActiveCatalog(catalog);
    } else {
      void api
        .listItems()
        .then((items) => {
          if (items && items.length > 0) {
            setActiveCatalog(items);
          }
        })
        .catch(() => {});
    }
  }, [catalog, api]);

  // Synchronize and auto-load on open so modal is never blank
  useEffect(() => {
    if (!isOpen) return;

    const trimmed = initialPrompt.trim();
    const queryToRun = trimmed || "Solo outdoor vlog / YouTube video, budget ฿800";
    setPrompt(trimmed ? trimmed : "Solo outdoor vlog / YouTube video, budget ฿800");

    void (async () => {
      let itemsToUse = activeCatalog;
      if (!itemsToUse || itemsToUse.length === 0) {
        try {
          itemsToUse = await api.listItems();
          setActiveCatalog(itemsToUse);
        } catch {
          itemsToUse = [];
        }
      }
      setIsAnalyzing(true);
      setTimeout(() => {
        const kit = generateSmartKit(queryToRun, itemsToUse);
        setResult(kit);
        setIsAnalyzing(false);
      }, 200);
    })();
  }, [isOpen, initialPrompt]);

  // Handle ESC key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  const handleGenerate = async (queryText: string) => {
    const textToRun = queryText.trim() || "Solo outdoor vlog / YouTube video, budget ฿800";
    setIsAnalyzing(true);

    let itemsToUse = activeCatalog;
    if (!itemsToUse || itemsToUse.length === 0) {
      try {
        itemsToUse = await api.listItems();
        setActiveCatalog(itemsToUse);
      } catch {
        itemsToUse = [];
      }
    }

    setTimeout(() => {
      const kit = generateSmartKit(textToRun, itemsToUse);
      setResult(kit);
      setIsAnalyzing(false);
    }, 200);
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    void handleGenerate(prompt);
  };

  const handleQuickPromptClick = (p: string) => {
    setPrompt(p);
    void handleGenerate(p);
  };

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="ai-kit-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="relative w-full max-w-2xl max-h-[92vh] flex flex-col rounded-2xl bg-card border shadow-2xl overflow-hidden text-card-foreground animate-in zoom-in-95 duration-200">
        {/* Header - Star icon removed per user request */}
        <div className="flex items-center justify-between border-b px-5 py-4 bg-muted/30">
          <div>
            <h2 id="ai-kit-title" className="text-base font-semibold leading-none text-foreground">
              Brollow AI · Smart Kit Builder
            </h2>
            <p className="text-xs text-muted-foreground mt-1">
              Describe your project. AI curates and bundles the right equipment within your budget.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close modal"
            className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
          >
            <X className="size-4" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="overflow-y-auto p-5 space-y-4">
          {/* Natural Language Prompt Input */}
          <form onSubmit={handleFormSubmit} className="space-y-3">
            <div className="relative flex items-center">
              <input
                ref={inputRef}
                type="text"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="e.g. Shooting a 2-person indoor interview, budget ฿1,200 / day"
                className="w-full h-11 pl-4 pr-32 rounded-xl border border-input bg-background text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 shadow-xs"
              />
              <Button
                type="submit"
                size="sm"
                disabled={isAnalyzing}
                className="absolute right-1.5 h-8 px-3.5 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold rounded-lg flex items-center gap-1.5 shadow-xs"
              >
                {isAnalyzing ? (
                  <>
                    <Loader2 className="size-3.5 animate-spin" />
                    <span>Searching...</span>
                  </>
                ) : (
                  <span>Generate Kit</span>
                )}
              </Button>
            </div>

            {/* Quick Inspiration Chips */}
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-1.5">
                Quick Prompts:
              </p>
              <div className="flex flex-wrap gap-1.5">
                {QUICK_PROMPTS.map((item) => (
                  <button
                    key={item.label}
                    type="button"
                    onClick={() => handleQuickPromptClick(item.prompt)}
                    className="inline-flex items-center text-xs px-2.5 py-1 rounded-full border border-border/80 bg-muted/30 hover:bg-muted text-foreground transition-colors"
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>
          </form>

          {/* Loading Indicator */}
          {isAnalyzing && (
            <div className="py-10 flex flex-col items-center justify-center gap-2 text-center">
              <Loader2 className="size-6 text-primary animate-spin" />
              <p className="text-xs text-muted-foreground">
                Analyzing inventory, gear synergies, and optimal pricing...
              </p>
            </div>
          )}

          {/* Result Card */}
          {!isAnalyzing && result && (
            <div className="space-y-4 animate-in fade-in duration-200">
              {/* Kit Summary Banner */}
              <div className="rounded-xl border border-border/80 bg-[#f8f9f5] dark:bg-muted/30 p-4 space-y-2.5">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold text-[#124e3b] bg-[#e3edc8] px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                      Recommended Bundle
                    </span>
                    <h3 className="text-base font-bold text-foreground mt-1.5">
                      {result.kitName}
                    </h3>
                    <p className="text-xs text-muted-foreground mt-0.5 max-w-md">
                      {result.description}
                    </p>
                  </div>

                  <div className="text-right shrink-0">
                    <p className="text-xs text-muted-foreground">Total Daily Rate</p>
                    <p className="text-lg font-bold text-foreground">
                      {formatMoney(result.totalDailyPriceSatang)}
                      <span className="text-xs font-normal text-muted-foreground"> / day</span>
                    </p>
                    {result.targetBudgetSatang !== null && (
                      <span
                        className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-md mt-1 ${
                          result.withinBudget
                            ? "bg-[#e3edc8] text-[#124e3b]"
                            : "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300"
                        }`}
                      >
                        <CheckCircle2 className="size-2.5" />
                        {result.withinBudget
                          ? `Within ${formatMoney(result.targetBudgetSatang)} budget`
                          : `Exceeds ${formatMoney(result.targetBudgetSatang)}`}
                      </span>
                    )}
                  </div>
                </div>

                {/* Why this kit? */}
                {result.reasons.length > 0 && (
                  <div className="border-t border-border/70 pt-2.5 mt-2">
                    <p className="text-xs font-semibold text-foreground mb-1.5 flex items-center gap-1.5">
                      <Layers className="size-3 text-primary" />
                      Why this kit fits your project:
                    </p>
                    <ul className="space-y-1">
                      {result.reasons.map((r, i) => (
                        <li key={i} className="text-xs text-muted-foreground flex items-start gap-1.5">
                          <CheckCircle2 className="size-3.5 text-primary shrink-0 mt-0.5" />
                          <span>{r}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              {/* Bundled Equipment List */}
              <div className="space-y-2">
                <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Equipment in this Bundle ({result.items.length} items)
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {result.items.map((item) => (
                    <div
                      key={item.id}
                      className="group flex items-center gap-3 p-2.5 rounded-xl border border-border/70 bg-card hover:border-primary/50 transition-colors"
                    >
                      <div className="size-16 rounded-lg overflow-hidden shrink-0">
                        <ItemImage
                          src={item.images[0]}
                          alt={item.title}
                          category={item.category}
                          className="size-full object-cover"
                        />
                      </div>
                      <div className="min-w-0 flex-1">
                        <h5 className="text-xs font-semibold text-foreground line-clamp-1 group-hover:text-primary transition-colors">
                          {item.title}
                        </h5>
                        <p className="text-[11px] text-muted-foreground line-clamp-1">
                          {item.location}
                        </p>
                        <div className="flex items-center justify-between mt-1">
                          <span className="text-xs font-bold text-foreground">
                            {formatMoney(item.dailyPriceSatang)}
                            <span className="text-[10px] font-normal text-muted-foreground"> / day</span>
                          </span>
                          <Link
                            href={`/items/${item.id}`}
                            onClick={onClose}
                            className="inline-flex items-center gap-0.5 text-[11px] font-medium text-primary hover:underline"
                          >
                            <span>View</span>
                            <ExternalLink className="size-3" />
                          </Link>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t px-5 py-3 bg-muted/20">
          {result && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => {
                setPrompt("");
                setTimeout(() => inputRef.current?.focus(), 50);
              }}
              className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1"
            >
              <RotateCcw className="size-3" />
              <span>Clear prompt</span>
            </Button>
          )}
          {!result && <div />}

          <div className="flex items-center gap-2">
            <Button type="button" variant="outline" size="sm" onClick={onClose} className="text-xs">
              Close
            </Button>
            {result && result.items.length > 0 && (
              <Link
                href={`/items/${result.items[0].id}`}
                onClick={onClose}
                className="h-8 px-3 rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-semibold inline-flex items-center gap-1 shadow-xs"
              >
                <span>Book Equipment</span>
                <ArrowRight className="size-3" />
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
