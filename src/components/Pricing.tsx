import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useSafeUser } from '../lib/useSafeUser';
import { Check, ArrowLeft, Star, Users, Play } from 'lucide-react';

const Pricing: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useSafeUser();
  const userId = user?.id ?? 'anon_' + Math.random().toString(36).substr(2, 9);
  const userEmail = user?.emailAddresses?.[0]?.emailAddress ?? '';

  // Your Lemon Squeezy Variant IDs (numeric)
  const lsVariantIds = {
    'New Tuber': parseInt(import.meta.env.VITE_LEMON_NEW_TUBER || '1160511', 10),
    'Creator': parseInt(import.meta.env.VITE_LEMON_CREATOR || '1160512', 10),
    'Pro': parseInt(import.meta.env.VITE_LEMON_PRO || '1160514', 10),
  };

  const tiers = [
    {
      name: 'Free',
      price: '$0',
      period: '/month',
      description: 'Perfect for getting started',
      autoDaily: 3,
      manualDaily: 0.5,
      features: [
        '3 AI-generated videos daily',
        '1 manual video every 48 hours',
        '720p export quality',
        'Standard AI voices',
        'Basic stock footage',
      ],
      cta: 'Start Creating Free',
      popular: false,
      isFree: true,
    },
    {
      name: 'New Tuber',
      price: '$10',
      period: '/month',
      description: 'For serious creators',
      autoDaily: 5,
      manualDaily: 5,
      features: [
        '5 AI-generated videos daily',
        '5 manual videos daily',
        '1080p export quality',
        'Premium AI voices',
        'Extended stock footage',
        'Commercial usage rights',
        'Priority processing',
      ],
      cta: 'Start New Tuber',
      popular: true,
      isFree: false,
    },
    {
      name: 'Creator',
      price: '$25',
      period: '/month',
      description: 'For growing channels',
      autoDaily: 25,
      manualDaily: 25,
      features: [
        '25 AI-generated videos daily',
        '25 manual videos daily',
        '4K export quality',
        'All AI voices + custom',
        'Premium stock footage',
        'Commercial usage rights',
        'Priority processing',
        'Advanced editing tools',
        'Analytics dashboard',
      ],
      cta: 'Start Creator',
      popular: false,
      isFree: false,
    },
    {
      name: 'Pro',
      price: '$50',
      period: '/month',
      description: 'For professionals',
      autoDaily: 'Unlimited',
      manualDaily: 'Unlimited',
      features: [
        'Unlimited AI-generated videos',
        'Unlimited manual videos',
        '4K+ export quality',
        'All AI voices + custom',
        'Premium stock footage',
        'Commercial usage rights',
        'Priority processing',
        'Advanced editing tools',
        'Analytics dashboard',
        'API access',
        'White-label options',
        'Dedicated support',
      ],
      cta: 'Start Pro',
      popular: false,
      isFree: false,
    },
  ];

  // ✅ CORRECT: Use your /api/checkout route
  const startLemonCheckout = async (tierName: 'New Tuber' | 'Creator' | 'Pro') => {
    const variantId = lsVariantIds[tierName];
    if (!variantId) {
      alert('This plan is not available yet.');
      return;
    }

    try {
      const response = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ variantId, userId, userEmail }),
      });

      const data = await response.json();

      if (response.ok && data.url) {
        // ✅ Redirect to real Lemon Squeezy checkout
        window.location.href = data.url;
      } else {
        alert('Checkout failed. Please try again.');
        console.error('API Error:', data);
      }
    } catch (error) {
      console.error('Network Error:', error);
      alert('Failed to connect. Please try again.');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-6 py-12">
      <button 
        onClick={() => navigate(-1)}
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
        {tiers.map((tier) => (
          <div 
            key={tier.name}
            className={`bg-[#11141b] border ${tier.popular ? 'border-yellow-500/50' : 'border-zinc-800'} rounded-2xl p-6 flex flex-col relative`}
          >
            {tier.popular && (
              <div className="absolute top-0 right-0 bg-yellow-500 text-black text-xs font-bold px-2 py-1 rounded-bl-lg">
                POPULAR
              </div>
            )}
            
            <div className="mb-4">
              <h3 className="text-xl font-semibold text-white">{tier.name}</h3>
              <p className="text-zinc-400 text-sm mt-1">{tier.description}</p>
            </div>
            
            <div className="mb-6">
              <span className="text-3xl font-bold text-white">{tier.price}</span>
              <span className="text-zinc-500 text-sm"> {tier.period}</span>
            </div>

            <div className="mb-6 bg-zinc-900/50 rounded-lg p-4">
              <div className="flex justify-between items-center mb-2">
                <span className="text-zinc-400 text-sm">AI Videos Daily</span>
                <span className="text-white font-bold">{tier.autoDaily}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-zinc-400 text-sm">Manual Videos Daily</span>
                <span className="text-white font-bold">{tier.manualDaily}</span>
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

            {tier.isFree ? (
              <button 
                onClick={() => navigate('/generator')}
                className="w-full py-3 rounded-xl font-semibold transition-all bg-zinc-700 text-white hover:bg-zinc-600"
              >
                {tier.cta}
              </button>
            ) : (
              <button
                onClick={() => startLemonCheckout(tier.name as 'New Tuber' | 'Creator' | 'Pro')}
                className="w-full py-3 rounded-xl font-semibold transition-all bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white"
              >
                {tier.cta}
              </button>
            )}
          </div>
        ))}
      </div>

      {/* Optional: Keep or remove FAQ */}
      <div className="max-w-4xl mx-auto mt-16">
        <h2 className="text-3xl font-bold text-white mb-8 text-center">Frequently Asked Questions</h2>
        <div className="space-y-4">
          <div className="bg-zinc-800 p-6 rounded-xl">
            <h3 className="text-white font-semibold mb-2">How does the daily limit work?</h3>
            <p className="text-zinc-400">Limits reset every 24 hours. Paid plans get higher or unlimited generations.</p>
          </div>
          <div className="bg-zinc-800 p-6 rounded-xl">
            <h3 className="text-white font-semibold mb-2">Can I cancel anytime?</h3>
            <p className="text-zinc-400">Yes — cancel anytime from your account. Access continues until end of billing period.</p>
          </div>
        </div>
      </div>

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
