import React, { useEffect } from 'react';
import { useNavigate } from '../../router';
import { Loader2 } from 'lucide-react';
import { BrandLogo } from '../../components/ui/BrandLogo';

export function CreatorOnboardingPage() {
  const navigate = useNavigate();

  useEffect(() => {
    // 3-step streamlined onboarding: users are taken directly into their dashboard
    // Any remaining profile or bank setups are done non-blockingly from within the dashboard!
    const timer = setTimeout(() => {
      navigate('/dashboard');
    }, 400);
    return () => clearTimeout(timer);
  }, [navigate]);

  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center p-6 text-center space-y-4">
      <BrandLogo size="lg" showSlogan={true} />
      <div className="flex items-center gap-2 text-sm text-gray-500 pt-4">
        <Loader2 className="w-5 h-5 animate-spin text-[#F22550]" />
        <span className="font-semibold text-[#17191F]">Setting up your dashboard...</span>
      </div>
    </div>
  );
}
