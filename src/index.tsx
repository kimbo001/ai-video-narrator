import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./index.css";

/* =====  SEO (your existing block, untouched)  ===== */
document.title = "AI Video Narrator: Ultimate AI Short Creator and Narrator | TikTok & Reels";

const head = document.head;
const meta = (name: string, content: string) => {
  const el = document.createElement("meta");
  el.name = name; el.content = content; head.appendChild(el);
};
const og = (property: string, content: string) => {
  const el = document.createElement("meta");
  el.setAttribute("property", property); el.content = content; head.appendChild(el);
};

// Core
meta("description", "Turn any script into a fully narrated viral TikTok, YouTube Short or Reel in under 60 seconds. Free AI voiceover, auto visuals, one-click editing.");
meta("robots", "index, follow");
// Open Graph
og("og:title", "AI Video Narrator – Ultimate AI Short Creator and Narrator");
og("og:description", "Create professional narrated videos from text instantly. 100% free to start, lifetime unlimited for $29.");
og("og:url", "https://aivideonarrator.com");
og("og:type", "website");
og("og:image", "https://aivideonarrator.com/og-preview.jpg");
og("og:site_name", "AI Video Narrator");
// Twitter
meta("twitter:card", "summary_large_image");
meta("twitter:title", "AI Video Narrator – Free Text to Viral Videos");
meta("twitter:description", "Instant AI-narrated TikTok/Reels from any script. Free forever, lifetime unlimited $29.");
meta("twitter:image", "https://aivideonarrator.com/og-preview.jpg");
// Canonical
const link = document.createElement("link"); link.rel = "canonical"; link.href = "https://aivideonarrator.com"; head.appendChild(link);
// Schema
const schema = document.createElement("script"); schema.type = "application/ld+json";
schema.textContent = JSON.stringify({
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  "name": "AI Video Narrator",
  "description": "Free AI tool that turns text into narrated viral videos for TikTok, Shorts & Reels.",
  "offers": { "@type": "Offer", "price": "0" }
});
head.appendChild(schema);

/* =====  React mount  ===== */
const root = ReactDOM.createRoot(document.getElementById("root")!);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

/* =====  Chrome-extension deep-link (NEW)  ===== */
function fillScriptFromExtension() {
  const params = new URLSearchParams(window.location.search);
  const script = params.get("script");
  if (!script) return;

  let ticks = 0;
  const timer = setInterval(() => {
    const el = document.querySelector('textarea[name="script"], #script-box, [data-input="script"]') as HTMLTextAreaElement | null;
    if (el) {
      el.value = decodeURIComponent(script).replace(/\+/g, " ");
      el.dispatchEvent(new Event("input", { bubbles: true }));
      el.scrollIntoView({ behavior: "smooth", block: "center" });
      clearInterval(timer);
    } else if (++ticks > 20) {          // 6 s max
      clearInterval(timer);
    }
  }, 300);
}
// run after React paints
setTimeout(fillScriptFromExtension, 500);
