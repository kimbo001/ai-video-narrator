import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Check, ArrowLeft, Star, Zap, Play, Video, Clock, Users } from 'lucide-react';

const Pricing: React.FC = () => {
  const navigate = useNavigate();

  const tiers = [
    {
      name: "Free",
      price: "$0",
      period: "/month",
      description: "Perfect for getting started",
      autoDaily: 3,
      manualDaily: 0.5, // 1 per 48 hours
      features: [
        "3 AI-generated videos daily",
        "1 manual video every 48 hours",
        "720p export quality",
        "Standard AI voices",
        "Basic stock footage"
      ],
      cta: "Start Creating Free",
      popular: false,
      disabled: false
    },
    {
      name: "New Tuber",
      price: "$10",
      period: "/month",
      description: "For serious creators",
      autoDaily: 5,
      manualDaily: 5,
      features: [
        "5 AI-generated videos daily",
        "5 manual videos daily",
        "1080p export quality",
        "Premium AI voices",
        "Extended stock footage",
        "Commercial usage rights",
        "Priority processing"
      ],
      cta: "Start New Tuber",
      popular: true,
      disabled: true
    },
    {
      name: "Creator",
      price: "$25",
      period: "/month",
      description: "For growing channels",
      autoDaily: 25,
      manualDaily: 25,
      features: [
        "25 AI-generated videos daily",
        "25 manual videos daily",
        "4K export quality",
        "All AI voices + custom",
        "Premium stock footage",
        "Commercial usage rights",
        "Priority processing",
        "Advanced editing tools",
        "Analytics dashboard"
      ],
      cta: "Start Creator",
      popular: false,
      disabled: true
    },
    {
      name: "Pro",
      price: "$50",
      period: "/month",
      description: "For professionals",
      autoDaily: "Unlimited",
      manualDaily: "Unlimited",
      features: [
        "Unlimited AI-generated videos",
        "Unlimited manual videos",
        "4K+ export quality",
        "All AI voices + custom",
        "Premium stock footage",
        "Commercial usage rights",
        "Priority processing",
        "Advanced editing tools",
        "Analytics dashboard",
        "API access",
        "White-label options",
        "Dedicated support"
      ],
      cta: "Start Pro",
      popular: false,
      disabled: true
    }
  ];

  return (
    <div className="max-w-7xl mx-auto px-6 py-12">
      <button 
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 text-zinc-400 hover:text-white transition-colors mb-8"
      >
        <ArrowLeft className="w-4 h-4" />
        Back
      </button>

      {/* Header - Matches Landing Page Gradient Exactly */}
<div className="text-center mb-12">
  <h1 className="text-4xl md:text-6xl font-bold text-white mb-6">
    Create Videos <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-indigo-500">That Actually Get Views</span>
  </h1>
  <p className="text-xl text-zinc-400 max-w-2xl mx-auto leading-relaxed">
    From text to viral content in seconds. No face required.
  </p>
</div>

      {/* Social Proof */}
      <div className="max-w-3xl mx-auto mb-12 text-center">
        <div className="bg-green-900/20 border border-green-500/30 rounded-xl p-6">
          <p className="text-green-200 italic mb-2">"I really loved your app. It was bit addicting to try different stories."</p>
          <p className="text-green-300 text-sm">- Guilty_Tear_4477, Reddit user</p>
          <div className="flex items-center justify-center gap-4 mt-4 text-sm text-zinc-400">
            <span className="flex items-center gap-1"><Users className="w-4 h-4" /> Loved by creators</span>
            <span className="flex items-center gap-1"><Star className="w-4 h-4" /> 5 Reddit front pages</span>
          </div>
        </div>
      </div>

      {/* Pricing Tiers */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-7xl mx-auto">
        {tiers.map((tier, index) => (
          <div 
            key={tier.name}
            className={`bg-[#11141b] border ${tier.popular ? 'border-yellow-500/50' : 'border-zinc-800'} rounded-2xl p-6 flex flex-col relative ${tier.disabled ? 'opacity-60' : ''}`}
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

            {/* Daily Limits - The Hook */}
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

            {tier.disabled ? (
              <button 
                className="w-full py-3 rounded-xl bg-zinc-800 text-zinc-400 font-semibold cursor-not-allowed"
              >
                Coming Soon
              </button>
            ) : (
              <button 
                onClick={() => tier.name === "Free" ? navigate('/generator') : null}
                className={`w-full py-3 rounded-xl font-semibold transition-all ${
                  tier.name === "Free" 
                    ? 'bg-zinc-700 text-white hover:bg-zinc-600' 
                    : 'bg-zinc-800 text-zinc-400 cursor-not-allowed'
                }`}
              >
                {tier.cta}
              </button>
            )}
          </div>
        ))}
      </div>

      {/* FAQ Section */}
      <div className="max-w-4xl mx-auto mt-16">
        <h2 className="text-3xl font-bold text-white mb-8 text-center">Frequently Asked Questions</h2>
        <div className="space-y-4">
          <div className="bg-zinc-800 p-6 rounded-xl">
            <h3 className="text-white font-semibold mb-2">How does the daily limit work?</h3>
            <p className="text-zinc-400">AI videos reset every 24 hours. Manual videos are 1 per 48 hours for free users. Paid tiers get daily refreshes.</p>
          </div>
          <div className="bg-zinc-800 p-6 rounded-xl">
            <h3 className="text-white font-semibold mb-2">What's the difference between AI and manual videos?</h3>
            <p className="text-zinc-400">AI videos auto-generate from your text with voiceover and stock footage. Manual videos let you control every aspect while AI assists.</p>
          </div>
          <div className="bg-zinc-800 p-6 rounded-xl">
            <h3 className="text-white font-semibold mb-2">Can I cancel anytime?</h3>
            <p className="text-zinc-400">Yes, all paid plans cancel anytime. You'll keep access until the end of your billing period.</p>
          </div>
          <div className="bg-zinc-800 p-6 rounded-xl">
            <h3 className="text-white font-semibold mb-2">When will monthly subscriptions launch?</h3>
            <p className="text-zinc-400">We're finalizing payment processing. Join the waitlist for founder pricing when we launch!</p>
          </div>
        </div>
      </div>

      {/* Final CTA */}
      <div className="text-center mt-16">
        <button 
          onClick={() => navigate('/generator')}
          className="px-8 py-4 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold text-lg rounded-xl shadow-xl shadow-cyan-500/40 transition-all transform hover:scale-105 flex items-center gap-2 mx-auto"
        >
          <Play className="w-5 h-5" />
          Start Creating Free
        </button>
        <p className="text-zinc-400 text-sm mt-4">No credit card required • 5 videos daily • Instant access</p>
      </div>
    </div>
  );
};

export default Pricing;
