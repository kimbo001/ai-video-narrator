import { Link } from 'react-router-dom';

export default function BlogIndex() {
  // REMOVED useClerk and useEffect - They were causing the crash!

const posts = [
  { slug: 'ai-script-to-video-narrated', title: 'How to Turn a Script into a Narrated Video with AI (2025 Step-by-Step)', desc: 'Full workflow from text to finished MP4 in under 3 minutes.' },
  { slug: 'pictory-vs-ai-video-narrator', title: 'Pictory vs AI Video Narrator: Price, Voices & Export Quality Compared', desc: 'Side-by-side showdown so you can pick the right tool.' },
  { slug: 'ai-voice-over-generators-tiktok-reels', title: '7 Best AI Voice-Over Generators for TikTok & Reels Marketers', desc: 'Scroll-stopping voices ranked by realism & price.' },
  { slug: 'how-it-works', title: 'How To Use AIVideoNarrator.com', desc: 'The 30-second tour from text to viral short.' }
];
  return (
    <div className="max-w-4xl mx-auto px-6 py-16">
      <h1 className="text-4xl font-bold text-white mb-4 italic">AI Video Narrator Blog</h1>
      <p className="text-zinc-400 mb-12 text-lg">Insights and guides on faceless video automation.</p>
      
      <div className="grid gap-8">
        {posts.map(p => (
          <article key={p.slug} className="p-8 bg-zinc-900/50 border border-zinc-800 rounded-3xl hover:border-cyan-500/50 transition-all group">
            <Link to={`/blog/${p.slug}`} className="block">
              <h2 className="text-2xl font-bold text-white group-hover:text-cyan-400 transition-colors mb-3">{p.title}</h2>
              <p className="text-zinc-400 leading-relaxed mb-4">{p.desc}</p>
              <div className="text-cyan-500 font-bold text-sm uppercase tracking-widest flex items-center gap-2">
                Read Article <span>→</span>
              </div>
            </Link>
          </article>
        ))}
      </div>
    </div>
  );
}
