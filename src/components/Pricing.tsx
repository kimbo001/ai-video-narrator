import React, { useState, useEffect } from 'react';
import { Check, ArrowLeft, Key, Lock, Unlock, Loader2 } from 'lucide-react';
import { Page } from '../types';

interface PricingProps {
  onBack: () => void;
  onNavigate: (page: Page) => void;
}

const Pricing: React.FC<PricingProps> = ({ onBack }) => {
  const [licenseKey, setLicenseKey] = useState('');
  const [isPro, setIsPro] = useState(false);
  const [activationMsg, setActivationMsg] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);

  // UPDATED: Using Product ID as requested by Gumroad Error
  const GUMROAD_PRODUCT_ID = 'IKQUftD2-Z1zgm1zoHAWUA=='; 

  useEffect(() => {
    const storedLicense = localStorage.getItem('license_key');
    if (storedLicense) {
        setIsPro(true);
        setLicenseKey(storedLicense);
    }
  }, []);

  const handleActivate = async () => {
      if (licenseKey.trim().length < 5) {
          setActivationMsg('Please enter a valid key.');
          return;
      }

      setIsVerifying(true);
      setActivationMsg('');

      try {
          console.log(`Verifying key for product ID: ${GUMROAD_PRODUCT_ID}`);
          
          const res = await fetch('/api/verify', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                  product_id: GUMROAD_PRODUCT_ID,
                  license_key: licenseKey.trim()
              })
          });

          const data = await res.json();

          if (data.success) {
              localStorage.setItem('license_key', licenseKey.trim());
              setIsPro(true);
              setActivationMsg('License activated successfully! You now have unlimited access.');
          } else {
              console.error("Verification failed:", data);
              setActivationMsg(data.error || 'Invalid or refunded license.');
              setIsPro(false);
          }
      } catch (error) {
          console.error("Verification error:", error);
          setActivationMsg('Connection error. Please try again.');
      } finally {
          setIsVerifying(false);
      }
  };

  const handleDeactivate = () => {
      localStorage.removeItem('license_key');
      setIsPro(false);
      setLicenseKey('');
      setActivationMsg('License removed.');
  };

  return (
    <div className="max-w-7xl mx-auto px-6 py-12">
      <button 
        onClick={onBack}
        className="flex items-center gap-2 text-zinc-400 hover:text-white transition-colors mb-8"
      >
        <ArrowLeft className="w-4 h-4" />
        Back
      </button>

      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-white mb-4">Simple, Transparent Pricing</h1>
        <p className="text-zinc-400 text-lg">Start for free, unlock unlimited power forever.</p>
      </div>

      {/* Activation Section */}
      <div className="max-w-xl mx-auto mb-16 bg-zinc-900 border border-zinc-800 rounded-xl p-6">
          <div className="flex items-center gap-3 mb-4">
              {isPro ? <Unlock className="text-green-500 w-5 h-5" /> : <Key className="text-cyan-500 w-5 h-5" />}
              <h3 className="text-white font-semibold">{isPro ? 'Lifetime License Active' : 'Activate Lifetime License'}</h3>
          </div>
          
          {isPro ? (
              <div>
                  <p className="text-green-400 text-sm mb-4">You have unlimited access.</p>
                  <button onClick={handleDeactivate} className="text-xs text-zinc-500 hover:text-zinc-300 underline">Deactivate Device</button>
              </div>
          ) : (
              <div className="flex flex-col gap-2">
                  <div className="flex gap-2">
                    <input 
                        type="text" 
                        value={licenseKey}
                        onChange={(e) => setLicenseKey(e.target.value)}
                        placeholder="Enter Gumroad License Key"
                        className="flex-1 bg-black border border-zinc-700 rounded-lg px-4 py-2 text-white text-sm focus:border-cyan-500 outline-none"
                    />
                    <button 
                        onClick={handleActivate}
                        disabled={isVerifying}
                        className="bg-cyan-600 hover:bg-cyan-500 text-white text-sm font-bold px-4 py-2 rounded-lg transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isVerifying ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Activate'}
                    </button>
                  </div>
              </div>
          )}
          {activationMsg && <p className={`text-xs mt-3 ${activationMsg.includes('Invalid') || activationMsg.includes('error') ? 'text-red-400' : 'text-green-400'}`}>{activationMsg}</p>}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
        
        {/* Free Plan */}
        <div className={`bg-[#11141b] border ${isPro ? 'border-zinc-800 opacity-50' : 'border-zinc-700'} rounded-2xl p-8 flex flex-col`}>
          <div className="mb-4">
            <h3 className="text-xl font-semibold text-white">Free Starter</h3>
            <p className="text-zinc-400 text-sm mt-2">Perfect for trying it out.</p>
          </div>
          <div className="mb-8">
            <span className="text-4xl font-bold text-white">$0</span>
            <span className="text-zinc-500">/forever</span>
          </div>
          <ul className="flex-1 space-y-4 mb-8">
            <li className="flex items-center gap-3 text-zinc-300">
              <Check className="w-5 h-5 text-zinc-500 flex-shrink-0" />
              <span>5 Generations per day</span>
            </li>
            <li className="flex items-center gap-3 text-zinc-300">
              <Check className="w-5 h-5 text-zinc-500 flex-shrink-0" />
              <span>720p Export Quality</span>
            </li>
            <li className="flex items-center gap-3 text-zinc-300">
              <Check className="w-5 h-5 text-zinc-500 flex-shrink-0" />
              <span>Standard AI Voices</span>
            </li>
          </ul>
          <button disabled={true} className="w-full py-3 rounded-xl border border-zinc-700 text-zinc-400 font-semibold cursor-default">
            {isPro ? 'Upgraded' : 'Current Plan'}
          </button>
        </div>

        {/* Lifetime Plan */}
        <div className={`bg-[#11141b] border ${isPro ? 'border-green-500/50 bg-green-900/10' : 'border-cyan-500/50'} rounded-2xl p-8 flex flex-col relative overflow-hidden`}>
          {!isPro && <div className="absolute top-0 right-0 bg-cyan-500 text-black text-xs font-bold px-3 py-1 rounded-bl-xl">BEST VALUE</div>}
          <div className="mb-4">
            <h3 className="text-xl font-semibold text-white">Lifetime Access</h3>
            <p className="text-zinc-400 text-sm mt-2">One payment, unlimited forever.</p>
          </div>
          <div className="mb-8">
            <span className="text-4xl font-bold text-white">$99</span>
            <span className="text-zinc-500">/once off</span>
          </div>
          <ul className="flex-1 space-y-4 mb-8">
            <li className="flex items-center gap-3 text-zinc-300">
              <Check className="w-5 h-5 text-cyan-500 flex-shrink-0" />
              <span className="font-bold text-white">Unlimited Generations</span>
            </li>
            <li className="flex items-center gap-3 text-zinc-300">
              <Check className="w-5 h-5 text-cyan-500 flex-shrink-0" />
              <span>Commercial Rights</span>
            </li>
            <li className="flex items-center gap-3 text-zinc-300">
              <Check className="w-5 h-5 text-cyan-500 flex-shrink-0" />
              <span>Priority 1080p Processing</span>
            </li>
            <li className="flex items-center gap-3 text-zinc-300">
              <Check className="w-5 h-5 text-cyan-500 flex-shrink-0" />
              <span>Support Future Updates</span>
            </li>
          </ul>
          
          {isPro ? (
              <button disabled className="w-full py-3 rounded-xl bg-green-600 text-white font-bold cursor-default">
                  Plan Active
              </button>
          ) : (
              <button 
                onClick={() => window.open('https://kimbosaurus.gumroad.com/l/AIVideoNarrator', '_blank')} 
                className="w-full py-3 rounded-xl bg-cyan-500 text-black font-bold hover:bg-cyan-400 transition-colors shadow-lg shadow-cyan-500/20"
              >
                Buy on Gumroad
              </button>
          )}
          {!isPro && <p className="text-center text-xs text-zinc-500 mt-3">Receive license key instantly via email</p>}
        </div>

      </div>
    </div>
  );
};

export default Pricing;