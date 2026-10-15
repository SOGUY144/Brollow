"use client";
/* eslint-disable @next/next/no-img-element -- intro sprites are pre-optimised webp, preloaded, and animated with CSS */

import { useCallback, useEffect, useRef, useState } from "react";
import { preload } from "react-dom";
import { Search, Sparkles } from "lucide-react";

/** Total length of the film before it fades out on its own (ms). Keep in sync with globals.css (--s + 9.6s). */
const FILM_MS = 12000;
const LEAVE_MS = 650; // fade the film to white
const REVEAL_MS = 900; // then fade the white away to show the page
const ART = "/images/brand/intro";
const SEEN_KEY = "brollow-intro-seen-desktop-qa";

type Phase = "idle" | "playing" | "leaving" | "reveal";

const LINE_ONE = ["A", "little", "sharing."];
const LINE_TWO = ["A", "little", "lift."];
const BRAND = "Brollow".split("");

/** Real listing photos that float past during the "little lift". */
const CARDS = [
  { src: "/images/items/mus-01-1.jpg", x: 78, r: 10, delay: 0.15 },
  { src: "/images/items/tool-01-1.jpg", x: 30, r: 8, delay: 0.35 },
  { src: "/images/items/ele-01-1.jpg", x: 64, r: -9, delay: 0.5 },
  { src: "/images/items/spo-01-1.jpg", x: 4, r: 6, delay: 0.7 },
  { src: "/images/items/camp-01-1.jpg", x: 90, r: -6, delay: 0.85 },
];

/** Puffs for the cloud-wipe banks: [left %, top %, size % of bank width]. Mirrored for the right bank. */
const BANK_PUFFS: [number, number, number][] = [
  [4, 16, 30], [20, 10, 34], [38, 14, 28], [55, 8, 32], [72, 13, 30], [88, 18, 26],
  [96, 30, 26], [99, 44, 30], [95, 58, 28], [100, 72, 30], [96, 86, 30],
];

/** Sky clouds: [left %, top %, width vw, delay s, flip]. */
const SKY_CLOUDS: [number, number, number, number, boolean][] = [
  [-4, 14, 30, 0, false], [66, 8, 36, 0.2, true], [38, 34, 18, 0.4, false], [82, 46, 16, 0.3, false],
];

const PRELOAD = [
  `${ART}/bg-room.webp`, `${ART}/man-thinking.webp`, `${ART}/woman-standing.webp`,
  `${ART}/man-flying.webp`, `${ART}/woman-flying.webp`, `${ART}/cloud-1.webp`, `${ART}/item-camera.webp`,
  "/images/brand/sharing-people.png",
];

function CloudBank({ side }: { side: "left" | "right" }) {
  return (
    <div className={`wi-bank wi-bank-${side}`}>
      <div className="wi-bank-inner">
        <div className="wi-bank-core" />
        {BANK_PUFFS.map(([x, y, s], i) => (
          <span key={i} className="wi-puff" style={{ left: `${x}%`, top: `${y}%`, width: `${s}%` }} />
        ))}
      </div>
    </div>
  );
}

