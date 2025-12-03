
import React from 'react';
import { ArrowLeft } from 'lucide-react';

interface LegalProps {
  onBack: () => void;
}

const Legal: React.FC<LegalProps> = ({ onBack }) => {
  return (
    <div className="max-w-4xl mx-auto px-6 py-12 text-zinc-300">
      <button 
        onClick={onBack}
        className="flex items-center gap-2 text-zinc-400 hover:text-white transition-colors mb-8"
      >
        <ArrowLeft className="w-4 h-4" />
        Back
      </button>

      <div className="space-y-12">
        <section>
          <h1 className="text-3xl font-bold text-white mb-6">Terms of Service</h1>
          <p className="mb-4">Last Updated: October 26, 2023</p>
          <p className="mb-4">
            Welcome to AI Video Narrator. By accessing or using our website and services, you agree to be bound by these Terms of Service. If you disagree with any part of the terms, you may not access the service.
          </p>
          <h3 className="text-xl font-semibold text-white mt-6 mb-3">1. Use License</h3>
          <p className="mb-4">
            Permission is granted to temporarily download one copy of the materials (information or software) on AI Video Narrator's website for personal, non-commercial transitory viewing only.
          </p>
          <h3 className="text-xl font-semibold text-white mt-6 mb-3">2. AI Usage</h3>
          <p>
            Our service utilizes Google Gemini and other third-party APIs. You agree not to use the service to generate harmful, illegal, or offensive content.
          </p>
        </section>

        <section className="pt-8 border-t border-zinc-800">
          <h1 className="text-3xl font-bold text-white mb-6">Privacy Policy</h1>
          <p className="mb-4">
            Your privacy is important to us. It is AI Video Narrator's policy to respect your privacy regarding any information we may collect from you across our website.
          </p>
          <h3 className="text-xl font-semibold text-white mt-6 mb-3">Data Collection</h3>
          <p className="mb-4">
            We do not store the scripts or videos you generate on our servers permanently. Processing is done in real-time. We may collect basic usage analytics to improve our service.
          </p>
          <h3 className="text-xl font-semibold text-white mt-6 mb-3">Third Party Services</h3>
          <p>
            We use third-party services for image generation and text-to-speech. Please review the privacy policies of Google (Gemini), Pixabay, Pexels, and Unsplash.
          </p>
        </section>

        <section className="pt-8 border-t border-zinc-800">
          <h1 className="text-3xl font-bold text-white mb-6">Refund Policy</h1>
          <p className="mb-4">
            We want you to be completely satisfied with our service.
          </p>
          <ul className="list-disc pl-5 space-y-2 mb-4">
            <li>
              <strong className="text-white">7-Day Money-Back Guarantee:</strong> If you are not satisfied with your Pro or Lifetime purchase, contact us within 7 days of your transaction for a full refund.
            </li>
            <li>
              <strong className="text-white">Cancellation:</strong> You can cancel your monthly subscription at any time. Your access will continue until the end of the billing period.
            </li>
          </ul>
          <p>
            To request a refund, please contact our support team at support@aivideonarrator.com with your order details.
          </p>
        </section>
      </div>
    </div>
  );
};

export default Legal;
