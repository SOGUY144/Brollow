"use client";

import { useState } from "react";
import { ChevronDown, HandCoins, PackageSearch, Undo2, Wrench, type LucideIcon } from "lucide-react";

type PromiseItem = { id: string; icon: LucideIcon; title: string; who: "For owners" | "For renters"; body: string };

const PROMISES: PromiseItem[] = [
  {
    id: "repair",
    icon: Wrench,
    title: "Something breaks? We pay for the repair.",
    who: "For owners",
    body: "If your gear comes back damaged, open a claim. We compare the 4 photos from pickup with the 4 from return, and we get a repair quote. Once the claim is approved, we pay the repair cost up to the cover limit shown when the booking was made. You don’t have to chase the renter for money. Wear and tear, and damage that was there before the rental, aren’t covered.",
  },
  {
    id: "missing",
    icon: PackageSearch,
    title: "Something goes missing? We pay you back.",
    who: "For owners",
    body: "If your gear is lost or stolen during a rental, we pay you its agreed value, up to the booking’s cover limit. You set that value with us before the rental starts, so there’s no argument later. It’s the value you agreed, which may be less than a brand-new replacement.",
  },
  {
    id: "refund",
    icon: Undo2,
    title: "Not what the listing said? You get a full refund.",
    who: "For renters",
    body: "Look the item over at pickup. If it’s clearly different from the listing, or it doesn’t work, report it and don’t accept it. Once we confirm the problem, you get back the rental and the Brollow fee. Changing your mind about an item that matches its listing is different, and our cancellation policy covers that case.",
  },
  {
    id: "accept",
    icon: HandCoins,
    title: "Check it first. Accept it. Then the owner gets paid.",
    who: "For renters",
    body: "After the owner approves your request, you pay through Brollow. The owner’s money stays on hold while you check the gear. When you tap “Accept,” we send the owner their share, and it’s marked paid once the payment provider confirms it. If you report a problem before you accept, the payment stays on hold while we look into it.",
  },
];