export function WelcomeIntro() {
  PRELOAD.forEach((href) => preload(href, { as: "image" }));
  const dialog = useRef<HTMLDialogElement>(null);
  const [phase, setPhase] = useState<Phase>("idle");

  const finish = useCallback(() => setPhase((p) => (p === "playing" ? "leaving" : p)), []);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      try {
        if (sessionStorage.getItem(SEEN_KEY)) return;
        sessionStorage.setItem(SEEN_KEY, "1");
      } catch {
        // Storage can be unavailable in privacy modes; the intro may still play safely.
      }
      setPhase("playing");
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  // Open the modal once, and keep the page from scrolling behind it.
  const open = phase === "playing" || phase === "leaving";
  useEffect(() => {
    if (!open) return;
    const node = dialog.current;
    const previousOverflow = document.body.style.overflow;
    node?.showModal();
    node?.querySelector<HTMLButtonElement>("[data-skip]")?.focus();
    document.body.style.overflow = "hidden";
    return () => {
      node?.close();
      document.body.style.overflow = previousOverflow;
    };
  }, [open]);

  useEffect(() => {
    if (phase === "playing") {
      const timer = window.setTimeout(finish, FILM_MS);
      return () => clearTimeout(timer);
    }
    if (phase === "leaving") {
      const timer = window.setTimeout(() => setPhase("reveal"), LEAVE_MS);
      return () => clearTimeout(timer);
    }
    if (phase === "reveal") {
      const timer = window.setTimeout(() => setPhase("idle"), REVEAL_MS);
      return () => clearTimeout(timer);
    }
  }, [phase, finish]);

  return (
    <>
    <dialog
      ref={dialog}
      className="welcome-dialog"
      aria-labelledby="welcome-title"
      onCancel={(e) => { e.preventDefault(); finish(); }}
    >
      {open && (
        <div className={`wi-film${phase === "leaving" ? " is-leaving" : ""}`}>
          <div className="wi-whiteout" aria-hidden="true" />
          <div className="wi-sky" aria-hidden="true" />
          <div className="wi-sun" aria-hidden="true" />
          <div className="wi-glow" aria-hidden="true" />

          <div className="welcome-controls">
            <button type="button" data-skip onClick={finish}>Skip intro →</button>
          </div>

          {/* 01 · Rediscover */}
          <div className="wi-scene1" aria-hidden="true">
            <div className="wi-room">
              <div className="wi-room-img" style={{ backgroundImage: `url(${ART}/bg-room.webp)` }}>
                <span className="wi-ping" style={{ left: "84%", top: "48%" }} />
                <span className="wi-ping" style={{ left: "94%", top: "45%", ["--pd" as string]: ".25s" }} />
              </div>
            </div>
            <div className="wi-s1-caption">
              <p className="wi-kicker">Rediscover</p>
              <p className="wi-s1-text">See the potential in what you already own.</p>
            </div>
            <img className="wi-s1-person wi-s1-man" src={`${ART}/man-thinking.webp`} alt="" />
            <img className="wi-s1-person wi-s1-woman" src={`${ART}/woman-standing.webp`} alt="" />
          </div>

          {/* 02 · Rent & share */}
          <div className="wi-heading">
            <p className="wi-kicker">Everyday things, shared</p>
            <h2 id="welcome-title">
              <span className="wi-line">
                {LINE_ONE.map((w, i) => <span key={i} className="wi-word" style={{ ["--i" as string]: i }}>{w}</span>)}
              </span>
              <span className="wi-line wi-line-two">
                {LINE_TWO.map((w, i) => <span key={i} className="wi-word" style={{ ["--i" as string]: i }}>{w}</span>)}
              </span>
            </h2>
          </div>

          <div className="wi-sky-clouds" aria-hidden="true">
            {SKY_CLOUDS.map(([x, y, w, d, flip], i) => (
              <img
                key={i}
                className="wi-sky-cloud"
                src={`${ART}/cloud-1.webp`}
                alt=""
                style={{ left: `${x}%`, top: `${y}%`, width: `${w}vw`, ["--cd" as string]: `${d}s`, ["--fx" as string]: flip ? -1 : 1 }}
              />
            ))}
          </div>

          <div className="wi-stage" aria-hidden="true">
            <div className="wi-person wi-person-left"><div className="wi-walk"><div className="wi-bob wi-img" /></div></div>
            <div className="wi-person wi-person-right"><div className="wi-walk"><div className="wi-bob wi-img" /></div></div>
            <div className="wi-spark">
              <span className="wi-ring" />
              <span className="wi-ring wi-ring-2" />
              {Array.from({ length: 10 }, (_, i) => <span key={i} className="wi-particle" style={{ ["--a" as string]: `${i * 36}deg` }} />)}
              <span className="wi-star">✦</span>
            </div>
          </div>

          {/* 03 · A little lift */}
          <div className="wi-flyers" aria-hidden="true">
            <img className="wi-flyer wi-flyer-man" src={`${ART}/man-flying.webp`} alt="" />
            <img className="wi-flyer wi-flyer-woman" src={`${ART}/woman-flying.webp`} alt="" />
          </div>

          <div className="wi-cards" aria-hidden="true">
            <img className="wi-float-camera" src={`${ART}/item-camera.webp`} alt="" />
            {CARDS.map((c, i) => (
              <div
                key={i}
                className="wi-card"
                style={{ left: `${c.x}%`, ["--r" as string]: `${c.r}deg`, ["--cd" as string]: `${c.delay}s`, backgroundImage: `url(${c.src})` }}
              />
            ))}
          </div>

          <div aria-hidden="true">
            <CloudBank side="left" />
            <CloudBank side="right" />
          </div>

          {/* 04 · Welcome */}
          <div className="wi-brand">
            <p className="wi-logo" aria-label="Brollow">
              {BRAND.map((ch, i) => <span key={i} aria-hidden="true" style={{ ["--i" as string]: i }}>{ch}</span>)}
            </p>
            <p className="wi-tagline">Good things deserve another adventure.</p>
            <button type="button" className="wi-search" onClick={finish}>
              <Search size={18} className="shrink-0 opacity-60" />
              <span className="wi-search-text">What would you like to rent?</span>
              <span className="wi-search-ai"><Sparkles size={14} /> Ask AI</span>
            </button>
            <div className="wi-chips" aria-hidden="true"><span>Area</span><span>Pickup</span><span>Return</span></div>
          </div>
        </div>
      )}
    </dialog>
    {phase === "reveal" && <div className="wi-reveal" aria-hidden="true" />}
    </>
  );
}
