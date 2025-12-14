import React from 'react';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface LegalProps {
  page: 'terms' | 'privacy' | 'refund';
}

const Legal: React.FC<LegalProps> = ({ page }) => {
  const navigate = useNavigate();

  const content = {
    terms: (
      <>
        <h1 className="text-3xl font-bold text-white mb-6">Terms of Service</h1>
        <p className="mb-4">Last updated: December 2025</p>
        <h3 className="text-xl font-semibold text-white mt-6 mb-3">1. Services</h3>
        <p className="mb-4">AI Video Narrator provides AI-powered video generation tools that convert text to narrated videos with stock footage.</p>
        <h3 className="text-xl font-semibold text-white mt-6 mb-3">2. Payment & Subscription</h3>
        <p className="mb-4">Monthly subscriptions auto-renew unless cancelled. Lifetime purchases are one-time payments with no recurring fees.</p>
        <h3 className="text-xl font-semibold text-white mt-6 mb-3">3. Refunds</h3>
        <p className="mb-4">14-day refund policy for unused subscriptions. No refunds after service usage.</p>
        <h3 className="text-xl font-semibold text-white mt-6 mb-3">4. Content Rights</h3>
        <p className="mb-4">Users retain ownership of their scripts. We provide royalty-free stock footage and AI-generated voiceovers.</p>
        <h3 className="text-xl font-semibold text-white mt-6 mb-3">5. Acceptable Use</h3>
        <p>No illegal content, spam, or copyright infringement.</p>
        <p className="mt-6"><strong>Company:</strong> AI Video Narrator</p>
        <p><strong>Contact:</strong> contact@aivideonarrator.com</p>
      </>
    ),
    privacy: (
      <>
        <h1 className="text-3xl font-bold text-white mb-6">Privacy Policy</h1>
        <p className="mb-4">We collect email address (account creation), payment info (processed by Paddle), and generated video content (temporarily stored).</p>
        <p className="mb-4">We don't sell your data. Videos are deleted after 30 days.</p>
        <p><strong>Contact:</strong> contact@aivideonarrator.com for data deletion requests.</p>
      </>
    ),
    refund: (
      <>
        <h1 className="text-3xl font-bold text-white mb-6">Refund Policy</h1>
        <p className="mb-4">14-day money-back guarantee for unused subscriptions.</p>
        <p className="mb-4">No refunds after video generation, account usage, or download of generated content.</p>
        <p><strong>Contact:</strong> contact@aivideonarrator.com for refund requests.</p>
      </>
    ),
  };

  return (
    <div className="max-w-4xl mx-auto px-6 py-12 text-zinc-300">
      <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-zinc-400 hover:text-white transition-colors mb-8">
        <ArrowLeft className="w-4 h-4" />
        Back
      </button>
      {content[page]}
    </div>
  );
};

export default Legal;
