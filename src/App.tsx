import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'

// FULL SEO OPTIMIZATION – invisible to users, massive for Google & social
document.title = 'AI Video Narrator: Free Text to Viral Video Generator | TikTok, Shorts & Reels'

const head = document.head

// Helper to create meta tags
const addMeta = (name: string, content: string) => {
  const meta = document.createElement('meta')
  meta.name = name
  meta.content = content
  head.appendChild(meta)
}

const addOG = (property: string, content: string) => {
  const meta = document.createElement('meta')
  meta.setAttribute('property', property)
  meta.content = content
  head.appendChild(meta)
}

// Core SEO
addMeta('description', 'Turn any text into fully narrated viral videos for TikTok, YouTube Shorts & Reels in seconds. Free AI narration, auto visuals from Pexels/Pixabay, one-click editing. No skills needed.')
addMeta('robots', 'index, follow')
addMeta('theme-color', '#000000')

// Open Graph (Facebook, LinkedIn, WhatsApp, Discord)
addOG('og:title', 'AI Video Narrator – Free Text to Viral Video Generator')
addOG('og:description', 'Create professional narrated videos from text instantly. 100% free & open-source.')
addOG('og:url', 'https://aivideonarrator.com')
addOG('og:type', 'website')
addOG('og:image', 'https://aivideonarrator.com/og-preview.jpg')
addOG('og:site_name', 'AI Video Narrator')

// Twitter / X
addMeta('twitter:card', 'summary_large_image')
addMeta('twitter:title', 'AI Video Narrator – Free Text to Viral Videos')
addMeta('twitter:description', 'Instant AI-narrated TikTok/Reels from text. Free forever.')
addMeta('twitter:image', 'https://aivideonarrator.com/og-preview.jpg')
addMeta('twitter:site', '@yourusername') // ← change to your real X handle if you have one

// Canonical URL
const canonical = document.createElement('link')
canonical.rel = 'canonical'
canonical.href = 'https://aivideonarrator.com'
head.appendChild(canonical)

// Optional: Rich results (Google may show stars/pricing)
const schema = document.createElement('script')
schema.type = 'application/ld+json'
schema.textContent = JSON.stringify({
  '@context': 'https://schema.org',
  '@type': 'SoftwareApplication',
  name: 'AI Video Narrator',
  description: 'Free AI tool that turns text into fully narrated viral videos with auto visuals.',
  applicationCategory: 'MultimediaApplication',
  operatingSystem: 'Web Browser',
  offers: {
    '@type': 'Offer',
    price: '0',
    priceCurrency: 'USD'
  },
  featureList: ['AI Narration', 'Auto Visuals', 'One-Click Editing', 'Free Forever']
})
head.appendChild(schema)

// Render your beautiful original app (unchanged!)
ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)
