import React from 'react';
import { Link } from '../../router';
import { ShieldCheck, Heart, Sparkles, Globe, Target, Zap, ArrowRight } from 'lucide-react';

export function AboutPage() {
  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16 space-y-16">
      <div className="text-center max-w-2xl mx-auto space-y-4">
        <span className="text-xs font-bold text-[#F22550] uppercase tracking-wider">
          Our Purpose & Mission
        </span>
        <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight">
          Fueling Africa's Creative & Knowledge Economy
        </h1>
        <p className="text-gray-600 text-base leading-relaxed">
          BuyMeData was founded on a simple truth: talent is universal, but uninterrupted access to resources, power, and data is not.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-10 items-center">
        <div className="space-y-4 text-gray-600 text-sm leading-relaxed">
          <h2 className="text-2xl font-bold text-gray-900">
            Why "Buy Me Data"?
          </h2>
          <p>
            Across Lagos, Abuja, Nairobi, Accra, and throughout the African continent, millions of talented youth are coding open-source packages, recording tutorials, producing podcasts, writing journalism, and designing products.
          </p>
          <p>
            Often, their single biggest everyday obstacle isn't inspiration or drive—it's high internet data costs and stable power. In Africa, asking someone to "Buy me a coffee" felt culturally distant; asking someone to "Buy me data" or "Support my work" represents the real daily fuel of creativity.
          </p>
          <p>
            BuyMeData transforms appreciation into immediate, tangible fuel. Through a single personalized link, anyone in the world can send support straight to a creator's verified Nigerian bank account.
          </p>
        </div>

        <div className="bg-[#FFE6EA]/70 rounded-3xl p-8 border border-[#F22550]/20 space-y-6">
          <div className="w-12 h-12 rounded-2xl bg-[#F22550] text-white flex items-center justify-center font-bold">
            <Target className="w-6 h-6" />
          </div>
          <h3 className="text-xl font-bold text-gray-900">Our Commitments</h3>
          <ul className="space-y-3 text-xs text-gray-700">
            <li className="flex items-start gap-2.5">
              <ShieldCheck className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
              <span><strong>Auditable Ledger:</strong> Every transaction and fee is recorded in an immutable financial ledger.</span>
            </li>
            <li className="flex items-start gap-2.5">
              <Heart className="w-4 h-4 text-rose-500 flex-shrink-0 mt-0.5" />
              <span><strong>Creator First:</strong> Transparent 5% flat fee with zero monthly subscriptions.</span>
            </li>
            <li className="flex items-start gap-2.5">
              <Globe className="w-4 h-4 text-[#F22550] flex-shrink-0 mt-0.5" />
              <span><strong>Built for Africa:</strong> NGN ₦ native settlement with multi-market expansion architecture.</span>
            </li>
          </ul>
        </div>
      </div>

      <div className="bg-white rounded-3xl p-10 border border-gray-100 text-center space-y-4">
        <h3 className="text-2xl font-bold text-gray-900">Join the movement</h3>
        <p className="text-gray-500 text-sm max-w-md mx-auto">
          Start your personalized creator page in minutes and let your community fuel your next breakthrough.
        </p>
        <Link
          to="/auth/register"
          className="inline-flex items-center gap-2 px-6 py-3 bg-[#F22550] text-white font-bold text-sm rounded-xl hover:bg-[#D81A43]"
        >
          Create Your Page <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </div>
  );
}
