// src/pages/blog/PostD.tsx
import React from 'react';
import { Link } from 'react-router-dom';

const PostD: React.FC = () => (
  <div className="max-w-3xl mx-auto px-6 py-12 text-zinc-300">
    <Link to="/blog" className="text-sm text-zinc-500 hover:text-cyan-400 mb-6 inline-block">← Back to posts</Link>

    <h1 className="text-3xl md:text-4xl font-bold text-white mb-4">How To Use AiVideoNarator.com</h1>
    <p className="text-sm text-zinc-500 mb-8">31 Dec 2025 · 3 min read</p>

    <div className="prose prose-invert prose-cyan max-w-none">
      <p>Welcome to AI Video Narrator, the fastest way to turn any text into a faceless TikTok, Short, or Reel.</p>
      <p>Open the site and you’re already on the runway: paste your script, press Generate, and thirty seconds later you’re holding a finished, captioned, narrated video—no account needed, no watermark on the free tier.</p>

      <h2 className="text-xl font-semibold text-white mt-8 mb-3">1. Drop Your Text</h2>
      <p>If you’re new, start with the default text or paste your own Reddit story, AITA post, or motivational paragraph. Click Generate; the robot splits your text into scenes, finds royalty-free clips that match the mood, adds a calm human voice, and exports both 9:16 and 16:9 files. Done. Download, post, watch the views climb.</p>

      <h2 className="text-xl font-semibold text-white mt-8 mb-3">2. Need More Firepower?</h2>
      <p>Need more than three videos a day? Tap <strong>Pricing</strong>, pick <strong>Creator</strong> or <strong>Pro</strong>, and hit Upgrade. Not signed in? Google one-click or email magic-link takes five seconds. Security is baked in—no passwords stored, all billing handled by LemonSqueezy over TLS.</p>
      <p>Payment screen accepts card, PayPal, and whatever else you prefer. Got a coupon? Paste it right there; we drop random codes on our Reddit channel (link in footer). Close the gateway when you’re finished—you’re back in the dashboard instantly.</p>

      <h2 className="text-xl font-semibold text-white mt-8 mb-3">3. Two Lanes: Auto or Manual</h2>
      <p>Dashboard gives you two lanes: <strong>Auto</strong> for pure laziness, <strong>Manual</strong> for control freaks.</p>
      <p>In Auto mode you can still nudge the AI: add a positive prompt (“cyber-punk city, neon”) or a negative one (“no text, no people”) and the clip picker will respect it. Each scene has a little refresh icon; smash it if you hate the stock footage and the bot will fetch new royalty-free media in seconds. Toggle captions on or off, choose Kore (calm female) or another voice, pick portrait or landscape, then lean back.</p>
      <p>Switch to Manual and the toy-box opens: upload your own images or videos (Midjourney, Runway, Nano-banana—doesn’t matter), drop a Suno-made MP3 for background music, set volume with a slider. Split scenes by typing three dashes <code>---</code> at the end of any sentence; the AI treats that as a hard cut and starts the next scene. When you’re happy, hit Generate again; the engine stitches everything, burns in captions, balances audio levels, and hands you a download link.</p>

      <h2 className="text-xl font-semibold text-white mt-8 mb-3">4. Ship It</h2>
      <p>No editing timeline, no key-frames, no hidden export fees. You literally copy-paste, press a button, and get a publish-ready short while your coffee is still hot.</p>
      <p>If you ever feel lost, the same dashboard holds a <strong>Demo</strong> button—one click and you’ll watch a thirty-second AITA story appear from scratch. We built the flow we wanted when we were running three faceless channels from a bedroom ThinkCentre: zero friction, zero bloat, zero face required.</p>
    </div>

    <Link to="/generator" className="inline-flex items-center gap-2 mt-8 px-5 py-2.5 bg-cyan-500 text-black font-bold rounded-lg hover:bg-cyan-400 transition-colors">
      Try It Now
    </Link>

    <footer className="mt-12 pt-6 border-t border-zinc-800 text-sm text-zinc-500">
      © 2025 AI Video Narrator · <Link to="/">Home</Link> · <Link to="/blog">Blog</Link> · <Link to="/terms">Terms</Link> · <Link to="/privacy">Privacy</Link>
    </footer>
  </div>
);

export default PostD;
