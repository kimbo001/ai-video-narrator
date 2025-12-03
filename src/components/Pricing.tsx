
import React from 'react';
import { Check, ArrowLeft } from 'lucide-react';

interface PricingProps {
  onBack: () => void;
  onNavigate: (page: string) => void;
}

const Pricing: React.FC<PricingProps> = ({ onBack }) => {
  return (
    <div className="max-w-7xl mx-auto px-6 py-12">
      <button 
        onClick={onBack}
        className="flex items-center gap-2 text-zinc-400 hover:text-white transition-colors mb-8"
      >
        <ArrowLeft className="w-4 h-4" />
        Back
      </button>

      <div className="text-center mb-16">
        <h1 className="text-4xl font-bold text-white mb-4">Simple, Transparent Pricing</h1>
        <p className="text-zinc-400 text-lg">Start for free, upgrade when you go viral.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        
        {/* Free Plan */}
        <div className="bg-[#11141b] border border-zinc-800 rounded-2xl p-8 flex flex-col">
          <div className="mb-4">
            <h3 className="text-xl font-semibold text-white">Starter</h3>
            <p className="text-zinc-400 text-sm mt-2">For testing the waters.</p>
          </div>
          <div className="mb-8">
            <span className="text-4xl font-bold text-white">$0</span>
            <span className="text-zinc-500">/forever</span>
          </div>
          <ul className="flex-1 space-y-4 mb-8">
            <li className="flex items-center gap-3 text-zinc-300">
              <Check className="w-5 h-5 text-cyan-500 flex-shrink-0" />
              <span>3 Videos per day</span>
            </li>
            <li className="flex items-center gap-3 text-zinc-300">
              <Check className="w-5 h-5 text-cyan-500 flex-shrink-0" />
              <span>Standard Rendering Speed</span>
            </li>
            <li className="flex items-center gap-3 text-zinc-300">
              <Check className="w-5 h-5 text-cyan-500 flex-shrink-0" />
              <span>720p Export</span>
            </li>
          </ul>
          <button className="w-full py-3 rounded-xl border border-zinc-700 text-white font-semibold hover:bg-zinc-800 transition-colors">
            Current Plan
          </button>
        </div>

        {/* Pro Plan */}
        <div className="bg-[#11141b] border border-cyan-500/30 rounded-2xl p-8 flex flex-col relative overflow-hidden">
          <div className="absolute top-0 right-0 bg-cyan-500 text-black text-xs font-bold px-3 py-1 rounded-bl-xl">POPULAR</div>
          <div className="mb-4">
            <h3 className="text-xl font-semibold text-white">Pro Creator</h3>
            <p className="text-zinc-400 text-sm mt-2">For serious content creators.</p>
          </div>
          <div className="mb-8">
            <span className="text-4xl font-bold text-white">$12</span>
            <span className="text-zinc-500">/month</span>
          </div>
          <ul className="flex-1 space-y-4 mb-8">
            <li className="flex items-center gap-3 text-zinc-300">
              <Check className="w-5 h-5 text-cyan-500 flex-shrink-0" />
              <span>Unlimited Videos</span>
            </li>
            <li className="flex items-center gap-3 text-zinc-300">
              <Check className="w-5 h-5 text-cyan-500 flex-shrink-0" />
              <span>Priority Rendering</span>
            </li>
            <li className="flex items-center gap-3 text-zinc-300">
              <Check className="w-5 h-5 text-cyan-500 flex-shrink-0" />
              <span>1080p HD Export</span>
            </li>
            <li className="flex items-center gap-3 text-zinc-300">
              <Check className="w-5 h-5 text-cyan-500 flex-shrink-0" />
              <span>Commercial Rights</span>
            </li>
          </ul>
          <button className="w-full py-3 rounded-xl bg-cyan-500 text-black font-bold hover:bg-cyan-400 transition-colors shadow-lg shadow-cyan-500/20">
            Subscribe Now
          </button>
        </div>

        {/* Lifetime Plan */}
        <div className="bg-[#11141b] border border-zinc-800 rounded-2xl p-8 flex flex-col">
          <div className="mb-4">
            <h3 className="text-xl font-semibold text-white">Lifetime</h3>
            <p className="text-zinc-400 text-sm mt-2">Pay once, own it forever.</p>
          </div>
          <div className="mb-8">
            <span className="text-4xl font-bold text-white">$99</span>
            <span className="text-zinc-500">/once</span>
          </div>
          <ul className="flex-1 space-y-4 mb-8">
            <li className="flex items-center gap-3 text-zinc-300">
              <Check className="w-5 h-5 text-cyan-500 flex-shrink-0" />
              <span>All Pro Features</span>
            </li>
            <li className="flex items-center gap-3 text-zinc-300">
              <Check className="w-5 h-5 text-cyan-500 flex-shrink-0" />
              <span>Lifetime Updates</span>
            </li>
            <li className="flex items-center gap-3 text-zinc-300">
              <Check className="w-5 h-5 text-cyan-500 flex-shrink-0" />
              <span>Priority Support</span>
            </li>
          </ul>
          <button className="w-full py-3 rounded-xl border border-zinc-700 text-white font-semibold hover:bg-zinc-800 transition-colors">
            Buy Lifetime
          </button>
        </div>

      </div>
    </div>
  );
};

export default Pricing;
