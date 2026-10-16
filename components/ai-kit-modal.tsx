"use client";

import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import {
  ArrowRight,
  CheckCircle2,
  ExternalLink,
  Layers,
  Loader2,
  Mic,
  RotateCcw,
  Square,
  Volume2,
  VolumeX,
  X,
} from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
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

const emptySubscribe = () => () => {};

export function AiKitModal({
  isOpen,
  onClose,
  initialPrompt = "",
  catalog,
}: AiKitModalProps) {
  const { api } = useData();
  const mounted = useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  );
  const [fetchedCatalog, setFetchedCatalog] = useState<ItemSummary[]>([]);
  const activeCatalog = catalog && catalog.length > 0 ? catalog : fetchedCatalog;
  const [prompt, setPrompt] = useState(initialPrompt);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<SmartKitResult | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isLoadingAudio, setIsLoadingAudio] = useState(false);

  const inputRef = useRef<HTMLInputElement | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const audioPlayerRef = useRef<HTMLAudioElement | null>(null);

  const stopAudioPlayback = useCallback(() => {
    if (audioPlayerRef.current) {
      audioPlayerRef.current.pause();
      audioPlayerRef.current.currentTime = 0;
      audioPlayerRef.current = null;
    }
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
    setIsSpeaking(false);
    setIsLoadingAudio(false);
  }, []);

  // Stop audio and recording when modal unmounts or closes
  useEffect(() => {
    if (!isOpen) return;
    return () => {
      if (audioPlayerRef.current) {
        audioPlayerRef.current.pause();
        audioPlayerRef.current.currentTime = 0;
        audioPlayerRef.current = null;
      }
      if (typeof window !== "undefined" && "speechSynthesis" in window) {
        window.speechSynthesis.cancel();
      }
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
        mediaRecorderRef.current.stop();
      }
    };
  }, [isOpen]);

  // Fetch catalog if prop is empty
  useEffect(() => {
    if (!catalog || catalog.length === 0) {
      void api
        .listItems()
        .then((items) => {
          if (items && items.length > 0) {
            setFetchedCatalog(items);
          }
        })
        .catch(() => {});
    }
  }, [catalog, api]);

  const runKitGeneration = useCallback(
    async (queryText: string) => {
      stopAudioPlayback();
      const textToRun = queryText.trim() || "Solo outdoor vlog / YouTube video, budget ฿2,800";
      setIsAnalyzing(true);

      let itemsToUse = activeCatalog;
      if (!itemsToUse || itemsToUse.length === 0) {
        try {
          itemsToUse = await api.listItems();
          setFetchedCatalog(itemsToUse);
        } catch {
          itemsToUse = [];
        }
      }

      try {
        const res = await fetch("/api/ai-kit", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ prompt: textToRun, items: itemsToUse }),
        });
        if (res.ok) {
          const kit = (await res.json()) as SmartKitResult;
          setResult(kit);
          setIsAnalyzing(false);
          return;
        }
      } catch {
        // Fallback to local engine below
      }

      const kit = generateSmartKit(textToRun, itemsToUse);
      setResult(kit);
      setIsAnalyzing(false);
    },
    [activeCatalog, api, stopAudioPlayback]
  );

  const handleToggleRecording = async () => {
    if (isRecording) {
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
        mediaRecorderRef.current.stop();
      }
      setIsRecording(false);
      return;
    }

    try {
      stopAudioPlayback();
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      audioChunksRef.current = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          audioChunksRef.current.push(e.data);
        }
      };

      recorder.onstop = async () => {
        stream.getTracks().forEach((track) => track.stop());
        const audioBlob = new Blob(audioChunksRef.current, { type: "audio/webm" });
        if (audioBlob.size === 0) return;

        setIsTranscribing(true);
        try {
          const formData = new FormData();
          formData.append("file", audioBlob, "voice.webm");
          const res = await fetch("/api/elevenlabs/stt", {
            method: "POST",
            body: formData,
          });
          if (res.ok) {
            const data = (await res.json()) as { text?: string };
            const spokenText = (data.text ?? "").trim();
            if (spokenText) {
              setPrompt(spokenText);
              toast.success("Transcribed with ElevenLabs Scribe");
              void runKitGeneration(spokenText);
            } else {
              toast.error("Could not hear speech clearly. Please try again.");
            }
          } else {
            toast.error("Voice transcription failed. Please try again.");
          }
        } catch {
          toast.error("Could not connect to ElevenLabs Speech-to-Text.");
        } finally {
          setIsTranscribing(false);
        }
      };

      mediaRecorderRef.current = recorder;
      recorder.start();
      setIsRecording(true);
    } catch {
      toast.error("Microphone permission is required for voice search.");
    }
  };

  const handleListenToAdvice = async () => {
    if (!result) return;
    if (isSpeaking || isLoadingAudio) {
      stopAudioPlayback();
      return;
    }

    const totalBaht = Math.round(result.totalDailyPriceSatang / 100);
    const itemTitles = result.items.map((i) => i.title).join(", ");
    const isThai = /[\u0E00-\u0E7F]/.test(
      `${prompt} ${result.kitName} ${result.description} ${result.reasons.join(" ")}`
    );
    const speechScript = isThai
      ? `ชุดอุปกรณ์ที่แนะนำคือ ${result.kitName}. ${result.description} ในชุดประกอบด้วย ${itemTitles}. ราคารวมทั้งหมดวันละ ${totalBaht} บาท. ${result.reasons.join(" ")}`
      : `${result.kitName}. ${result.description} This bundle includes: ${itemTitles}. Total daily rate is ${totalBaht} baht. ${result.reasons.join(" ")}`;

    setIsLoadingAudio(true);
    try {
      const res = await fetch("/api/elevenlabs/tts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: speechScript }),
      });

      if (!res.ok) {
        throw new Error("ElevenLabs TTS request failed");
      }

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const audio = new Audio(url);
      audioPlayerRef.current = audio;

      audio.onended = () => {
        setIsSpeaking(false);
        URL.revokeObjectURL(url);
      };
      audio.onerror = () => {
        setIsSpeaking(false);
        URL.revokeObjectURL(url);
      };

      setIsLoadingAudio(false);
      setIsSpeaking(true);
      await audio.play();
    } catch {
      setIsLoadingAudio(false);
      // Graceful browser speech fallback if offline
      if (typeof window !== "undefined" && "speechSynthesis" in window) {
        const utterance = new SpeechSynthesisUtterance(speechScript);
        utterance.onend = () => setIsSpeaking(false);
        setIsSpeaking(true);
        window.speechSynthesis.speak(utterance);
      } else {
        toast.error("Could not play AI voice right now.");
      }
    }
  };

  // Synchronize and auto-load on open so modal is never blank
  useEffect(() => {
    if (!isOpen) return;

    const trimmed = initialPrompt.trim();
    const defaultQuery = "Solo outdoor vlog / YouTube video, budget ฿2,800";
    const queryToRun = trimmed || defaultQuery;

    void (async () => {
      await Promise.resolve();
      setPrompt(queryToRun);

      if (trimmed) {
        await runKitGeneration(queryToRun);
      } else {
        let itemsToUse = activeCatalog;
        if (!itemsToUse || itemsToUse.length === 0) {
          try {
            itemsToUse = await api.listItems();
            setFetchedCatalog(itemsToUse);
          } catch {
            itemsToUse = [];
          }
        }
        setResult(generateSmartKit(queryToRun, itemsToUse));
      }
    })();
  }, [isOpen, initialPrompt, activeCatalog, api, runKitGeneration]);

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
    await runKitGeneration(queryText);
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    void handleGenerate(prompt);
  };

  const handleQuickPromptClick = (p: string) => {
    setPrompt(p);
    void handleGenerate(p);
  };

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      const prevOverflow = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = prevOverflow;
      };
    }
  }, [isOpen]);

  if (!isOpen || !mounted) return null;

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="ai-kit-title"
      className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="relative w-full max-w-2xl max-h-[92vh] flex flex-col rounded-2xl bg-white border border-[#e2e8d8] shadow-2xl overflow-hidden text-[#1b2b22] animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#e8eee0] px-5 py-4 bg-[#fbfcf9]">
          <div>
            <div className="flex items-center gap-2">
              <h2 id="ai-kit-title" className="text-base font-semibold leading-none text-[#1b2b22]">
                Brollow AI · Smart Kit Builder
              </h2>
              <span className="inline-flex items-center gap-1 rounded-full bg-[#e3edc8] px-2 py-0.5 text-[10px] font-semibold text-[#124e3b] border border-[#d2deba]">
                Voice by ElevenLabs
              </span>
            </div>
            <p className="text-xs text-[#5f6e65] mt-1">
              Type or speak your project needs. AI curates and narrates the right equipment bundle.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close modal"
            className="rounded-lg p-1.5 text-[#5f6e65] hover:bg-[#edf2e4] hover:text-[#1b2b22] transition-colors"
          >
            <X className="size-4" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="overflow-y-auto p-5 space-y-4">
          {/* Natural Language & Voice Prompt Input */}
          <form onSubmit={handleFormSubmit} className="space-y-3">
            <div className="flex items-center gap-1.5 rounded-xl border border-[#d8e0ce] bg-white pl-3.5 pr-1.5 py-1.5 focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20 shadow-xs">
              <input
                ref={inputRef}
                type="text"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Speak or type, e.g. ถ่าย Vlog นอกสถานที่ งบ 2,500 บาท"
                className="min-w-0 flex-1 h-8 bg-transparent text-sm text-[#1b2b22] placeholder:text-[#88968d] outline-none"
              />
              <div className="flex shrink-0 items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => void handleToggleRecording()}
                  disabled={isTranscribing || isAnalyzing}
                  title={isRecording ? "Stop recording" : "Speak with ElevenLabs Voice Search"}
                  className={`h-8 px-2.5 rounded-lg text-xs font-semibold inline-flex items-center gap-1 transition-colors cursor-pointer border ${
                    isRecording
                      ? "bg-red-50 text-red-700 border-red-200 hover:bg-red-100"
                      : "bg-[#f4f7ee] text-[#124e3b] border-[#d2deba] hover:bg-[#e3edc8]"
                  }`}
                >
                  {isTranscribing ? (
                    <>
                      <Loader2 className="size-3.5 animate-spin" />
                      <span>Scribe...</span>
                    </>
                  ) : isRecording ? (
                    <>
                      <Square className="size-3 fill-red-600 text-red-600" />
                      <span>Stop</span>
                    </>
                  ) : (
                    <>
                      <Mic className="size-3.5" />
                      <span className="hidden sm:inline">Voice</span>
                    </>
                  )}
                </button>

                <Button
                  type="submit"
                  size="sm"
                  disabled={isAnalyzing || isTranscribing}
                  className="h-8 px-3.5 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold rounded-lg flex items-center gap-1.5 shadow-xs"
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
            </div>

            {/* Quick Inspiration Chips */}
            <div>
              <p className="text-xs font-medium text-[#5f6e65] mb-1.5">
                Quick Prompts:
              </p>
              <div className="flex flex-wrap gap-1.5">
                {QUICK_PROMPTS.map((item) => (
                  <button
                    key={item.label}
                    type="button"
                    onClick={() => handleQuickPromptClick(item.prompt)}
                    className="inline-flex items-center text-xs px-2.5 py-1 rounded-full border border-[#dce3d2] bg-[#f4f7ee] hover:bg-[#eaf0df] text-[#2c3d31] font-medium transition-colors cursor-pointer"
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
              <p className="text-xs text-[#5f6e65]">
                Analyzing inventory, gear synergies, and optimal pricing...
              </p>
            </div>
          )}

          {/* Result Card */}
          {!isAnalyzing && result && (
            <div className="space-y-4 animate-in fade-in duration-200">
              {/* Kit Summary Banner */}
              <div className="rounded-xl border border-[#d5e0be] bg-[#f4f8ed] p-4 space-y-2.5">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-[#124e3b] bg-[#e3edc8] border border-[#d2deba] px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                        Recommended Bundle
                      </span>
                      <button
                        type="button"
                        onClick={() => void handleListenToAdvice()}
                        className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-0.5 rounded-full border transition-all cursor-pointer ${
                          isSpeaking
                            ? "bg-[#124e3b] text-white border-[#124e3b]"
                            : "bg-white text-[#124e3b] border-[#c5d4a7] hover:bg-[#e3edc8]"
                        }`}
                      >
                        {isLoadingAudio ? (
                          <>
                            <Loader2 className="size-3 animate-spin" />
                            <span>Generating Voice...</span>
                          </>
                        ) : isSpeaking ? (
                          <>
                            <VolumeX className="size-3.5" />
                            <span>Stop AI Voice</span>
                          </>
                        ) : (
                          <>
                            <Volume2 className="size-3.5" />
                            <span>Listen to AI Advice</span>
                          </>
                        )}
                      </button>
                    </div>
                    <h3 className="text-base font-bold text-[#153426] mt-1.5">
                      {result.kitName}
                    </h3>
                    <p className="text-xs text-[#4e6054] mt-0.5 max-w-md">
                      {result.description}
                    </p>
                  </div>

                  <div className="text-right shrink-0">
                    <p className="text-xs text-[#5f6e65]">Total Daily Rate</p>
                    <p className="text-lg font-bold text-[#153426]">
                      {formatMoney(result.totalDailyPriceSatang)}
                      <span className="text-xs font-normal text-[#5f6e65]"> / day</span>
                    </p>
                    {result.targetBudgetSatang !== null && (
                      <span
                        className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-md mt-1 border ${
                          result.withinBudget
                            ? "bg-[#e3edc8] text-[#124e3b] border-[#d2deba]"
                            : "bg-[#fef3c7] text-[#92400e] border-[#fde68a]"
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
                  <div className="border-t border-[#d8e3c4] pt-2.5 mt-2">
                    <p className="text-xs font-semibold text-[#1e3327] mb-1.5 flex items-center gap-1.5">
                      <Layers className="size-3 text-primary" />
                      Why this kit fits your project:
                    </p>
                    <ul className="space-y-1">
                      {result.reasons.map((r, i) => (
                        <li key={i} className="text-xs text-[#3b4c41] flex items-start gap-1.5">
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
                <h4 className="text-xs font-semibold text-[#5f6e65] uppercase tracking-wider">
                  Equipment in this Bundle ({result.items.length} items)
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {result.items.map((item) => (
                    <div
                      key={item.id}
                      className="group flex items-center gap-3 p-2.5 rounded-xl border border-[#e2e8d8] bg-white hover:border-primary/50 hover:shadow-xs transition-all"
                    >
                      <div className="size-16 rounded-lg overflow-hidden shrink-0 border border-[#e8eee0]">
                        <ItemImage
                          src={item.images[0]}
                          alt={item.title}
                          category={item.category}
                          className="size-full object-cover"
                        />
                      </div>
                      <div className="min-w-0 flex-1">
                        <h5 className="text-xs font-semibold text-[#1b2b22] line-clamp-1 group-hover:text-primary transition-colors">
                          {item.title}
                        </h5>
                        <p className="text-[11px] text-[#5f6e65] line-clamp-1">
                          {item.location}
                        </p>
                        <div className="flex items-center justify-between mt-1">
                          <span className="text-xs font-bold text-[#153426]">
                            {formatMoney(item.dailyPriceSatang)}
                            <span className="text-[10px] font-normal text-[#5f6e65]"> / day</span>
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
        <div className="flex items-center justify-between border-t border-[#e8eee0] px-5 py-3 bg-[#fbfcf9]">
          {result && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => {
                setPrompt("");
                setTimeout(() => inputRef.current?.focus(), 50);
              }}
              className="text-xs text-[#5f6e65] hover:text-[#1b2b22] flex items-center gap-1 cursor-pointer"
            >
              <RotateCcw className="size-3" />
              <span>Clear prompt</span>
            </Button>
          )}
          {!result && <div />}

          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onClose}
              className="text-xs border-[#d8e0ce] text-[#2c3d31] hover:bg-[#f4f7ee] cursor-pointer"
            >
              Close
            </Button>
            {result && result.items.length > 0 && (
              <Link
                href={`/items/${result.items[0].id}`}
                onClick={onClose}
                className="h-8 px-3 rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-semibold inline-flex items-center gap-1 shadow-xs transition-colors"
              >
                <span>Book Equipment</span>
                <ArrowRight className="size-3" />
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
