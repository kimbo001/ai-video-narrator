import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser, useClerk } from '@clerk/clerk-react';
import { Check, ArrowLeft, Play, Loader2, Star, Zap, Crown, Users } from 'lucide-react';
import { Page } from '../types';

// --- CONFIGURATION ---
// 1. Integer IDs for the API Payload (Backend)
const TIER_IDS = {
  'New Tuber': '1160511',
  'Creator': '1160512',
  'Pro': '1160514',
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

 // load LemonSqueezy ONLY when pricing mounts and ONLY once
useEffect(() => {
  if (!window.createLemonSqueezy) {
    const script = document.createElement('script');
    script.src = 'https://assets.lemonsqueezy.com/lemon.js';
    script.async = true;
    document.head.appendChild(script);
    script.onload = () => window.createLemonSqueezy?.();
  }
}, []);

  // 2. Fetch User Plan
  useEffect(() => {
    const fetchPlan = async () => {
      if (!user?.id) return;
      setLoadingPlan(true);
      try {
        const res = await fetch(`/api/limits?userId=${user.id}`);
        if (res.ok) {
          const data = await res.json();
          console.log("Database Plan:", data.plan); // Debugging
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

  // 3. Checkout Handler
  const handleCheckout = async (tierName: string, isFree: boolean) => {
    // A. Not Signed In? -> Open Login Modal
    if (!isSignedIn || !user) {
      clerk.openSignIn({
        redirectUrl: '/pricing'
      });
      return;
    }

    // B. Free Tier -> Go to App
    if (isFree) {
      navigate('/generator');
      return;
    }

    // C. Paid Tier -> Call API
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
        console.error("Checkout Error:", err);
        alert("Failed to initialize checkout. Please try again.");
    } finally {
        setProcessingTier(null);
    }
  };

// --- UI DATA (Updated for Character Credits) ---
  const tiers = [
    {
      name: 'Free',
      dbName: 'FREE',
      price: '$0',
      period: '/one-time',
      description: 'Perfect for getting started',
      characterLimit: '5,000', // Replaces autoDaily
      videoEst: '~5 mins',    // Replaces manualDaily
      features: [
        '5,000 characters total', 
        '720p export quality', 
        'Standard AI voices', 
        'Basic stock footage',
        'No credit card required'
      ],
      cta: 'Start Creating Free',
      popular: false,
      isFree: true,
    },
    {
      name: 'New Tuber',
      dbName: 'NEW_TUBER',
      price: '$9',
      period: '/month',
      description: 'For serious creators',
      characterLimit: '50,000',
      videoEst: '~45 mins',
      features: [
        '50,000 characters / month', 
        '1080p export quality', 
        'Premium HD AI voices', 
        'Commercial usage rights', 
        'Priority processing'
      ],
      cta: 'Start New Tuber',
      popular: true,
      isFree: false,
    },
    {
      name: 'Creator',
      dbName: 'CREATOR',
      price: '$24',
      period: '/month',
      description: 'For growing channels',
      characterLimit: '150,000',
      videoEst: '~2.5 hours',
      features: [
        '150,000 characters / month', 
        '4K export quality', 
        'All HD AI voices', 
        'Advanced editing tools', 
        'Analytics dashboard'
      ],
      cta: 'Start Creator',
      popular: false,
      isFree: false,
    },
    {
      name: 'Pro',
      dbName: 'PRO',
      price: '$48',
      period: '/month',
      description: 'For professionals',
      characterLimit: '500,000',
      videoEst: '~8+ hours',
      features: [
        '500,000 characters / month', 
        '4K+ export quality', 
        'API access', 
        'White-label options', 
        'Dedicated support'
      ],
      cta: 'Start Pro',
      popular: false,
      isFree: false,
    },
  ];
  return (
    <div className="max-w-7xl mx-auto px-6 py-12">
      <button 
        onClick={handleBack}
        className="flex items-center gap-2 text-zinc-400 hover:text-white transition-colors mb-8"
      >
        <ArrowLeft className="w-4 h-4" />
        Back
      </button>

      <div className="text-center mb-12">
        <h1 className="text-4xl md:text-6xl font-bold text-white mb-6">
          Create Videos <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-indigo-500">That Actually Get Views</span>
        </h1>
        <p className="text-xl text-zinc-400 max-w-2xl mx-auto leading-relaxed">
          From text to viral content in seconds. No face required.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-7xl mx-auto">
        {tiers.map((tier) => {
          // Exact Match Logic
          const isActive = currentPlan === tier.dbName;
          const isProcessing = processingTier === tier.name;

          return (
            <div 
              key={tier.name}
              className={`bg-[#11141b] border ${tier.popular ? 'border-yellow-500/50' : 'border-zinc-800'} ${isActive ? 'border-green-500/50 bg-green-900/10' : ''} rounded-2xl p-6 flex flex-col relative transition-all hover:border-zinc-700`}
            >
              {tier.popular && !isActive && (
                <div className="absolute top-0 right-0 bg-yellow-500 text-black text-xs font-bold px-2 py-1 rounded-bl-lg">
                  POPULAR
                </div>
              )}
              
              <div className="mb-4">
                <h3 className="text-xl font-semibold text-white">
                    {tier.name}
                    {isActive && <span className="ml-2 text-xs bg-green-500 text-black px-2 py-0.5 rounded-full align-middle">ACTIVE</span>}
                </h3>
                <p className="text-zinc-400 text-sm mt-1">{tier.description}</p>
              </div>
              
              <div className="mb-6">
                <span className="text-3xl font-bold text-white">{tier.price}</span>
                <span className="text-zinc-500 text-sm"> {tier.period}</span>
              </div>

              <div className="mb-6 bg-zinc-900/50 rounded-lg p-4 border border-zinc-800/50">
  <div className="flex justify-between items-center mb-2">
    <span className="text-zinc-400 text-xs uppercase tracking-widest font-bold">Credits</span>
    <span className="text-white font-bold">{tier.characterLimit} chars</span>
  </div>
  <div className="flex justify-between items-center">
    <span className="text-zinc-400 text-xs uppercase tracking-widest font-bold">Est. Content</span>
    <span className="text-cyan-400 font-bold">{tier.videoEst}</span>
  </div>
</div>

              <ul className="flex-1 space-y-3 mb-6">
                {tier.features.map((feature, idx) => (
                  <li key={idx} className="flex items-center gap-2 text-zinc-300 text-sm">
                    <Check className="w-4 h-4 text-green-500 flex-shrink-0" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>

              <button
                onClick={() => handleCheckout(tier.name, tier.isFree)}
                disabled={isActive || isProcessing}
                className={`w-full py-3 rounded-xl font-semibold transition-all flex items-center justify-center gap-2 ${
                  isActive 
                    ? 'bg-zinc-800 text-zinc-500 cursor-default'
                    : tier.isFree 
                      ? 'bg-zinc-700 text-white hover:bg-zinc-600' 
                      : 'bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white shadow-lg shadow-cyan-500/20'
                }`}
              >
                {isProcessing ? <Loader2 className="w-5 h-5 animate-spin" /> : 
                 isActive ? 'Current Plan' : 
                 !user ? 'Sign in to Upgrade' : tier.cta}
              </button>
            </div>
          );
        })}
      </div>

      {/* FAQ Section */}
      <div className="max-w-4xl mx-auto mt-16">
        <h2 className="text-3xl font-bold text-white mb-8 text-center">Frequently Asked Questions</h2>
        <div className="space-y-4">
          <div className="bg-zinc-800/50 p-6 rounded-xl border border-zinc-800">
            <h3 className="text-white font-semibold mb-2">How does the daily limit work?</h3>
            <p className="text-zinc-400">Limits reset every 24 hours. Paid plans get higher or unlimited generations.</p>
          </div>
          <div className="bg-zinc-800/50 p-6 rounded-xl border border-zinc-800">
            <h3 className="text-white font-semibold mb-2">Can I cancel anytime?</h3>
            <p className="text-zinc-400">Yes — cancel anytime from your account. Access continues until end of billing period.</p>
          </div>
        </div>
      </div>

      {/* Footer CTA */}
      <div className="text-center mt-16">
        <button 
          onClick={() => navigate('/generator')}
          className="px-8 py-4 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold text-lg rounded-xl shadow-xl shadow-cyan-500/40 transition-all transform hover:scale-105 flex items-center gap-2 mx-auto"
        >
          <Play className="w-5 h-5" />
          Start Creating Free
        </button>
        <p className="text-zinc-400 text-sm mt-4">No credit card required • Instant access</p>
      </div>
    </div>
  );
};

export default Pricing;
