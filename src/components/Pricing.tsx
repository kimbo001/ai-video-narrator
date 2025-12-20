import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSafeUser } from '../lib/useSafeUser';
import { Check, ArrowLeft, Play } from 'lucide-react';

declare global {
  interface Window {
    createLemonSqueezy: () => void;
    LemonSqueezy: {
      Url: { Open: (url: string) => void };
    };
  }
}

const Pricing: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useSafeUser();
  const userId = user?.id ?? 'anon_' + Math.random().toString(36).substr(2, 9);
  const userEmail = user?.emailAddresses?.[0]?.emailAddress ?? '';

  useEffect(() => {
    if (window.createLemonSqueezy) {
      window.createLemonSqueezy();
    }
  }, []);

  const lsVariantIds = {
    'New Tuber': import.meta.env.VITE_LEMON_NEW_TUBER || '1160511',
    'Creator': import.meta.env.VITE_LEMON_CREATOR || '1160512',
    'Pro': import.meta.env.VITE_LEMON_PRO || '1160514',
  };

  const startLemonCheckout = async (tierName: 'New Tuber' | 'Creator' | 'Pro') => {
    const variantId = lsVariantIds[tierName];
    
    try {
      const response = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ variantId, userId, userEmail }),
      });

      const data = await response.json();

      if (response.ok && data.url) {
        // Open the Lemon Squeezy Overlay
        if (window.LemonSqueezy) {
          window.LemonSqueezy.Url.Open(data.url);
        } else {
          window.location.href = data.url; // Fallback
        }
      } else {
        alert('Checkout failed to initialize. Please check console.');
        console.error('Checkout Error:', data);
      }
    } catch (error) {
      console.error('Network Error:', error);
    }
  };

  const tiers = [
    { name: 'Free', price: '$0', isFree: true, features: ['3 AI videos daily', '720p quality'], cta: 'Start Free' },
    { name: 'New Tuber', price: '$10', isFree: false, features: ['5 AI videos daily', '1080p quality'], cta: 'Start New Tuber', popular: true },
    { name: 'Creator', price: '$25', isFree: false, features: ['25 AI videos daily', '4K quality'], cta: 'Start Creator' },
    { name: 'Pro', price: '$50', isFree: false, features: ['Unlimited videos', 'Priority support'], cta: 'Start Pro' },
  ];

  return (
    <div className="max-w-7xl mx-auto px-6 py-12">
      <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-zinc-400 mb-8"><ArrowLeft size={16}/> Back</button>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {tiers.map((tier) => (
          <div key={tier.name} className={`p-6 rounded-2xl bg-[#11141b] border ${tier.popular ? 'border-cyan-500' : 'border-zinc-800'}`}>
            <h3 className="text-xl font-bold text-white">{tier.name}</h3>
            <div className="text-3xl font-bold text-white my-4">{tier.price}<span className="text-sm text-zinc-500">/mo</span></div>
            <ul className="mb-6 space-y-2">
              {tier.features.map(f => <li key={f} className="text-zinc-300 text-sm flex gap-2"><Check size={14} className="text-green-500"/> {f}</li>)}
            </ul>
            <button
              onClick={() => tier.isFree ? navigate('/generator') : startLemonCheckout(tier.name as any)}
              className="w-full py-3 rounded-xl font-bold bg-cyan-600 text-white hover:bg-cyan-500 transition-colors"
            >
              {tier.cta}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Pricing;
