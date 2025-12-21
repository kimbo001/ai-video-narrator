// src/components/Pricing.tsx - FINAL: Force sign-in before paid checkout

import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSafeUser } from '../lib/useSafeUser';
import { SignedIn, SignedOut, SignInButton } from '@clerk/clerk-react';
import { Check, ArrowLeft, Star, Users, Play } from 'lucide-react';

// Lemon Squeezy overlay
declare global {
  interface Window {
    createLemonSqueezy: () => void;
    LemonSqueezy: {
      Url: {
        Open: (url: string) => void;
      };
    };
  }
}

const Pricing: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useSafeUser();
  const userEmail = user?.primaryEmailAddress?.emailAddress || '';

  // Initialize Lemon Squeezy
  useEffect(() => {
    if (window.createLemonSqueezy) {
      window.createLemonSqueezy();
    }
  }, []);

  // Variant IDs (keep your env vars)
  const lsVariantIds = {
    'New Tuber': import.meta.env.VITE_LEMON_NEW_TUBER || '1160511',
    'Creator': import.meta.env.VITE_LEMON_CREATOR || '1160512',
    'Pro': import.meta.env.VITE_LEMON_PRO || '1160514',
  };

  // Checkout URLs with pre-filled email (only for signed-in users)
  const getCheckoutUrl = (tier: 'New Tuber' | 'Creator' | 'Pro') => {
    const base = `https://yourstore.lemonsqueezy.com/checkout/buy/${lsVariantIds[tier]}`;
    if (userEmail) {
      return `${base}?checkout[email]=${encodeURIComponent(userEmail)}`;
    }
    return base;
  };

  const tiers = [
    {
      name: 'Free',
      price: '$0',
      period: 'forever',
      description: 'Perfect for trying it out',
      features: [
        '5 videos per day',
        'All voices & styles',
        'Watermark-free',
        'Commercial use',
      ],
      cta: 'Start Creating Free',
      highlighted: false,
      onClick: () => navigate('/generator'),
    },
    {
      name: 'New Tuber',
      price: '$10',
      period: '/month',
      description: 'Great for new creators',
      features: [
        '10 videos per day',
        'Everything in Free',
        'Priority support',
      ],
      cta: 'Upgrade to New Tuber',
      highlighted: false,
      tierKey: 'New Tuber' as const,
    },
    {
      name: 'Creator',
      price: '$25',
      period: '/month',
      description: 'Most popular',
      features: [
        '25 videos per day',
        'Everything in New Tuber',
        'Faster generation',
      ],
      cta: 'Upgrade to Creator',
      highlighted: true,
      tierKey: 'Creator' as const,
    },
    {
      name: 'Pro',
      price: '$50',
      period: '/month',
      description: 'For power users',
      features: [
        '50 videos per day',
        'Everything in Creator',
        'Early access to new features',
      ],
      cta: 'Upgrade to Pro',
      highlighted: false,
      tierKey: 'Pro' as const,
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0b0e14] to-black text-white py-20">
      {/* Back button */}
      <div className="max-w-7xl mx-auto px-6">
        <button
          onClick={() => navigate(-1)}
          className="mb-8 flex items-center gap-2 text-zinc-400 hover:text-white transition"
        >
          <ArrowLeft className="w-5 h-5" />
          Back
        </button>
      </div>

      {/* Header */}
      <div className="text-center mb-16">
        <h1 className="text-5xl md:text-6xl font-bold mb-6">
          Simple, Transparent Pricing
        </h1>
        <p className="text-xl text-zinc-400 max-w-2xl mx-auto">
          Choose the plan that fits your content creation needs. Upgrade anytime.
        </p>
      </div>

      {/* Pricing Cards */}
      <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
        {tiers.map((tier) => (
          <div
            key={tier.name}
            className={`relative rounded-2xl border-2 p-8 transition-all ${
              tier.highlighted
                ? 'border-cyan-500 shadow-2xl shadow-cyan-500/20 scale-105'
                : 'border-zinc-800 hover:border-zinc-700'
            }`}
          >
            {tier.highlighted && (
              <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                <span className="bg-gradient-to-r from-cyan-500 to-blue-500 text-white px-4 py-1 rounded-full text-sm font-bold">
                  Most Popular
                </span>
              </div>
            )}

            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold mb-2">{tier.name}</h2>
              <div className="mb-4">
                <span className="text-5xl font-bold">{tier.price}</span>
                <span className="text-zinc-400">{tier.period}</span>
              </div>
              <p className="text-zinc-400">{tier.description}</p>
            </div>

            <ul className="space-y-4 mb-10">
              {tier.features.map((feature) => (
                <li key={feature} className="flex items-center gap-3">
                  <Check className="w-5 h-5 text-cyan-400 flex-shrink-0" />
                  <span className="text-zinc-300">{feature}</span>
                </li>
              ))}
            </ul>

            {/* CTA Button – SIGN IN REQUIRED FOR PAID TIERS */}
            {tier.name === 'Free' ? (
              <button
                onClick={tier.onClick}
                className="w-full py-4 bg-white text-black font-bold rounded-xl hover:bg-zinc-200 transition"
              >
                {tier.cta}
              </button>
            ) : (
              <>
                <SignedIn>
                  <a
                    href={getCheckoutUrl(tier.tierKey!)}
                    className={`w-full block text-center py-4 rounded-xl font-bold transition ${
                      tier.highlighted
                        ? 'bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 text-white'
                        : 'bg-white text-black hover:bg-zinc-200'
                    }`}
                  >
                    {tier.cta}
                  </a>
                </SignedIn>
                <SignedOut>
                  <SignInButton mode="modal">
                    <button
                      className={`w-full py-4 rounded-xl font-bold transition ${
                        tier.highlighted
                          ? 'bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 text-white'
                          : 'bg-white text-black hover:bg-zinc-200'
                      }`}
                    >
                      Sign In to {tier.cta}
                    </button>
                  </SignInButton>
                </SignedOut>
              </>
            )}
          </div>
        ))}
      </div>

      {/* FAQ & Footer CTA – unchanged */}
      <div className="max-w-4xl mx-auto mt-16 px-6">
        <h2 className="text-3xl font-bold text-white mb-8 text-center">Frequently Asked Questions</h2>
        <div className="space-y-4">
          <div className="bg-zinc-800/50 p-6 rounded-xl border border-zinc-800">
            <h3 className="text-white font-semibold mb-2">How does the daily limit work?</h3>
            <p className="text-zinc-400">Limits reset every 24 hours. Paid plans get higher generations.</p>
          </div>
          <div className="bg-zinc-800/50 p-6 rounded-xl border border-zinc-800">
            <h3 className="text-white font-semibold mb-2">Can I cancel anytime?</h3>
            <p className="text-zinc-400">Yes — cancel anytime from your account. Access continues until end of billing period.</p>
          </div>
        </div>
      </div>

      <div className="text-center mt-16 pb-20">
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