/** Styles ship with the component (React 19 hoists and de-duplicates this <style> by href). */
const CSS = `/* The Brollow promise — same card language as "How renting works", plus a short gold
   "found something good" moment when a card opens. Durations live in --d / --td so the
   reduced-motion block keeps them (Windows "animation effects off" sets reduced motion). */
.bp-grid { display: grid; gap: 16px; align-items: start; }
@media (min-width: 768px) { .bp-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); } }
@media (min-width: 1024px) { .bp-grid { grid-template-columns: repeat(4, minmax(0, 1fr)); } }

.bp-card { position: relative; overflow: hidden; border: 1px solid var(--border); border-radius: 14px; transition: border-color .35s, box-shadow .35s, translate .35s cubic-bezier(.2,.8,.2,1), background .35s; --td: .35s; }
.bp-card:hover { translate: 0 -3px; border-color: #d8dfc8; box-shadow: 0 14px 30px #2b3a1a14; }
.bp-open, .bp-open:hover { translate: 0 -3px; border-color: #d9b85a; background: linear-gradient(165deg, #fffaf0 0%, #ffffff 55%, #fdf4dc 100%); box-shadow: 0 16px 36px #b8902f24, 0 0 0 3px #f3e3b066; }
.bp-card::after { content: ''; position: absolute; inset: 0; pointer-events: none; background: linear-gradient(110deg, transparent 30%, #fff3c9cc 45%, #ffe08aaa 50%, #fff3c9cc 55%, transparent 70%); transform: translateX(-130%); }
.bp-open::after { animation: bp-kf-sheen 1.1s cubic-bezier(.3,.6,.3,1); --d: 1.1s; }

.bp-head { position: relative; z-index: 1; display: flex; flex-direction: column; align-items: flex-start; width: 100%; min-height: 196px; padding: 20px; text-align: left; cursor: pointer; }
.bp-head:focus-visible { outline: 2px solid #b8902f; outline-offset: -2px; border-radius: 14px; }

.bp-icon { position: relative; display: grid; place-items: center; width: 44px; height: 44px; border-radius: 12px; color: var(--primary); background: #eef2e4; transition: color .4s, background .4s, box-shadow .4s; --td: .4s; }
.bp-glyph { width: 22px; height: 22px; }
.bp-open .bp-icon { color: #5a4108; background: radial-gradient(circle at 35% 30%, #fff4c4 0%, #ecc75e 50%, #c79a34 100%); box-shadow: 0 0 0 3px #f6e3b0, 0 0 18px #ecc75e99; animation: bp-kf-flip .8s cubic-bezier(.3,.7,.3,1.2); --d: .8s; }
.bp-spark { position: absolute; left: 50%; top: 50%; width: 5px; height: 5px; margin: -2.5px; border-radius: 50%; background: #e9c45c; box-shadow: 0 0 6px #ffd86a; opacity: 0; rotate: var(--a); pointer-events: none; }
.bp-spark:nth-child(odd) { background: #fff0b0; }
.bp-open .bp-spark { animation: bp-kf-spark .9s cubic-bezier(.15,.8,.25,1) .05s; --d: .9s; }

.bp-title { display: block; margin-top: 14px; font-weight: 600; line-height: 1.35; color: var(--foreground); }

.bp-foot { display: flex; width: 100%; align-items: center; justify-content: space-between; gap: 8px; margin-top: auto; padding-top: 16px; }
.bp-who { padding: 3px 10px; border-radius: 999px; background: #eef2e4; color: var(--primary); font-size: 12px; font-weight: 500; white-space: nowrap; transition: background .4s, color .4s; --td: .4s; }
.bp-open .bp-who { background: #f6e7bd; color: #7a5b12; }
.bp-more { display: inline-flex; align-items: center; gap: 4px; font-size: 13px; font-weight: 500; color: var(--primary); white-space: nowrap; }
.bp-open .bp-more { color: #9a7620; }
.bp-chevron { width: 16px; height: 16px; transition: transform .4s cubic-bezier(.2,.8,.2,1); --td: .4s; }
.bp-open .bp-chevron { transform: rotate(180deg); }

.bp-panel { position: relative; z-index: 1; display: grid; grid-template-rows: 0fr; transition: grid-template-rows .45s cubic-bezier(.2,.8,.2,1); --td: .45s; }
.bp-open .bp-panel { grid-template-rows: 1fr; }
.bp-panel-inner { overflow: hidden; }
.bp-body { margin: 0 20px 20px; padding-top: 14px; border-top: 1px dashed #e2cf95; font-size: 14px; line-height: 1.65; color: var(--muted-foreground); opacity: 0; transform: translateY(-6px); transition: opacity .3s, transform .3s; --td: .3s; }
.bp-open .bp-body { opacity: 1; transform: none; transition-delay: .12s; }

@keyframes bp-kf-sheen { from { transform: translateX(-130%); } to { transform: translateX(130%); } }
@keyframes bp-kf-flip { 0% { transform: rotateY(0) scale(1); } 45% { transform: rotateY(200deg) scale(1.25); } 100% { transform: rotateY(360deg) scale(1); } }
@keyframes bp-kf-spark { 0% { opacity: 0; transform: translateX(0) scale(.3); } 20% { opacity: 1; } 100% { opacity: 0; transform: translateX(34px) scale(1); } }

@media (prefers-reduced-motion: reduce) {
  .bp-card, .bp-card *, .bp-card::after { animation-duration: var(--d) !important; transition-duration: var(--td, .3s) !important; }
}
`;

export function BrollowPromise() {
  const [open, setOpen] = useState<string | null>(null);

  return (
    <section id="promise" aria-labelledby="promise-title" className="scroll-mt-24 space-y-4">
      <style href="brollow-promise" precedence="default">{CSS}</style>
      <h2 id="promise-title" className="text-xl font-semibold tracking-tight">The Brollow promise</h2>
      <ol className="bp-grid">
        {PROMISES.map((p, i) => {
          const isOpen = open === p.id;
          return (
            <li key={p.id} className={`bp-card bg-card${isOpen ? " bp-open" : ""}`}>
              <button
                type="button"
                className="bp-head"
                aria-expanded={isOpen}
                aria-controls={`promise-${p.id}`}
                onClick={() => setOpen(isOpen ? null : p.id)}
              >
                <span className="bp-icon" aria-hidden="true">
                  <p.icon className="bp-glyph" strokeWidth={1.8} />
                  {Array.from({ length: 10 }, (_, k) => (
                    <span key={k} className="bp-spark" style={{ ["--a" as string]: `${k * 36}deg` }} />
                  ))}
                </span>
                <span className="bp-title">{i + 1}. {p.title}</span>
                <span className="bp-foot">
                  <span className="bp-who">{p.who}</span>
                  <span className="bp-more">
                    {isOpen ? "Hide details" : "See details"}
                    <ChevronDown className="bp-chevron" aria-hidden="true" />
                  </span>
                </span>
              </button>
              <div id={`promise-${p.id}`} className="bp-panel" role="region" aria-label={p.title} inert={!isOpen}>
                <div className="bp-panel-inner">
                  <p className="bp-body">{p.body}</p>
                </div>
              </div>
            </li>
          );
        })}
      </ol>
      <p className="text-sm text-muted-foreground">
        Planned protections. Before launch, repair and loss cover needs secured funding or an insurance partner.
      </p>
    </section>
  );
}
