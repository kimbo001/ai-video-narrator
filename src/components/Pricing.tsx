// src/components/Pricing.tsx
import React, { useState, useEffect } from 'react';
import { Check, ArrowLeft, Key, Unlock, Zap, Star, Crown } from 'lucide-react';

// ✅ REPLACE THESE WITH YOUR ACTUAL VARIANT IDs FROM LEMON SQUEEZY
const PLANS = [
  {
    id: 'new-tuber',
    name: 'New Tuber',
    price: '$9',
    period: '/month',
    icon: Zap,
    features: ['Standard AI Voices', '720p Export', '5 mins/month'],
    variantId: 1160511, // ← CHANGE ME
    color: 'text-zinc-300',
    btnColor: 'bg-zinc-700 hover:bg-zinc-600',
    highlight: false,
  },
  {
    id: 'creator',
    name: 'Creator',
    price: '$19',
    period: '/month',
    icon: Star,
    features: ['Premium Voices', '1080p Export', '30 mins/month', 'No Watermark'],
    variantId: 1160512, // ← CHANGE ME
    color: 'text-cyan-400',
    btnColor: 'bg-cyan-600 hover:bg-cyan-500',
    highlight: true,
  },
  {
    id: 'pro',
    name: 'Pro',
    price: '$29',
    period: '/month',
    icon: Crown,
    features: ['Ultra-Realistic Voices', '4K Export', 'Unlimited Minutes', 'Commercial Rights'],
    variantId: 1160514, // ← CHANGE ME
    color: 'text-purple-400',
    btnColor: 'bg-purple-600 hover:bg-purple-500',
    highlight: false,
  },
];

// Create a simple user ID if none exists
const getOrCreateUserId = (): string => {
  let id = localStorage.getItem('user_id');
  if (!id) {
    id = 'user_' + Math.random().toString(36).substring(2, 10);
    localStorage.setItem('user_id', id);
  }
  return id;
};

const Pricing = ({ onBack }: { onBack?: () => void }) => {
  const [licenseKey, setLicenseKey] = useState('');
  const [isPro, setIsPro] = useState(false);
  const [activationMsg, setActivationMsg] = useState('');
  const [loadingVariant, setLoadingVariant] = useState<number | null>(null);

  // Check if user already has a license
  useEffect(() => {
    const key = localStorage.getItem('license_key');
    if (key) {
      setIsPro(true);
      setLicenseKey(key);
    }
  }, []);

  const handleActivate = () => {
    if (licenseKey.trim().length > 5) {
      localStorage.setItem('license_key', licenseKey);
      setIsPro(true);
      setActivationMsg('✅ License activated!');
    } else {
      setActivationMsg('❌ Invalid license key.');
    }
  };

  const handleDeactivate = () => {
    localStorage.removeItem('license_key');
    setIsPro(false);
    setLicenseKey('');
    setActivationMsg('License removed.');
  };

  const goBack = () => {
    if (onBack) onBack();
    else window.location.href = '/';
  };

  // ✅ MAIN CHECKOUT FUNCTION
  const handleBuy = async (variantId: number) => {
    setLoadingVariant(variantId);

    const userId = getOrCreateUserId();

    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ variantId, userId }),
      });

      const data = await res.json();

      if (res.ok && data.url) {
        // Go to Lemon Squeezy
        window.location.href = data.url;
      } else {
        alert('Checkout failed: ' + (data.error || 'Unknown error'));
        console.error('API Error:', data);
      }
    } catch (err) {
      console.error('Network Error:', err);
      alert('Failed to connect. Check your internet.');
    } finally {
      setLoadingVariant(null);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-12">
      <button onClick={goBack} className="flex items-center text-zinc-400 hover:text-white mb-8">
        <ArrowLeft className="w-4 h-4 mr-1" /> Back
      </button>

      <div className="text-center mb-12">
        <h1 className="text-3xl font-bold text-white">Choose Your Plan</h1>
        <p className="text-zinc-400">Unlock the full power of AI Narration</p>
      </div>

      {/* License Activation Box */}
      <div className="max-w-md mx-auto mb-12 p-6 bg-zinc-900 rounded-xl border border-zinc-800">
        <div className="flex items-center gap-2 mb-3">
          {isPro ? <Unlock className="text-green-500" /> : <Key className="text-cyan-500" />}
          <h3 className="text-white font-medium">{isPro ? 'License Active' : 'Activate License'}</h3>
        </div>

        {isPro ? (
          <button onClick={handleDeactivate} className="text-sm text-zinc-500 underline">
            Deactivate
          </button>
        ) : (
          <div className="flex gap-2">
            <input
              type="text"
              value={licenseKey}
              onChange={(e) => setLicenseKey(e.target.value)}
              placeholder="Enter license key"
              className="flex-1 bg-black border border-zinc-700 rounded px-3 py-2 text-white text-sm"
            />
            <button onClick={handleActivate} className="bg-cyan-600 hover:bg-cyan-500 text-white px-3 rounded font-medium">
              Activate
            </button>
          </div>
        )}
        {activationMsg && <p className={`text-sm mt-2 ${activationMsg.includes('Invalid') ? 'text-red-400' : 'text-green-400'}`}>{activationMsg}</p>}
      </div>

      {/* Plans */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {PLANS.map((plan) => (
          <div
            key={plan.id}
            className={`p-6 rounded-2xl border ${
              plan.highlight
                ? 'bg-zinc-900 border-cyan-500 relative z-10 scale-105'
                : 'bg-[#11141b] border-zinc-800'
            }`}
          >
            {plan.highlight && (
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-cyan-500 text-black text-xs px-3 py-1 rounded-full">
                Most Popular
              </div>
            )}

            <div className="mb-4">
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center mb-3 bg-zinc-800 ${plan.color}`}>
                <plan.icon className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-white">{plan.name}</h3>
              <div className="mt-1">
                <span className="text-2xl font-bold text-white">{plan.price}</span>
                <span className="text-zinc-500 text-sm">{plan.period}</span>
              </div>
            </div>

            <ul className="space-y-2 mb-6 text-sm text-zinc-300">
              {plan.features.map((f, i) => (
                <li key={i} className="flex items-start gap-2">
                  <Check className={`w-4 h-4 mt-0.5 ${plan.color}`} />
                  <span>{f}</span>
                </li>
              ))}
            </ul>

            {isPro ? (
              <button disabled className="w-full py-2 bg-zinc-800 text-zinc-500 rounded-lg cursor-not-allowed">
                Active
              </button>
            ) : (
              <button
                onClick={() => handleBuy(plan.variantId)}
                disabled={loadingVariant === plan.variantId}
                className={`w-full py-2 rounded-lg font-bold transition ${
                  loadingVariant === plan.variantId
                    ? 'bg-zinc-700 cursor-not-allowed'
                    : plan.btnColor + ' text-white'
                }`}
              >
                {loadingVariant === plan.variantId ? 'Loading...' : 'Buy Now'}
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default Pricing;
