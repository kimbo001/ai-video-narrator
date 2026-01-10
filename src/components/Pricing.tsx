import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser, useClerk } from '@clerk/clerk-react';
import { Check, ArrowLeft, Play, Loader2, Zap } from 'lucide-react'; // Added Zap icon
import { Page } from '../types';

// 1. ADDED YOUR NEW POWER PASS ID HERE
const TIER_IDS = {
  'New Tuber': '1160511',
  'Creator': '1160512',
  'Pro': '1160514',
  'Power Pass': '1204425' // <--- PASTE THAT ID HERE
};

declare global {
  interface Window {
    createLemonSqueezy?: () => void;
    LemonSqueezy?: {
      Url: {
        Open: (url: string) => void;
      };
    };
  }
}

interface PricingProps {
  onBack?: () => void;
  onNavigate?: (page: Page) => void;
}

const Pricing: React.FC<PricingProps> = ({ onBack }) => {
  const navigate = useNavigate();
  const { user, isLoaded, isSignedIn } = useUser();
  const clerk = useClerk();
  
  const [currentPlan, setCurrentPlan] = useState<string>('FREE');
  const [loadingPlan, setLoadingPlan] = useState(false);
  const [processingTier, setProcessingTier] = useState<string | null>(null);

useEffect(() => {
  if (!window.createLemonSqueezy) {
    const script = document.createElement('script');
    script.src = 'https://assets.lemonsqueezy.com/lemon.js';
    script.async = true;
    document.head.appendChild(script);
    script.onload = () => window.createLemonSqueezy?.();
  }
}, []);

  useEffect(() => {
    const fetchPlan = async () => {
      if (!user?.id) return;
      setLoadingPlan(true);
      try {
        const res = await fetch(`/api/limits?userId=${user.id}`);
        if (res.ok) {
          const data = await res.json();
          setCurrentPlan(data.plan || 'FREE');
        }
      } catch (e) {
        console.error("Failed to fetch plan", e);
      } finally {
        setLoadingPlan(false);
      }
    };

    if (isLoaded && user) {
      fetchPlan();
    }
  }, [user, isLoaded]);

  const handleBack = () => {
    if (onBack) onBack();
    else window.location.href = '/';
  };

  const handleCheckout = async (tierName: string, isFree: boolean) => {
    if (!isSignedIn || !user) {
      clerk.openSignIn({ redirectUrl: '/pricing' });
      return;
    }

    if (isFree) {
      navigate('/generator');
      return;
    }

    setProcessingTier(tierName);
    const variantId = TIER_IDS[tierName as keyof typeof TIER_IDS];

    try {
        const response = await fetch('/api/checkout', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                variantId: variantId,
                userId: user.id,
                userEmail: user.emailAddresses[0].emailAddress
            })
        });

        const data = await response.json();
        if (!response.ok) throw new Error(data.error);

        if (window.LemonSqueezy) {
            window.LemonSqueezy.Url.Open(data.url);
        } else {
            window.open(data.url, '_blank');
        }
    } catch (err) {
        alert("Failed to initialize checkout.");
    } finally {
        setProcessingTier(null);
    }
  };

  const tiers = [
    {
      name: 'Free',
      dbName: 'FREE',
      price: '$0',
      period: '/one-time',
      description: 'Perfect for getting started',
      characterLimit: '5,000',
      videoEst: '~5 mins',
      features: ['5,000 characters total', '720p export quality', 'Standard AI voices', 'No credit card required'],
      cta: 'Start Creating Free',
      popular: false,
      isFree: true,
      isOneTime: true,
    },
    {
      name: 'Power Pass', // <--- THE NEW DISRUPTIVE TOP-UP
      dbName: 'POWER_PASS',
      price: '$5',
      period: '/one-time',
      description: 'Instant credit top-up',
      characterLimit: '20,000',
      videoEst: '~15 mins',
      features: ['20,000 extra characters', 'All Pro features unlocked', 'Valid for 24 hours', 'No subscription required'],
      cta: 'Get 20k Credits',
      popular: false,
      isFree: false,
      isOneTime: true,
    },
    {
      name: 'New Tuber',
      dbName: 'NEW_TUBER',
      price: '$9',
      period: '/month',
      description: 'For serious creators',
      characterLimit: '50,000',
      videoEst: '~45 mins',
      features: ['50,000 chars / month', '1080p export quality', 'Premium HD voices', 'Priority processing'],
      cta: 'Start New Tuber',
      popular: true,
      isFree: false,
      isOneTime: false,
    },
    {
      name: 'Creator',
      dbName: 'CREATOR',
      price: '$24',
      period: '/month',
      description: 'For growing channels',
      characterLimit: '150,000',
      videoEst: '~2.5 hours',
      features: ['150,000 chars / month', '4K export quality', 'All HD AI voices', 'Analytics dashboard'],
      cta: 'Start Creator',
      popular: false,
      isFree: false,
      isOneTime: false,
    },
    {
      name: 'Pro',
      dbName: 'PRO',
      price: '$48',
      period: '/month',
      description: 'For professionals',
      characterLimit: '500,000',
      videoEst: '~8+ hours',
      features: ['500,000 chars / month', '4K+ export quality', 'API access', 'Dedicated support'],
      cta: 'Start Pro',
      popular: false,
      isFree: false,
      isOneTime: false,
    },
  ];

  return (
    <div className="max-w-[1600px] mx-auto px-6 py-12">
      <button onClick={handleBack} className="flex items-center gap-2 text-zinc-400 hover:text-white transition-colors mb-8">
        <ArrowLeft className="w-4 h-4" /> Back
      </button>

      <div className="text-center mb-12">
        <h1 className="text-4xl md:text-6xl font-bold text-white mb-6">
          Create Videos <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-indigo-500">That Actually Get Views</span>
        </h1>
        <p className="text-xl text-zinc-400 max-w-2xl mx-auto leading-relaxed">
          From text to viral content in seconds. No face required.
        </p>
      </div>

      {/* UPDATED GRID FOR 5 CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-6">
        {tiers.map((tier) => {
          const isActive = currentPlan === tier.dbName;
          const isProcessing = processingTier === tier.name;

          return (
            <div 
              key={tier.name}
              className={`bg-[#11141b] border ${tier.popular ? 'border-yellow-500/50' : 'border-zinc-800'} ${isActive ? 'border-green-500/50 bg-green-900/10' : ''} ${tier.name === 'Power Pass' ? 'border-cyan-500/30 bg-cyan-500/5' : ''} rounded-2xl p-6 flex flex-col relative transition-all hover:border-zinc-700`}
            >
              {tier.popular && !isActive && (
                <div className="absolute top-0 right-0 bg-yellow-500 text-black text-[9px] font-black px-2 py-1 rounded-bl-lg uppercase tracking-tighter">POPULAR</div>
              )}
              {tier.name === 'Power Pass' && (
                <div className="absolute top-0 right-0 bg-cyan-500 text-black text-[9px] font-black px-2 py-1 rounded-bl-lg uppercase tracking-tighter flex items-center gap-1"><Zap className="w-2 h-2 fill-current"/> TOP-UP</div>
              )}
              
              <div className="mb-4">
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                    {tier.name}
                    {isActive && <span className="text-[10px] bg-green-500 text-black px-2 py-0.5 rounded-full">ACTIVE</span>}
                </h3>
                <p className="text-zinc-500 text-xs mt-1 leading-relaxed">{tier.description}</p>
              </div>
              
              <div className="mb-6">
                <span className="text-3xl font-black text-white">{tier.price}</span>
                <span className="text-zinc-500 text-xs"> {tier.period}</span>
              </div>

              <div className="mb-6 bg-black/40 rounded-xl p-4 border border-zinc-800/50">
                <div className="flex justify-between items-center mb-2">
                    <span className="text-zinc-500 text-[10px] uppercase font-black tracking-widest">Credits</span>
                    <span className="text-white font-bold text-sm">{tier.characterLimit}</span>
                </div>
                <div className="flex justify-between items-center">
                    <span className="text-zinc-500 text-[10px] uppercase font-black tracking-widest">Est. Content</span>
                    <span className="text-cyan-400 font-bold text-xs">{tier.videoEst}</span>
                </div>
              </div>

              <ul className="flex-1 space-y-3 mb-6">
                {tier.features.map((feature, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-zinc-300 text-xs">
                    <Check className="w-3.5 h-3.5 text-green-500 flex-shrink-0 mt-0.5" />
                    <span className="leading-tight">{feature}</span>
                  </li>
                ))}
              </ul>

              <button
                onClick={() => handleCheckout(tier.name, tier.isFree)}
                disabled={isActive || isProcessing}
                className={`w-full py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${
                  isActive 
                    ? 'bg-zinc-800 text-zinc-500 cursor-default'
                    : tier.isFree 
                      ? 'bg-zinc-700 text-white hover:bg-zinc-600' 
                      : tier.name === 'Power Pass'
                        ? 'bg-zinc-100 text-black hover:bg-white shadow-lg'
                        : 'bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white shadow-lg'
                }`}
              >
                {isProcessing ? <Loader2 className="w-4 h-4 animate-spin" /> : (isActive ? 'Current Plan' : tier.cta)}
              </button>
            </div>
          );
        })}
      </div>

      <div className="max-w-4xl mx-auto mt-16 text-center">
        <h2 className="text-2xl font-bold text-white mb-8 italic">Frequently Asked Questions</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left">
          <div className="bg-zinc-900/30 p-6 rounded-2xl border border-zinc-800">
            <h3 className="text-white font-bold mb-2 text-sm">How do characters work?</h3>
            <p className="text-zinc-500 text-xs leading-relaxed">1 character in your script equals 1 credit. On monthly plans, your balance refills every 30 days. One-time passes add credits instantly to your current balance.</p>
          </div>
          <div className="bg-zinc-900/30 p-6 rounded-2xl border border-zinc-800">
            <h3 className="text-white font-bold mb-2 text-sm">Can I cancel anytime?</h3>
            <p className="text-zinc-500 text-xs leading-relaxed">Yes. Our subscriptions are month-to-month. If you cancel, you keep your paid credits until the end of your billing cycle.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Pricing;
