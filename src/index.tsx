import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'

// === ADD THESE SEO LINES ONLY ===
document.title = 'AI Video Narrator: Free AI Text to Video Generator | Viral Shorts & Reels'

const meta = (name: string, content: string) => {
  const m = document.createElement('meta')
  m.name = name
  m.content = content
  document.head.appendChild(m)
}
const og = (property: string, content: string) => {
  const m = document.createElement('meta')
  m.setAttribute('property', property)
  m.content = content
  document.head.appendChild(m)
}

meta('description', 'Turn any text into fully narrated viral videos for TikTok, YouTube Shorts & Reels in seconds. Free AI narration + auto visuals.')
meta('robots', 'index, follow')
og('og:title', 'AI Video Narrator – Free Text to Viral Video Generator')
og('og:description', 'Create narrated TikTok/Reels from text in seconds. 100% free.')
og('og:url', 'https://ai-video-narrator.vercel.app')
og('og:type', 'website')
og('og:image', 'https://ai-video-narrator.vercel.app/og-image.jpg')
meta('twitter:card', 'summary_large_image')
// === END OF SEO ===

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)
