import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./index.css";

// FULL PROFESSIONAL SEO (100% invisible to users)
document.title = "AI Video Narrator: Free Text to Viral Video Generator | TikTok & Reels";

const head = document.head;

// Helper functions
const meta = (name: string, content: string) => {
  const el = document.createElement("meta");
  el.name = name;
  el.content = content;
  head.appendChild(el);
};

const og = (property: string, content: string) => {
  const el = document.createElement("meta");
  el.setAttribute("property", property);
  el.content = content;
  head.appendChild(el);
};

// SEO Tags
meta("description", "Turn any text into fully narrated viral videos for TikTok, YouTube Shorts & Reels in seconds. Free AI narration, auto visuals, one-click editing. No skills needed.");
meta("robots", "index, follow");

og("og:title", "AI Video Narrator – Free Text to Viral Video Generator");
og("og:description", "Create narrated TikTok/Reels from text instantly. 100% free & open-source.");
og("og:url", "https://aivideonarrator.com");
og("og:type", "website");
og("og:image", "https://aivideonarrator.com/og-preview.jpg");

meta("twitter:card", "summary_large_image");

// Canonical
const link = document.createElement("link");
link.rel = "canonical";
link.href = "https://aivideonarrator.com";
head.appendChild(link);

// Render App
ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
