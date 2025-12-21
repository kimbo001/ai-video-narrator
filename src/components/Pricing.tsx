              {tier.features.map((feature, idx) => (
                <li key={idx} className="flex items-center gap-2 text-zinc-300 text-sm">
                  <Check className="w-4 h-4 text-green-500 flex-shrink-0" />
                  <span>{feature}</span>
                </li>
              ))}
            </ul>

            <button
              onClick={() => tier.isFree ? navigate('/generator') : startLemonCheckout(tier.name as any)}
              className={`w-full py-3 rounded-xl font-semibold transition-all ${
                tier.isFree 
                ? 'bg-zinc-700 text-white hover:bg-zinc-600' 
                : 'bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white'
              }`}
            >
              {tier.cta}
            </button>
          </div>
        ))}
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
