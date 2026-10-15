"use client";

import { useEffect, useState } from "react";

const PHRASE = "Someone’s next idea.";

export function TypingHeading() {
  const [text, setText] = useState(PHRASE);
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    let length = PHRASE.length;
    let deleting = true;
    function tick() {
      if (document.hidden || document.querySelector(".welcome-dialog[open]")) {
        timer = setTimeout(tick, 200);
        return;
      }
      length += deleting ? -1 : 1;
      setText(PHRASE.slice(0, length));
      let delay = deleting ? 45 : 100;
      if (length === 0) { deleting = false; delay = 350; }
      else if (length === PHRASE.length) { deleting = true; delay = 2400; }
      timer = setTimeout(tick, delay);
    }
    timer = setTimeout(tick, 2400);
    return () => clearTimeout(timer);
  }, []);

  return <h1 id="hero-title" className="typing-heading text-4xl font-semibold leading-[1.06] tracking-tight text-[#124e3b] sm:text-6xl">
    <span className="sr-only">Your unused things. Someone’s next idea. Earn from what you own.</span>
    <span aria-hidden="true">Your unused things.<br /><span className="typing-line"><span className="typing-spacer">Someone’s next idea.</span><span className="typing-text">{text}<span className="typing-caret" /></span></span></span>
  </h1>;
}
